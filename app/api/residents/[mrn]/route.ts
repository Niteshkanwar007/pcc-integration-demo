import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { DMERecommendationEngine } from '@/dme/recommendations';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ mrn: string }> }
) {
  try {
    const { mrn } = await context.params;
    const resident = store.getResident(mrn);

    if (!resident) {
      return NextResponse.json({ success: false, error: 'Resident not found' }, { status: 404 });
    }

    const recommendations = DMERecommendationEngine.evaluateRecommendations(resident.activeDiagnoses);
    const orders = store.getOrdersForResident(resident.mrn);

    return NextResponse.json({
      success: true,
      resident,
      recommendations,
      orders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve resident record';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
