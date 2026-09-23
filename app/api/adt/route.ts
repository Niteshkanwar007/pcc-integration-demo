import { NextRequest, NextResponse } from 'next/server';
import { ADTProcessor } from '@/integration/adt-processing';
import { executeSimulatedScenario, PREDEFINED_SCENARIOS } from '@/demo/event-simulator';
import { IntegrationError } from '@/integration/error-handling';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    scenarios: PREDEFINED_SCENARIOS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if triggering a predefined scenario
    if (body.scenarioId) {
      const result = await executeSimulatedScenario(body.scenarioId);
      return NextResponse.json({
        success: true,
        scenarioId: body.scenarioId,
        result,
      });
    }

    // Otherwise process custom ADT payload
    const processor = new ADTProcessor();
    const result = await processor.processADTEvent(body);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    if (error instanceof IntegrationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to process ADT event';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
