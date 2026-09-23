'use client';

import React from 'react';
import {
  Server,
  RefreshCw,
  Radio,
  FileSpreadsheet,
  Package,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { IntegrationMetrics } from '@/integration/types';

interface WorkflowPipelineProps {
  metrics: IntegrationMetrics | null;
  onSync: () => void;
  onOpenADT: () => void;
  onOpenOrder: () => void;
  onViewRules: () => void;
  isSyncing: boolean;
}

export function WorkflowPipeline({
  metrics,
  onSync,
  onOpenADT,
  onOpenOrder,
  onViewRules,
  isSyncing,
}: WorkflowPipelineProps) {
  const steps = [
    {
      id: 'pcc',
      stepNumber: '01',
      title: 'PCC Connector',
      subtitle: 'Synthetic EHR Adapter',
      status: 'SYNTHETIC',
      statusType: 'info' as const,
      icon: Server,
      badge: `Simulated ${metrics?.averageProcessingTimeMs || 22}ms`,
      actionLabel: null,
      onAction: null,
    },
    {
      id: 'sync',
      stepNumber: '02',
      title: 'Resident Sync',
      subtitle: 'Canonical Mapping',
      status: `${metrics?.totalSynchronizedResidents ?? 5} Demo Synced`,
      statusType: 'success' as const,
      icon: RefreshCw,
      badge: 'Batch + On-Demand',
      actionLabel: isSyncing ? 'Syncing...' : 'Sync Now',
      onAction: onSync,
      isActionActive: isSyncing,
    },
    {
      id: 'adt',
      stepNumber: '03',
      title: 'ADT Events',
      subtitle: 'Demo Event Listener',
      status: `${metrics?.activeAdmittedCount ?? 4} Simulated Active`,
      statusType: 'info' as const,
      icon: Radio,
      badge: 'Admission • Transfer • Discharge',
      actionLabel: 'Simulate',
      onAction: onOpenADT,
    },
    {
      id: 'clinical',
      stepNumber: '04',
      title: 'Clinical Data',
      subtitle: 'ICD-10 Diagnoses',
      status: 'Normalized',
      statusType: 'info' as const,
      icon: FileSpreadsheet,
      badge: 'Payer & Diagnostic Link',
      actionLabel: null,
      onAction: null,
    },
    {
      id: 'dme',
      stepNumber: '05',
      title: 'DME Orders',
      subtitle: 'Equipment Dispatch',
      status: `${metrics?.pendingOrdersCount ?? 2} Pending`,
      statusType: 'warning' as const,
      icon: Package,
      badge: 'Facility Routing',
      actionLabel: 'New Order',
      onAction: onOpenOrder,
    },
    {
      id: 'recommendation',
      stepNumber: '06',
      title: 'Recommendation',
      subtitle: 'Clinical Rules',
      status: 'Active Heuristics',
      statusType: 'purple' as const,
      icon: Sparkles,
      badge: 'Synthetic Rule Engine',
      actionLabel: 'View Rules',
      onAction: onViewRules,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-slate-900 tracking-tight">
            PointClickCare &rarr; DME Integration Demonstration Flow
          </span>
          <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono font-medium">
            Provider Mode: Synthetic PCC Client
          </span>
        </div>
        <div className="text-[11px] text-slate-700 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Demo Pipeline Active
          </span>
          <span className="hidden lg:inline text-slate-700">&bull;</span>
          <span className="hidden lg:inline text-slate-700">
            Decoupled Modular Architecture
          </span>
        </div>
      </div>

      {/* Horizontal Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="group relative bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-md p-2.5 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Step number and icon */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-700">
                      {step.stepNumber}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-900 transition-colors" />
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block w-3 h-3 text-slate-700 -mr-1" />
                  )}
                </div>

                {/* Step Titles */}
                <div className="font-semibold text-slate-900 text-xs tracking-tight">
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-700 mb-1.5">
                  {step.subtitle}
                </div>
              </div>

              {/* Status & Action */}
              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px]">
                <span className="font-mono text-slate-700 truncate" title={step.badge}>
                  {step.status}
                </span>

                {step.actionLabel && step.onAction && (
                  <button
                    onClick={step.onAction}
                    disabled={step.isActionActive}
                    className="shrink-0 font-medium text-[10px] text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-slate-200 rounded px-1.5 py-0.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
