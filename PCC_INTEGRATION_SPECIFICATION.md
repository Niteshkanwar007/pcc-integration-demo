# PointClickCare (PCC) Integration Specification
**Document Version:** 1.0.0  
**Status:** Pre-Implementation Architectural Specification & Capability Analysis  
**Target Application:** PCC Integration Console & DME Workflow Engine  
**Classification:** Technical Architecture Review (Sanitized Demo to Real Integration Mapping)

---

## 1. Executive Summary & Purpose

This specification defines the formal architectural blueprint mapping our current **Synthetic PCC Adapter** to a future production-grade **PointClickCare (PCC) Integration**. 

PointClickCare is the primary Electronic Health Record (EHR) utilized across Senior Care, Skilled Nursing Facilities (SNFs), Long-Term Care (LTC), and Assisted Living. While public FHIR specifications (under ONC 21st Century Cures Act guidelines) define read-access standards for specific US Core data sets (e.g., Patient, Condition, Coverage), long-term post-acute care (LTPAC) workflows—specifically real-time bed movement (ADT events), room/bed census tracking, and equipment/supply order management—frequently require **PCC Developer Partner Marketplace Access**, specialized Webhook/Event subscriptions, or HL7 v2/v3 feeds.

The objective of this specification is to:
1. Provide an exhaustive capability-by-capability analysis of all 17 required integration domains.
2. Establish a clear, honest boundary between **SUPPORTED / VERIFIED**, **NOT VERIFIED**, **REQUIRES PCC PARTNER ACCESS**, and **SYNTHETIC ONLY** capabilities.
3. Prevent invalid architectural assumptions (such as assuming public FHIR sandboxes provide real-time ADT webhooks or bidirectional DME ordering).
4. Review our existing codebase abstractions (`IPCCAuthenticator`, `IPCCClient`, `PCCResident`, `PCCFacility`, `PCCDiagnosis`, `PCCADTEventPayload`, `ResidentSyncService`, and `ADTProcessor`) to confirm whether they provide a clean, plug-and-play boundary for a future `RealPCCClient`.

---

## 2. Capability Analysis Matrix

> **IMPORTANT ARCHITECTURAL NOTICE:**
> Exact PointClickCare endpoint paths, OAuth scopes, webhook contracts, signing mechanisms, rate limits, and proprietary API schemas must be taken from the applicable PointClickCare developer documentation or partner environment before implementation. All paths, scope names, and event names cited below are illustrative architectural patterns, not confirmed PCC implementation facts.

### Status Legend
- **DOCUMENTED / SUPPORTED:** Documented in standard public PCC FHIR R4 / US Core APIs or standard OAuth2 specifications (not live-tested in this demo).
- **NOT VERIFIED:** Feasible in enterprise EHR integrations, but exact endpoint syntax, payload shape, or field availability requires PCC developer portal documentation confirmation.
- **REQUIRES PCC PARTNER ACCESS:** Proprietary PCC Connect/Marketplace APIs, Webhook/Event Engine subscriptions, or direct ordering workflows requiring certified partner status, business associate agreement (BAA), and vendor NDA.
- **SYNTHETIC ONLY:** Client-side simulations, instant demo triggers, or heuristic scoring engines that exist solely for workflow demonstrations.

---

### Detailed Capability Analysis Table

*All endpoint paths, OAuth scopes, webhook names, and rate limits listed below are **ILLUSTRATIVE ONLY / REQUIRES PCC DOCUMENTATION**.*

