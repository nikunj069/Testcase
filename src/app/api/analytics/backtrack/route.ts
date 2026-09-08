import { NextResponse } from "next/server";
import { BidirectionalBacktracker } from "@/lib/analytics/backtrack";

/**
 * POST /api/analytics/backtrack
 *
 * Returns a bidirectional money-laundering trace (NDSS MFScope methodology).
 * Body: { targetActor?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetActor: string = body.targetActor || "ShadowBroker";

    const result = BidirectionalBacktracker.traceSyndicateFlow(targetActor);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Backtrack API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to run bidirectional trace" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/backtrack
 * Returns the default ShadowBroker trace.
 */
export async function GET() {
  try {
    const result = BidirectionalBacktracker.traceSyndicateFlow("ShadowBroker");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to run bidirectional trace" },
      { status: 500 }
    );
  }
}
