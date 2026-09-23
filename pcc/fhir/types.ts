/**
 * Generic HL7 FHIR R4 Resource Types
 *
 * Represents standard healthcare FHIR resources for interoperability with
 * modern EHR APIs (including PointClickCare FHIR R4 endpoints).
 * Decoupled from internal canonical DME domain structures.
 */

export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FHIRCodeableConcept;
  system?: string;
  value: string;
  period?: { start?: string; end?: string };
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

/**
 * FHIR R4 Patient Resource
 */
export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: FHIRIdentifier[];
  active?: boolean;
  name?: FHIRHumanName[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  }>;
  managingOrganization?: FHIRReference;
}

/**
 * FHIR R4 Condition (Diagnosis) Resource
 */
export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus?: FHIRCodeableConcept;
  verificationStatus?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  severity?: FHIRCodeableConcept;
  code?: FHIRCodeableConcept;
  subject: FHIRReference;
  encounter?: FHIRReference;
  onsetDateTime?: string;
  recordedDate?: string;
}

/**
 * FHIR R4 Coverage (Payer/Insurance) Resource
 */
export interface FHIRCoverage {
  resourceType: 'Coverage';
  id: string;
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  type?: FHIRCodeableConcept;
  subscriberId?: string;
  beneficiary: FHIRReference;
  relationship?: FHIRCodeableConcept;
  period?: { start?: string; end?: string };
  payor: FHIRReference[];
  order?: number;
}

/**
 * FHIR R4 DocumentReference (Clinical Notes & Assessments) Resource
 */
export interface FHIRDocumentReference {
  resourceType: 'DocumentReference';
  id: string;
  status: 'current' | 'superseded' | 'entered-in-error';
  docStatus?: 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  type?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  subject?: FHIRReference;
  date?: string;
  description?: string;
  content: Array<{
    attachment: {
      contentType?: string;
      language?: string;
      url?: string;
      title?: string;
    };
  }>;
}
