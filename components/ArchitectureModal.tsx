'use client';

import React from 'react';
import {
  X,
  Layers,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  ExternalLink,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                PointClickCare Integration Architecture & Modular Separation
              </h2>
              <p className="text-xs text-slate-700">
                Design rationale for seamless synthetic-to-sandbox transition
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Executive Architecture Summary */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <div className="font-semibold text-blue-950 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Core Technical Decoupling Principle
            </div>
            <p className="text-blue-900 text-[11px] leading-relaxed">
              This demo strictly decouples the vendor EHR provider (PointClickCare) from the internal DME workflow
              and canonical domain models. All PointClickCare wire communication is isolated behind the <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">IPCCClient</code> interface. Switching to an official PointClickCare Developer Sandbox requires only providing an implementation of <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">RealPCCClient</code> without modifying resident synchronization, ADT logic, or DME ordering.
            </p>
          </div>

          {/* Current vs Future Integration State Indicator */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/80">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-slate-900 text-xs">
                Integration State Comparison: Current vs Future Target
              </h3>
              <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Plug-and-Play Boundary
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CURRENT */}
              <div className="bg-white border-2 border-blue-500/80 rounded-md p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    CURRENT STATE (ACTIVE DEMO)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-medium">In-Memory Synthetic</span>
                </div>
                <div className="font-mono text-[11px] text-slate-900 font-medium bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">Synthetic PCC Client</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Integration Layer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">DME Workflow</span>
                </div>
                <p className="mt-2 text-[10px] text-slate-600 leading-normal">
                  In-memory synthetic client implementing the full <code className="font-mono text-slate-700">IPCCClient</code> interface. Emulates OAuth token lifecycles, REST facility rosters, and ADT webhooks without requiring live PointClickCare credentials.
                </p>
              </div>

              {/* FUTURE */}
              <div className="bg-white border border-slate-300 border-dashed rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    FUTURE STATE (OFFICIAL SANDBOX / PRODUCTION)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Zero Internal Rewrite</span>
                </div>
                <div className="font-mono text-[11px] text-slate-900 font-medium bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">Official PCC Sandbox/Production Adapter</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Integration Layer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">DME Workflow</span>
                </div>
                <p className="mt-2 text-[10px] text-slate-600 leading-normal">
                  Switch the provider factory to inject <code className="font-mono text-slate-700">RealPCCClient</code> via developer portal OAuth2 credentials. The canonical resident data model, ADT processor, and DME ordering engine remain 100% untouched.
                </p>
              </div>
            </div>
          </div>

          {/* Module Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: /pcc */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-xs">/pcc</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">
                  EHR Provider Abstraction
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-purple-700 text-[11px] font-semibold">authentication:</span>
                  <span>OAuth 2.0 token management, renewal lifecycle, and client credentials.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-purple-700 text-[11px] font-semibold">client:</span>
                  <span><code className="bg-slate-200 px-1 rounded">IPCCClient</code> contract implemented currently by <code className="bg-slate-200 px-1 rounded">SyntheticPCCClient</code>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-purple-700 text-[11px] font-semibold">patient-service:</span>
                  <span>Patient search, facility roster queries, and diagnosis retrieval.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-purple-700 text-[11px] font-semibold">event-processing:</span>
                  <span>Inbound ADT / Webhook validator and payload sanitizer.</span>
                </li>
              </ul>
            </div>

            {/* Box 2: /integration */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-xs">/integration</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                  Integration Engine
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-blue-700 text-[11px] font-semibold">resident-sync:</span>
                  <span>Scheduled & on-demand synchronization pulling EHR updates into canonical store.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-blue-700 text-[11px] font-semibold">adt-processing:</span>
                  <span>Real-time processing of ADMISSION, TRANSFER, and DISCHARGE events.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-blue-700 text-[11px] font-semibold">mapping:</span>
                  <span><code className="bg-slate-200 px-1 rounded">PCCDataMapper</code> translating PCC schemas into internal CanonicalResident models.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-blue-700 text-[11px] font-semibold">error-handling:</span>
                  <span>Typed <code className="bg-slate-200 px-1 rounded">IntegrationError</code> classification with automated audit log emission.</span>
                </li>
              </ul>
            </div>

            {/* Box 3: /dme */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-xs">/dme</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                  Equipment Domain
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-emerald-700 text-[11px] font-semibold">orders:</span>
                  <span>Equipment order generation, validation against active admission status, and state management.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-emerald-700 text-[11px] font-semibold">recommendations:</span>
                  <span>Clinical heuristics engine linking active ICD-10 diagnoses (e.g. L89 pressure ulcers, J44 COPD) to recommended DME items.</span>
                </li>
              </ul>
            </div>

            {/* Box 4: /demo */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-xs">/demo</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                  Synthetic Testing
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-amber-700 text-[11px] font-semibold">synthetic-data:</span>
                  <span>Sanitized, de-identified facilities, residents, and initial seed fixtures.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-mono text-amber-700 text-[11px] font-semibold">event-simulator:</span>
                  <span>Pre-configured clinical scenarios to demonstrate admission, room transfer, and discharge.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Transition Roadmap to Real PCC Sandbox */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-white">
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-slate-700" />
              How to Connect the Official PCC Sandbox (Step-by-Step)
            </h3>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Provision Sandbox Credentials:</strong> Register on the PointClickCare Developer Portal, generate OAuth2 client credentials (Client ID, Client Secret, and assigned Org UUID).
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900">Inject RealPCCAuthenticator:</strong> Replace <code className="bg-slate-100 px-1 rounded font-mono">SyntheticPCCAuthenticator</code> with <code className="bg-slate-100 px-1 rounded font-mono">RealPCCAuthenticator</code> using secure environment variables.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900">Implement RealPCCClient:</strong> Provide HTTP fetch requests implementing <code className="bg-slate-100 px-1 rounded font-mono">IPCCClient</code> matching official PCC REST endpoints for resident lookups and facility rosters.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-900">Zero Core Changes:</strong> The synchronization services, ADT event processing pipeline, recommendation engine, and UI dashboard continue to operate with no code modifications.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Architecture Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
