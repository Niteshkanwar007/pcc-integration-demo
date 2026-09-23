/**
 * PointClickCare (PCC) Provider Architecture & Interfaces
 *
 * Defines the contract for EHR data providers (Synthetic vs Real PCC Sandbox/Production),
 * capability declarations, connection status states, and configuration validation models.
 */

import {
  PCCResident,
  PCCFacility,
  PCCDiagnosis,
  PCCClientSearchFilter,
  PCCADTEventPayload,
} from '../types';

/**
 * Capability declarations for a PCC provider implementation.
 * Applications inspect these capabilities before exposing features.
 */
export interface PCCCapabilities {
  patientRead: boolean;
  patientSearch: boolean;
  conditionRead: boolean;
  coverageRead: boolean;
  documentRead: boolean;
  orderRead: boolean;
  realtimeEvents: boolean;
  orderWriteBack: boolean;
}

/**
 * Verification status for architectural capabilities.
 * Distinguishes what is verified against official specs vs unverified/partner-only.
 *
 * 1. VERIFIED_AGAINST_PCC: Means an actual legitimate PCC environment/sandbox was successfully tested.
 * 2. DOCUMENTED_SUPPORTED: Means the capability is supported by legitimate PCC documentation, but has not been personally verified in this application.
 * 3. NOT_VERIFIED: Not verified against specifications or live environment.
 * 4. REQUIRES_PCC_PARTNER_ACCESS: Requires PointClickCare Developer Partner program enrollment.
 * 5. SYNTHETIC_ONLY: Simulated locally in demo mode only.
 */
export type CapabilityVerificationStatus =
  | 'VERIFIED_AGAINST_PCC'
  | 'DOCUMENTED_SUPPORTED'
  | 'NOT_VERIFIED'
  | 'REQUIRES_PCC_PARTNER_ACCESS'
  | 'SYNTHETIC_ONLY';

export interface PCCCapabilityItem {
  id: keyof PCCCapabilities | string;
  name: string;
  category: 'Patient Data' | 'Clinical' | 'Census & ADT' | 'Orders' | 'Infrastructure' | 'Demo Simulator';
  status: CapabilityVerificationStatus;
  supportedInSynthetic: boolean;
  supportedInRealSandbox: boolean;
  description: string;
  notes: string;
}

/**
 * Formal PCC Connection States.
 * A missing or partial configuration can NEVER be reported as a successful connection.
 * Cannot transition to VERIFIED without explicit runtime verification.
 */
export type PCCConnectionState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED_NOT_VERIFIED'
  | 'VERIFIED_SANDBOX'
  | 'VERIFIED_PRODUCTION';

export type LivePCCVerificationStatus = 'NOT_PERFORMED' | 'FAILED' | 'VERIFIED';

export interface PCCConnectionStatusReport {
  connectionState: PCCConnectionState;
  providerMode: 'SYNTHETIC' | 'REAL_SANDBOX' | 'REAL_PRODUCTION';
  providerStatus?: 'SIMULATED' | 'CONNECTED' | 'DISCONNECTED';
  activeProviderName: string;
  isConfigured: boolean;
  isVerified: boolean;
  livePccVerification: LivePCCVerificationStatus;
  livePccVerificationStatusText: 'NOT PERFORMED' | 'FAILED' | 'VERIFIED';
  message: string;
  missingConfig: string[];
  lastChecked: string;
  verifiedEndpointsCount?: number;
}

/**
 * Configuration schema for official PointClickCare environments.
 * Values are provided via environment variables, NEVER hardcoded.
 */
export interface PCCConfig {
  baseUrl?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  authMode?: 'client_credentials' | 'authorization_code';
  environment?: 'synthetic' | 'sandbox' | 'production';
}

export class PCCConfigurationError extends Error {
  public readonly missingFields: string[];
  public readonly selectedMode: string;

  constructor(message: string, missingFields: string[] = [], selectedMode = '') {
    super(message);
    this.name = 'PCCConfigurationError';
    this.missingFields = missingFields;
    this.selectedMode = selectedMode;
    Object.setPrototypeOf(this, PCCConfigurationError.prototype);
  }
}

/**
 * Universal PCC Provider Interface.
 * Defines domain operations required by integration workflows.
 */
export interface PCCProvider {
  readonly id: string;
  readonly name: string;
  readonly mode: 'SYNTHETIC' | 'REAL_SANDBOX' | 'REAL_PRODUCTION';

  /**
   * Explicitly declared capabilities for this provider instance.
   */
  getCapabilities(): PCCCapabilities;

  /**
   * Reports live or synthetic connection status.
   */
  getConnectionStatus(): Promise<PCCConnectionStatusReport>;

  /**
   * Patient / resident lookup by internal ID or MRN.
   */
  getPatient(idOrMrn: string): Promise<PCCResident | null>;

  /**
   * Multi-resident demographic query with optional filtering.
   */
  searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]>;

  /**
   * Clinical diagnoses and ICD-10 conditions for a patient.
   */
  getPatientConditions(patientId: string): Promise<PCCDiagnosis[]>;

  /**
   * Payer and insurance coverage details.
   */
  getPatientCoverage?(patientId: string): Promise<{
    payerName: string;
    payerType: string;
    subscriberId?: string;
    coverageStatus: string;
    eligibilityVerified: boolean;
    isVerified: boolean;
    verificationSource?: string;
  } | null>;

  /**
   * Clinical documentation references (e.g., PT assessments, nursing notes).
   */
  getPatientDocuments?(patientId: string): Promise<Array<{
    documentId: string;
    title: string;
    category: string;
    date: string;
    status: string;
  }>>;

  /**
   * Resident medical equipment or supply orders.
   */
  getOrders?(patientId: string): Promise<Array<{
    orderId: string;
    itemDescription: string;
    orderDate: string;
    status: string;
  }>>;

  /**
   * Facilities accessible by the active tenant or provider credentials.
   */
  getFacilities(): Promise<PCCFacility[]>;

  /**
   * Reconciles patient census delta since the given timestamp.
   */
  reconcilePatients(sinceTimestamp?: string): Promise<PCCResident[]>;

  /**
   * Subscribes to real-time webhook events if the provider supports it.
   */
  subscribeToEvents?(callbackUrl: string): Promise<{ subscriptionId: string; status: string }>;
}

/**
 * Extended interface for providers that support interactive demo simulation.
 */
export interface ISimulatedPCCProvider extends PCCProvider {
  simulateADTEvent(event: PCCADTEventPayload): Promise<{
    success: boolean;
    eventId: string;
    timestamp: string;
  }>;
}
