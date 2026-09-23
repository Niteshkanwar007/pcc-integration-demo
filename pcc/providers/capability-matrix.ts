/**
 * PCC Capability Matrix Definition
 *
 * Defines the explicit verification and support status for each PointClickCare
 * capability. Status values are driven by this configuration, NOT assumed from code presence.
 */

import { PCCCapabilityItem, PCCCapabilities } from './types';

export type { PCCCapabilityItem };

/**
 * Standard capability matrix representing the verified boundaries
 * between public FHIR, PCC Partner Access, and the demo Synthetic implementation.
 *
 * Terminology Separation:
 * 1. VERIFIED_AGAINST_PCC: Actual legitimate PCC environment/sandbox successfully tested.
 * 2. DOCUMENTED_SUPPORTED: Supported by legitimate PCC/FHIR documentation, not personally verified in this app.
 * 3. NOT_VERIFIED: Not verified against specifications or live environment.
 * 4. REQUIRES_PCC_PARTNER_ACCESS: Requires PointClickCare Developer Partner program enrollment.
 * 5. SYNTHETIC_ONLY: Synthetic demo capability only.
 *
 * Note: For the current demo, Live PCC Verification has NOT been performed.
 */
export const PCC_CAPABILITY_MATRIX: PCCCapabilityItem[] = [
  {
    id: 'patientRead',
    name: 'Patient Demographics Read',
    category: 'Patient Data',
    status: 'DOCUMENTED_SUPPORTED',
    supportedInSynthetic: true,
    supportedInRealSandbox: true,
    description: 'Query individual patient demographic and identity records by ID or MRN.',
    notes: 'Architecture supports the corresponding standard FHIR Patient resource pattern. Availability, endpoint access, scopes, and enabled resources through the applicable PointClickCare integration must be confirmed against the relevant PointClickCare developer documentation and configured environment. (Live PCC Verification: NOT PERFORMED)',
  },
  {
    id: 'patientSearch',
    name: 'Patient Search & Filtering',
    category: 'Patient Data',
    status: 'DOCUMENTED_SUPPORTED',
    supportedInSynthetic: true,
    supportedInRealSandbox: true,
    description: 'Search facility resident rosters by name, identifier, or active status.',
    notes: 'Architecture supports the corresponding standard FHIR Patient search query pattern. Availability, endpoint access, scopes, and enabled resources through the applicable PointClickCare integration must be confirmed against the relevant PointClickCare developer documentation and configured environment. (Live PCC Verification: NOT PERFORMED)',
  },
  {
    id: 'conditionRead',
    name: 'Active Diagnoses & ICD-10 Conditions',
    category: 'Clinical',
    status: 'DOCUMENTED_SUPPORTED',
    supportedInSynthetic: true,
    supportedInRealSandbox: true,
    description: 'Retrieve active clinical diagnoses, ICD-10 codes, onset dates, and rankings.',
    notes: 'Architecture supports the corresponding standard FHIR Condition resource pattern. Availability, endpoint access, scopes, and enabled resources through the applicable PointClickCare integration must be confirmed against the relevant PointClickCare developer documentation and configured environment. (Live PCC Verification: NOT PERFORMED)',
  },
  {
    id: 'coverageRead',
    name: 'Insurance & Payer Coverage',
    category: 'Clinical',
    status: 'DOCUMENTED_SUPPORTED',
    supportedInSynthetic: true,
    supportedInRealSandbox: true,
    description: 'Retrieve primary, secondary, and tertiary payer coverage and subscriber identifiers.',
    notes: 'Architecture supports the corresponding standard FHIR Coverage resource pattern. Availability, endpoint access, scopes, and enabled resources through the applicable PointClickCare integration must be confirmed against the relevant PointClickCare developer documentation and configured environment. (Live PCC Verification: NOT PERFORMED)',
  },
  {
    id: 'documentRead',
    name: 'Clinical Documentation & PT Notes',
    category: 'Clinical',
    status: 'NOT_VERIFIED',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Extract therapy notes, mobility evaluations, and MDS assessments for prior authorization.',
    notes: 'DocumentReference is in FHIR R4, but specific SNF therapy note category codes require PCC developer documentation.',
  },
  {
    id: 'adtEvents',
    name: 'Census, Room & Bed Tracking',
    category: 'Census & ADT',
    status: 'NOT_VERIFIED',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Real-time tracking of resident unit, room, and bed assignments within a SNF.',
    notes: 'FHIR Patient does not expose real-time bed locations; requires proprietary PCC census endpoints or Encounter location extensions.',
  },
  {
    id: 'realtimeEvents',
    name: 'Real-Time Webhook / ADT Delivery',
    category: 'Census & ADT',
    status: 'REQUIRES_PCC_PARTNER_ACCESS',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Push notifications for Admissions (A01), Room Transfers (A02), and Discharges (A03).',
    notes: 'Public FHIR sandboxes DO NOT provide real-time ADT webhooks. Requires PointClickCare Developer Partner program enrollment.',
  },
  {
    id: 'orderRead',
    name: 'EHR Medical Order Ingestion',
    category: 'Orders',
    status: 'NOT_VERIFIED',
    supportedInSynthetic: false,
    supportedInRealSandbox: false,
    description: 'Ingest physician equipment and supply requisitions directly from EHR order entry.',
    notes: 'Public FHIR DeviceRequest / ServiceRequest availability varies in SNF EHR configurations.',
  },
  {
    id: 'orderWriteBack',
    name: 'DME Order Write-Back & Status Sync',
    category: 'Orders',
    status: 'REQUIRES_PCC_PARTNER_ACCESS',
    supportedInSynthetic: false,
    supportedInRealSandbox: false,
    description: 'Write external equipment fulfillment milestones, serial numbers, and delivery receipts back into PCC.',
    notes: 'PointClickCare does not allow open third-party order write access. Requires certified integration partnership.',
  },
  {
    id: 'facilityRoster',
    name: 'Multi-Facility Tenant Organization',
    category: 'Infrastructure',
    status: 'REQUIRES_PCC_PARTNER_ACCESS',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Enumerate authorized facility locations across an enterprise multi-site SNF chain.',
    notes: 'Multi-facility tenant mapping requires enterprise organization credentials from PointClickCare.',
  },
  {
    id: 'adtSimulator',
    name: 'ADT Event Simulation (In-Memory)',
    category: 'Demo Simulator',
    status: 'SYNTHETIC_ONLY',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Simulates Admission, Room Transfer, and Discharge events locally in memory.',
    notes: 'Synthetic demo capability only. Generates local state transitions for demo scenarios.',
  },
  {
    id: 'dmeRulesEngine',
    name: 'DME Equipment Clinical Rules Engine',
    category: 'Demo Simulator',
    status: 'SYNTHETIC_ONLY',
    supportedInSynthetic: true,
    supportedInRealSandbox: false,
    description: 'Automated evaluation of ICD-10 conditions and mobility status against equipment criteria.',
    notes: 'Synthetic demo capability only. Runs on canonical normalized records.',
  },
];

/**
 * Returns declared capabilities for a given provider mode.
 */
export function getDeclaredCapabilitiesForMode(mode: 'SYNTHETIC' | 'REAL_SANDBOX' | 'REAL_PRODUCTION'): PCCCapabilities {
  if (mode === 'SYNTHETIC') {
    return {
      patientRead: true,
      patientSearch: true,
      conditionRead: true,
      coverageRead: true,
      documentRead: true,
      orderRead: false,
      realtimeEvents: false, // Inbound push is simulated locally, not a real external webhook engine
      orderWriteBack: false,
    };
  }

  // Real Sandbox (public/standard FHIR tier without partner access)
  return {
    patientRead: true,
    patientSearch: true,
    conditionRead: true,
    coverageRead: true,
    documentRead: false, // Unverified without specific tenant note mapping
    orderRead: false,
    realtimeEvents: false, // NOT supported in public sandbox
    orderWriteBack: false, // Requires partner access
  };
}
