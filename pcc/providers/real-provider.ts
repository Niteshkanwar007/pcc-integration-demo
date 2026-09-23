/**
 * Real PointClickCare Provider Adapter Skeleton
 *
 * This is an adapter skeleton designed to plug into official PointClickCare
 * Sandbox or Production APIs once legitimate credentials and developer portal access
 * are provisioned.
 *
 * ARCHITECTURAL CONSTRAINTS:
 * - Contains NO hardcoded secrets or credentials.
 * - Does NOT invent base URLs, endpoint paths, or proprietary schemas.
 * - Does NOT make speculative network requests.
 * - Throws clear, structured errors when configuration is absent.
 */

import {
  PCCProvider,
  PCCCapabilities,
  PCCConnectionStatusReport,
  PCCConfig,
} from './types';
import {
  PCCResident,
  PCCFacility,
  PCCDiagnosis,
  PCCClientSearchFilter,
} from '../types';
import { PCCConfigValidator } from './config-validator';
import { getDeclaredCapabilitiesForMode } from './capability-matrix';

export class RealPCCProvider implements PCCProvider {
  public readonly id = 'real-pcc-provider-skeleton';
  public readonly name = 'Real PointClickCare Provider Adapter (Skeleton)';
  public readonly mode: 'REAL_SANDBOX' | 'REAL_PRODUCTION';

  private config: PCCConfig;

  constructor(config?: PCCConfig) {
    this.config = config || PCCConfigValidator.readConfigFromEnv();
    this.mode = this.config.environment === 'production' ? 'REAL_PRODUCTION' : 'REAL_SANDBOX';
  }

  public getCapabilities(): PCCCapabilities {
    return getDeclaredCapabilitiesForMode(this.mode);
  }

  public async getConnectionStatus(): Promise<PCCConnectionStatusReport> {
    return PCCConfigValidator.evaluateConnectionStatus(this.config, this.mode);
  }

  private assertConfigured(): void {
    const status = PCCConfigValidator.evaluateConnectionStatus(this.config, this.mode);
    if (!status.isConfigured) {
      throw new Error(
        `[PCC Real Provider] Cannot execute live EHR operation. ${status.message}`
      );
    }
  }

  public async getPatient(idOrMrn: string): Promise<PCCResident | null> {
    this.assertConfigured();
    // In a future phase with live credentials:
    // 1. Obtain Bearer token via OAuth 2.0 client credentials.
    // 2. Execute GET ${this.config.baseUrl}/Patient?identifier=${idOrMrn}
    // 3. Map FHIR Patient resource into canonical model.
    throw new Error(
      `[PCC Real Provider] Operation 'getPatient' requires verified PointClickCare API access. Target identifier: ${idOrMrn}`
    );
  }

  public async searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]> {
    this.assertConfigured();
    throw new Error(
      `[PCC Real Provider] Operation 'searchPatients' requires verified PointClickCare API access. Filter: ${JSON.stringify(filter || {})}`
    );
  }

  public async getPatientConditions(patientId: string): Promise<PCCDiagnosis[]> {
    this.assertConfigured();
    throw new Error(
      `[PCC Real Provider] Operation 'getPatientConditions' requires verified PointClickCare API access. PatientId: ${patientId}`
    );
  }

  public async getFacilities(): Promise<PCCFacility[]> {
    this.assertConfigured();
    throw new Error(
      "[PCC Real Provider] Operation 'getFacilities' requires verified PointClickCare Partner API access."
    );
  }

  public async reconcilePatients(sinceTimestamp?: string): Promise<PCCResident[]> {
    this.assertConfigured();
    throw new Error(
      `[PCC Real Provider] Operation 'reconcilePatients' requires verified PointClickCare API access. Watermark: ${sinceTimestamp || 'none'}`
    );
  }
}
