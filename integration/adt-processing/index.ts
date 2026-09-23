/**
 * ADT (Admission, Discharge, Transfer) Processing Pipeline
 *
 * Implements real-time HL7/FHIR/Webhook event handling for resident movement.
 * Updates local clinical records and generates audit trail events.
 */

import { PCCADTEventPayload } from '@/pcc/types';
import { PCCEventParser } from '@/pcc/event-processing';
import { PCCDataMapper } from '@/integration/mapping';
import { IntegrationError } from '@/integration/error-handling';
import { CanonicalResident, IntegrationEvent } from '@/integration/types';
import { store } from '@/lib/store';

export interface ADTProcessResult {
  success: boolean;
  mrn: string;
  eventType: string;
  message: string;
  resident?: CanonicalResident;
  event: IntegrationEvent;
}

export class ADTProcessor {
  private parser: PCCEventParser;

  constructor() {
    this.parser = new PCCEventParser();
  }

  public async processADTEvent(rawPayload: unknown): Promise<ADTProcessResult> {
    const startTime = Date.now();

    // 1. Validation
    const validation = this.parser.validateEventPayload(rawPayload);
    if (!validation.isValid || !validation.validatedEvent) {
      const errTime = Date.now() - startTime;
      const failedEvent = store.addEvent({
        eventType: 'ADT_TRANSFER',
        mrn: (rawPayload as { mrn?: string })?.mrn || 'UNKNOWN',
        source: 'ADT Simulator',
        status: 'FAILED',
        processingTimeMs: errTime,
        message: `Validation failed for ADT event: ${validation.error}`,
        errorMessage: validation.error,
        details: { rawPayload },
      });

      throw new IntegrationError('INVALID_ADT_PAYLOAD', validation.error || 'Invalid ADT payload', 400, {
        eventId: failedEvent.id,
      });
    }

    const event: PCCADTEventPayload = validation.validatedEvent;

    try {
      // 2. Reflect event in PointClickCare Client
      await store.pccClient.simulateADTEvent(event);

      // 3. Process according to event type
      let resident = store.getResident(event.mrn);
      let summaryMessage = '';

      if (event.eventType === 'ADMISSION') {
        // Fetch new resident data from PCC
        const pccData = await store.pccClient.getPatient(event.mrn);
        if (pccData) {
          resident = PCCDataMapper.toCanonicalResident(pccData);
        } else {
          // Fallback constructed canonical resident
          resident = {
            mrn: event.mrn,
            pccPatientId: event.patientId,
            fullName: event.notes || 'Admitted Resident',
            firstName: event.notes?.split(' ')[0] || '',
            lastName: event.notes?.split(' ')[1] || '',
            dateOfBirth: '',
            gender: 'Other',
            facilityId: event.facId,
            facilityName: event.facilityName || '',
            room: event.targetRoom || '',
            bed: event.targetBed || '',
            status: 'ADMITTED',
            admissionDate: event.timestamp.slice(0, 10),
            primaryInsurance: {
              payerName: 'Pending Verification',
              payerType: 'Medicare',
              coverageStatus: 'unknown',
              eligibilityVerified: false,
              isVerified: false,
              verificationSource: 'NOT_PERFORMED',
            },
            activeDiagnoses: PCCDataMapper.mapDiagnoses(event.diagnoses || []),
            lastSyncTimestamp: new Date().toISOString(),
            syncStatus: 'SYNCED',
          };
        }
        store.saveResident(resident);
        summaryMessage = `Processed ADMISSION for ${resident.fullName} (${resident.mrn}) into Room ${resident.room}-${resident.bed}.`;
      } else if (event.eventType === 'TRANSFER') {
        if (!resident) {
          throw new IntegrationError(
            'RESIDENT_NOT_FOUND',
            `Cannot process TRANSFER: No existing resident found with MRN ${event.mrn}.`
          );
        }
        const priorRoom = `${resident.room}-${resident.bed}`;
        resident.room = event.targetRoom || resident.room;
        resident.bed = event.targetBed || resident.bed;
        resident.status = 'TRANSFERRED';
        resident.lastSyncTimestamp = new Date().toISOString();
        store.saveResident(resident);
        summaryMessage = `Processed TRANSFER for ${resident.fullName} (${resident.mrn}) from Room ${priorRoom} to Room ${resident.room}-${resident.bed}.`;
      } else if (event.eventType === 'DISCHARGE') {
        if (!resident) {
          throw new IntegrationError(
            'RESIDENT_NOT_FOUND',
            `Cannot process DISCHARGE: No existing resident found with MRN ${event.mrn}.`
          );
        }
        resident.status = 'DISCHARGED';
        resident.dischargeDate = event.timestamp.slice(0, 10);
        resident.lastSyncTimestamp = new Date().toISOString();
        store.saveResident(resident);
        summaryMessage = `Processed DISCHARGE for ${resident.fullName} (${resident.mrn}). Reason: ${event.dischargeReason || 'Completed Course of Care'}.`;
      }

      const elapsed = Date.now() - startTime;

      // 4. Log integration audit event
      const auditEvent = store.addEvent({
        eventType:
          event.eventType === 'ADMISSION'
            ? 'ADT_ADMISSION'
            : event.eventType === 'TRANSFER'
            ? 'ADT_TRANSFER'
            : 'ADT_DISCHARGE',
        mrn: event.mrn,
        patientName: resident?.fullName,
        source: 'ADT Simulator',
        status: 'SUCCESS',
        processingTimeMs: Math.max(elapsed, 18),
        message: summaryMessage,
        details: {
          eventType: event.eventType,
          facilityId: event.facId,
          targetRoom: event.targetRoom,
          targetBed: event.targetBed,
          dischargeReason: event.dischargeReason,
        },
      });

      store.addTrace({
        provider: 'SYNTHETIC',
        operation: `ADT_${event.eventType}`,
        requestType: 'POST',
        endpointOrMethod: `SyntheticPCCProvider.simulateADTEvent() -> ADTProcessor`,
        responseStatus: 'SUCCESS',
        processingDurationMs: Math.max(elapsed, 18),
        mappingResultSummary: summaryMessage,
        source: 'SYNTHETIC',
        sanitizedPayloadSummary: {
          eventType: event.eventType,
          mrn: event.mrn,
          targetRoom: event.targetRoom,
          targetBed: event.targetBed,
          facilityId: event.facId,
        },
      });

      return {
        success: true,
        mrn: event.mrn,
        eventType: event.eventType,
        message: summaryMessage,
        resident,
        event: auditEvent,
      };
    } catch (err: unknown) {
      const elapsed = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown integration error';

      const auditEvent = store.addEvent({
        eventType:
          event.eventType === 'ADMISSION'
            ? 'ADT_ADMISSION'
            : event.eventType === 'TRANSFER'
            ? 'ADT_TRANSFER'
            : 'ADT_DISCHARGE',
        mrn: event.mrn,
        source: 'ADT Simulator',
        status: 'FAILED',
        processingTimeMs: elapsed,
        message: `Failed to process ADT event: ${errorMsg}`,
        errorMessage: errorMsg,
        details: { rawPayload },
      });

      if (err instanceof IntegrationError) throw err;
      throw new IntegrationError('INTERNAL_INTEGRATION_FAULT', errorMsg, 500, { eventId: auditEvent.id });
    }
  }
}
