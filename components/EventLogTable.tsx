'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { IntegrationEvent, IntegrationEventStatus } from '@/integration/types';

interface EventLogTableProps {
  events: IntegrationEvent[];
  limit?: number;
  showFilters?: boolean;
}

export function EventLogTable({ events, limit, showFilters = false }: EventLogTableProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const displayList = events
    .filter((e) => {
      if (filterType && e.eventType !== filterType) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    })
    .slice(0, limit || events.length);

  const getStatusBadge = (status: IntegrationEventStatus | 'PROCESSED') => {
    switch (status) {
      case 'SUCCESS':
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            {status === 'PROCESSED' ? 'Processed' : 'Success'}
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            Warning
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-2.5 h-2.5 text-red-600" />
            Failed
          </span>
        );
    }
  };

  const getEventTypeBadge = (type: IntegrationEvent['eventType']) => {
    let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
    if (type.startsWith('ADT_')) {
      colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
    } else if (type.startsWith('PCC_')) {
      colorClass = 'bg-purple-50 text-purple-800 border-purple-200';
    } else if (type.startsWith('DME_')) {
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return (
      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border font-semibold ${colorClass}`}>
        {type.replace('PCC_', '').replace('ADT_', 'ADT ')}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Top Controls */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-semibold text-slate-900 tracking-tight">
            Integration Audit Trail & Events
          </h2>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
            {events.length}
          </span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-0.5 px-2 text-[11px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="">All Events</option>
              <option value="PCC_PATIENT_SYNC">PCC_PATIENT_SYNC</option>
              <option value="ADT_ADMISSION">ADT_ADMISSION</option>
              <option value="ADT_TRANSFER">ADT_TRANSFER</option>
              <option value="ADT_DISCHARGE">ADT_DISCHARGE</option>
              <option value="DME_ORDER_CREATED">DME_ORDER_CREATED</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-0.5 px-2 text-[11px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        )}
      </div>

      {/* Table - Optimized for Desktop Width without horizontal scroll */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-medium text-[11px]">
              <th className="py-2 px-3 w-[80px]">Time</th>
              <th className="py-2 px-3 w-[130px]">Event</th>
              <th className="py-2 px-3 w-[90px]">MRN</th>
              <th className="py-2 px-3 w-[120px]">Source</th>
              <th className="py-2 px-3 w-[80px]">Status</th>
              <th className="py-2 px-3 w-[70px]">Duration</th>
              <th className="py-2 px-3">Message</th>
              <th className="py-2 px-3 w-[40px] text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-700 text-xs">
                  No integration events recorded yet.
                </td>
              </tr>
            ) : (
              displayList.map((e) => {
                const isExpanded = expandedEventId === e.id;
                return (
                  <React.Fragment key={e.id}>
                    <tr
                      onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Time */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {new Date(e.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Event Type */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {getEventTypeBadge(e.eventType)}
                      </td>

                      {/* MRN */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-900 font-medium text-xs">
                        {e.mrn}
                      </td>

                      {/* Source */}
                      <td className="py-2 px-3 whitespace-nowrap text-slate-700 text-[11px] truncate max-w-[130px]" title={e.source}>
                        <span className="font-mono text-[11px]">
                          {e.source.includes('Synthetic') ? 'PCC (Synthetic)' : e.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {getStatusBadge(e.status)}
                      </td>

                      {/* Duration */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {e.processingTimeMs}ms
                      </td>

                      {/* Message Preview */}
                      <td className="py-2 px-3 text-slate-700 text-xs truncate max-w-[180px] 2xl:max-w-[280px]" title={e.message}>
                        {e.message}
                      </td>

                      {/* Toggle button */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          className="p-1 rounded text-slate-700 group-hover:text-slate-900"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON Payload */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={8} className="p-3 border-y border-slate-200 font-mono text-[11px]">
                          <div className="bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto shadow-inner">
                            <div className="flex items-center justify-between text-slate-700 text-xs font-sans pb-1 mb-2 border-b border-slate-800">
                              <span>Structured Payload (Audit ID: {e.id})</span>
                              <span>Timestamp: {e.timestamp}</span>
                            </div>
                            <pre className="text-[11px] leading-relaxed">
                              {JSON.stringify(
                                {
                                  id: e.id,
                                  timestamp: e.timestamp,
                                  eventType: e.eventType,
                                  mrn: e.mrn,
                                  patientName: e.patientName,
                                  source: e.source,
                                  status: e.status,
                                  processingTimeMs: e.processingTimeMs,
                                  details: e.details,
                                  errorMessage: e.errorMessage,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
