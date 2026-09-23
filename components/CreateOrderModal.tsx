'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  PlusCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CanonicalResident } from '@/integration/types';
import { SyntheticEquipmentRecommendation, DMEEquipmentCategory, DMEOrderPriority } from '@/dme/types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: CanonicalResident[];
  initialResident?: CanonicalResident | null;
  initialRecommendation?: SyntheticEquipmentRecommendation | null;
  onOrderCreated: () => void;
}

const COMMON_EQUIPMENT_OPTIONS: { name: string; category: DMEEquipmentCategory }[] = [
  { name: 'Alternating Pressure Mattress (Group 2 Low-Air-Loss)', category: 'Support Surfaces' },
  { name: 'Multi-Zoned Gel Foam Overlay Mattress with Heel Trough', category: 'Support Surfaces' },
  { name: 'Ultra-Low Height Bed Frame with Perimeter Fall Safety Mat', category: 'Support Surfaces' },
  { name: 'Continuous Oxygen Concentrator (5L Stationary + Portable Backup)', category: 'Respiratory' },
  { name: 'Full-Body Electric Patient Lift (Hoyer) with Commode Sling', category: 'Patient Handling' },
  { name: 'Bariatric Lightweight Wheelchair (20in with Elevating Leg Rests)', category: 'Mobility' },
  { name: 'Standard Lightweight Wheelchair (18in)', category: 'Mobility' },
  { name: 'Heavy-Duty Bedside Drop-Arm Commode', category: 'Bathroom Safety' },
];

function OrderFormDialog({
  onClose,
  residents,
  initialResident,
  initialRecommendation,
  onOrderCreated,
}: Omit<CreateOrderModalProps, 'isOpen'>) {
  const defaultResident =
    initialResident || residents.find((r) => r.status !== 'DISCHARGED') || residents[0];

  const [selectedMrn, setSelectedMrn] = useState<string>(defaultResident?.mrn || '');
  const [equipmentType, setEquipmentType] = useState<string>(
    initialRecommendation?.equipmentType || COMMON_EQUIPMENT_OPTIONS[0].name
  );
  const [category, setCategory] = useState<DMEEquipmentCategory>(
    initialRecommendation?.category || COMMON_EQUIPMENT_OPTIONS[0].category
  );
  const [orderingUser, setOrderingUser] = useState<string>('Dr. Sarah Lin, MD');
  const [orderingUserRole, setOrderingUserRole] = useState<string>('Attending Physician');
  const [diagnosisIcd10, setDiagnosisIcd10] = useState<string>(
    defaultResident?.activeDiagnoses[0]?.icd10 || ''
  );
  const [priority, setPriority] = useState<DMEOrderPriority>(
    initialRecommendation?.suggestedPriority || 'ROUTINE'
  );
  const [notes, setNotes] = useState<string>(
    initialRecommendation
      ? `Synthetic rule matched: ${initialRecommendation.ruleId} (${initialRecommendation.clinicalRationale})`
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentResident = residents.find((r) => r.mrn === selectedMrn);

  const handleSelectEquipmentPreset = (opt: typeof COMMON_EQUIPMENT_OPTIONS[0]) => {
    setEquipmentType(opt.name);
    setCategory(opt.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/dme/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn: selectedMrn,
          equipmentType,
          category,
          orderingUser,
          orderingUserRole,
          diagnosisIcd10,
          priority,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onOrderCreated();
        onClose();
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit DME order';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Create DME Equipment Order
              </h2>
              <p className="text-xs text-slate-700">
                Associates patient demographics and active PointClickCare diagnoses with equipment order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {initialRecommendation && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900">
                <span className="font-semibold">Prefilled from synthetic recommendation: </span>
                {initialRecommendation.matchedDiagnosis}
              </div>
            </div>
          )}

          {/* Resident Selection */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Patient / Resident (MRN) *
            </label>
            <select
              value={selectedMrn}
              onChange={(e) => {
                setSelectedMrn(e.target.value);
                const r = residents.find((res) => res.mrn === e.target.value);
                if (r && r.activeDiagnoses.length > 0) {
                  setDiagnosisIcd10(r.activeDiagnoses[0].icd10);
                }
              }}
              className="w-full p-2 border border-slate-300 rounded text-xs bg-white font-mono"
            >
              {residents.map((r) => (
                <option key={r.mrn} value={r.mrn} disabled={r.status === 'DISCHARGED'}>
                  {r.mrn} - {r.fullName} ({r.facilityName} | Rm {r.room}-{r.bed}) [{r.status}]
                </option>
              ))}
            </select>
            {currentResident && (
              <div className="mt-1 text-[11px] text-slate-700 flex items-center gap-2">
                <span>Facility: <strong>{currentResident.facilityName}</strong></span>
                <span>&bull;</span>
                <span>Payer: <strong>{currentResident.primaryInsurance.payerName}</strong></span>
              </div>
            )}
          </div>

          {/* Equipment Quick Presets */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Equipment Presets (Click to autofill)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-200 rounded bg-slate-50">
              {COMMON_EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.name}
                  onClick={() => handleSelectEquipmentPreset(opt)}
                  className={`text-[10px] px-2 py-1 rounded border text-left cursor-pointer transition-colors ${
                    equipmentType === opt.name
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Equipment Name / Description *</label>
              <input
                type="text"
                required
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DMEEquipmentCategory)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
              >
                <option value="Support Surfaces">Support Surfaces</option>
                <option value="Mobility">Mobility</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Patient Handling">Patient Handling</option>
                <option value="Bathroom Safety">Bathroom Safety</option>
              </select>
            </div>
          </div>

          {/* Clinical Indication (Diagnosis) & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Clinical Indication (ICD-10 Diagnosis) *
              </label>
              {currentResident && currentResident.activeDiagnoses.length > 0 ? (
                <select
                  value={diagnosisIcd10}
                  onChange={(e) => setDiagnosisIcd10(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white font-mono"
                >
                  {currentResident.activeDiagnoses.map((d) => (
                    <option key={d.icd10} value={d.icd10}>
                      {d.icd10} - {d.description} {d.isPrimary ? '(Primary)' : ''}
                    </option>
                  ))}
                  <option value="OTHER">Other / Manual Entry...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. L89.153"
                  value={diagnosisIcd10}
                  onChange={(e) => setDiagnosisIcd10(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                />
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Order Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DMEOrderPriority)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
              >
                <option value="ROUTINE">Routine (24-48h)</option>
                <option value="URGENT">Urgent (4-8h)</option>
                <option value="STAT">STAT (&lt; 2h)</option>
              </select>
            </div>
          </div>

          {/* Ordering Clinician */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ordering Clinician</label>
              <input
                type="text"
                value={orderingUser}
                onChange={(e) => setOrderingUser(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Role / Credential</label>
              <input
                type="text"
                value={orderingUserRole}
                onChange={(e) => setOrderingUserRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Clinical Notes / Delivery Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Set up bed before 3:00 PM transfer; verify mattress size."
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-700">
              Order will trigger internal dispatch & audit event
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating Order...' : 'Submit DME Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateOrderModal(props: CreateOrderModalProps) {
  if (!props.isOpen) return null;
  return (
    <OrderFormDialog
      key={`${props.initialResident?.mrn || 'default'}-${props.initialRecommendation?.ruleId || 'none'}`}
      {...props}
    />
  );
}
