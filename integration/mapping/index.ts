/**
 * Integration Mapping Layer
 *
 * Translates PointClickCare external schema structures into the canonical
 * internal models utilized by the DME order and recommendation systems.
 */

import { PCCResident, PCCDiagnosis, PCCADTEventType } from '@/pcc/types';
import { CanonicalResident, CanonicalDiagnosis, ResidentStatus } from '../types';

export class PCCDataMapper {
  /**
   * Maps PointClickCare status strings to internal Canonical ResidentStatus.
   */
  public static mapStatus(pccStatus: PCCResident['status']): ResidentStatus {
    switch (pccStatus) {
      case 'Active':
        return 'ADMITTED';
      case 'Discharged':
        return 'DISCHARGED';
      case 'Hospitalized':
        return 'TRANSFERRED';
      case 'Hold':
        return 'ON_HOLD';
      default:
        return 'ADMITTED';
    }
  }

  /**
   * Maps an ADT event type to the corresponding updated ResidentStatus.
   */
  public static mapADTToStatus(eventType: PCCADTEventType): ResidentStatus {
    switch (eventType) {
      case 'ADMISSION':
        return 'ADMITTED';
      case 'TRANSFER':
        return 'TRANSFERRED';
      case 'DISCHARGE':
        return 'DISCHARGED';
    }
  }

  /**
   * Maps PCC diagnoses array to canonical diagnoses.
   */
  public static mapDiagnoses(diagnoses: PCCDiagnosis[] = []): CanonicalDiagnosis[] {
    return diagnoses
      .filter((d) => d.isActive)
      .map((d) => ({
        icd10: d.code.trim().toUpperCase(),
        description: d.description,
        classification: d.classification,
        isPrimary: d.classification === 'Primary' || d.rank === 1,
        onsetDate: d.onsetDate,
      }))
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  }

  /**
   * Transforms raw PCC resident into clean canonical resident record.
   */
  public static toCanonicalResident(pccResident: PCCResident): CanonicalResident {
    const fullName = `${pccResident.lastName}, ${pccResident.firstName}`;
    return {
      mrn: pccResident.mrn.trim().toUpperCase(),
      pccPatientId: pccResident.patientId,
      fullName,
      firstName: pccResident.firstName,
      lastName: pccResident.lastName,
      dateOfBirth: pccResident.birthDate,
      gender: pccResident.gender,
      facilityId: pccResident.facId,
      facilityName: pccResident.facilityName,
      room: pccResident.roomNumber,
      bed: pccResident.bedDescription,
      status: this.mapStatus(pccResident.status),
      admissionDate: pccResident.admissionDate,
      dischargeDate: pccResident.dischargeDate,
      primaryInsurance: {
        payerName: pccResident.primaryPayerName || 'Self-Pay / Not Recorded',
        payerType: pccResident.primaryPayerType,
        coverageStatus: 'active',
        eligibilityVerified: false,
        isVerified: false,
        verificationSource: 'NOT_PERFORMED',
      },
      activeDiagnoses: this.mapDiagnoses(pccResident.diagnoses),
      lastSyncTimestamp: new Date().toISOString(),
      syncStatus: 'SYNCED',
    };
  }
}
