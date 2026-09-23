import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { PCC_CAPABILITY_MATRIX } from '@/pcc/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await store.getMetrics();
    const recentEvents = store.getRecentEvents(25);
    const recentOrders = store.getAllOrders().slice(0, 15);
    const connectionReport = await store.pccProvider.getConnectionStatus();
    const capabilities = store.pccProvider.getCapabilities();
    const recentTraces = store.getRecentTraces(20);

    return NextResponse.json({
      success: true,
      metrics,
      recentEvents,
      recentOrders,
      connectionReport,
      capabilities,
      capabilityMatrix: PCC_CAPABILITY_MATRIX,
      recentTraces,
      providerInfo: {
        id: store.pccProvider.id,
        name: store.pccProvider.name,
        mode: store.pccProvider.mode,
        isSynthetic: store.pccProvider.mode === 'SYNTHETIC',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve dashboard metrics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
