/**
 * DME (Durable Medical Equipment) Types
 *
 * Defines medical equipment categories, order payloads, and recommendation structures.
 */

export type DMEEquipmentCategory =
  | 'Support Surfaces'
  | 'Mobility'
  | 'Respiratory'
  | 'Patient Handling'
  | 'Bathroom Safety';

export type DMEOrderStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'DISCHARGED_RETURN'
  | 'CANCELLED';

export type DMEOrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface DMEOrder {
  orderId: string;
  mrn: string;
  residentName: string;
  facilityName: string;
  room: string;
  equipmentType: string;
  category: DMEEquipmentCategory;
  orderDate: string;
  orderingUser: string;
  orderingUserRole: string;
  diagnosisIcd10: string;
  diagnosisDescription: string;
  status: DMEOrderStatus;
  priority: DMEOrderPriority;
  notes?: string;
  associatedEventId?: string;
}

export interface SyntheticEquipmentRecommendation {
  ruleId: string;
  category: DMEEquipmentCategory;
  equipmentType: string;
  triggerIcd10Pattern: string;
  matchedDiagnosis: string;
  clinicalRationale: string;
  suggestedPriority: DMEOrderPriority;
  contraindicationsOrNotes?: string;
}
