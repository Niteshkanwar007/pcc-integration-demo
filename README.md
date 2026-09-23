# PCC Integration Demo

A sanitized technical demonstration of a healthcare integration architecture featuring a PointClickCare (PCC) provider boundary, canonical healthcare data model, ADT event processing pipeline, clinical and coverage mapping, and a downstream Durable Medical Equipment (DME) fulfillment workflow.

> **DEMONSTRATION & INTEGRITY NOTICE**  
> **Current Mode:** Synthetic Demo Provider  
> **Live PCC Verification:** NOT PERFORMED  
> **Data:** 100% Synthetic / Fictional EHR Cohort  
> **Credentials:** No PointClickCare credentials, live endpoints, client secrets, or production patient data are included or connected.  
> **Original Codebase Notice:** This project is a clean-room architectural demonstration and does **not** contain any previous client's proprietary production source code or confidential algorithms.

---

## 1. Overview

Integrating acute and post-acute electronic health records (EHRs)—such as PointClickCare—with downstream specialized ancillary workflows (e.g., DME equipment delivery, therapy fulfillment, and prior authorization) requires strict architectural boundaries.

Direct coupling between proprietary EHR schemas and operational business logic creates fragile systems that break whenever vendor payloads evolve or tenant configurations differ. This demonstration showcases a resilient integration architecture that:
- Decouples vendor-specific data contracts behind a provider abstraction interface (`IPCCProvider`).
- Translates external events and resources into internal, provider-neutral **Canonical Models** (`CanonicalResident`, `CanonicalDiagnosis`, `CanonicalInsurance`).
- Processes HL7 ADT events (Admissions, Bed Transfers, Discharges) with idempotency and state synchronization.
- Maps active clinical ICD-10 indications to durable equipment recommendations and order tracking.
- Maintains strict truth-in-advertising regarding integration boundaries and testing status.

---

## 2. Architecture

```text
PointClickCare / Future Legitimate PCC Environment
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       PCC Provider Boundary      │
        │  ──────────────────────────────  │
        │  [Synthetic Provider]            │  ◄── CURRENT DEMO (In-Memory EHR)
        │  [Real PCC Provider Skeleton]    │  ◄── FUTURE (Requires Legitimate Access)
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       Canonical Data Model       │
        │  ──────────────────────────────  │
        │  CanonicalResident               │
        │  CanonicalDiagnosis              │
        │  CanonicalInsurance              │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       Integration Services       │
        │  ──────────────────────────────  │
        │  ADT Processor (A01 / A02 / A03) │
        │  Resident Sync Service           │
        │  Error Translation & Resilience  │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │           DME Workflow           │
        │  ──────────────────────────────  │
        │  Equipment Recommendation Rules  │
        │  Order Submission & Lifecycle    │
        │  Room / Bed Change Automation    │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │          Audit & Console         │
        │  ──────────────────────────────  │
        │  Request & Payload Inspector     │
        │  Capability Support Matrix       │
        │  Integration Event Audit Trail   │
        └──────────────────────────────────┘
```

---

## 3. PCC Provider Abstraction

All data access is mediated through the `IPCCProvider` interface (`pcc/providers/types.ts`), isolating the application core from the underlying EHR data source:

```typescript
export interface IPCCProvider {
  readonly id: string;
  readonly name: string;
  readonly mode: 'SYNTHETIC' | 'REAL_SANDBOX' | 'REAL_PRODUCTION';

  getConnectionStatus(): Promise<PCCConnectionStatusReport>;
  getCapabilities(): PCCCapabilities;
  getPatient(patientId: string): Promise<CanonicalResident | null>;
  searchPatients(query: PCCPatientSearchQuery): Promise<CanonicalResident[]>;
  getConditions(patientId: string): Promise<CanonicalDiagnosis[]>;
  getCoverage(patientId: string): Promise<CanonicalInsurance[]>;
}
```

