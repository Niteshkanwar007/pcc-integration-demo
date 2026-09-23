import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST() {
  try {
    store.resetToDefault();
    return NextResponse.json({
      success: true,
      message: 'Integration state and synthetic records reset to baseline seed state.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
