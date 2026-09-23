/**
 * Central Integration Store & In-Memory State Container
 *
 * Simulates the integration persistence layer (e.g., PostgreSQL database)
 * and holds synchronized resident records, DME orders, audit event logs,
 * and developer request/response inspector traces.
 *
 * All demo operations are explicitly tagged as SYNTHETIC.
 */

import { CanonicalResident, IntegrationEvent, IntegrationMetrics, InspectorTraceRecord } from '@/integration/types';
import { DMEOrder } from '@/dme/types';
import { IPCCClient, SyntheticPCCClient } from '@/pcc/client';
import { PCCProvider, getPCCProvider, ISimulatedPCCProvider, getSyntheticPCCProvider } from '@/pcc/providers';
import { PCCDataMapper } from '@/integration/mapping';
import {
  INITIAL_SYNTHETIC_PCC_RESIDENTS,
  INITIAL_SYNTHETIC_ORDERS,
  INITIAL_INTEGRATION_EVENTS,
} from '@/demo/synthetic-data';

class IntegrationStore {
  public pccClient: IPCCClient;
  public pccProvider: PCCProvider;
  public syntheticSimulator: ISimulatedPCCProvider;
  public residents: Map<string, CanonicalResident> = new Map();
  public orders: DMEOrder[] = [];
  public events: IntegrationEvent[] = [];
  public traces: InspectorTraceRecord[] = [];
  public lastSyncTimestamp: string;

  constructor() {
    this.pccClient = new SyntheticPCCClient();
    this.pccProvider = getPCCProvider();
    this.syntheticSimulator = getSyntheticPCCProvider();
    this.lastSyncTimestamp = new Date().toISOString();
    this.seedInitialState();
  }

  private seedInitialState(): void {
    // Populate canonical residents from synthetic PCC raw data
    for (const raw of INITIAL_SYNTHETIC_PCC_RESIDENTS) {
      const canonical = PCCDataMapper.toCanonicalResident(raw);
      this.residents.set(canonical.mrn.toUpperCase(), canonical);
    }

    // Populate initial orders
    this.orders = [...INITIAL_SYNTHETIC_ORDERS];

    // Populate initial integration events
    this.events = [...INITIAL_INTEGRATION_EVENTS];

    // Populate initial sanitized inspector traces (no secrets, no PHI, synthetic IDs only)
    this.seedInitialTraces();
  }

  private seedInitialTraces(): void {
    this.traces = [
      {
        id: 'trace-init-001',
        timestamp: '2026-09-23T07:45:12.110Z',
        provider: 'SYNTHETIC',
        operation: 'searchPatients',
        requestType: 'GET',
        endpointOrMethod: 'SyntheticPCCProvider.searchPatients()',
        responseStatus: 'SUCCESS',
        processingDurationMs: 24,
        mappingResultSummary: 'Successfully queried 5 synthetic residents; mapped via PCCDataMapper into canonical store.',
        source: 'SYNTHETIC',
        sanitizedPayloadSummary: {
          requestedCount: 5,
          facilityCount: 3,
          authHeader: 'Bearer pcc_demo_tok_*** [SYNTHETIC]',
        },
      },
      {
        id: 'trace-init-002',
        timestamp: '2026-09-23T08:12:30.450Z',
        provider: 'SYNTHETIC',
        operation: 'ADT_TRANSFER',
        requestType: 'POST',
        endpointOrMethod: 'ADTProcessor.processADTEvent() -> simulateADTEvent()',
        responseStatus: 'SUCCESS',
        processingDurationMs: 28,
        mappingResultSummary: 'Room transfer processed for MRN-804192 (Room 102-B -> 104-A). Canonical state updated.',
        source: 'SYNTHETIC',
        sanitizedPayloadSummary: {
          mrn: 'MRN-804192',
          targetRoom: '104',
          targetBed: 'A',
          eventType: 'TRANSFER',
        },
      },
      {
        id: 'trace-init-003',
        timestamp: '2026-09-23T08:21:05.820Z',
        provider: 'SYNTHETIC',
        operation: 'DME_ORDER_CREATED',
        requestType: 'INTERNAL_EVAL',
        endpointOrMethod: 'ClinicalRulesEngine.evaluateRules()',
        responseStatus: 'SUCCESS',
        processingDurationMs: 35,
        mappingResultSummary: 'ICD-10 I69.351 evaluated; matched Rule RULE-002 (Electric Patient Lift Hoyer).',
        source: 'SYNTHETIC',
        sanitizedPayloadSummary: {
          orderId: 'ORD-2026-0903',
          hcpcsCode: 'E0635',
          priority: 'ROUTINE',
        },
      },
    ];
  }

