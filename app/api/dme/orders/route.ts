import { NextRequest, NextResponse } from 'next/server';
import { DMEOrderService } from '@/dme/orders';
import { store } from '@/lib/store';
import { IntegrationError } from '@/integration/error-handling';

export const dynamic = 'force-dynamic';

const orderService = new DMEOrderService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mrn = searchParams.get('mrn');
    const orders = mrn ? store.getOrdersForResident(mrn) : store.getAllOrders();

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to query DME orders';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.mrn || !body.equipmentType || !body.orderingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required order fields: mrn, equipmentType, and orderingUser are required.',
        },
        { status: 400 }
      );
    }

    const order = await orderService.createOrder({
      mrn: body.mrn,
      equipmentType: body.equipmentType,
      category: body.category,
      orderingUser: body.orderingUser,
      orderingUserRole: body.orderingUserRole,
      diagnosisIcd10: body.diagnosisIcd10,
      priority: body.priority,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    if (error instanceof IntegrationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to create DME order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
