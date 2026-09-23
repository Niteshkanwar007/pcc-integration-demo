import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Database, Layers, KeyRound, AlertTriangle, CheckCircle2, Lock, Cpu } from 'lucide-react';
import { PCC_CAPABILITY_MATRIX } from '@/pcc/providers/capability-matrix';

export default function PCCIntegrationDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Integration Console
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Architecture Specification & Verification Standard
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                PointClickCare (PCC) Integration Architecture
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Technical blueprint defining provider boundaries, canonical normalization, verified capabilities, and sandbox onboarding.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-700/60 font-mono font-bold">
                Live PCC Verification: NOT PERFORMED
              </span>
            </div>
          </div>
        </div>

        {/* Section 13: Visual Architecture Diagram */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">System Architecture & Boundary Flow</h2>
          </div>

          <div className="p-6 bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-x-auto font-mono text-xs">
            <div className="min-w-[680px] flex flex-col items-center gap-3 text-slate-300">
              
              {/* Dual Provider Ingestion Layer */}
              <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                <div className="p-3.5 rounded-lg border-2 border-dashed border-sky-500/60 bg-sky-950/30 text-center">
                  <div className="text-sky-300 font-bold text-sm">Synthetic PCC Provider</div>
                  <div className="text-[11px] text-sky-400/80 mt-1">In-Memory Cohort • ADT Simulator (Active)</div>
                </div>
                <div className="p-3.5 rounded-lg border-2 border-dashed border-amber-600/50 bg-amber-950/20 text-center">
                  <div className="text-amber-300 font-bold text-sm">Real PCC Provider Adapter</div>
                  <div className="text-[11px] text-amber-400/80 mt-1">Future / requires legitimate PCC configuration</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* PCC Adapter Boundary */}
              <div className="w-full max-w-2xl p-3.5 rounded-lg border border-purple-500/50 bg-purple-950/30 text-center">
                <div className="text-purple-300 font-bold text-sm">PCC Adapter & Verification Layer (IPCCProvider)</div>
                <div className="text-[11px] text-purple-400/80 mt-0.5">Capability Declarations • Token Lifecycle • Connection Status Evaluator</div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* Canonical Model Layer */}
              <div className="w-full max-w-2xl p-3.5 rounded-lg border border-emerald-500/50 bg-emerald-950/30 text-center">
                <div className="text-emerald-300 font-bold text-sm">Canonical Healthcare Domain Model</div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">CanonicalResident • CanonicalDiagnosis • CanonicalInsurance (Vendor-Neutral)</div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* Integration Services */}
              <div className="w-full max-w-2xl p-3.5 rounded-lg border border-blue-500/50 bg-blue-950/30 text-center">
                <div className="text-blue-300 font-bold text-sm">Integration Pipeline Services</div>
                <div className="text-[11px] text-blue-400/80 mt-0.5">ResidentSyncService • ADTProcessor • RetryPolicy & Resilience</div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* Branching Workflows */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                  <div className="font-semibold text-slate-200">ADT Pipeline</div>
                  <div className="text-[10px] text-slate-400">Admit / Transfer / Discharge</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                  <div className="font-semibold text-slate-200">Patient Roster</div>
                  <div className="text-[10px] text-slate-400">Census Reconciliation</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                  <div className="font-semibold text-slate-200">Clinical Coverage</div>
                  <div className="text-[10px] text-slate-400">ICD-10 & Payer Criteria</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* DME Workflow */}
              <div className="w-full max-w-2xl p-3.5 rounded-lg border border-teal-500/50 bg-teal-950/30 text-center">
                <div className="text-teal-300 font-bold text-sm">DME Workflow Engine</div>
                <div className="text-[11px] text-teal-400/80 mt-0.5">Clinical Rules Engine • Equipment Recommendations • Prior Auth Readiness</div>
              </div>

              {/* Arrow */}
              <div className="text-slate-500 font-bold text-lg">↓</div>

              {/* UI Dashboard */}
              <div className="w-full max-w-2xl p-3.5 rounded-lg border border-slate-700 bg-slate-900 text-center">
                <div className="text-slate-200 font-bold text-sm">Healthcare Integration Console & Inspector</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Operations Audit Log • Live Sanitized Request Inspector • Status Banners</div>
              </div>

            </div>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section 1: Current Synthetic Architecture */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400 font-semibold text-base">
              <Database className="w-5 h-5" />
              <h3>1. Current Synthetic Architecture</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The application executes in a fully contained demonstration sandbox. Patient demographic records, ICD-10 clinical diagnoses, and room locations are served via an in-memory repository initialized from sanitized seed data. All state updates resulting from simulated ADT movements or batch synchronization are maintained in server memory without external dependencies.
            </p>
          </div>

          {/* Section 2: PCC Adapter Boundary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-400 font-semibold text-base">
              <Cpu className="w-5 h-5" />
              <h3>2. PCC Adapter Boundary</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All interactions with EHR systems pass through the <code className="text-purple-300">PCCProvider</code> interface. Core business logic (such as admission routing, diagnosis evaluation, and DME order submission) does not know whether data originates from the synthetic provider or a certified FHIR sandbox. Swapping providers requires no refactoring of business logic.
            </p>
          </div>

          {/* Section 3: Canonical Data Model */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-base">
              <Layers className="w-5 h-5" />
              <h3>3. Canonical Data Model</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              External data structures (such as HL7 FHIR R4 resources or proprietary EHR payloads) are immediately transformed into internal models (<code className="text-emerald-300">CanonicalResident</code>, <code className="text-emerald-300">CanonicalDiagnosis</code>, <code className="text-emerald-300">CanonicalInsurance</code>) via dedicated data mappers. Vendor-specific parameters and wire formats are isolated strictly at the boundary.
            </p>
          </div>

          {/* Section 4: Real PCC Integration Path */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-base">
              <KeyRound className="w-5 h-5" />
              <h3>4. Real PCC Integration Path</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The project contains a pre-architected <code className="text-amber-300">RealPCCProvider</code> skeleton. When legitimate credentials and developer portal access are provisioned, this skeleton can be configured with genuine OAuth 2.0 endpoints, client credentials, and FHIR base URLs without changing downstream workflow code.
            </p>
          </div>

        </div>

        {/* Section 5, 6, 7: Capability Classification Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Capability Classification Matrix</h2>
            </div>
            <span className="text-xs text-slate-400">Explicit verification boundaries</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Technical Verification & Boundary Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {PCC_CAPABILITY_MATRIX.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'DOCUMENTED_SUPPORTED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                          Documented / Supported
                        </span>
                      )}
                      {item.status === 'VERIFIED_AGAINST_PCC' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          Verified Against PCC
                        </span>
                      )}
                      {item.status === 'NOT_VERIFIED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Not Verified
                        </span>
                      )}
                      {item.status === 'REQUIRES_PCC_PARTNER_ACCESS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          Requires PCC Partner Access
                        </span>
                      )}
                      {item.status === 'SYNTHETIC_ONLY' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/60">
                          Synthetic Only
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed text-[11px]">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 8 & 9: Security Boundaries & Future Onboarding */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section 8: Security Boundaries */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-base">
              <Lock className="w-5 h-5" />
              <h3>8. Security & Privacy Boundaries</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
              <li><strong className="text-white">Zero Hardcoded Credentials:</strong> Secrets are strictly injected through environment variables and never committed to source code.</li>
              <li><strong className="text-white">No Client Secrets in UI:</strong> Client IDs, tokens, and authorization credentials are never returned in public API payloads or displayed on screen.</li>
              <li><strong className="text-white">Sanitized Developer Traces:</strong> The Request/Response Inspector filters out all sensitive patient identifiers and tokens, displaying only sanitized synthetic references.</li>
              <li><strong className="text-white">Zero Real PHI:</strong> All names, addresses, and identifiers in the demo are synthetically generated and non-attributable.</li>
            </ul>
          </div>

          {/* Section 9: Future Sandbox Integration Process */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-teal-400 font-semibold text-base">
              <AlertTriangle className="w-5 h-5" />
              <h3>9. Future Sandbox Integration Process</h3>
            </div>
            <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
              <li><strong className="text-white">Partner Enrollment:</strong> Register for the PointClickCare Developer Marketplace and execute BAA documentation.</li>
              <li><strong className="text-white">Credential Provisioning:</strong> Obtain sandbox <code className="text-teal-300">PCC_CLIENT_ID</code>, <code className="text-teal-300">PCC_CLIENT_SECRET</code>, and <code className="text-teal-300">PCC_TENANT_ID</code>.</li>
              <li><strong className="text-white">Configuration Injection:</strong> Populate <code className="text-teal-300">.env</code> with sandbox base URLs without modifying application logic.</li>
              <li><strong className="text-white">Runtime Verification:</strong> Execute authenticated ping tests to transition from <code className="text-amber-400">CONFIGURED_NOT_VERIFIED</code> to <code className="text-emerald-400">VERIFIED_SANDBOX</code>.</li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
}
