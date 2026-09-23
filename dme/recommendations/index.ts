/**
 * Synthetic DME Equipment Recommendation Engine
 *
 * IMPORTANT DISCLAIMER:
 * These recommendation rules are purely synthetic heuristics built for architectural
 * and workflow demonstration purposes. They DO NOT represent clinical guidelines,
 * PointClickCare logic, or proprietary commercial algorithms.
 */

import { CanonicalDiagnosis } from '@/integration/types';
import { SyntheticEquipmentRecommendation } from '../types';

interface SyntheticRuleDefinition {
  ruleId: string;
  category: SyntheticEquipmentRecommendation['category'];
  equipmentType: string;
  icdPrefixes: string[];
  rationale: string;
  priority: SyntheticEquipmentRecommendation['suggestedPriority'];
  notes?: string;
}

const SYNTHETIC_RULES: SyntheticRuleDefinition[] = [
  {
    ruleId: 'SYNTH-RULE-L89-BED',
    category: 'Support Surfaces',
    equipmentType: 'Alternating Pressure Mattress (Group 2 Low-Air-Loss)',
    icdPrefixes: ['L89.'], // Pressure ulcer codes
    rationale: 'Active pressure ulcer diagnosis indicates clinical indication for continuous pressure redistribution to promote wound healing.',
    priority: 'URGENT',
    notes: 'Synthetic demo rule: evaluates stage II-IV decubitus ulcers against support surface criteria.',
  },
  {
    ruleId: 'SYNTH-RULE-J44-RESP',
    category: 'Respiratory',
    equipmentType: 'Continuous Oxygen Concentrator (5L Stationary + Portable Backup)',
    icdPrefixes: ['J44.', 'J96.', 'J18.'], // COPD, Respiratory failure, Pneumonia
    rationale: 'Chronic obstructive pulmonary condition with documented hypoxemic symptoms suggests supplemental oxygen therapy necessity.',
    priority: 'STAT',
    notes: 'Synthetic demo rule: triggers respiratory equipment checklist.',
  },
  {
    ruleId: 'SYNTH-RULE-G81-LIFT',
    category: 'Patient Handling',
    equipmentType: 'Full-Body Electric Patient Lift (Hoyer) with Commode Sling',
    icdPrefixes: ['G81.', 'G82.', 'I69.3'], // Hemiplegia, Paraplegia, Post-Stroke
    rationale: 'Severe motor deficit or hemiparesis requires mechanical transfer support to prevent staff/patient injury during bed-to-chair transitions.',
    priority: 'ROUTINE',
    notes: 'Synthetic demo rule: transfers requiring total mechanical assistance.',
  },
  {
    ruleId: 'SYNTH-RULE-M16-MOB',
    category: 'Mobility',
    equipmentType: 'Bariatric Lightweight Wheelchair (20in with Elevating Leg Rests)',
    icdPrefixes: ['M16.', 'M17.', 'Z96.6'], // Osteoarthritis of hip/knee, joint implants
    rationale: 'Post-surgical lower extremity or severe arthritic weight-bearing limitation indicates high-stability mobility aid.',
    priority: 'ROUTINE',
    notes: 'Synthetic demo rule: mobility impairment secondary to lower extremity arthropathy.',
  },
  {
    ruleId: 'SYNTH-RULE-R29-FALL',
    category: 'Support Surfaces',
    equipmentType: 'Ultra-Low Height Bed Frame with Perimeter Fall Safety Mat',
    icdPrefixes: ['R29.6', 'F03.', 'G30.'], // Repeated falls, Dementia, Alzheimer's
    rationale: 'Cognitive impairment paired with documented fall history indicates restraint-free fall mitigation equipment.',
    priority: 'URGENT',
    notes: 'Synthetic demo rule: non-restraint fall injury reduction protocol.',
  },
  {
    ruleId: 'SYNTH-RULE-E11-SURF',
    category: 'Support Surfaces',
    equipmentType: 'Multi-Zoned Gel Foam Overlay Mattress with Heel Trough',
    icdPrefixes: ['E11.6', 'E11.5'], // Type 2 diabetes with peripheral vascular complications
    rationale: 'Diabetic peripheral neuropathy with microvascular compromise requires proactive heel floatation and sacral offloading.',
    priority: 'ROUTINE',
    notes: 'Synthetic demo rule: preventative offloading for high-risk diabetic tissue.',
  },
];

export class DMERecommendationEngine {
  /**
   * Generates synthetic equipment recommendations based on active resident diagnoses.
   */
  public static evaluateRecommendations(diagnoses: CanonicalDiagnosis[]): SyntheticEquipmentRecommendation[] {
    const recommendations: SyntheticEquipmentRecommendation[] = [];
    const triggeredRules = new Set<string>();

    for (const diag of diagnoses) {
      const code = diag.icd10.trim().toUpperCase();

      for (const rule of SYNTHETIC_RULES) {
        if (triggeredRules.has(rule.ruleId)) continue;

        const matches = rule.icdPrefixes.some((prefix) => code.startsWith(prefix));
        if (matches) {
          triggeredRules.add(rule.ruleId);
          recommendations.push({
            ruleId: rule.ruleId,
            category: rule.category,
            equipmentType: rule.equipmentType,
            triggerIcd10Pattern: rule.icdPrefixes.join(', '),
            matchedDiagnosis: `${diag.icd10} - ${diag.description}`,
            clinicalRationale: rule.rationale,
            suggestedPriority: rule.priority,
            contraindicationsOrNotes: rule.notes,
          });
        }
      }
    }

    return recommendations;
  }
}
