import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const traces = store.getRecentTraces(50);
    const events = store.getRecentEvents(50);

    return NextResponse.json({
      success: true,
      traces,
      events,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve inspector traces';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