The application switches providers dynamically based on verified configuration without altering any downstream workflow code.

---

## 4. Synthetic Demo Mode (Current Demo)

The application currently operates with `SyntheticPCCProvider` as the active provider:
- **Zero External Dependencies:** Runs entirely self-contained without requiring third-party network access or vendor credentials.
- **Realistic Skilled Nursing Roster:** Seeds a cohort of fictional residents with geriatric clinical profiles (mobility deficits, pressure injuries, respiratory conditions).
- **Inspectable Traces:** Every synthetic query and evaluation generates detailed audit records labeled with `SOURCE: SYNTHETIC` in the Request Inspector.
- **Deterministic State Reset:** Users can reset data back to baseline at any moment via the UI or `/api/reset`.

---

## 5. Real PCC Provider Boundary (Future Integration)

`RealPCCProvider` (`pcc/providers/real-pcc-provider.ts`) is an architectural skeleton and boundary layer:
- **Safe Initialization:** If instantiated without complete, verified credentials, it immediately throws a structured `IntegrationError('PCC_CLIENT_ERROR')` and reports `CONFIGURED_NOT_VERIFIED` or `NOT_CONFIGURED`.
- **Placeholder Endpoints:** Uses explicitly non-routable placeholder domains (`https://example.invalid/pcc-sandbox`) to prevent misleading developers into treating unverified URLs as official PCC endpoints.
- **Contract Boundary:** Defines the exact locations where token acquisition, FHIR R4 resource parsing, and pagination would connect once official developer partner credentials and documentation are acquired.

---

## 6. Canonical Data Model

Downstream business logic never touches raw EHR JSON. The integration adapter transforms vendor payloads into validated TypeScript interfaces (`integration/types.ts`):

- **`CanonicalResident`:** Patient demographic identity, facility scope, room, and bed assignment. Optional fields remain empty if omitted by the EHR rather than fabricating defaults.
- **`CanonicalDiagnosis`:** Clinical condition with ICD-10 code, description, and status. Codes are preserved without manufactured fallbacks.
- **`CanonicalInsurance`:** Separate tracking of EHR coverage status (`coverageStatus: 'active' | 'cancelled' | 'draft'`) and third-party eligibility verification (`eligibilityVerified: boolean`). FHIR active status is never conflated with verified eligibility.

---

## 7. ADT Event Processing

The ADT pipeline (`integration/adt-processing/index.ts`) handles event messages:

1. **Proprietary Webhook Normalization:** `PCCExternalEventAdapter` unpacks vendor-specific webhook envelopes and maps event types to canonical ADT actions.
2. **Event Validation:** Ensures tenant ID, patient identifiers, and event-specific fields (e.g., target room for transfers) are present.
3. **ADT Actions:**
   - **`ADMISSION` (A01):** Activates resident record, establishes initial facility and bed assignment.
   - **`TRANSFER` (A02):** Reassigns room and bed location; automatically flags active DME orders associated with the resident for location verification.
   - **`DISCHARGE` (A03):** Transitions resident to discharged status and updates room occupancy.
4. **Idempotency:** Replay protection guards against duplicate webhook delivery.

---

## 8. DME Workflow

Downstream medical equipment management demonstrates operational EHR event reactivity:
- **Heuristic Indications:** Evaluates resident diagnoses against safe demonstration rules (e.g., mobility impairments trigger wheelchair or walker suggestions; stage 3/4 ulcers trigger alternating pressure mattresses).
- **Order Lifecycle:** Orders move through `SUBMITTED`, `IN_REVIEW`, `DISPATCHED`, `DELIVERED`, and `COMPLETED`.
- **ADT Coordination:** Bed transfer events link directly to DME orders, showing how real-time census tracking prevents equipment delivery to incorrect rooms.

---

## 9. Capability Status Model

To preserve absolute technical credibility, capabilities are categorized across five explicit statuses:

