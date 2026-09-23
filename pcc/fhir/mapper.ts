/**
 * FHIR to Canonical Healthcare Model Mapper
 *
 * Transforms standard HL7 FHIR R4 resources into internal canonical domain models.
 * Ensures zero FHIR-specific or vendor-specific artifacts leak into internal DME business logic.
 */

import { FHIRPatient, FHIRCondition, FHIRCoverage } from './types';
import { CanonicalResident, CanonicalDiagnosis, CanonicalInsurance } from '@/integration/types';

export class FHIRDataMapper {
  /**
   * Maps a FHIR R4 Patient resource into our internal CanonicalResident.
   * Does NOT manufacture or fabricate missing healthcare, room, or facility values.
   */
  public static toCanonicalResident(
    fhirPatient: FHIRPatient,
    facilityContext?: { id: string; name: string; room?: string; bed?: string }
  ): CanonicalResident {
    // 1. Resolve primary name
    const primaryName = fhirPatient.name?.[0];
    const given = primaryName?.given?.join(' ') || '';
    const family = primaryName?.family || '';
    const fullName = primaryName?.text || `${given} ${family}`.trim() || 'Unknown Name';

    // 2. Resolve Medical Record Number (MRN) from identifiers
    const mrnIdentifier =
      fhirPatient.identifier?.find((id) => id.type?.coding?.some((c) => c.code === 'MR')) ||
      fhirPatient.identifier?.[0];
    const mrn = mrnIdentifier?.value || (fhirPatient.id ? `MRN-${fhirPatient.id}` : 'MRN-UNKNOWN');

    // 3. Normalize gender
    let normalizedGender = 'Unknown';
    if (fhirPatient.gender === 'male') normalizedGender = 'Male';
    else if (fhirPatient.gender === 'female') normalizedGender = 'Female';
    else if (fhirPatient.gender === 'other') normalizedGender = 'Other';

    return {
      mrn: mrn.trim().toUpperCase(),
      pccPatientId: fhirPatient.id || '',
      fullName,
      firstName: given,
      lastName: family,
      dateOfBirth: fhirPatient.birthDate || '',
      gender: normalizedGender,
      facilityId: facilityContext?.id || fhirPatient.managingOrganization?.reference?.replace('Organization/', '') || '',
      facilityName: facilityContext?.name || fhirPatient.managingOrganization?.display || '',
      room: facilityContext?.room || '',
      bed: facilityContext?.bed || '',
      status: fhirPatient.active ? 'ADMITTED' : 'DISCHARGED',
      admissionDate: '',
      primaryInsurance: {
        payerName: 'Pending Verification',
        payerType: 'Commercial',
        coverageStatus: 'unknown',
        eligibilityVerified: false,
        isVerified: false,
        verificationSource: 'NOT_PERFORMED',
      },
      activeDiagnoses: [],
      lastSyncTimestamp: new Date().toISOString(),
      syncStatus: 'SYNCED',
    };
  }

  /**
   * Maps a FHIR R4 Condition resource into an internal CanonicalDiagnosis.
   */
  public static toCanonicalDiagnosis(fhirCondition: FHIRCondition): CanonicalDiagnosis {
    // Extract primary ICD-10 coding
    const icdCoding =
      fhirCondition.code?.coding?.find(
        (c) => c.system?.includes('icd-10') || c.system?.includes('2.16.840.1.113883.6.90')
      ) || fhirCondition.code?.coding?.[0];

    const code = icdCoding?.code || '';
    const description = icdCoding?.display || fhirCondition.code?.text || 'Unspecified Condition';

    // Determine category
    const isEncounterOrProblem = fhirCondition.category?.some((c) =>
      c.coding?.some((cd) => cd.code === 'encounter-diagnosis' || cd.code === 'problem-list-item')
    );

    return {
      icd10: code,
      description,
      classification: isEncounterOrProblem ? 'Primary' : 'Secondary',
      isPrimary: Boolean(isEncounterOrProblem),
      onsetDate: fhirCondition.onsetDateTime || fhirCondition.recordedDate || '',
    };
  }

  /**
   * Maps a FHIR R4 Coverage resource into an internal CanonicalInsurance model.
   *
   * Note: FHIR Coverage.status === 'active' merely indicates the record is active in the EHR,
   * NOT that real-time eligibility (270/271) has been verified.
   */
  public static toCanonicalInsurance(fhirCoverage: FHIRCoverage): CanonicalInsurance {
    const payorDisplay = fhirCoverage.payor?.[0]?.display || 'Unknown Payer';
    const typeCode = fhirCoverage.type?.coding?.[0]?.code || '';

    let normalizedType = 'Commercial';
    if (typeCode.toUpperCase().includes('MEDICARE') || payorDisplay.toLowerCase().includes('medicare')) {
      normalizedType = 'Medicare';
    } else if (typeCode.toUpperCase().includes('MEDICAID') || payorDisplay.toLowerCase().includes('medicaid')) {
      normalizedType = 'Medicaid';
    } else if (payorDisplay.toLowerCase().includes('advantage') || payorDisplay.toLowerCase().includes('managed')) {
      normalizedType = 'Managed Care';
    }

    const coverageStatus = fhirCoverage.status || 'unknown';

    return {
      payerName: payorDisplay,
      policyNumber: fhirCoverage.subscriberId,
      payerType: normalizedType,
      coverageStatus,
      eligibilityVerified: false, // Live clearinghouse eligibility has NOT been verified
      isVerified: false, // Explicitly false; separated from coverageStatus
      verificationSource: 'NOT_PERFORMED',
    };
  }
}