| # | Capability | Current Synthetic Implementation | PCC Capability Required | Expected PCC Resource / API Category (Illustrative) | Authentication Requirement (Illustrative) | Data Required (Request) | Data Returned (Response) | Mapping into Canonical Model | Unknown / Requires PCC Dev Docs | Implementation Notes | Capability Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Resident / Patient Lookup** | In-memory query via `SyntheticPCCClient.getPatient(idOrMrn)` and `searchPatients()` filtering static seed arrays. | REST/FHIR Patient Search and Read by ID or identifier. | `GET /Patient/{id}` or `GET /Patient?identifier={mrn}` (FHIR R4 standard read; illustrative endpoint path / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient internal PCC ID, MRN, or facility ID filter. | Demographic records: Name, DOB, Gender, Status, Identifiers, Contact. | Mapped via `PCCDataMapper.toCanonicalResident` into `CanonicalResident` (`fullName`, `dateOfBirth`, `gender`, `mrn`). | Exact FHIR vs proprietary PCC REST response format; pagination cursor mechanism (`next` links vs offset/limit). | Public FHIR supports standard `Patient` resource. LTPAC extensions often contain census status. | **DOCUMENTED / SUPPORTED** (FHIR Patient) |
| **2** | **MRN (Medical Record Number)** | `mrn` string property on `PCCResident` (e.g. `MRN-44912`). | Patient Identifier mapping with System identifier for MRN vs PCC internal ID. | FHIR `Patient.identifier[]` with `type.coding.code="MR"` and specific facility namespace URI (Illustrative pattern / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient query parameter or returned resource. | Array of identifiers (`system`, `value`, `use`). | Identifiers array parsed to isolate `value` where identifier type is MRN, setting `CanonicalResident.mrn`. | The exact `system` URI PCC uses for facility MRNs vs enterprise MPIs. | Some SNF chains have facility-local MRNs vs enterprise-wide master patient IDs (MPI). | **DOCUMENTED / SUPPORTED** |
| **3** | **Facility / Organization** | Static array of 3 mock facilities (`FAC-101`, `FAC-102`, `FAC-103`) with capacity and timezone. | Facility / Location hierarchy querying. | `GET /Organization` or `GET /Location` or PCC proprietary `GET /facilities` (Illustrative only / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Org UUID or partner client credential context. | Organization list with PCC facility IDs, legal names, NPI, addresses, time zones. | Mapped to `PCCFacility` and referenced by `CanonicalResident.facilityId` and `facilityName`. | Whether `GET /facilities` is available in public FHIR or requires PCC Partner Connect API with Org-level grants. | Multi-facility SNF chains require facility-level filtering on every query. | **REQUIRES PCC PARTNER ACCESS** (Proprietary facility roster) |
| **4** | **Room & Location Tracking** | Hardcoded `roomNumber` ("104-B") and `bedDescription` ("Bed 104-B") on `PCCResident`. | Current bed/room census location. | FHIR `Encounter.location` or PCC proprietary Census API (`/residents/{id}/census` or `/beds` - illustrative only / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient ID or Facility Census ID. | Location reference, Room identifier, Bed identifier, Unit/Wing name. | Mapped to `CanonicalResident.room` and `CanonicalResident.bed`. | Public FHIR `Patient` rarely includes real-time room/bed; usually lives in `Encounter` or proprietary census endpoint. | Crucial for DME delivery logistics. Must determine if bed is in `Encounter` or dedicated census endpoint. | **NOT VERIFIED** (FHIR lacks direct real-time bed field on Patient) |
| **5** | **Admission Event (ADT A01)** | `simulateADTEvent()` with `eventType: 'ADMISSION'` adds resident to active roster. | Inbound notification of new admission or re-admission to SNF. | PCC Webhook Event Engine (Event: `Resident.Admitted` - illustrative naming only / requires PCC partner docs) or HL7 v2 A01 feed via MLLP/VPN. | Webhook HMAC-SHA256 signature verification or mutual TLS (mTLS) for HL7 feeds (Illustrative signing mechanism / requires PCC documentation). | Webhook event payload containing patient ID, facility ID, admission timestamp, admitting diagnosis. | Webhook HTTP 200/202 ACK; or HL7 MSA ACK message. | Triggers `ADTProcessor.processADTEvent`, creates/updates `CanonicalResident` with `status: 'ADMITTED'`. | **Public FHIR Sandbox does NOT provide real-time ADT Webhooks.** Requires PCC Developer Partner Webhook enrollment. | Our production experience confirms PCC operates webhook/event notifications for certified partners, but sandbox lacks this. | **REQUIRES PCC PARTNER ACCESS** |
| **6** | **Transfer Event (ADT A02)** | `simulateADTEvent()` with `eventType: 'TRANSFER'`, updates room/bed in-memory. | Inbound notification of room/bed/unit change within facility or between units. | PCC Webhook Event Engine (`Resident.RoomChanged` or `BedTransfer` - illustrative naming only / requires PCC partner docs) or HL7 v2 A02. | Webhook HMAC-SHA256 signature verification or API secret in headers (Illustrative / requires PCC documentation). | Payload with `mrn`, `facId`, `targetRoom`, `targetBed`, effective timestamp. | HTTP 200/202 acknowledgment. | Updates `CanonicalResident.room` and `CanonicalResident.bed`, logs audit event `ADT_TRANSFER`. | Exact payload schema for bed transfers in PCC's event API; notification latency SLA (sub-second vs batch). | Crucial for equipment retrieval/relocation (e.g. resident moves from Rehab to Long-Term wing). | **REQUIRES PCC PARTNER ACCESS** |
| **7** | **Discharge Event (ADT A03)** | `simulateADTEvent()` with `eventType: 'DISCHARGE'`, sets status to `DISCHARGED` and records date. | Inbound notification of resident discharge, transfer to acute hospital, or AMA. | PCC Webhook Event Engine (`Resident.Discharged` - illustrative naming only / requires PCC partner docs) or HL7 v2 A03. | Webhook HMAC signature or secure HTTPS listener (Illustrative / requires PCC documentation). | Payload with `mrn`, discharge timestamp, discharge disposition code, destination. | HTTP 200/202 acknowledgment. | Sets `CanonicalResident.status = 'DISCHARGED'`, marks `dischargeDate`, triggers DME pickup recommendation. | Discharge disposition codes mapping (e.g. SNF to home vs SNF to acute emergency). | Signals immediate DME equipment pickup/return to prevent unnecessary monthly rental billing. | **REQUIRES PCC PARTNER ACCESS** |
| **8** | **Diagnoses & ICD-10 Coding** | Static diagnoses array on resident with `code`, `description`, `classification`, `rank`. | Retrieval of active medical diagnoses, onset dates, and billing rank. | FHIR `GET /Condition?patient={id}&clinical-status=active` (FHIR R4; illustrative path / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient internal PCC ID or MRN. | FHIR Condition Bundle containing `code.coding[]` (ICD-10-CM), `category`, `clinicalStatus`, `recordedDate`. | Mapped to `CanonicalResident.activeDiagnoses` (`icd10`, `description`, `isPrimary`, `onsetDate`). | Whether ICD-10 ranking (Primary vs Secondary vs Admitting) is stored in FHIR extension or category code. | ICD-10 codes drive the automated clinical equipment recommendation engine (e.g., L89 -> Pressure Relief Mattress). | **DOCUMENTED / SUPPORTED** (FHIR Condition) |
| **9** | **Insurance & Coverage** | Static primary insurance object on resident (`payerName`, `payerType`, `isVerified: false`). | Primary, secondary, and tertiary payer coverage details. | FHIR `GET /Coverage?patient={id}` (FHIR R4; illustrative path / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient ID. | FHIR Coverage Bundle: `payor.display`, `type`, `subscriberId`, `period`, `relationship`. | Mapped to `CanonicalResident.primaryInsurance` (`payerName`, `payerType`, `coverageStatus`, `eligibilityVerified: false`). | SNF billing complexity: Part A Medicare vs Managed Care vs Medicare Advantage prior authorization rules. Active coverage does not equal verified eligibility. | DME coverage criteria differ fundamentally between Medicare Fee-For-Service and Managed Care Advantage. | **DOCUMENTED / SUPPORTED** (FHIR Coverage schema) |
| **10** | **Clinical Documentation** | Simulated progress notes and clinical indications linked to equipment recommendations. | Retrieval of nursing notes, PT/OT functional mobility assessments, MDS 3.0 records. | FHIR `GET /DocumentReference?patient={id}` or `GET /DiagnosticReport` or PCC Clinical API (Illustrative only / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Patient ID, date range, document category (e.g., Physical Therapy evaluation). | DocumentReference bundle containing attachment metadata (MIME types, base64 or URL). | Extracted to support Medical Necessity Documentation for DME orders (e.g. Stage IV ulcer staging notes). | Availability of structured MDS (Minimum Data Set) Section GG mobility data via standard FHIR. | In real DME workflows, payers require mobility evaluation notes to justify specialized wheelchairs/beds. | **NOT VERIFIED** (Requires PCC API doc confirmation on note types) |
| **11** | **Equipment & Medical Orders** | In-memory `DMEOrder` model (`orderId`, `equipmentType`, `hcpcsCode`, `status`, `deliveryInstructions`). | Ingestion of physician supply orders or writing back DME order status to PCC EHR. | PCC Partner Order API (Proprietary) or HL7 v2 ORM/OMG order interface (Illustrative only / requires PCC partner documentation). | OAuth 2.0 Partner credentials with write scope or HL7 engine access (Illustrative / requires PCC partner docs). | Order payload: HCPCS code, equipment description, prescriber NPI, diagnosis code, facility ID. | PCC Order ID, entry confirmation, electronic signature status. | Bridges `DMEOrder` to PCC EHR order record and tracks dispatch/delivery milestones. | **Public FHIR does NOT support proprietary order write-back to PCC.** PCC does not allow open write access without certification. | Most DME suppliers operate outside PCC as an integrated portal, sending delivery confirmations via PDF/fax or Partner API. | **REQUIRES PCC PARTNER ACCESS** |
| **12** | **Authentication & Authorization** | `SyntheticPCCAuthenticator` emulating OAuth2 Bearer token generation and token refresh. | SMART on FHIR OAuth 2.0 / Client Credentials Grant or Authorization Code Grant. | PCC OAuth2 Authorization Server (`/oauth/token` or `/connect/token` - illustrative endpoint path / requires PCC documentation). | Basic auth with Client ID + Client Secret, or asymmetric private_key_jwt (Illustrative / requires PCC documentation). | `grant_type=client_credentials`, `client_id`, `client_secret`, `scope`. | JSON: `access_token`, `token_type: "Bearer"`, `expires_in`, `scope`. | Injected into HTTP client headers: `Authorization: Bearer <token>`. | Exact token expiration duration (typically 3600s); whether multi-tenant requires separate Org tokens or single Master token. | Must support automated token refresh with jitter and thread-safe token caching before expiry. | **DOCUMENTED / SUPPORTED** (Standard OAuth2 protocol) |
| **13** | **Webhook / Event Delivery** | Simulated button clicks dispatching mock ADT payloads via `/api/adt/simulate`. | Real-time push notification of census movements and clinical events. | PointClickCare Webhook Engine / Event Hub (Illustrative only / requires PCC partner documentation). | HTTPS webhook receiver with cryptographic signature (HMAC-SHA256) validation in header (Illustrative / requires PCC documentation). | Inbound HTTPS POST from PCC IP addresses with JSON envelope. | HTTP 200 OK within 2000ms SLA. | Validated by `PCCEventParser` and routed to `ADTProcessor`. | Event retry schedule (exponential backoff vs dead-letter queue); payload structure; webhook registration UI/API. | Production systems must enqueue raw webhooks to SQS/Redis before processing to prevent timeouts. | **REQUIRES PCC PARTNER ACCESS** |
| **14** | **Polling & Census Reconciliation** | Triggered via "Sync Patients" button (`ResidentSyncService.synchronizeAll()`). | Scheduled delta synchronization to reconcile missed webhooks or off-line drift. | FHIR `GET /Patient?_lastUpdated=gt{timestamp}` or PCC REST `/residents?modifiedSince={timestamp}` (Illustrative only / requires PCC documentation). | OAuth 2.0 Bearer Token (Scope names illustrative only / requires PCC documentation). | Timestamp watermark (`lastSyncTimestamp`), facility filter, pagination cursor. | Delta bundle of resident records modified since watermark. | Iterates and calls `store.saveResident()`, updating existing records or flagging discrepancies. | Whether PCC supports FHIR `_lastUpdated` filtering reliably across all tenant databases. | Reconciliation runs on a cron schedule (e.g. nightly at 02:00) to ensure local database matches EHR census. | **DOCUMENTED / SUPPORTED** (Conceptually supported; endpoint syntax needs docs) |
| **15** | **Error Handling & Resilience** | Custom `IntegrationError` with HTTP status codes and audit logging to in-memory event store. | Standardized EHR error handling (400, 401, 403, 404, 429, 500, 503). | HTTP status codes + FHIR `OperationOutcome` resource. | N/A (Response from API). | HTTP response payload. | FHIR `OperationOutcome` with `issue.severity`, `issue.code`, `issue.diagnostics`. | Parsed into `IntegrationError`, captured in `EventLogTable` with audit timestamp and payload context. | Exact OperationOutcome schema nuances returned by PCC backend systems. | Must implement automatic retry for 503 Service Unavailable and 429 Too Many Requests with exponential backoff. | **DOCUMENTED / SUPPORTED** (Standard HTTP & FHIR practice) |
| **16** | **Rate Limiting & Throttling** | Simulated artificial latency (22ms) without real rate limiting. | Adherence to PCC API rate limits and concurrency caps. | HTTP 429 Too Many Requests response with `Retry-After` header (Illustrative rate limits: 50 req/sec - exact quotas illustrative only / requires PCC documentation). | N/A. | Incurred when client exceeds rate threshold. | HTTP 429 header: `Retry-After: <seconds>`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`. | Client interceptor queues request and delays execution until `Retry-After` elapses. | Exact rate limits per tier (public FHIR sandbox vs enterprise partner production gateway). | Token-bucket or leaky-bucket algorithm required in client HTTP transport layer to prevent 429 errors. | **NOT VERIFIED** (PCC limits published only in developer portal) |
| **17** | **Multi-Facility & Tenant Mapping** | Hardcoded `facId` mapping in seed data across 3 simulated SNFs. | Enterprise tenant partitioning across multi-site SNF operating companies. | PCC Enterprise Organization hierarchy (`orgUuid` + `facilityId` - illustrative only / requires PCC documentation). | Enterprise OAuth scope granting multi-facility permissions (Scope names illustrative only / requires PCC documentation). | Header or query parameter: `X-Facility-ID` or `?facilityId={id}` or distinct org-level bearer tokens. | Facility-scoped patient and clinical data. | `CanonicalResident.facilityId` partitioned in multi-tenant data store; role-based facility filtering in UI. | Whether single API credentials access all facilities under a parent provider group or require per-facility authorization. | In SNF chains, nurses and administrators operate at specific facility scopes; corporate executives see all. | **REQUIRES PCC PARTNER ACCESS** (Enterprise credential model) |

---

## 3. Review of Existing Codebase Interfaces & Abstractions

We conducted an architectural audit of our current TypeScript abstractions to assess whether they provide an appropriate boundary for plugging in a real PCC implementation:

### 3.1. `IPCCAuthenticator` (`/pcc/authentication/index.ts`)
```typescript
export interface IPCCAuthenticator {
  getAccessToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isAuthenticated(): boolean;
  getAuthStatus(): {
    authenticated: boolean;
    environment: string;
    expiresAt?: string;
    scope?: string;
  };
}
```
- **Evaluation:** **EXCELLENT / PRODUCTION READY.**
- **Rationale:** The interface cleanly abstracts token generation and renewal. It does not dictate whether tokens are generated synthetically, via client credentials grant, or via authorization code. A future `RealPCCAuthenticator` will implement this exact contract using `fetch()` against PCC's OAuth2 token endpoint.

### 3.2. `IPCCClient` (`/pcc/client/index.ts`)
```typescript
export interface IPCCClient {
  getPatient(patientIdOrMrn: string): Promise<PCCResident | null>;
  searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]>;
  getFacilities(): Promise<PCCFacility[]>;
  getDiagnosesForPatient(patientId: string): Promise<PCCDiagnosis[]>;
  ping(): Promise<PCCConnectionHealth>;
  simulateADTEvent(event: PCCADTEventPayload): Promise<{ success: boolean; eventId: string; timestamp: string }>;
  getAuthenticator(): IPCCAuthenticator;
}
```
- **Evaluation:** **GOOD ABSTRACTION, NEEDS MINOR REFINEMENT FOR PRODUCTION.**
- **Analysis:**
  - `getPatient()`, `searchPatients()`, `getFacilities()`, `getDiagnosesForPatient()`, and `ping()` cleanly represent EHR query operations.
  - **Refinement Required:** `simulateADTEvent()` belongs strictly to testing/demo environments. In a production `RealPCCClient`, outbound simulation does not exist—ADT events arrive via inbound webhook or message queue. We should separate `simulateADTEvent()` into an optional `ISimulatedPCCClient` extension interface so that `RealPCCClient` is not forced to implement dummy simulation methods.

### 3.3. `PCCResident`, `PCCFacility`, `PCCDiagnosis` (`/pcc/types.ts`)
- **Evaluation:** **APPROPRIATE AS SANITIZED EHR DTOs.**
- **Analysis:**
  - These interfaces represent the data as received from the EHR before canonical mapping.
  - In a real implementation with FHIR R4, an intermediate parser (`FHIRPatientToPCCResident`) will transform raw FHIR JSON bundles (`resourceType: "Patient"`) into our standardized `PCCResident` DTO, which is then mapped into `CanonicalResident`.
  - This two-stage transformation decouples our internal DME workflow from whether PCC returns FHIR R4 or proprietary PCC REST JSON.

### 3.4. `PCCADTEventPayload` & `IPCCEventParser` (`/pcc/types.ts`, `/pcc/event-processing/index.ts`)
- **Evaluation:** **SOUND INGESTION CONTRACT.**
- **Analysis:**
  - `PCCADTEventPayload` captures the universal core of an ADT message (event type, patient identifier, facility, room/bed movement, timestamp, diagnoses).
  - A real webhook receiver will need an adapter function (`PCCWebhookPayloadToADTEvent`) to parse PCC's specific webhook envelope and extract this payload.

### 3.5. `ResidentSyncService` & `ADTProcessor` (`/integration/`)
- **Evaluation:** **EXCELLENT DOMAIN BOUNDARY.**
- **Analysis:**
  - Neither service touches raw HTTP or vendor-specific headers; they interact exclusively with `IPCCClient` and `PCCDataMapper`.
  - `ResidentSyncService` coordinates reconciliation.
  - `ADTProcessor` coordinates movement logic, updating local canonical records and dispatching audit events.
  - **Verdict:** Zero rewrite of `ResidentSyncService` or `ADTProcessor` will be necessary when moving to a real PCC connection.

---

## 4. Architectural Classifications & Findings

### A. Documented / Supported Capabilities (Public FHIR / Standard OAuth)
The architecture supports the corresponding standard FHIR resource patterns (HL7 FHIR R4 / US Core / SMART on FHIR OAuth2). However, standard FHIR or US Core compatibility alone does not prove that PointClickCare exposes, licenses, or enables a given capability. Availability, endpoint access, scopes, and enabled resources through the applicable PointClickCare integration must be confirmed against the relevant PointClickCare developer documentation and configured environment. (Live PCC Verification: NOT PERFORMED).

The following capabilities follow this pattern:
1. **OAuth 2.0 Client Authentication:** Standard Bearer token authentication via token endpoints. Specific authorization servers and client grant scopes must be confirmed against PointClickCare developer documentation.
2. **Patient Demographics Lookup & Search:** Architecture supports the standard FHIR `Patient` resource pattern and search parameters. Resource availability and search filter support in PCC must be verified.
3. **Medical Diagnoses Ingestion:** Architecture supports standard FHIR `Condition` resource queries. Active clinical status mappings and ICD-10 codings must be verified against PCC tenant configurations.
4. **Insurance Payer Data:** Architecture supports standard FHIR `Coverage` resource ingestion. Eligibility verification requires clearinghouse integration and cannot be inferred from FHIR coverage status alone.
5. **Basic Reconciliation Polling:** Architecture supports delta polling using `_lastUpdated` parameters, subject to PCC API gateway rate limits.

### B. Capabilities Requiring PCC Partner / Developer Access
These capabilities cannot be verified or executed through open public FHIR sandboxes without formal PointClickCare Developer Marketplace / Partner enrollment:
1. **Real-time ADT Webhook Notifications:** Inbound instant push notifications for Admissions, Room Transfers, and Discharges.
2. **Facility-Level Census & Room/Bed Tracking:** Real-time bed-level census queries that reflect room-to-room moves within skilled nursing wings.
3. **Multi-Facility Enterprise Tenant Provisioning:** Org-level UUID authorization across multi-site SNF chains.
4. **Direct DME / Supply Order Injection:** Writing back equipment orders or clinical requisitions into the resident's EHR record.
5. **Webhooks Verification Secret & Event Subscriptions:** Subscribing to specific tenant event streams and verifying HMAC signatures.

### C. Capabilities That Should Remain Simulated in This Demo
To maintain strict technical credibility while delivering a comprehensive demonstration, the following capabilities remain simulated in this application:
1. **ADT Simulator Modal:** The interactive trigger allowing users to fire on-demand Admissions, Bed Transfers, and Discharges to demonstrate real-time workflow reactivity.
2. **In-Memory Seed Roster:** The realistic synthetic cohort of elderly SNF residents with authentic ICD-10 clinical diagnoses and room assignments.
3. **Simulated Processing Latency:** The realistic response times (22ms to 45ms) reported across API calls.
4. **DME Order Dispatch & Delivery Tracking:** Equipment order creation, approval, and dispatching, which connect downstream to DME suppliers rather than PCC directly.

---

## 5. Recommended `RealPCCClient` Architecture

When transitioning from the synthetic client to a live integration, the implementation should adhere to this architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PointClickCare Platform                         │
│  ┌───────────────────────┐                 ┌─────────────────────────┐ │
│  │   PCC Developer API   │                 │   PCC Event / Webhook   │ │
│  │     (FHIR / REST)     │                 │         Engine          │ │
│  └───────────▲───────────┘                 └────────────┬────────────┘ │
└──────────────┼──────────────────────────────────────────┼──────────────┘
               │ HTTPS (Bearer Token)                     │ Inbound Webhook
               │                                          │ (HMAC Signature)
┌──────────────┼──────────────────────────────────────────┼──────────────┐
│  PCC Layer   │                                          ▼              │
│  ┌───────────┴──────────┐                  ┌─────────────────────────┐ │
│  │    RealPCCClient     │                  │   PCCExternalEventAdapter│ │
│  │ (implements          │                  │ (validates HMAC, parses │ │
│  │  IPCCClient)         │                  │  inbound JSON envelope) │ │
│  └───────────┬──────────┘                  └────────────┬────────────┘ │
│              │ DTOs (PCCResident, PCCDiagnosis)         │ PCCADTEvent  │
└──────────────┼──────────────────────────────────────────┼──────────────┘
               │                                          │
┌──────────────┼──────────────────────────────────────────┼──────────────┐
│ Integration  ▼                                          ▼              │
│  ┌──────────────────────┐                  ┌─────────────────────────┐ │
│  │    PCCDataMapper     │                  │      ADTProcessor       │ │
│  │ (converts to         │                  │ (updates census, logs   │ │
│  │  CanonicalResident)  │                  │  audit trail)           │ │
│  └───────────┬──────────┘                  └────────────┬────────────┘ │
│              │                                          │              │
│              ▼                                          ▼              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Canonical Resident Store                      │ │
│  └───────────────────────────────────┬───────────────────────────────┘ │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼─────────────────────────────────┐
│ DME Workflow Engine                  ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │        Clinical Rules Engine -> DME Order Creation & Track        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles:
1. **Zero Rewrite of Business Logic:** The `CanonicalResident` model, the clinical equipment recommendation engine, and the DME order tracking components interact strictly with `IPCCClient` and `ADTProcessor`.
2. **Provider Factory Pattern:** A runtime factory inspects environment variables (`PCC_INTEGRATION_MODE=real` vs `PCC_INTEGRATION_MODE=synthetic`):
   ```typescript
   export function createPCCClient(): IPCCClient {
     if (process.env.PCC_INTEGRATION_MODE === 'real') {
       const auth = new RealPCCAuthenticator({
         clientId: process.env.PCC_CLIENT_ID!,
         clientSecret: process.env.PCC_CLIENT_SECRET!,
         tokenEndpoint: process.env.PCC_TOKEN_ENDPOINT!,
         environment: process.env.PCC_ENVIRONMENT as 'sandbox' | 'production',
       });
       return new RealPCCClient(auth, process.env.PCC_BASE_API_URL!);
     }
     return new SyntheticPCCClient();
   }
   ```
3. **Resilience & Rate Limiting:** `RealPCCClient` wraps a centralized HTTP transport configured with:
   - Exponential backoff retry on HTTP 429 and 503 errors.
   - Circuit breaker pattern to prevent cascading failures if PCC experiences service degradation.
   - Dedicated token caching with 5-minute pre-expiry proactive renewal.

---

## 6. Exact Information & Credentials Required from PointClickCare Before Implementation

> **CRITICAL REQUIREMENT:**
> Exact PointClickCare endpoint paths, OAuth scopes, webhook contracts, signing mechanisms, rate limits, and proprietary API schemas must be taken from the applicable PointClickCare developer documentation or partner environment before implementation.

Before writing any real PCC client code, the following credentials, configurations, and technical specifications must be obtained through the official PointClickCare Developer Program:

1. **OAuth 2.0 Credentials:**
   - Client ID (`client_id`)
   - Client Secret (`client_secret`)
   - Token Endpoint URL (`PCC_TOKEN_ENDPOINT`, e.g., `https://example.invalid/oauth/token`)
   - Authorized Scopes list (Exact scope names must be obtained from PCC developer documentation)
2. **Environment Base URLs:**
   - Certified Sandbox API Base URL (`PCC_SANDBOX_BASE_URL`)
   - Production API Gateway URL
3. **Organization & Facility Identifiers:**
   - Test Organization UUID (`orgUuid`)
   - Facility IDs (`facId`) authorized for the developer account
4. **Webhook & Event Engine Specifications:**
   - Webhook registration portal or administrative setup guide
   - Webhook signing secret / public key for HMAC signature verification
   - Detailed JSON schemas for admission, transfer, and discharge events
   - Inbound webhook retry policies and IP address whitelist for firewall configuration
5. **Rate Limiting Guidelines:**
   - Maximum requests per second (RPS) per client
   - Concurrency limits per facility
   - Rate limit header specifications (`X-RateLimit-*` or standard `Retry-After`)

---

## 7. Recommended Interface Refinements

Based on this review, we recommend two non-breaking refinements to our current interfaces when preparing for the live adapter:

1. **Decouple Simulation from `IPCCClient`:**
   - Split `simulateADTEvent()` into an optional child interface:
     ```typescript
     export interface IPCCClient {
       getPatient(patientIdOrMrn: string): Promise<PCCResident | null>;
       searchPatients(filter?: PCCClientSearchFilter): Promise<PCCResident[]>;
       getFacilities(): Promise<PCCFacility[]>;
       getDiagnosesForPatient(patientId: string): Promise<PCCDiagnosis[]>;
       ping(): Promise<PCCConnectionHealth>;
       getAuthenticator(): IPCCAuthenticator;
     }

     export interface ISimulatedPCCClient extends IPCCClient {
       simulateADTEvent(event: PCCADTEventPayload): Promise<{ success: boolean; eventId: string; timestamp: string }>;
     }
     ```
   - This ensures `RealPCCClient` does not have to throw `NotImplementedError` or stub out a simulation method.

2. **Add `PCCWebhookEventEnvelope` Type:**
   - Introduce a raw webhook envelope type (`PCCWebhookEventEnvelope`) to represent the outer wrapper delivered by PCC's webhook gateway before parsing into the standardized `PCCADTEventPayload`.

---

**Conclusion:** The existing synthetic architecture is cleanly abstracted, highly disciplined, and completely decoupled from proprietary EHR internals. When official PCC partner credentials and webhook subscriptions become available, a `RealPCCClient` can be dropped into the application with zero disruption to the canonical clinical model or DME workflow engine.
