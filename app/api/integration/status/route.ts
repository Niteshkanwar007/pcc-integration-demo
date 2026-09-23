import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { PCC_CAPABILITY_MATRIX } from '@/pcc/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connectionReport = await store.pccProvider.getConnectionStatus();
    const capabilities = store.pccProvider.getCapabilities();

    return NextResponse.json({
      success: true,
      connectionReport,
      capabilities,
      capabilityMatrix: PCC_CAPABILITY_MATRIX,
      providerInfo: {
        id: store.pccProvider.id,
        name: store.pccProvider.name,
        mode: store.pccProvider.mode,
        isSynthetic: store.pccProvider.mode === 'SYNTHETIC',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve connection status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
