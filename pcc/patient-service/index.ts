/**
 * PointClickCare Patient Service
 *
 * Provides domain-level operations for patient querying and diagnosis retrieval,
 * abstracting low-level client operations.
 */

import { IPCCClient } from '../client';
import { PCCResident, PCCFacility, PCCClientSearchFilter } from '../types';

export interface IPCCPatientService {
  getResidentByMrn(mrn: string): Promise<PCCResident | null>;
  listResidents(filter?: PCCClientSearchFilter): Promise<PCCResident[]>;
  getFacilities(): Promise<PCCFacility[]>;
}

export class PCCPatientService implements IPCCPatientService {
  constructor(private client: IPCCClient) {}

  public async getResidentByMrn(mrn: string): Promise<PCCResident | null> {
    return this.client.getPatient(mrn);
  }

  public async listResidents(filter?: PCCClientSearchFilter): Promise<PCCResident[]> {
    return this.client.searchPatients(filter);
  }

  public async getFacilities(): Promise<PCCFacility[]> {
    return this.client.getFacilities();
  }
}
