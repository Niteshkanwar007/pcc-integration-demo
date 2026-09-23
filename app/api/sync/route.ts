import { NextResponse } from 'next/server';
import { ResidentSyncService } from '@/integration/resident-synchronization';

const syncService = new ResidentSyncService();

export async function POST() {
  try {
    const summary = await syncService.synchronizeAll();
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Synchronization failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
