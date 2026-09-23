/**
 * Unit Test Suite: PCC Verification Architecture & Adapter Boundary
 *
 * Verifies:
 * 1. Provider selection and dependency injection
 * 2. Capability detection and matrix configuration
 * 3. Synthetic patient, condition, and coverage retrieval
 * 4. ADT event processing (Admission, Transfer, Discharge)
 * 5. FHIR-to-Canonical mapping logic
 * 6. Validation and error translation into provider-neutral categories
 * 7. Retry policy classification and resilience
 * 8. Connection-status evaluation logic
 *
 * CRITICAL ASSERTIONS:
 * - A missing PCC configuration can NEVER be reported as a successful PCC connection.
 * - A synthetic response can NEVER be labeled as a live PCC response.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PCCConfigValidator,
  SyntheticPCCProvider,
  RealPCCProvider,
  getPCCProvider,
  resetProviderCache,
  PCC_CAPABILITY_MATRIX,
  getDeclaredCapabilitiesForMode,
  PCCConfigurationError,
} from '../pcc/providers';

import { FHIRDataMapper } from '../pcc/fhir/mapper';
import { FHIRPatient, FHIRCondition, FHIRCoverage } from '../pcc/fhir/types';
import { translateExternalError, IntegrationError } from '../integration/error-handling';
import { RetryPolicy } from '../integration/resilience/retry-policy';
import { ADTProcessor } from '../integration/adt-processing';
import { PCCExternalEventAdapter } from '../pcc/event-processing';
import { store } from '../lib/store';

describe('1. Provider Selection & Factory', () => {
  it('returns SyntheticPCCProvider by default or when integration mode is synthetic', () => {
    resetProviderCache();
    delete process.env.PCC_INTEGRATION_MODE;
    const provider = getPCCProvider();
    assert.equal(provider.mode, 'SYNTHETIC');
    assert.equal(provider.id, 'synthetic-pcc-provider');

    resetProviderCache();
    process.env.PCC_INTEGRATION_MODE = 'synthetic';
    const explicitSyntheticProvider = getPCCProvider();
    assert.equal(explicitSyntheticProvider.mode, 'SYNTHETIC');
  });

  it('throws configuration error when Real PCC mode is explicitly requested with missing credentials (never silently falls back)', () => {
    resetProviderCache();
    process.env.PCC_INTEGRATION_MODE = 'real';
    delete process.env.PCC_BASE_URL;
    delete process.env.PCC_CLIENT_ID;
    delete process.env.PCC_CLIENT_SECRET;
    delete process.env.PCC_TENANT_ID;

    assert.throws(
      () => {
        getPCCProvider();
      },
      (err: unknown) => {
        assert.ok(err instanceof PCCConfigurationError);
        assert.ok(err.message.includes('PointClickCare Configuration Error'));
        assert.ok(err.message.includes('Never falling back to synthetic mode silently'));
        return true;
      }
    );
  });

  it('returns RealPCCProvider in CONFIGURED_NOT_VERIFIED state when credentials are provided without legitimate live verification', async () => {
    resetProviderCache();
    process.env.PCC_INTEGRATION_MODE = 'real';
    process.env.PCC_BASE_URL = 'https://example.invalid/pcc-sandbox/fhir/R4';
    process.env.PCC_CLIENT_ID = 'test-client-id';
    process.env.PCC_CLIENT_SECRET = 'test-client-secret';
    process.env.PCC_TENANT_ID = 'tenant-999';

    const provider = getPCCProvider();
    assert.equal(provider.mode, 'REAL_SANDBOX');
    assert.equal(provider.id, 'real-pcc-provider-skeleton');

    const status = await provider.getConnectionStatus();
    assert.equal(status.connectionState, 'CONFIGURED_NOT_VERIFIED');
    assert.equal(status.isConfigured, true);
    assert.equal(status.isVerified, false);
    assert.equal(status.livePccVerification, 'NOT_PERFORMED');
    assert.equal(status.livePccVerificationStatusText, 'NOT PERFORMED');

    // Clean up
    delete process.env.PCC_INTEGRATION_MODE;
    delete process.env.PCC_BASE_URL;
    delete process.env.PCC_CLIENT_ID;
    delete process.env.PCC_CLIENT_SECRET;
    delete process.env.PCC_TENANT_ID;
    resetProviderCache();
  });
});

describe('2. Capability Detection & Matrix Terminology', () => {
  it('declares accurate capabilities for synthetic mode', () => {
    const syntheticCaps = getDeclaredCapabilitiesForMode('SYNTHETIC');
    assert.equal(syntheticCaps.patientRead, true);
    assert.equal(syntheticCaps.conditionRead, true);
    assert.equal(syntheticCaps.orderWriteBack, false);
    assert.equal(syntheticCaps.realtimeEvents, false);
  });

  it('declares accurate capabilities for real sandbox mode', () => {
    const sandboxCaps = getDeclaredCapabilitiesForMode('REAL_SANDBOX');
    assert.equal(sandboxCaps.patientRead, true);
    assert.equal(sandboxCaps.conditionRead, true);
    assert.equal(sandboxCaps.realtimeEvents, false, 'Sandbox cannot claim realtime webhooks without partner tier');
    assert.equal(sandboxCaps.orderWriteBack, false, 'Sandbox cannot claim order writeback without partner tier');
  });

  it('separates terminology: patient demographics, search, condition, coverage are DOCUMENTED_SUPPORTED, not VERIFIED_AGAINST_PCC', () => {
    const patientRead = PCC_CAPABILITY_MATRIX.find((c) => c.id === 'patientRead');
    const patientSearch = PCC_CAPABILITY_MATRIX.find((c) => c.id === 'patientSearch');
    const conditionRead = PCC_CAPABILITY_MATRIX.find((c) => c.id === 'conditionRead');
    const coverageRead = PCC_CAPABILITY_MATRIX.find((c) => c.id === 'coverageRead');

    assert.equal(patientRead?.status, 'DOCUMENTED_SUPPORTED');
    assert.equal(patientSearch?.status, 'DOCUMENTED_SUPPORTED');
    assert.equal(conditionRead?.status, 'DOCUMENTED_SUPPORTED');
    assert.equal(coverageRead?.status, 'DOCUMENTED_SUPPORTED');

    // For every DOCUMENTED_SUPPORTED item, rationale must distinguish standard FHIR pattern from PCC-specific availability
    const documentedSupportedItems = PCC_CAPABILITY_MATRIX.filter((c) => c.status === 'DOCUMENTED_SUPPORTED');
    assert.equal(documentedSupportedItems.length, 4);
    for (const item of documentedSupportedItems) {
      assert.ok(
        item.notes.includes('Architecture supports the corresponding standard FHIR'),
        `${item.id} must note architecture supports standard FHIR pattern`
      );
      assert.ok(
        item.notes.includes('PointClickCare developer documentation and configured environment'),
        `${item.id} must state availability and scopes must be confirmed against PCC developer docs`
      );
      assert.ok(
        item.notes.includes('Live PCC Verification: NOT PERFORMED'),
        `${item.id} must explicitly state Live PCC Verification: NOT PERFORMED`
      );
    }

    // No capabilities can be marked VERIFIED_AGAINST_PCC for current demo
    const verifiedAgainstPcc = PCC_CAPABILITY_MATRIX.filter((c) => c.status === 'VERIFIED_AGAINST_PCC');
    assert.equal(verifiedAgainstPcc.length, 0, 'No capability may be marked VERIFIED_AGAINST_PCC without live PCC testing');
  });

  it('contains expected status concepts in capability matrix', () => {
    const statuses = new Set(PCC_CAPABILITY_MATRIX.map((c) => c.status));
    assert.ok(statuses.has('DOCUMENTED_SUPPORTED'));
    assert.ok(statuses.has('NOT_VERIFIED'));
    assert.ok(statuses.has('REQUIRES_PCC_PARTNER_ACCESS'));
    assert.ok(statuses.has('SYNTHETIC_ONLY'));
  });
});

describe('3. Synthetic Patient, Condition & Coverage Retrieval', () => {
  const provider = new SyntheticPCCProvider();

  it('retrieves synthetic patient by MRN', async () => {
    const patient = await provider.getPatient('MRN-492011');
    assert.ok(patient !== null);
    assert.equal(patient.mrn, 'MRN-492011');
    assert.equal(patient.firstName, 'Arthur');
    assert.equal(patient.lastName, 'Pendleton');
  });

  it('returns null for non-existent patient identifier', async () => {
    const patient = await provider.getPatient('NON-EXISTENT-MRN-999');
    assert.equal(patient, null);
  });

  it('retrieves active ICD-10 conditions for synthetic patient', async () => {
    const conditions = await provider.getPatientConditions('MRN-804192');
    assert.ok(Array.isArray(conditions));
    assert.ok(conditions.length > 0);
    assert.ok(conditions.some((c) => c.code === 'L89.153'));
  });

  it('retrieves synthetic coverage details for resident with separate coverageStatus and eligibilityVerified', async () => {
    const coverage = await provider.getPatientCoverage('MRN-804192');
    assert.ok(coverage !== null);
    assert.equal(coverage.payerName, 'Medicare Part A (Traditional)');
    assert.equal(coverage.coverageStatus, 'active');
    assert.equal(coverage.eligibilityVerified, false, 'Eligibility cannot be verified without live clearinghouse check');
    assert.equal(coverage.isVerified, false, 'Active coverage status does not mean eligibilityVerified');
  });
});

describe('4. ADT Event Processing Pipeline', () => {
  const processor = new ADTProcessor();

  it('processes ADT Room Transfer event successfully and updates canonical state', async () => {
    const transferPayload = {
      eventId: `adt-test-${Date.now()}`,
      eventType: 'TRANSFER',
      patientId: 'PCC-RES-88201',
      mrn: 'MRN-804192',
      facId: 'FAC-101',
      targetRoom: '205',
      targetBed: 'B',
      timestamp: new Date().toISOString(),
    };

    const result = await processor.processADTEvent(transferPayload);
    assert.equal(result.success, true);
    assert.equal(result.resident?.room, '205');
    assert.equal(result.resident?.bed, 'B');

    // Verify state in store
    const stored = store.getResident('MRN-804192');
    assert.equal(stored?.room, '205');
    assert.equal(stored?.bed, 'B');
  });

  it('rejects invalid ADT payloads with validation error', async () => {
    const invalidPayload = {
      eventType: 'TRANSFER',
      // missing mrn and patientId
    };

    await assert.rejects(
      async () => {
        await processor.processADTEvent(invalidPayload);
      },
      (err: unknown) => {
        assert.ok(err instanceof IntegrationError);
        assert.equal(err.code, 'INVALID_ADT_PAYLOAD');
        return true;
      }
    );
  });
});

describe('5. FHIR-Ready Mapping Logic', () => {
  it('maps standard FHIR R4 Patient to CanonicalResident without leaking vendor fields', () => {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: 'pcc-fhir-991',
      identifier: [
        {
          type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }] },
          value: 'MRN-TEST-881',
        },
      ],
      name: [{ family: 'Johnson', given: ['Evelyn', 'Rose'], text: 'Evelyn Rose Johnson' }],
      gender: 'female',
      birthDate: '1942-06-18',
      active: true,
      managingOrganization: { reference: 'Organization/FAC-102', display: 'Meadowview Pavilion' },
    };

    const canonical = FHIRDataMapper.toCanonicalResident(fhirPatient);
    assert.equal(canonical.mrn, 'MRN-TEST-881');
    assert.equal(canonical.fullName, 'Evelyn Rose Johnson');
    assert.equal(canonical.gender, 'Female');
    assert.equal(canonical.dateOfBirth, '1942-06-18');
    assert.equal(canonical.status, 'ADMITTED');
  });

  it('maps FHIR Condition to CanonicalDiagnosis', () => {
    const fhirCondition: FHIRCondition = {
      resourceType: 'Condition',
      id: 'cond-01',
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10-cm',
            code: 'I69.351',
            display: 'Hemiplegia following cerebral infarction',
          },
        ],
      },
      category: [
        {
          coding: [{ code: 'encounter-diagnosis' }],
        },
      ],
      subject: { reference: 'Patient/pcc-fhir-991' },
      onsetDateTime: '2026-08-10',
    };

    const diagnosis = FHIRDataMapper.toCanonicalDiagnosis(fhirCondition);
    assert.equal(diagnosis.icd10, 'I69.351');
    assert.equal(diagnosis.isPrimary, true);
    assert.equal(diagnosis.classification, 'Primary');
  });

  it('maps FHIR Coverage to CanonicalInsurance cleanly separating coverageStatus from eligibilityVerified', () => {
    const fhirCoverage: FHIRCoverage = {
      resourceType: 'Coverage',
      id: 'cov-01',
      status: 'active',
      subscriberId: 'POL-1928374',
      payor: [{ display: 'Medicare Part A' }],
      beneficiary: { reference: 'Patient/pcc-fhir-991' },
    };

    const insurance = FHIRDataMapper.toCanonicalInsurance(fhirCoverage);
    assert.equal(insurance.payerName, 'Medicare Part A');
    assert.equal(insurance.payerType, 'Medicare');
    assert.equal(insurance.coverageStatus, 'active');
    assert.equal(insurance.eligibilityVerified, false, 'Do not equate FHIR Coverage status active with eligibility verified');
    assert.equal(insurance.isVerified, false);
  });
});

describe('6. Error Translation & Classification', () => {
  it('translates HTTP 429 and rate limit messages into RATE_LIMITED category', () => {
    const err = new Error('HTTP 429 Too Many Requests: Rate limit exceeded');
    const translated = translateExternalError(err);
    assert.equal(translated.category, 'RATE_LIMITED');
    assert.equal(translated.isRetryable, true);
  });

  it('translates HTTP 401 into AUTHENTICATION_ERROR category and marks not retryable', () => {
    const err = new Error('401 Unauthorized: Invalid access token');
    const translated = translateExternalError(err);
    assert.equal(translated.category, 'AUTHENTICATION_ERROR');
    assert.equal(translated.isRetryable, false);
  });

  it('translates HTTP 404 into NOT_FOUND category', () => {
    const err = new Error('Patient record not found: 404');
    const translated = translateExternalError(err);
    assert.equal(translated.category, 'NOT_FOUND');
    assert.equal(translated.isRetryable, false);
  });
});

describe('7. Resilience & Retry Policy', () => {
  it('correctly classifies retryable vs non-retryable errors', () => {
    const policy = new RetryPolicy();
    const rateLimitErr = new Error('429 Rate limited');
    const authErr = new Error('401 Unauthorized');

    assert.equal(policy.isRetryable(rateLimitErr), true);
    assert.equal(policy.isRetryable(authErr), false);
  });

  it('computes exponential delay with upper bound cap', () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 400,
      backoffMultiplier: 2,
      jitter: false,
      retryableCategories: ['RATE_LIMITED', 'NETWORK_ERROR', 'PROVIDER_ERROR'],
    });

    assert.equal(policy.computeDelayMs(1), 100);
    assert.equal(policy.computeDelayMs(2), 200);
    assert.equal(policy.computeDelayMs(3), 400);
    assert.equal(policy.computeDelayMs(4), 400, 'Must cap at maxDelayMs');
  });
});

describe('8. CRITICAL ASSERTION: Missing PCC Config NEVER Reported As Successful Connection', () => {
  it('reports NOT_CONFIGURED when configuration is completely missing', () => {
    const report = PCCConfigValidator.evaluateConnectionStatus({}, 'REAL_SANDBOX');
    assert.equal(report.connectionState, 'NOT_CONFIGURED');
    assert.equal(report.isConfigured, false);
    assert.equal(report.isVerified, false);
    assert.equal(report.livePccVerification, 'NOT_PERFORMED');
    assert.equal(report.livePccVerificationStatusText, 'NOT PERFORMED');
    assert.ok(report.missingConfig.includes('PCC_BASE_URL'));
    assert.ok(report.missingConfig.includes('PCC_CLIENT_ID'));
    assert.ok(report.missingConfig.includes('PCC_CLIENT_SECRET'));
    assert.ok(report.missingConfig.includes('PCC_TENANT_ID'));
    assert.ok(report.message.includes('Missing PCC configuration'));
  });

  it('reports NOT_CONFIGURED when configuration is partial', () => {
    const report = PCCConfigValidator.evaluateConnectionStatus(
      { baseUrl: 'https://example.invalid/pcc-sandbox' },
      'REAL_SANDBOX'
    );
    assert.equal(report.connectionState, 'NOT_CONFIGURED');
    assert.equal(report.isConfigured, false);
    assert.equal(report.isVerified, false);
    assert.equal(report.livePccVerification, 'NOT_PERFORMED');
  });

  it('reports CONFIGURED_NOT_VERIFIED when config exists but has not been verified', () => {
    const report = PCCConfigValidator.evaluateConnectionStatus(
      {
        baseUrl: 'https://example.invalid/pcc-sandbox',
        tenantId: 'tenant-123',
        clientId: 'client-abc',
        clientSecret: 'secret-xyz',
      },
      'REAL_SANDBOX'
    );
    assert.equal(report.connectionState, 'CONFIGURED_NOT_VERIFIED');
    assert.equal(report.isConfigured, true);
    assert.equal(report.isVerified, false, 'Configured credentials must NEVER automatically be marked verified');
    assert.equal(report.livePccVerification, 'NOT_PERFORMED');
    assert.equal(report.livePccVerificationStatusText, 'NOT PERFORMED');
    assert.ok(report.message.includes('Live PCC Verification: NOT PERFORMED'));
  });

  it('RealPCCProvider throws descriptive error if called when not configured', async () => {
    const unconfiguredProvider = new RealPCCProvider({});
    await assert.rejects(
      async () => {
        await unconfiguredProvider.getPatient('MRN-001');
      },
      (err: Error) => {
        assert.ok(err.message.includes('Cannot execute live EHR operation'));
        assert.ok(err.message.includes('Missing PCC configuration'));
        return true;
      }
    );
  });
});

describe('9. CRITICAL ASSERTION: Synthetic Response Can NEVER Be Labeled As Live PCC Response', () => {
  it('Synthetic provider explicitly declares its mode as SYNTHETIC with Live PCC Verification: NOT PERFORMED', async () => {
    const provider = new SyntheticPCCProvider();
    const status = await provider.getConnectionStatus();

    assert.equal(provider.mode, 'SYNTHETIC');
    assert.equal(status.providerMode, 'SYNTHETIC');
    assert.equal(status.isVerified, false);
    assert.equal(status.livePccVerification, 'NOT_PERFORMED');
    assert.equal(status.livePccVerificationStatusText, 'NOT PERFORMED');
    assert.equal(status.activeProviderName, 'Synthetic PCC Provider');
    assert.ok(status.message.includes('Live PCC Verification: NOT PERFORMED'));

    // Negative assertions ensuring forbidden live labels are absent
    assert.notEqual(status.connectionState, 'VERIFIED_SANDBOX');
    assert.notEqual(status.connectionState, 'VERIFIED_PRODUCTION');
    assert.ok(!status.message.toLowerCase().includes('connected to live'));
  });

  it('Inspector traces generated from synthetic operations explicitly declare SOURCE: SYNTHETIC', () => {
    const trace = store.addTrace({
      operation: 'testOperation',
      requestType: 'GET',
      endpointOrMethod: 'SyntheticPCCProvider.getPatient()',
      responseStatus: 'SUCCESS',
      processingDurationMs: 15,
      mappingResultSummary: 'Test synthetic trace',
    });

    assert.equal(trace.source, 'SYNTHETIC');
    assert.equal(trace.provider, 'SYNTHETIC');
    assert.notEqual(trace.source, 'PCC SANDBOX');
  });
});

describe('10. Event Boundary: Proprietary External Envelope Adapter', () => {
  it('normalizes external proprietary webhook envelope into internal canonical ADT event', () => {
    const rawEnvelope = {
      externalEventId: 'ext-evt-9921',
      externalEventType: 'Resident.Admitted',
      tenantId: 'pcc-org-1234',
      facilityId: 'FAC-101',
      occurredAt: '2026-09-23T10:00:00Z',
      payload: {
        residentId: 'PCC-RES-771',
        mrn: 'MRN-77100',
        residentName: 'Test Patient',
        room: '302',
        bed: 'A',
      },
    };

    const canonicalEvent = PCCExternalEventAdapter.normalizeExternalEvent(rawEnvelope);
    assert.equal(canonicalEvent.eventId, 'ext-evt-9921');
    assert.equal(canonicalEvent.eventType, 'ADMISSION');
    assert.equal(canonicalEvent.patientId, 'PCC-RES-771');
    assert.equal(canonicalEvent.mrn, 'MRN-77100');
    assert.equal(canonicalEvent.facId, 'FAC-101');
    assert.equal(canonicalEvent.targetRoom, '302');
    assert.equal(canonicalEvent.targetBed, 'A');
  });

  it('rejects external envelope missing required tenant or patient identifiers', () => {
    const invalidEnvelope = {
      externalEventId: 'ext-evt-invalid',
      externalEventType: 'Unknown.Event',
      payload: {},
    };

    assert.throws(
      () => {
        PCCExternalEventAdapter.normalizeExternalEvent(invalidEnvelope);
      },
      (err: unknown) => {
        assert.ok(err instanceof IntegrationError);
        assert.equal(err.code, 'INVALID_EXTERNAL_PAYLOAD');
        return true;
      }
    );
  });
});

describe('11. Demographic & Clinical Integrity: No Manufactured Facts', () => {
  it('leaves dateOfBirth and room empty when not provided in FHIR Patient resource', () => {
    const barePatient: FHIRPatient = {
      resourceType: 'Patient',
      id: 'bare-patient-001',
      identifier: [{ value: 'MRN-BARE-01' }],
      name: [{ text: 'Jane Doe' }],
      gender: 'other',
      active: true,
    };

    const canonical = FHIRDataMapper.toCanonicalResident(barePatient);
    assert.equal(canonical.dateOfBirth, '', 'Must not manufacture a default birth date (e.g. 1940-01-01)');
    assert.equal(canonical.room, '', 'Must not manufacture a default room number (e.g. 101)');
    assert.equal(canonical.bed, '', 'Must not manufacture a default bed (e.g. A)');
    assert.equal(canonical.facilityId, '', 'Must not manufacture a default facility ID');
    assert.equal(canonical.admissionDate, '', 'Must not manufacture an admission date');
  });

  it('leaves ICD-10 code empty when missing from FHIR Condition instead of inventing a default code', () => {
    const bareCondition: FHIRCondition = {
      resourceType: 'Condition',
      id: 'bare-cond-01',
      subject: { reference: 'Patient/bare-patient-001' },
    };

    const canonical = FHIRDataMapper.toCanonicalDiagnosis(bareCondition);
    assert.equal(canonical.icd10, '', 'Must not manufacture R69 or other default ICD-10 code');
    assert.equal(canonical.onsetDate, '', 'Must not manufacture today as onset date');
  });
});
