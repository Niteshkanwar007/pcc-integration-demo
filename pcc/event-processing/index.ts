/**
 * PointClickCare Event Processing Abstraction
 *
 * Enforces the formal event pipeline:
 *
 *   External PCC payload
 *           ↓
 *   PCC-specific adapter/parser (PCCExternalEventAdapter / PCCEventParser)
 *           ↓
 *   Canonical ADT event (PCCADTEventPayload)
 *           ↓
 *   ADTProcessor
 *           ↓
 *   Internal business workflow
 *
 * Note: The interactive UI simulator generates canonical synthetic events directly.
 * Real inbound webhooks or HL7 messages arrive in proprietary vendor envelopes and must
 * pass through the PCC-specific adapter before reaching the canonical ADT processor.
 */

import { PCCADTEventPayload, PCCADTEventType, RawExternalPCCEventEnvelope } from '../types';
import { IntegrationError } from '@/integration/error-handling';

export interface IPCCEventParser {
  validateEventPayload(rawPayload: unknown): { isValid: boolean; error?: string; validatedEvent?: PCCADTEventPayload };
}

/**
 * Validates and normalizes canonical ADT event structures.
 */
export class PCCEventParser implements IPCCEventParser {
  public validateEventPayload(rawPayload: unknown): { isValid: boolean; error?: string; validatedEvent?: PCCADTEventPayload } {
    if (!rawPayload || typeof rawPayload !== 'object') {
      return { isValid: false, error: 'Event payload must be a non-null JSON object.' };
    }

    const payload = rawPayload as Partial<PCCADTEventPayload>;

    const validTypes: PCCADTEventType[] = ['ADMISSION', 'TRANSFER', 'DISCHARGE'];
    if (!payload.eventType || !validTypes.includes(payload.eventType)) {
      return {
        isValid: false,
        error: `Invalid or missing eventType. Expected one of: ${validTypes.join(', ')}`,
      };
    }

    if (!payload.mrn || typeof payload.mrn !== 'string' || payload.mrn.trim().length === 0) {
      return { isValid: false, error: 'Missing or empty MRN (Medical Record Number).' };
    }

    if (!payload.facId || typeof payload.facId !== 'string') {
      return { isValid: false, error: 'Missing or invalid facId (Facility ID).' };
    }

    if (payload.eventType === 'TRANSFER' && !payload.targetRoom) {
      return { isValid: false, error: 'TRANSFER events require a targetRoom property.' };
    }

    const normalized: PCCADTEventPayload = {
      eventId: payload.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: payload.eventType,
      patientId: payload.patientId || `pcc_pid_${payload.mrn}`,
      mrn: payload.mrn.trim().toUpperCase(),
      facId: payload.facId,
      facilityName: payload.facilityName || '',
      timestamp: payload.timestamp || new Date().toISOString(),
      targetRoom: payload.targetRoom?.trim(),
      targetBed: payload.targetBed?.trim(),
      dischargeReason: payload.dischargeReason?.trim(),
      transferDestination: payload.transferDestination?.trim(),
      diagnoses: payload.diagnoses,
      notes: payload.notes?.trim(),
    };

    return {
      isValid: true,
      validatedEvent: normalized,
    };
  }
}

/**
 * PCC-Specific External Event Adapter
 *
 * Demonstrates the boundary parser that adapts proprietary vendor envelopes
 * into canonical ADT event structures before passing to ADTProcessor.
 */
export class PCCExternalEventAdapter {
  /**
   * Adapts a raw external PCC webhook envelope into a normalized PCCADTEventPayload.
   * Exact field mapping must be verified against official PCC developer documentation.
   */
  public static adaptExternalPayload(rawEnvelope: RawExternalPCCEventEnvelope): PCCADTEventPayload {
    return this.normalizeExternalEvent(rawEnvelope);
  }

  /**
   * Normalizes an external webhook envelope into canonical PCCADTEventPayload.
   * Throws IntegrationError if envelope is malformed or lacks necessary patient/tenant identity.
   */
  public static normalizeExternalEvent(rawEnvelope: unknown): PCCADTEventPayload {
    if (!rawEnvelope || typeof rawEnvelope !== 'object') {
      throw new IntegrationError('INVALID_EXTERNAL_PAYLOAD', 'External event envelope must be a valid object.');
    }

    const env = rawEnvelope as Record<string, unknown>;
    const payload = (env.payload || env.data || {}) as Record<string, unknown>;
    const rawType = String(env.externalEventType || env.eventType || '').toUpperCase();

    // Map external vendor event name to canonical ADT event type
    let canonicalType: PCCADTEventType = 'ADMISSION';
    if (rawType.includes('TRANSFER') || rawType.includes('ROOM') || rawType.includes('A02')) {
      canonicalType = 'TRANSFER';
    } else if (rawType.includes('DISCHARGE') || rawType.includes('A03')) {
      canonicalType = 'DISCHARGE';
    }

    const mrn = payload.mrn || payload.patientIdentifier || payload.medicalRecordNumber;
    const patientId = payload.residentId || payload.patientId || (mrn ? `pcc_${mrn}` : undefined);
    const facId = env.facilityId || payload.facId || payload.facilityId;

    if (!mrn || !patientId) {
      throw new IntegrationError(
        'INVALID_EXTERNAL_PAYLOAD',
        'External event envelope missing required resident/patient identifiers.'
      );
    }

    const eventId = String(env.externalEventId || env.subscriptionId || `ext_${Date.now()}`);
    const timestamp = String(env.occurredAt || env.eventTime || new Date().toISOString());

    return {
      eventId,
      eventType: canonicalType,
      patientId: String(patientId),
      mrn: String(mrn).trim().toUpperCase(),
      facId: String(facId || 'UNKNOWN'),
      facilityName: payload.facilityName ? String(payload.facilityName) : undefined,
      timestamp,
      targetRoom: payload.room ? String(payload.room) : payload.targetRoom ? String(payload.targetRoom) : undefined,
      targetBed: payload.bed ? String(payload.bed) : payload.targetBed ? String(payload.targetBed) : undefined,
      dischargeReason: payload.dischargeReason ? String(payload.dischargeReason) : undefined,
      transferDestination: payload.transferDestination ? String(payload.transferDestination) : undefined,
      notes: payload.residentName ? String(payload.residentName) : payload.notes ? String(payload.notes) : undefined,
    };
  }
}
