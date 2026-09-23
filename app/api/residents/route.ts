import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { DMERecommendationEngine } from '@/dme/recommendations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const facility = searchParams.get('facility') || '';
    const status = searchParams.get('status') || '';

    let residents = store.getAllResidents();

    if (facility) {
      residents = residents.filter((r) => r.facilityId === facility);
    }

    if (status) {
      residents = residents.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      residents = residents.filter(
        (r) =>
          r.mrn.toLowerCase().includes(search) ||
          r.fullName.toLowerCase().includes(search) ||
          (r.room && r.room.toLowerCase().includes(search)) ||
          (r.facilityName && r.facilityName.toLowerCase().includes(search)) ||
          r.activeDiagnoses.some((d) => d.description.toLowerCase().includes(search) || d.icd10.toLowerCase().includes(search))
      );
    }

    // Attach recommendations count for quick UI badges
    const enriched = residents.map((r) => {
      const recs = DMERecommendationEngine.evaluateRecommendations(r.activeDiagnoses);
      const orders = store.getOrdersForResident(r.mrn);
      return {
        ...r,
        recommendationsCount: recs.length,
        ordersCount: orders.length,
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      residents: enriched,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to query residents';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
