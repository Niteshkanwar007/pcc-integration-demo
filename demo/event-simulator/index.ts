/**
 * ADT Event Simulator Helpers
 *
 * Preconfigures synthetic event scenarios to test and demonstrate
 * integration behavior across ADMISSION, TRANSFER, and DISCHARGE lifecycles.
 */

import { PCCADTEventPayload } from '@/pcc/types';
import { ADTProcessor, ADTProcessResult } from '@/integration/adt-processing';

export interface PredefinedScenario {
  id: string;
  name: string;
  type: 'ADMISSION' | 'TRANSFER' | 'DISCHARGE';
  description: string;
  payload: PCCADTEventPayload;
}

export const PREDEFINED_SCENARIOS: PredefinedScenario[] = [
  {
    id: 'scen-admit-copd',
    name: 'New Admission: Respiratory Care',
    type: 'ADMISSION',
    description: 'Admit new resident "Robert Chen" with acute COPD exacerbation to Room 218-A.',
    payload: {
      eventId: 'evt-sim-admit-01',
      eventType: 'ADMISSION',
      patientId: 'PCC-RES-99301',
      mrn: 'MRN-330912',
      facId: 'FAC-101',
      facilityName: 'Pinecrest Rehabilitation & Healthcare',
      timestamp: new Date().toISOString(),
      targetRoom: '218',
      targetBed: 'A',
      notes: 'Robert Chen',
      diagnoses: [
        {
          code: 'J44.1',
          description: 'Chronic obstructive pulmonary disease with acute exacerbation',
          classification: 'Primary',
          onsetDate: new Date().toISOString().slice(0, 10),
          rank: 1,
          isActive: true,
        },
        {
          code: 'R29.6',
          description: 'Gait instability and falls',
          classification: 'Secondary',
          onsetDate: new Date().toISOString().slice(0, 10),
          rank: 2,
          isActive: true,
        },
      ],
    },
  },
  {
    id: 'scen-transfer-vance',
    name: 'Internal Room Transfer: Vance, E.',
    type: 'TRANSFER',
    description: 'Move Eleanor Vance from 104-A to Stepdown Isolation Suite 119-B.',
    payload: {
      eventId: 'evt-sim-trans-01',
      eventType: 'TRANSFER',
      patientId: 'PCC-RES-88201',
      mrn: 'MRN-804192',
      facId: 'FAC-101',
      timestamp: new Date().toISOString(),
      targetRoom: '119',
      targetBed: 'B (Isolation)',
      notes: 'Stepdown isolation room reassignment.',
    },
  },
  {
    id: 'scen-discharge-bennett',
    name: 'Discharge to Home Health: Bennett, M.',
    type: 'DISCHARGE',
    description: 'Discharge Marcus Bennett (MRN-618492) following completed post-hip rehab.',
    payload: {
      eventId: 'evt-sim-disc-01',
      eventType: 'DISCHARGE',
      patientId: 'PCC-RES-88204',
      mrn: 'MRN-618492',
      facId: 'FAC-102',
      timestamp: new Date().toISOString(),
      dischargeReason: 'Rehabilitation Goals Met - Discharge to Home with Outpatient PT',
      notes: 'Safe ambulation demonstrated with cane.',
    },
  },
];

export async function executeSimulatedScenario(scenarioId: string): Promise<ADTProcessResult> {
  const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found.`);
  }

  const processor = new ADTProcessor();
  const freshPayload: PCCADTEventPayload = {
    ...scenario.payload,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  return processor.processADTEvent(freshPayload);
}
