'use client';

import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export function RecommendationsPreview() {
  const rules = [
    {
      ruleId: 'SYNTH-RULE-L89-BED',
      condition: 'ICD-10 L89.* (Pressure ulcer of sacral / ischial region, stages 2-4)',
      equipment: 'Alternating Pressure Mattress (Group 2 Low-Air-Loss)',
      category: 'Support Surfaces',
      priority: 'URGENT',
      rationale: 'Active pressure ulcer indicates necessity for dynamic pressure redistribution and shear reduction.',
    },
    {
      ruleId: 'SYNTH-RULE-J44-RESP',
      condition: 'ICD-10 J44.* / J96.* (COPD with acute exacerbation, respiratory failure)',
      equipment: 'Continuous Oxygen Concentrator (5L Stationary + Portable Backup)',
      category: 'Respiratory',
      priority: 'STAT',
      rationale: 'Hypoxemic respiratory failure requiring continuous supplemental O2 delivery.',
    },
    {
      ruleId: 'SYNTH-RULE-G81-LIFT',
      condition: 'ICD-10 G81.* / I69.3 (Hemiplegia, post-cerebral infarction motor deficit)',
      equipment: 'Full-Body Electric Patient Lift (Hoyer) with Commode Sling',
      category: 'Patient Handling',
      priority: 'ROUTINE',
      rationale: 'Inability to safely bear weight for transfers; eliminates manual lifting injuries.',
    },
    {
      ruleId: 'SYNTH-RULE-R29-FALL',
      condition: 'ICD-10 R29.6 / F03.* (Frequent falls, unsteadiness on feet, cognitive impairment)',
      equipment: 'Ultra-Low Height Bed Frame with Perimeter Fall Safety Mat',
      category: 'Support Surfaces',
      priority: 'URGENT',
      rationale: 'Fall risk mitigation without physical restraints for non-ambulatory cognitively impaired residents.',
    },
    {
      ruleId: 'SYNTH-RULE-M16-MOB',
      condition: 'ICD-10 M16.* / Z96.6 (Primary osteoarthritis of hip / post-arthroplasty)',
      equipment: 'Bariatric Lightweight Wheelchair (20in with Elevating Leg Rests)',
      category: 'Mobility',
      priority: 'ROUTINE',
      rationale: 'Weight-bearing restrictions post-surgical intervention requiring elevating limb support.',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-100 text-blue-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Synthetic Clinical Recommendation Engine Rules
            </h3>
            <p className="text-xs text-slate-700">
              Heuristic mappings demonstrating how PointClickCare active diagnoses guide equipment prescription
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded p-2.5 mb-4 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Sanitized Demonstration Notice: </strong>
          These recommendation rules are purely synthetic heuristics created for this architecture demo.
          They do NOT represent official clinical guidelines, PointClickCare internal logic, or proprietary commercial algorithms.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {rules.map((rule) => (
          <div key={rule.ruleId} className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] text-slate-700 font-semibold bg-slate-200 px-1.5 py-0.5 rounded">
                {rule.ruleId}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                  rule.priority === 'STAT'
                    ? 'bg-red-100 text-red-800'
                    : rule.priority === 'URGENT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {rule.priority}
              </span>
            </div>

            <div className="font-semibold text-slate-900 text-xs mb-1">
              {rule.equipment}
            </div>
            <div className="text-[11px] font-mono text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 mb-1.5">
              {rule.condition}
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {rule.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
