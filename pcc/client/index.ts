/**
 * PointClickCare Client Abstraction
 *
 * Defines the contract for interacting with the PointClickCare REST API.
 * The rest of the application depends exclusively on this interface, allowing
 * the synthetic provider to be swapped with a real sandbox provider with zero
 * changes to the core business logic.
 */

import {
  PCCResident,
  PCCFacility,
  PCCDiagnosis,
  PCCClientSearchFilter,
  PCCConnectionHealth,
  PCCADTEventPayload,
} from '../types';
import { IPCCAuthenticator } from '../authentication';

export interface IPCCClient {
  getPatient(patientIdOrMrn: string): Promise<PCCResident | null>;
  searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]>;
  getFacilities(): Promise<PCCFacility[]>;
  getDiagnosesForPatient(patientId: string): Promise<PCCDiagnosis[]>;
  ping(): Promise<PCCConnectionHealth>;
  simulateADTEvent(event: PCCADTEventPayload): Promise<{ success: boolean; eventId: string; timestamp: string }>;
  getAuthenticator(): IPCCAuthenticator;
}

export { SyntheticPCCClient } from './synthetic-client';

/**
 * ARCHITECTURE PLACEHOLDER: RealPCCClient
 * In a future phase, a class implementing IPCCClient will be provided here:
 *
 * export class RealPCCClient implements IPCCClient {
 *   constructor(private auth: IPCCAuthenticator, private baseUrl: string) {}
 *   // Real fetch calls to official PCC endpoints with Bearer auth headers
 * }
 */
