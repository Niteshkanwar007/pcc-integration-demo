/**
 * Resident Synchronization Service
 *
 * Coordinates scheduled or on-demand batch synchronization between
 * the PointClickCare EHR API and the local canonical resident store.
 */

import { store } from '@/lib/store';
import { PCCDataMapper } from '@/integration/mapping';
import { IntegrationEvent } from '@/integration/types';

export interface SyncSummary {
  success: boolean;
  totalSynced: number;
  newResidentsCount: number;
  updatedResidentsCount: number;
  timestamp: string;
  durationMs: number;
  event: IntegrationEvent;
}

export class ResidentSyncService {
  public async synchronizeAll(): Promise<SyncSummary> {
    const startTime = Date.now();
    const pccResidents = await store.pccClient.searchPatients();

    let newCount = 0;
    let updatedCount = 0;

    for (const raw of pccResidents) {
      const existing = store.getResident(raw.mrn);
      const canonical = PCCDataMapper.toCanonicalResident(raw);

      if (!existing) {
        newCount++;
      } else {
        updatedCount++;
      }

      store.saveResident(canonical);
    }

    const elapsed = Date.now() - startTime;
    const nowIso = new Date().toISOString();
    store.lastSyncTimestamp = nowIso;

    const event = store.addEvent({
      eventType: 'PCC_PATIENT_SYNC',
      mrn: 'BATCH',
      source: 'PointClickCare (Synthetic)',
      status: 'SUCCESS',
      processingTimeMs: Math.max(elapsed, 24),
      message: `Full synchronization complete. ${pccResidents.length} residents synchronized (${newCount} new, ${updatedCount} updated).`,
      details: {
        totalRecords: pccResidents.length,
        newRecords: newCount,
        updatedRecords: updatedCount,
      },
    });

    store.addTrace({
      provider: 'SYNTHETIC',
      operation: 'searchPatients (Batch Sync)',
      requestType: 'GET',
      endpointOrMethod: 'SyntheticPCCProvider.searchPatients()',
      responseStatus: 'SUCCESS',
      processingDurationMs: Math.max(elapsed, 24),
      mappingResultSummary: `Batch synchronization: ${pccResidents.length} residents mapped into canonical store (${newCount} new, ${updatedCount} updated).`,
      source: 'SYNTHETIC',
      sanitizedPayloadSummary: {
        totalSynced: pccResidents.length,
        newCount,
        updatedCount,
      },
    });

    return {
      success: true,
      totalSynced: pccResidents.length,
      newResidentsCount: newCount,
      updatedResidentsCount: updatedCount,
      timestamp: nowIso,
      durationMs: elapsed,
      event,
    };
  }
}
