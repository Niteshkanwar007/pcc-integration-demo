'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { CanonicalResident } from '@/integration/types';

interface ResidentListProps {
  residents: (CanonicalResident & { recommendationsCount?: number; ordersCount?: number })[];
  onSelectResident: (resident: CanonicalResident) => void;
  onCreateOrderForResident: (resident: CanonicalResident) => void;
}

export function ResidentList({
  residents,
  onSelectResident,
  onCreateOrderForResident,
}: ResidentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = residents.filter((r) => {
    if (facilityFilter && r.facilityId !== facilityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.fullName.toLowerCase().includes(term);
      const matchMrn = r.mrn.toLowerCase().includes(term);
      const matchRoom = (r.room || '').toLowerCase().includes(term);
      const matchDiag = r.activeDiagnoses.some(
        (d) => d.description.toLowerCase().includes(term) || d.icd10.toLowerCase().includes(term)
      );
      if (!matchName && !matchMrn && !matchRoom && !matchDiag) return false;
    }
    return true;
  });

  const getStatusBadge = (status: CanonicalResident['status']) => {
    switch (status) {
      case 'ADMITTED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Admitted
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Transferred
          </span>
        );
      case 'DISCHARGED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Discharged
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            On Hold
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Control Bar - Compact */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-900 tracking-tight">
            Synchronized Patient Roster
          </h2>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
            {filtered.length} of {residents.length}
          </span>
          <span className="text-[9px] uppercase font-semibold text-amber-900 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
            SYNTHETIC
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search MRN, resident, diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded border border-slate-300 bg-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Facility Filter */}
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="py-1 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Facilities</option>
            <option value="FAC-101">Pinecrest Rehab (FAC-101)</option>
            <option value="FAC-102">Meadowview (FAC-102)</option>
            <option value="FAC-103">Harborview (FAC-103)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Admitted</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
        </div>
      </div>

      {/* Table - Compact Healthcare Layout */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-medium text-[11px]">
              <th className="py-2 px-3 w-[100px]">MRN</th>
              <th className="py-2 px-3">Resident</th>
              <th className="py-2 px-3">Facility / Room</th>
              <th className="py-2 px-3 w-[90px]">Status</th>
              <th className="py-2 px-3">Active Diagnoses</th>
              <th className="py-2 px-3 w-[140px]">Primary Payer</th>
              <th className="py-2 px-3 w-[90px]">Last Sync</th>
              <th className="py-2 px-3 w-[120px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-700 text-xs">
                  No synthetic residents match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.mrn}
                  onClick={() => onSelectResident(r)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* MRN */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="font-mono font-semibold text-slate-900 text-xs">{r.mrn}</div>
                    <div className="text-[10px] text-slate-700 font-mono">{r.pccPatientId}</div>
                  </td>

                  {/* Resident */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <span>{r.fullName}</span>
                      <span className="text-[10px] text-slate-700 font-normal">
                        ({r.gender}, DOB: {r.dateOfBirth})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-700">
                      Adm: {r.admissionDate}
                      {r.dischargeDate && <span className="text-red-600"> | Disch: {r.dischargeDate}</span>}
                    </div>
                  </td>

                  {/* Facility / Room */}
                  <td className="py-2 px-3">
                    <div className="text-slate-800 font-medium truncate max-w-[150px] 2xl:max-w-[200px]" title={r.facilityName}>
                      {r.facilityName}
                    </div>
                    <div className="text-[10px] text-slate-700 font-mono">
                      {r.room ? `Room ${r.room}` : 'No room assigned'} {r.bed ? `(Bed ${r.bed})` : ''}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getStatusBadge(r.status)}
                  </td>

                  {/* Active Diagnoses */}
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {r.activeDiagnoses.slice(0, 2).map((d) => (
                        <span
                          key={d.icd10}
                          title={`${d.icd10}: ${d.description}`}
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                            d.isPrimary
                              ? 'bg-amber-50 text-amber-900 border-amber-200 font-medium'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {d.icd10}
                        </span>
                      ))}
                      {r.activeDiagnoses.length > 2 && (
                        <span className="text-[10px] text-slate-700">
                          +{r.activeDiagnoses.length - 2}
                        </span>
                      )}
                      {(r.recommendationsCount ?? 0) > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 font-medium bg-blue-50 px-1 py-0.2 rounded border border-blue-100 ml-1"
                          title={`${r.recommendationsCount} DME recommendations available`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                          {r.recommendationsCount} rec
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Primary Payer */}
                  <td className="py-2 px-3">
                    <div className="text-slate-800 font-medium truncate max-w-[130px]" title={r.primaryInsurance.payerName}>
                      {r.primaryInsurance.payerName}
                    </div>
                    <div className="text-[10px] text-slate-700 truncate">{r.primaryInsurance.payerType}</div>
                  </td>

                  {/* Last Sync */}
                  <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-700 font-mono">
                    {new Date(r.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  {/* Action */}
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectResident(r)}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                        title="View Resident Profile & Recommendations"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onCreateOrderForResident(r)}
                        disabled={r.status === 'DISCHARGED'}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={r.status === 'DISCHARGED' ? 'Cannot place order for discharged resident' : 'Create DME Order'}
                      >
                        <PlusCircle className="w-2.5 h-2.5" />
                        Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
