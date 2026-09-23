/**
 * Synthetic PointClickCare Provider
 *
 * Implements the PCCProvider interface using an in-memory synthetic patient cohort.
 * Powers the demonstration without connecting to external networks or live EHRs.
 *
 * All operations clearly tag outputs as SYNTHETIC.
 */

import {
  ISimulatedPCCProvider,
  PCCCapabilities,
  PCCConnectionStatusReport,
} from './types';
import {
  PCCResident,
  PCCFacility,
  PCCDiagnosis,
  PCCClientSearchFilter,
  PCCADTEventPayload,
} from '../types';
import {
  INITIAL_SYNTHETIC_PCC_RESIDENTS,
  INITIAL_SYNTHETIC_FACILITIES,
} from '@/demo/synthetic-data';
import { getDeclaredCapabilitiesForMode } from './capability-matrix';

import { PCCConfigValidator } from './config-validator';

export class SyntheticPCCProvider implements ISimulatedPCCProvider {
  public readonly id = 'synthetic-pcc-provider';
  public readonly name = 'Synthetic PCC Provider';
  public readonly mode = 'SYNTHETIC' as const;

  private residents: Map<string, PCCResident> = new Map();
  private facilities: PCCFacility[] = [];

  constructor() {
    this.seedState();
  }

  private seedState(): void {
    this.facilities = [...INITIAL_SYNTHETIC_FACILITIES];
    for (const res of INITIAL_SYNTHETIC_PCC_RESIDENTS) {
      this.residents.set(res.mrn.toUpperCase(), { ...res });
      this.residents.set(res.patientId, { ...res });
    }
  }

  public getCapabilities(): PCCCapabilities {
    return getDeclaredCapabilitiesForMode('SYNTHETIC');
  }

  public async getConnectionStatus(): Promise<PCCConnectionStatusReport> {
    return PCCConfigValidator.evaluateConnectionStatus({}, 'SYNTHETIC');
  }

  public async getPatient(idOrMrn: string): Promise<PCCResident | null> {
    const key = idOrMrn.trim().toUpperCase();
    const resident = this.residents.get(key) || null;
    return resident ? { ...resident } : null;
  }

  public async searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]> {
    let list = Array.from(new Set(this.residents.values()));

    if (filter?.facId) {
      list = list.filter((r) => r.facId === filter.facId);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.firstName.toLowerCase().includes(term) ||
          r.lastName.toLowerCase().includes(term) ||
          r.mrn.toLowerCase().includes(term) ||
          r.roomNumber.toLowerCase().includes(term)
      );
    }

    return list.map((r) => ({ ...r }));
  }

  public async getPatientConditions(patientId: string): Promise<PCCDiagnosis[]> {
    const resident = await this.getPatient(patientId);
    return resident?.diagnoses ? [...resident.diagnoses] : [];
  }

  public async getPatientCoverage(patientId: string): Promise<{
    payerName: string;
    payerType: string;
    subscriberId?: string;
    coverageStatus: string;
    eligibilityVerified: boolean;
    isVerified: boolean;
    verificationSource?: string;
  } | null> {
    const resident = await this.getPatient(patientId);
    if (!resident) return null;
    return {
      payerName: resident.primaryPayerName,
      payerType: resident.primaryPayerType,
      subscriberId: `SUB-${resident.mrn.replace('MRN-', '')}`,
      coverageStatus: 'active',
      eligibilityVerified: false, // Live clearinghouse 270/271 eligibility check has NOT been executed
      isVerified: false, // Separate from active coverage status
      verificationSource: 'NOT_PERFORMED',
    };
  }

  public async getPatientDocuments(patientId: string): Promise<Array<{
    documentId: string;
    title: string;
    category: string;
    date: string;
    status: string;
  }>> {
    const resident = await this.getPatient(patientId);
    if (!resident) return [];
    return [
      {
        documentId: `DOC-${resident.mrn}-01`,
        title: 'Initial Physical Therapy & Mobility Assessment',
        category: 'Therapy Assessment',
        date: resident.admissionDate,
        status: 'Completed',
      },
      {
        documentId: `DOC-${resident.mrn}-02`,
        title: 'Nursing Skin & Wound Evaluation (Braden Scale)',
        category: 'Clinical Evaluation',
        date: resident.admissionDate,
        status: 'Completed',
      },
    ];
  }

  public async getOrders(patientId: string): Promise<Array<{
    orderId: string;
    itemDescription: string;
    orderDate: string;
    status: string;
  }>> {
    const resident = await this.getPatient(patientId);
    if (!resident) return [];
    return [];
  }

  public async getFacilities(): Promise<PCCFacility[]> {
    return [...this.facilities];
  }

  public async reconcilePatients(): Promise<PCCResident[]> {
    return this.searchPatients();
  }

  public async simulateADTEvent(event: PCCADTEventPayload): Promise<{
    success: boolean;
    eventId: string;
    timestamp: string;
  }> {
    const key = event.mrn.toUpperCase();
    const existing = this.residents.get(key);

    if (event.eventType === 'ADMISSION') {
      const newResident: PCCResident = {
        patientId: event.patientId,
        mrn: event.mrn,
        facId: event.facId,
        facilityName: event.facilityName || 'Pinecrest Rehabilitation & Healthcare',
        firstName: event.notes?.split(' ')[0] || 'Admitted',
        lastName: event.notes?.split(' ')[1] || 'Resident',
        gender: 'Other',
        birthDate: '1945-03-12',
        admissionDate: event.timestamp.slice(0, 10),
        roomNumber: event.targetRoom || '101',
        bedDescription: `Bed ${event.targetRoom || '101'}-${event.targetBed || 'A'}`,
        status: 'Active',
        primaryPayerName: 'Medicare Part A',
        primaryPayerType: 'Medicare',
        diagnoses: event.diagnoses || [],
        lastModifiedTimestamp: new Date().toISOString(),
      };
      this.residents.set(key, newResident);
      this.residents.set(newResident.patientId, newResident);
    } else if (existing) {
      if (event.eventType === 'TRANSFER') {
        existing.roomNumber = event.targetRoom || existing.roomNumber;
        existing.bedDescription = `Bed ${event.targetRoom}-${event.targetBed || 'A'}`;
        existing.lastModifiedTimestamp = new Date().toISOString();
      } else if (event.eventType === 'DISCHARGE') {
        existing.status = 'Discharged';
        existing.dischargeDate = event.timestamp.slice(0, 10);
        existing.lastModifiedTimestamp = new Date().toISOString();
      }
      this.residents.set(key, existing);
    }

    return {
      success: true,
      eventId: event.eventId,
      timestamp: event.timestamp,
    };
  }
}
