import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/models/[id]/tag-performance
 *
 * Returns aggregated performance metrics for a model across different tags.
 * Shows the model's win rate percentile for each tag.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Lazy import database to avoid build-time connection issues
    const { db } = await import("../../../../../../db");
    const { tournaments, tournamentRuns } = await import("../../../../../../db/schema");

    // Handle params as Promise in Next.js 15
    const resolvedParams = await params;

    // Parse and validate the model ID
    const modelId = decodeURIComponent(resolvedParams.id);

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Find all tournaments where this model participated
    // PostgreSQL compatibility: Use ::text cast for JSON search
    const modelTournamentsQuery = await db
      .select({
        id: tournaments.id,
        tags: tournaments.tags,
        models: tournaments.models,
        winnerModel: tournamentRuns.winnerModel,
        status: tournamentRuns.status,
      })
      .from(tournaments)
      .leftJoin(tournamentRuns, sql`${tournaments.id} = ${tournamentRuns.tournamentId}`)
      .where(sql`${tournaments.models}::text LIKE '%' || ${modelId} || '%'`);

    // Process the tournament data to calculate tag performance
    const tagPerformance: Record<string, { wins: number; total: number; percentile: number }> = {};

    modelTournamentsQuery.forEach((tournament) => {
      // Skip tournaments that are not completed
      if (tournament.status !== "completed" || !tournament.winnerModel) return;

      // Determine if the model won
      const didWin = tournament.winnerModel === modelId;

      // Process each tag
      const tags = Array.isArray(tournament.tags) ? tournament.tags : [];

      tags.forEach((tag) => {
        if (!tagPerformance[tag]) {
          tagPerformance[tag] = { wins: 0, total: 0, percentile: 0 };
        }

        tagPerformance[tag].total += 1;
        if (didWin) {
          tagPerformance[tag].wins += 1;
        }
      });
    });

    // Calculate win rate percentile for each tag
    // For now, we'll use the raw win rate as a simple percentile
    Object.keys(tagPerformance).forEach((tag) => {
      const tagData = tagPerformance[tag];
      if (!tagData) return; // TypeScript safety check

      const { wins, total } = tagData;
      if (total > 0) {
        // Win rate as a percentile between 0-100
        tagPerformance[tag]!.percentile = Math.round((wins / total) * 100);
      }
    });

    // Filter to tags with at least 2 evaluations
    const filteredTags = Object.entries(tagPerformance)
      .filter(([_, data]) => data.total >= 2)
      .sort((a, b) => b[1].percentile - a[1].percentile); // Sort by percentile desc

    // Format response to include win rate for each tag
    const response = {
      tags: filteredTags.map(([tag, data]) => ({
        tag,
        percentile: data.percentile,
        wins: data.wins,
        total: data.total,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Model tag performance API error:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