| Status Concept | Definition | Current Demo State |
| :--- | :--- | :--- |
| **`VERIFIED_AGAINST_PCC`** | Tested and validated against an active, legitimate PointClickCare environment. | **None** (Live verification has not been performed). |
| **`DOCUMENTED_SUPPORTED`** | Architecture supports the standard FHIR pattern. Availability, endpoints, scopes, and enabled resources must be confirmed against official PCC documentation. | Demographics, Search, Conditions, Coverage. |
| **`NOT_VERIFIED`** | Feasible in healthcare standards, but specific SNF codes or extensions require partner documentation. | Clinical Documents, Real-time Bed Census. |
| **`REQUIRES_PCC_PARTNER_ACCESS`** | Blocked without formal PointClickCare Developer Marketplace / Partner enrollment. | Real-Time Webhook Push, Order Write-Back, Org Rosters. |
| **`SYNTHETIC_ONLY`** | Designed exclusively for the local interactive simulator and test harness. | ADT Event Trigger Simulator. |

**Application Status Indicator:**  
`Live PCC Verification: NOT PERFORMED`

---

## 10. Security / Data Handling

- **No Real PHI:** All resident records, MRNs, diagnosis profiles, dates of birth, and insurer names are completely synthetic.
- **Secrets Management:** Credentials must only be provided via environment variables (`process.env`) on the server side. Never committed to version control.
- **No Token Logging:** Access tokens, client secrets, and sensitive authorization headers are excluded from client bundles and server logs.
- **Sanitized Inspector:** The Request Inspector displays sanitized metadata summaries and mock traces; it never exposes private API keys.
- **Compliance Disclaimer:** This demonstration does not claim HIPAA certification or production EHR security compliance. Production deployment against live healthcare environments requires full HIPAA BAA execution, audit logging, data-at-rest encryption, and vendor certification.

---

## 11. Local Development

### Prerequisites
- Node.js 20+
- npm or pnpm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/pcc-integration-demo.git
cd pcc-integration-demo

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 12. Environment Variables

Create a `.env.local` file for optional overrides. **No environment variables are required for the default synthetic deployment.**

See `.env.example`:
```bash
# Optional PointClickCare Credentials (Leave blank for default Synthetic mode)
PCC_BASE_URL=
PCC_TENANT_ID=
PCC_CLIENT_ID=
PCC_CLIENT_SECRET=
PCC_AUTH_MODE=client_credentials
PCC_INTEGRATION_MODE=synthetic
```

If these variables are omitted, the application automatically boots into **Synthetic Demo Mode** with full functionality.

---

## 13. Testing

The project includes an automated test suite verifying architectural boundaries, FHIR mappings, error classifications, configuration state-machines, and demographic data integrity:

```bash
# Run unit and integration tests
npm test

# Run ESLint validation
npm run lint

# Run type check and Next.js build
npm run build
```

---

## 14. Deployment

### Vercel Deployment
1. Import the repository into your Vercel dashboard.
2. Framework Preset: **Next.js**.
3. Build Command: `npm run build` (or leave default).
4. Output Directory: Leave default (`.next`).
5. Environment Variables: None required for default synthetic demonstration mode.
6. Click **Deploy**.

All dynamic API routes specify `export const dynamic = 'force-dynamic'` to run cleanly as serverless functions.

---

## 15. Important Limitations

1. **Synthetic Only:** The deployed demo uses synthetic data. No connection to PointClickCare is established or implied.
2. **Live PCC Verification Not Performed:** Neither the application nor its authors claim live test verification against a PointClickCare instance.
3. **Illustrative Details:** Endpoint paths, scopes, and webhook schemas in documentation are illustrative representations of FHIR patterns, not confirmed PCC specifications.
4. **Clean-Room Codebase:** This repository does not contain proprietary source code or production artifacts from previous client projects.
5. **No Commercial Warranty:** Provided for architectural education and technical demonstration purposes only.
