/**
 * Synthetic PointClickCare Client Implementation
 *
 * Implements IPCCClient by reading/writing to an in-memory synthetic EHR repository.
 * Emulates network latency, validates payloads, and logs client interactions.
 */

import { IPCCClient } from './index';
import {
  PCCResident,
  PCCFacility,
  PCCDiagnosis,
  PCCClientSearchFilter,
  PCCConnectionHealth,
  PCCADTEventPayload,
} from '../types';
import { IPCCAuthenticator, SyntheticPCCAuthenticator } from '../authentication';
import {
  SYNTHETIC_FACILITIES,
  INITIAL_SYNTHETIC_PCC_RESIDENTS,
} from '@/demo/synthetic-data';

export class SyntheticPCCClient implements IPCCClient {
  private authenticator: IPCCAuthenticator;
  private residents: Map<string, PCCResident> = new Map();
  private facilities: PCCFacility[] = [];

  constructor(authenticator?: IPCCAuthenticator) {
    this.authenticator = authenticator || new SyntheticPCCAuthenticator({ environment: 'synthetic' });
    this.seedInitialData();
  }

  private seedInitialData(): void {
    this.facilities = [...SYNTHETIC_FACILITIES];
    for (const r of INITIAL_SYNTHETIC_PCC_RESIDENTS) {
      // Store under both MRN and patientId for quick lookup
      this.residents.set(r.mrn.toUpperCase(), { ...r, diagnoses: [...r.diagnoses] });
      this.residents.set(r.patientId, { ...r, diagnoses: [...r.diagnoses] });
    }
  }

  public getAuthenticator(): IPCCAuthenticator {
    return this.authenticator;
  }

  public async ping(): Promise<PCCConnectionHealth> {
    // Simulate brief network ping
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 15));
    return {
      status: 'SIMULATED',
      mode: 'SYNTHETIC',
      latencyMs: Date.now() - startTime + 12,
      connectedOrg: 'Synthetic PCC Client (In-Memory Emulation)',
      lastChecked: new Date().toISOString(),
    };
  }

  public async getPatient(patientIdOrMrn: string): Promise<PCCResident | null> {
    const key = patientIdOrMrn.trim().toUpperCase();
    const resident = this.residents.get(key);
    if (!resident) {
      return null;
    }
    // Return deep copy
    return JSON.parse(JSON.stringify(resident));
  }

  public async searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]> {
    // Deduplicate unique MRNs
    const uniqueMap = new Map<string, PCCResident>();
    for (const res of this.residents.values()) {
      uniqueMap.set(res.mrn, res);
    }
    let list = Array.from(uniqueMap.values());

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
          r.mrn.toLowerCase().includes(term) ||
          r.firstName.toLowerCase().includes(term) ||
          r.lastName.toLowerCase().includes(term) ||
          r.roomNumber.toLowerCase().includes(term)
      );
    }

    return JSON.parse(JSON.stringify(list));
  }

  public async getFacilities(): Promise<PCCFacility[]> {
    return JSON.parse(JSON.stringify(this.facilities));
  }

  public async getDiagnosesForPatient(patientIdOrMrn: string): Promise<PCCDiagnosis[]> {
    const patient = await this.getPatient(patientIdOrMrn);
    return patient ? patient.diagnoses : [];
  }

  public async simulateADTEvent(event: PCCADTEventPayload): Promise<{ success: boolean; eventId: string; timestamp: string }> {
    const key = event.mrn.trim().toUpperCase();
    const existing = this.residents.get(key);

    const now = new Date().toISOString();

    if (event.eventType === 'ADMISSION') {
      const fac = this.facilities.find((f) => f.facId === event.facId) || this.facilities[0];
      const newResident: PCCResident = {
        patientId: event.patientId || `PCC-RES-${Date.now().toString().slice(-5)}`,
        mrn: event.mrn,
        facId: event.facId,
        facilityName: fac.name,
        firstName: event.notes?.split(' ')[0] || 'Admitted',
        lastName: event.notes?.split(' ')[1] || 'Resident',
        gender: 'Other',
        birthDate: '',
        admissionDate: now.slice(0, 10),
        roomNumber: event.targetRoom || '',
        bedDescription: event.targetBed || '',
        status: 'Active',
        primaryPayerName: 'Medicare Part A',
        primaryPayerType: 'Medicare',
        diagnoses: event.diagnoses && event.diagnoses.length > 0 ? event.diagnoses : [
          {
            code: 'R29.6',
            description: 'Repeated falls, gait instability',
            classification: 'Primary',
            onsetDate: now.slice(0, 10),
            rank: 1,
            isActive: true,
          }
        ],
        lastModifiedTimestamp: now,
      };
      this.residents.set(newResident.mrn.toUpperCase(), newResident);
      this.residents.set(newResident.patientId, newResident);
    } else if (existing) {
      if (event.eventType === 'TRANSFER') {
        if (event.targetRoom) existing.roomNumber = event.targetRoom;
        if (event.targetBed) existing.bedDescription = event.targetBed;
        existing.status = 'Active';
        existing.lastModifiedTimestamp = now;
      } else if (event.eventType === 'DISCHARGE') {
        existing.status = 'Discharged';
        existing.dischargeDate = now.slice(0, 10);
        existing.lastModifiedTimestamp = now;
      }
      this.residents.set(existing.mrn.toUpperCase(), existing);
      this.residents.set(existing.patientId, existing);
    }

    return {
      success: true,
      eventId: event.eventId,
      timestamp: now,
    };
  }
}