  public getResident(mrn: string): CanonicalResident | undefined {
    return this.residents.get(mrn.trim().toUpperCase());
  }

  public getAllResidents(): CanonicalResident[] {
    return Array.from(this.residents.values());
  }

  public saveResident(resident: CanonicalResident): void {
    this.residents.set(resident.mrn.toUpperCase(), { ...resident });
  }

  public addEvent(
    event: Omit<IntegrationEvent, 'id' | 'timestamp' | 'provider' | 'entityType' | 'entityId'> & {
      id?: string;
      timestamp?: string;
      provider?: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
      entityType?: 'RESIDENT' | 'DIAGNOSIS' | 'COVERAGE' | 'ORDER' | 'SYSTEM';
      entityId?: string;
      duration?: number;
    }
  ): IntegrationEvent {
    const fullEvent: IntegrationEvent = {
      ...event,
      id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      provider: event.provider || 'SYNTHETIC',
      entityType: event.entityType || 'RESIDENT',
      entityId: event.entityId || event.mrn || 'SYSTEM',
      source: event.source || 'SYNTHETIC',
      duration: event.duration || event.processingTimeMs || 22,
    };

    // Prepend to top of log
    this.events.unshift(fullEvent);
    if (this.events.length > 250) {
      this.events.pop();
    }
    return fullEvent;
  }

  public getRecentEvents(limit = 20): IntegrationEvent[] {
    return this.events.slice(0, limit);
  }

  public addTrace(
    trace: Omit<InspectorTraceRecord, 'id' | 'timestamp' | 'provider' | 'source'> & {
      id?: string;
      timestamp?: string;
      provider?: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
      source?: 'SYNTHETIC' | 'PCC SANDBOX' | 'PCC PRODUCTION';
    }
  ): InspectorTraceRecord {
    const fullTrace: InspectorTraceRecord = {
      ...trace,
      id: trace.id || `trc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: trace.timestamp || new Date().toISOString(),
      provider: trace.provider || 'SYNTHETIC',
      source: trace.source || 'SYNTHETIC',
    };

    this.traces.unshift(fullTrace);
    if (this.traces.length > 100) {
      this.traces.pop();
    }
    return fullTrace;
  }

  public getRecentTraces(limit = 25): InspectorTraceRecord[] {
    return this.traces.slice(0, limit);
  }

  public addOrder(order: DMEOrder): void {
    this.orders.unshift(order);
  }

  public getAllOrders(): DMEOrder[] {
    return [...this.orders];
  }

  public getOrdersForResident(mrn: string): DMEOrder[] {
    const key = mrn.trim().toUpperCase();
    return this.orders.filter((o) => o.mrn.toUpperCase() === key);
  }

  public async getMetrics(): Promise<IntegrationMetrics> {
    const statusReport = await this.pccProvider.getConnectionStatus();
    const allResidents = this.getAllResidents();
    const admittedCount = allResidents.filter((r) => r.status === 'ADMITTED').length;
    const pendingOrders = this.orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'APPROVED').length;

    // Calculate average latency from recent events
    const recent = this.events.slice(0, 30);
    const avgLatency =
      recent.length > 0
        ? Math.round(recent.reduce((acc, curr) => acc + (curr.processingTimeMs || 0), 0) / recent.length)
        : 22;

    const errorCount = recent.filter((e) => e.status === 'FAILED').length;
    const errorRate = recent.length > 0 ? Math.round((errorCount / recent.length) * 100) : 0;

    return {
      connectionStatus: statusReport.connectionState === 'NOT_CONFIGURED' ? 'DISCONNECTED' : 'CONNECTED',
      providerMode: 'SYNTHETIC',
      environment: 'DEMO / SYNTHETIC DATA',
      lastSyncTimestamp: this.lastSyncTimestamp,
      totalSynchronizedResidents: allResidents.length,
      activeAdmittedCount: admittedCount,
      recentEventsCount: this.events.length,
      pendingOrdersCount: pendingOrders,
      averageProcessingTimeMs: avgLatency,
      errorRatePercent: errorRate,
    };
  }

  public resetToDefault(): void {
    this.residents.clear();
    this.orders = [];
    this.events = [];
    this.traces = [];
    this.pccClient = new SyntheticPCCClient();
    this.pccProvider = getPCCProvider();
    this.syntheticSimulator = getSyntheticPCCProvider();
    this.lastSyncTimestamp = new Date().toISOString();
    this.seedInitialState();
  }
}

// Global singleton pattern to survive Next.js dev server re-renders
const globalForStore = global as unknown as { pccStore?: IntegrationStore };
export const store = globalForStore.pccStore ?? new IntegrationStore();
if (process.env.NODE_ENV !== 'production') globalForStore.pccStore = store;
