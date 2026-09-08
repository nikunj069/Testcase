import { NextResponse } from "next/server";
import { DeterministicRiskScorer, RiskInputParameters } from "@/lib/analytics/scoring";

/**
 * POST /api/analytics/score
 *
 * Deterministic Risk Scoring Engine.
 * Body: RiskInputParameters
 * Returns: DeterministicRiskAssessment
 */
export async function POST(request: Request) {
  try {
    const body: RiskInputParameters = await request.json();

    const requiredFields: (keyof RiskInputParameters)[] = [
      "degreeCentrality",
      "betweennessScore",
      "activitySpikeFactor",
      "crossPlatformMatches",
      "hasMixerExposure",
      "hasOffshoreBanking",
      "hasNarcoticsListingPattern",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const assessment = DeterministicRiskScorer.calculate(body);
    return NextResponse.json(assessment);
  } catch (err: any) {
    console.error("Risk Scoring API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate risk score" },
      { status: 500 }
    );
  }
}
