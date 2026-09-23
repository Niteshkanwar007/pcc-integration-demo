'use client';

import React, { useState } from 'react';
import { Terminal, Clock, CheckCircle2, XCircle, Code, ShieldAlert, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { InspectorTraceRecord } from '@/integration/types';

interface RequestInspectorTableProps {
  traces: InspectorTraceRecord[];
  onRefresh?: () => void;
}

export function RequestInspectorTable({ traces, onRefresh }: RequestInspectorTableProps) {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const toggleExpand = (id: string) => {
    setExpandedTraceId((prev) => (prev === id ? null : id));
  };

  const filteredTraces = traces.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.requestType === filterType;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Inspector Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-tight">
              Developer Request / Response Inspector
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Zero PHI • Sanitized Traces
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time payload inspection for synthetic operations and future PointClickCare sandbox requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Types */}
          <div className="flex items-center bg-slate-800 rounded p-0.5 text-xs">
            {['ALL', 'GET', 'POST', 'INTERNAL_EVAL'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  filterType === type ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh inspector traces"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Traces List */}
      <div className="divide-y divide-slate-100 font-mono text-xs">
        {filteredTraces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No trace records found. Trigger an ADT event or patient sync to generate traces.
          </div>
        ) : (
          filteredTraces.map((trace) => {
            const isExpanded = expandedTraceId === trace.id;

            return (
              <div key={trace.id} className="hover:bg-slate-50/70 transition-colors">
                <div
                  onClick={() => toggleExpand(trace.id)}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  {/* Left: Indicator, Operation, Endpoint */}
                  <div className="flex items-start md:items-center gap-2.5">
                    <button className="text-slate-400 hover:text-slate-600 mt-0.5 md:mt-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trace.requestType === 'GET'
                          ? 'bg-blue-100 text-blue-800'
                          : trace.requestType === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {trace.requestType}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{trace.operation}</span>
                        <span className="text-[11px] text-slate-500">{trace.endpointOrMethod}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-sans mt-0.5 line-clamp-1">
                        {trace.mappingResultSummary}
                      </div>
                    </div>
                  </div>

                  {/* Right: Source, Status, Latency, Timestamp */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    {/* Clear Source Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      SOURCE: {trace.source}
                    </span>

                    <span className="flex items-center gap-1 text-[11px]">
                      {trace.responseStatus === 'SUCCESS' || (typeof trace.responseStatus === 'number' && trace.responseStatus < 400) ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span className="font-semibold text-slate-800">{trace.responseStatus}</span>
                    </span>

                    <span className="text-[11px] text-slate-500">
                      {trace.processingDurationMs}ms
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Details: Sanitized Payload & Mapping Preview */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 text-slate-200 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Code className="w-3.5 h-3.5" /> Sanitized Wire Payload Preview
                      </span>
                      <span>Trace ID: {trace.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 mb-1">Payload Fields:</div>
                        <pre className="p-2.5 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-[11px] text-emerald-300">
                          {JSON.stringify(trace.sanitizedPayloadSummary || {}, null, 2)}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] uppercase text-slate-400 mb-1">Canonical Mapping Result:</div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 font-sans leading-relaxed">
                          {trace.mappingResultSummary}
                        </div>
                        {trace.errorState && (
                          <div className="p-2.5 bg-red-950/50 border border-red-800 rounded text-[11px] text-red-300">
                            Error: {trace.errorState}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 italic font-sans">
                          * Sanitization active: tokens, client secrets, and identifying patient particulars are excluded.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
