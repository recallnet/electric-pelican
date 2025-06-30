import { NextRequest, NextResponse } from "next/server";

import { ApiContracts } from "@/contracts/api";
import { getLeaderboard } from "@/lib/elo";

/**
 * GET /api/leaderboard
 *
 * Returns paginated leaderboard of AI models sorted by ELO rating.
 * Supports sorting by globalScore, winRate, or matchesPlayed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with validation
    const querySchema = ApiContracts["GET /api/leaderboard"].request.query;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(rawQuery);

    // Convert string parameters to appropriate types
    const options = {
      page: validatedQuery.page ? parseInt(validatedQuery.page, 10) : 1,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit, 10) : 50,
      sortBy: validatedQuery.sortBy || ("globalScore" as const),
      order: validatedQuery.order || ("desc" as const),
    };

    // Validate numeric parameters
    if (isNaN(options.page) || options.page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    if (isNaN(options.limit) || options.limit < 1 || options.limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be 1-100)" },
        { status: 400 },
      );
    }

    // Get leaderboard data
    const leaderboardData = await getLeaderboard(options);

    // Validate response against contract
    const responseSchema = ApiContracts["GET /api/leaderboard"].response;
    const validatedResponse = responseSchema.parse(leaderboardData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Leaderboard API error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
