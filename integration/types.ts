/**
 * Integration Domain Types
 *
 * Defines the canonical resident model and integration audit structures
 * used across the DME system. Decouples the internal DME domain from
 * PointClickCare's vendor-specific wire format.
 */

export type ResidentStatus = 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED' | 'ON_HOLD';

export interface CanonicalInsurance {
  payerName: string;
  policyNumber?: string;
  payerType: string;
  /** Status of the coverage record in the EHR (e.g., active, draft, cancelled, unknown). Does NOT imply verified eligibility. */
  coverageStatus?: string;
  /** Explicit real-time eligibility verification status with payer/clearinghouse (false until 270/271 workflow runs). */
  eligibilityVerified?: boolean;
  /** Verification flag (false until legitimate verification runs; never equated with active coverage status). */
  isVerified: boolean;
  /** Origin of verification statement. */
  verificationSource?: 'LIVE_CLEARINGHOUSE' | 'SYNTHETIC_DEMO' | 'NOT_PERFORMED';
}

export interface CanonicalDiagnosis {
  icd10: string;
  description: string;
  classification: string;
  isPrimary: boolean;
  onsetDate: string;
}

export interface CanonicalResident {
  mrn: string;
  pccPatientId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: string;
  facilityId?: string;
  facilityName?: string;
  room?: string;
  bed?: string;
  status: ResidentStatus;
  admissionDate?: string;
  dischargeDate?: string;
  primaryInsurance: CanonicalInsurance;
  activeDiagnoses: CanonicalDiagnosis[];
  lastSyncTimestamp: string;
  syncStatus: 'SYNCED' | 'OUT_OF_SYNC' | 'FAILED';
  rawPccChecksum?: string;
}

export type IntegrationEventType =
  | 'PCC_PATIENT_SYNC'
  | 'ADT_ADMISSION'
  | 'ADT_TRANSFER'
  | 'ADT_DISCHARGE'
  | 'DME_ORDER_CREATED'
  | 'DME_ORDER_UPDATED'
  | 'EQUIPMENT_RECOMMENDATION'
  | 'SYSTEM_HEALTH_CHECK';

export type IntegrationEventStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

export interface InspectorTraceRecord {
  id: string;
  timestamp: string;
  provider: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
  operation: string;
  requestType: 'GET' | 'POST' | 'INTERNAL_EVAL';
  endpointOrMethod: string;
  responseStatus: number | 'SUCCESS' | 'FAILED';
  processingDurationMs: number;
  mappingResultSummary: string;
  errorState?: string;
  source: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
  sanitizedPayloadSummary?: Record<string, unknown>;
}

export interface IntegrationEvent {
  id: string;
  timestamp: string;
  provider: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
  eventType: IntegrationEventType | string;
  entityType: 'RESIDENT' | 'DIAGNOSIS' | 'COVERAGE' | 'ORDER' | 'SYSTEM';
  entityId: string;
  mrn?: string;
  patientName?: string;
  source: 'SYNTHETIC' | 'PCC SANDBOX' | 'PointClickCare (Synthetic)' | 'Integration Engine' | 'DME Workflow' | 'ADT Simulator';
  status: IntegrationEventStatus | 'PROCESSED';
  duration?: number;
  processingTimeMs: number;
  message: string;
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export interface IntegrationMetrics {
  connectionStatus: 'CONNECTED' | 'SIMULATED' | 'DEGRADED' | 'DISCONNECTED';
  providerMode: 'SYNTHETIC' | 'SANDBOX' | 'PRODUCTION';
  environment: 'DEMO / SYNTHETIC DATA';
  lastSyncTimestamp: string;
  totalSynchronizedResidents: number;
  activeAdmittedCount: number;
  recentEventsCount: number;
  pendingOrdersCount: number;
  averageProcessingTimeMs: number;
  errorRatePercent: number;
}
