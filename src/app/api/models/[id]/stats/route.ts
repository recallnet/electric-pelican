import { NextRequest, NextResponse } from "next/server";

import { ApiContracts } from "@/contracts/api";
import { getModelStats } from "@/lib/elo";

/**
 * GET /api/models/[id]/stats
 *
 * Returns detailed statistics for a specific AI model including:
 * - Current ELO score and ranking
 * - Recent match history
 * - ELO score progression over time
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Handle params as Promise in Next.js 15
    const resolvedParams = await params;

    // Validate parameters
    const paramsSchema = ApiContracts["GET /api/models/:id/stats"].request.params;
    const validatedParams = paramsSchema.parse(resolvedParams);

    // Decode the model ID (in case it's URL encoded)
    const modelId = decodeURIComponent(validatedParams.id);

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Get model statistics
    const modelStats = await getModelStats(modelId);

    // Validate response against contract
    const responseSchema = ApiContracts["GET /api/models/:id/stats"].response;
    const validatedResponse = responseSchema.parse(modelStats);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Model stats API error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
