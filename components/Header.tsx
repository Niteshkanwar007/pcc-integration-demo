'use client';

import React from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  PlusCircle,
  Radio,
  RotateCcw,
  Layers,
  FileCode2,
} from 'lucide-react';
import { IntegrationMetrics } from '@/integration/types';

interface HeaderProps {
  metrics: IntegrationMetrics | null;
  isSyncing: boolean;
  onSync: () => void;
  onOpenADTSimulator: () => void;
  onOpenNewOrder: () => void;
  onReset: () => void;
  onOpenArchitecture: () => void;
}

export function Header({
  metrics,
  isSyncing,
  onSync,
  onOpenADTSimulator,
  onOpenNewOrder,
  onReset,
  onOpenArchitecture,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Persistent Engineering Demo Banner (Requirement 14) */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 sm:px-6 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold tracking-tight bg-blue-600/90 text-white px-2 py-0.5 rounded text-[11px] uppercase font-mono">
            PCC Integration Demonstration
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Live PCC Verification: NOT PERFORMED
          </span>
          <span className="text-slate-300 font-sans text-xs">
            This environment uses synthetic data to demonstrate the integration architecture and downstream workflow. No live PointClickCare credentials or production patient data are connected.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs/pcc-integration"
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            PCC Integration Specs & Diagram
          </Link>
          <span className="text-slate-600">|</span>
          <button
            onClick={onReset}
            title="Reset synthetic data to initial seed baseline"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Seed State
          </button>
        </div>
      </div>

      {/* Main Header Controls */}
      <div className="w-full max-w-[98vw] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            PCC
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Healthcare Integration Console
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Provider Mode: Synthetic PCC Client
              </span>
            </div>
            <p className="text-xs text-slate-600">
              PointClickCare Interoperability Boundary, ADT Pipeline & DME Equipment Workflow
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PCC Connection Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50/70 text-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-slate-900 font-medium">Provider:</span>
            <span className="text-blue-800 font-mono font-semibold text-[11px]">
              SYNTHETIC
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-800 font-medium text-[10px] bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
              Live Verification: NOT PERFORMED
            </span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Sync Residents'}
          </button>

          {/* Simulate ADT Event Button */}
          <button
            onClick={onOpenADTSimulator}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            Simulate ADT Event
          </button>

          {/* New DME Order Button */}
          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New DME Order
          </button>
        </div>
      </div>
    </header>
  );
}
