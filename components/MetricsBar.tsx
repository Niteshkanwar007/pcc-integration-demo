'use client';

import React from 'react';
import {
  Activity,
  Users,
  Clock,
  Package,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { IntegrationMetrics } from '@/integration/types';

interface MetricsBarProps {
  metrics: IntegrationMetrics | null;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5">
      {/* PRIMARY 1: PCC Provider & Connection Status (Requirement 4) (3 cols) */}
      <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-xs font-semibold text-slate-900 tracking-tight">PCC Provider</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            SYNTHETIC
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold text-slate-900 font-mono tracking-tight">
            Synthetic Adapter
          </span>
          <span className="text-[11px] text-blue-700 font-medium font-mono">
            Demo mode active
          </span>
        </div>
        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">Live PCC Verification:</span>
          <span className="text-amber-800 font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200">
            NOT PERFORMED
          </span>
        </div>
      </div>

      {/* PRIMARY 2: Last Synchronization (3 cols) */}
      <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-xs font-semibold text-slate-900 tracking-tight">Last Synchronization</span>
          </div>
          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            Simulated Sync
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold text-slate-900 font-mono">
            {formatTime(metrics?.lastSyncTimestamp)}
          </span>
          <span className="text-xs text-blue-700 font-medium font-mono">Demo Ready</span>
        </div>
        <div className="text-[10px] text-slate-600 mt-1 truncate">
          Demo event listener • In-memory state
        </div>
      </div>

      {/* PRIMARY 3: Synced Residents (3 cols) */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-xs font-semibold text-slate-900 tracking-tight">Synced Residents</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
            {metrics?.activeAdmittedCount ?? '--'} admitted
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold text-slate-900 font-mono">
            {metrics?.totalSynchronizedResidents ?? '--'}
          </span>
          <span className="text-xs text-slate-600 font-mono">3 demo facilities</span>
        </div>
        <div className="text-[10px] text-slate-600 mt-1 truncate">
          Synthetic roster • Sanitized clinical profiles
        </div>
      </div>

      {/* SECONDARY GROUP: DME Orders + Integration Audit (3 cols) */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-3 grid grid-cols-2 gap-2">
        {/* Secondary: DME Orders */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-medium">DME Orders</span>
            <Package className="w-3 h-3 text-slate-700" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 font-mono">
              {metrics?.pendingOrdersCount ?? '--'}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">pending</span>
          </div>
          <div className="text-[10px] text-slate-600 truncate">Synthetic order queue</div>
        </div>

        {/* Secondary: Audit Log */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-medium">Audit Events</span>
            <Activity className="w-3 h-3 text-slate-700" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 font-mono">
              {metrics?.recentEventsCount ?? 0}
            </span>
            <span className="text-[10px] text-slate-600">{metrics?.errorRatePercent ?? 0}% err</span>
          </div>
          <div className="text-[10px] text-slate-600 truncate">Simulated HL7 & API audit</div>
        </div>
      </div>
    </div>
  );
}
