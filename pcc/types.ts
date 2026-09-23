/**
 * PointClickCare (PCC) Integration Types & Interfaces
 *
 * NOTE: This is a sanitized abstraction designed for architectural demonstration
 * and synthetic data workflows. It models standard EHR concepts (Residents, Facilities,
 * Diagnoses, ADT events) without embedding confidential proprietary schemas.
 */

export interface PCCAuthConfig {
  clientId?: string;
  clientSecret?: string;
  orgUuid?: string;
  environment: 'synthetic' | 'sandbox' | 'production';
  tokenEndpoint?: string;
}

export interface PCCAuthTokens {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  issuedAt: string;
  scope: string;
}

export interface PCCFacility {
  facId: string;
  name: string;
  orgUuid: string;
  timeZone: string;
  city: string;
  state: string;
  capacity: number;
}

export interface PCCDiagnosis {
  code: string; // e.g. ICD-10 code (e.g. "L89.153")
  description: string;
  classification: 'Primary' | 'Secondary' | 'Admitting';
  onsetDate: string;
  rank: number;
  isActive: boolean;
}

export interface PCCResident {
  patientId: string;
  mrn: string;
  facId: string;
  facilityName: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'Other';
  birthDate: string;
  admissionDate: string;
  dischargeDate?: string;
  roomNumber: string;
  bedDescription: string;
  status: 'Active' | 'Discharged' | 'Hospitalized' | 'Hold';
  primaryPayerName: string;
  primaryPayerType: 'Medicare' | 'Medicaid' | 'Managed Care' | 'Commercial' | 'Private';
  diagnoses: PCCDiagnosis[];
  lastModifiedTimestamp: string;
}

export type PCCADTEventType = 'ADMISSION' | 'TRANSFER' | 'DISCHARGE';

/**
 * ARCHITECTURAL BOUNDARY: External PCC Event vs. Canonical ADT Event
 *
 * In a real production EHR integration, incoming event notifications from PointClickCare
 * arrive via proprietary webhook envelopes or HL7 v2 messages (e.g. A01/A02/A03) with
 * vendor-specific headers, routing tokens, and nested schemas.
 *
 * Enforced Architecture:
 *   External PCC payload
 *           ↓
 *   PCC-specific adapter/parser (e.g. PCCExternalEventAdapter)
 *           ↓
 *   Canonical ADT event (PCCADTEventPayload / CanonicalADTEvent)
 *           ↓
 *   ADTProcessor
 *           ↓
 *   Internal business workflow
 *
 * The current interactive ADT simulator generates canonical synthetic events directly.
 * Do not assume or imply that a real PointClickCare external webhook payload matches
 * the normalized PCCADTEventPayload interface.
 */
export interface RawExternalPCCEventEnvelope {
  /** Raw vendor event name or notification type (e.g. 'Resident.Admitted' or HL7 'ADT^A01') */
  eventType?: string;
  /** Raw timestamp or event sequence */
  eventTime?: string;
  /** Vendor subscription or delivery metadata */
  subscriptionId?: string;
  /** Raw patient, facility, and census data payload (vendor specific) */
  data?: Record<string, unknown>;
  /** Optional cryptographic signature header or token */
  signature?: string;
}

export interface PCCADTEventPayload {
  eventId: string;
  eventType: PCCADTEventType;
  patientId: string;
  mrn: string;
  facId: string;
  facilityName?: string;
  timestamp: string;
  targetRoom?: string;
  targetBed?: string;
  dischargeReason?: string;
  transferDestination?: string;
  diagnoses?: PCCDiagnosis[];
  notes?: string;
}

export interface PCCClientSearchFilter {
  facId?: string;
  status?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export interface PCCConnectionHealth {
  status: 'CONNECTED' | 'SIMULATED' | 'DEGRADED' | 'DISCONNECTED';
  mode: 'SYNTHETIC' | 'SANDBOX' | 'PRODUCTION';
  latencyMs: number;
  connectedOrg: string;
  lastChecked: string;
}
