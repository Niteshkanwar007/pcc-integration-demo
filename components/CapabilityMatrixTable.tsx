'use client';

import React, { useState } from 'react';
import { AlertCircle, Lock, Cpu, Info, ShieldCheck, FileCheck, HelpCircle } from 'lucide-react';
import { PCCCapabilityItem, PCC_CAPABILITY_MATRIX } from '@/pcc/providers/capability-matrix';
import { CapabilityVerificationStatus } from '@/pcc/providers/types';

export function CapabilityMatrixTable() {
  const [filter, setFilter] = useState<'ALL' | CapabilityVerificationStatus>('ALL');

  const filteredItems = PCC_CAPABILITY_MATRIX.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const documentedCount = PCC_CAPABILITY_MATRIX.filter((i) => i.status === 'DOCUMENTED_SUPPORTED').length;
  const verifiedAgainstPccCount = PCC_CAPABILITY_MATRIX.filter((i) => i.status === 'VERIFIED_AGAINST_PCC').length;
  const notVerifiedCount = PCC_CAPABILITY_MATRIX.filter((i) => i.status === 'NOT_VERIFIED').length;
  const partnerCount = PCC_CAPABILITY_MATRIX.filter((i) => i.status === 'REQUIRES_PCC_PARTNER_ACCESS').length;
  const syntheticOnlyCount = PCC_CAPABILITY_MATRIX.filter((i) => i.status === 'SYNTHETIC_ONLY').length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Live Verification Notice Banner */}
      <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
            Live PCC Verification: NOT PERFORMED
          </span>
          <span className="text-xs text-amber-900">
            No live PointClickCare credentials connected. Standard FHIR capabilities are documented/supported, not personally verified against a live PCC tenant.
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-800 shrink-0">
          Environment: Demo Synthetic
        </span>
      </div>

      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              PCC Capability Verification Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Explicit declaration of documented specifications vs live sandbox testing vs synthetic demo features.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({PCC_CAPABILITY_MATRIX.length})
          </button>
          <button
            onClick={() => setFilter('DOCUMENTED_SUPPORTED')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'DOCUMENTED_SUPPORTED'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Documented / Supported ({documentedCount})
          </button>
          <button
            onClick={() => setFilter('VERIFIED_AGAINST_PCC')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'VERIFIED_AGAINST_PCC'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Verified Against PCC ({verifiedAgainstPccCount})
          </button>
          <button
            onClick={() => setFilter('NOT_VERIFIED')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'NOT_VERIFIED'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Not Verified ({notVerifiedCount})
          </button>
          <button
            onClick={() => setFilter('REQUIRES_PCC_PARTNER_ACCESS')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'REQUIRES_PCC_PARTNER_ACCESS'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Partner Access ({partnerCount})
          </button>
          <button
            onClick={() => setFilter('SYNTHETIC_ONLY')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === 'SYNTHETIC_ONLY'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Synthetic Only ({syntheticOnlyCount})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">Capability</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Verification Status</th>
              <th className="py-2.5 px-4">Demo Active Mode</th>
              <th className="py-2.5 px-4">Technical Rationale & Bounds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {item.name}
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">{item.description}</div>
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                  {item.category}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {item.status === 'DOCUMENTED_SUPPORTED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      <FileCheck className="w-3 h-3 text-blue-600" />
                      DOCUMENTED / SUPPORTED
                    </span>
                  )}
                  {item.status === 'VERIFIED_AGAINST_PCC' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      VERIFIED AGAINST PCC
                    </span>
                  )}
                  {item.status === 'NOT_VERIFIED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                      <AlertCircle className="w-3 h-3 text-slate-500" />
                      NOT VERIFIED
                    </span>
                  )}
                  {item.status === 'REQUIRES_PCC_PARTNER_ACCESS' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                      <Lock className="w-3 h-3 text-amber-600" />
                      REQUIRES PCC PARTNER ACCESS
                    </span>
                  )}
                  {item.status === 'SYNTHETIC_ONLY' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      <Cpu className="w-3 h-3 text-sky-600" />
                      SYNTHETIC ONLY
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {item.supportedInSynthetic ? (
                    <span className="text-blue-700 font-mono text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                      Synthetic Active
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Not in demo
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed max-w-md">
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer disclaimer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-600 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Statuses strictly differentiate &apos;Documented / Supported&apos; (FHIR specification) from &apos;Verified Against PCC&apos; (actual live sandbox test). No live verification has been performed in this demo.
        </span>
        <span className="font-mono text-slate-500 shrink-0">
          Live PCC Verification: NOT PERFORMED
        </span>
      </div>
    </div>
  );
}
