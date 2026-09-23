'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Building2,
  Calendar,
  ShieldCheck,
  Package,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { CanonicalResident } from '@/integration/types';
import { SyntheticEquipmentRecommendation, DMEOrder } from '@/dme/types';

interface ResidentDetailModalProps {
  resident: CanonicalResident | null;
  onClose: () => void;
  onOrderEquipment: (resident: CanonicalResident, recommendation?: SyntheticEquipmentRecommendation) => void;
}

export function ResidentDetailModal({
  resident,
  onClose,
  onOrderEquipment,
}: ResidentDetailModalProps) {
  const [recommendations, setRecommendations] = useState<SyntheticEquipmentRecommendation[]>([]);
  const [orders, setOrders] = useState<DMEOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resident) return;
    let ignore = false;
    fetch(`/api/residents/${resident.mrn}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success) {
          setRecommendations(data.recommendations || []);
          setOrders(data.orders || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load resident details:', err);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [resident]);

  if (!resident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                Resident Clinical & Integration Profile
              </h2>
              <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Synthetic Record
              </span>
            </div>
            <p className="text-xs text-slate-700">
              MRN: <span className="font-mono font-medium text-slate-900">{resident.mrn}</span> | PCC ID: {resident.pccPatientId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Demographics */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Demographics
              </span>
              <div className="font-semibold text-slate-900 text-sm">{resident.fullName}</div>
              <div className="text-slate-700 mt-1">DOB: {resident.dateOfBirth} ({resident.gender})</div>
              <div className="text-slate-700">
                Status:{' '}
                <span className={`font-medium ${resident.status === 'ADMITTED' ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {resident.status}
                </span>
              </div>
            </div>

            {/* Facility & Location */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Facility & Room
              </span>
              <div className="font-semibold text-slate-900">{resident.facilityName}</div>
              <div className="text-slate-700 mt-1">Room {resident.room} | Bed {resident.bed}</div>
              <div className="text-slate-700">Admitted: {resident.admissionDate}</div>
            </div>

            {/* Payer Information */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Payer / Insurance
              </span>
              <div className="font-semibold text-slate-900 truncate" title={resident.primaryInsurance.payerName}>
                {resident.primaryInsurance.payerName}
              </div>
              <div className="text-slate-700 mt-1">Type: {resident.primaryInsurance.payerType}</div>
              <div className="text-emerald-600 font-medium">Eligibility: Active Verified</div>
            </div>
          </div>

          {/* Active Diagnoses List */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
              <span>Active ICD-10 Diagnoses</span>
              <span className="text-[11px] text-slate-700 font-normal">
                Synchronized from PointClickCare
              </span>
            </h3>
            <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden">
              {resident.activeDiagnoses.map((diag) => (
                <div key={diag.icd10} className="p-2.5 flex items-start justify-between bg-white hover:bg-slate-50">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded font-semibold border ${
                        diag.isPrimary
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {diag.icd10}
                    </span>
                    <div>
                      <div className="font-medium text-slate-900">{diag.description}</div>
                      <div className="text-[11px] text-slate-700">
                        Onset: {diag.onsetDate} | Classification: {diag.classification}
                      </div>
                    </div>
                  </div>
                  {diag.isPrimary && (
                    <span className="text-[10px] uppercase font-semibold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Synthetic Equipment Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  Diagnosis-Driven Equipment Recommendations
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-700">
                Rule Engine (Synthetic)
              </span>
            </div>

            {/* Disclaimer pill */}
            <div className="bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded text-[11px] mb-2.5 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
              <span>
                Demonstration rule engine: diagnoses trigger mock clinical indications for DME equipment. Not production clinical guidelines or proprietary commercial rules.
              </span>
            </div>

            {loading ? (
              <div className="py-4 text-center text-slate-700">Evaluating recommendations...</div>
            ) : recommendations.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded text-center text-slate-700">
                No active recommendations triggered for current diagnoses profile.
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec.ruleId}
                    className="p-3 border border-blue-200 bg-blue-50/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{rec.equipmentType}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.2 rounded border border-blue-200">
                          {rec.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          rec.suggestedPriority === 'STAT'
                            ? 'bg-red-100 text-red-800'
                            : rec.suggestedPriority === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.suggestedPriority}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1 text-[11px]">{rec.clinicalRationale}</p>
                      <div className="text-[10px] text-slate-700 font-mono mt-1">
                        Trigger: {rec.matchedDiagnosis} ({rec.ruleId})
                      </div>
                    </div>

                    <button
                      onClick={() => onOrderEquipment(resident, rec)}
                      disabled={resident.status === 'DISCHARGED'}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Order This Item
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing Orders for this resident */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
              <span>Existing DME Orders ({orders.length})</span>
            </h3>
            {orders.length === 0 ? (
              <div className="p-3 border border-slate-200 rounded text-center text-slate-700">
                No previous equipment orders on record for this resident.
              </div>
            ) : (
              <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden">
                {orders.map((o) => (
                  <div key={o.orderId} className="p-2.5 flex items-center justify-between bg-white text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">{o.orderId}</span>
                        <span className="font-medium text-slate-800">{o.equipmentType}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {o.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 mt-0.5">
                        Ordered by {o.orderingUser} on {new Date(o.orderDate).toLocaleDateString()} | Indication: {o.diagnosisIcd10}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-700 font-mono">
            Synced: {new Date(resident.lastSyncTimestamp).toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onOrderEquipment(resident)}
              disabled={resident.status === 'DISCHARGED'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Custom DME Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
