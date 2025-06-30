import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "../../../../../db";

/**
 * Bulk taxonomy leaderboard overview API
 *
 * Replaces 154 individual API calls with a single optimized query.
 * Returns leading model and statistics for all taxonomy tags.
 */
export async function GET() {
  try {
    console.log("Fetching taxonomy leaderboard overview...");
    const startTime = Date.now();

    // Single optimized query to get all taxonomy data
    const query = sql`
      WITH ranked_models AS (
        SELECT
          mts.tag_id,
          mts.model_id,
          m.name as model_name,
          m.provider,
          mts.elo_score,
          mts.matches_played,
          mts.wins,
          mts.losses,
          CASE
            WHEN mts.matches_played > 0
            THEN CAST(mts.wins AS FLOAT) / mts.matches_played
            ELSE 0.5
          END as win_rate,
          ROW_NUMBER() OVER (PARTITION BY mts.tag_id ORDER BY mts.elo_score DESC) as rank
        FROM model_tag_scores mts
        JOIN models m ON mts.model_id = m.id
        WHERE mts.matches_played > 0
      ),
      tag_stats AS (
        SELECT
          tag_id,
          COUNT(DISTINCT model_id) as total_models,
          -- Use a more conservative estimate for total matches
          -- This is still not perfect but won't break the API
          CASE
            WHEN COUNT(DISTINCT model_id) > 0
            THEN CAST(SUM(matches_played) / COUNT(DISTINCT model_id) AS INTEGER)
            ELSE 0
          END as total_matches,
          AVG(elo_score) as average_elo
        FROM model_tag_scores
        WHERE matches_played > 0
        GROUP BY tag_id
      )
      SELECT
        rm.tag_id,
        rm.model_id,
        rm.model_name,
        rm.provider,
        rm.elo_score,
        rm.matches_played,
        rm.win_rate,
        ts.total_models,
        ts.total_matches,
        ts.average_elo
      FROM ranked_models rm
      JOIN tag_stats ts ON rm.tag_id = ts.tag_id
      WHERE rm.rank = 1
      ORDER BY rm.tag_id
    `;

    const queryResult = await db.execute(query);

    // Handle different possible result formats from Drizzle
    const results = Array.isArray(queryResult) ? queryResult : queryResult.rows || [];

    console.log(`Query returned ${results.length} results`);

    // Transform results into the expected format
    const taxonomyData: Record<string, any> = {};
    const uniqueModels = new Set<string>();

    results.forEach((row: any) => {
      const tagId = row.tag_id;
      uniqueModels.add(row.model_id);

      taxonomyData[tagId] = {
        success: true,
        models: [
          {
            modelId: row.model_id,
            modelName: row.model_name || row.model_id,
            provider: row.provider || "Unknown",
            eloScore: Number(row.elo_score || 1200),
            globalScore: Number(row.elo_score || 1200),
            matchesPlayed: Number(row.matches_played || 0),
            winRate: Number(row.win_rate || 0.5),
            rank: 1,
          },
        ],
        stats: {
          totalModels: Number(row.total_models || 0),
          totalMatches: Number(row.total_matches || 0),
          averageElo: Number(row.average_elo || 1200),
        },
      };
    });

    // Calculate overall stats correctly from source data (not by summing tag stats)
    const overallStatsQuery = sql`
      SELECT
        COUNT(DISTINCT model_id) as total_models,
        COUNT(DISTINCT tag_id) as total_capabilities,
        SUM(matches_played) as total_tag_matches
      FROM model_tag_scores
      WHERE matches_played > 0
    `;

    // Get actual tournament/match counts (not tag-aggregated)

    const overallStatsResult = await db.execute(overallStatsQuery);
    const overallStatsRow = Array.isArray(overallStatsResult)
      ? overallStatsResult[0]
      : overallStatsResult.rows?.[0];

    const queryTime = Date.now() - startTime;
    console.log(
      `Taxonomy overview query completed in ${queryTime}ms for ${results.length} capabilities`,
    );

    return NextResponse.json(
      {
        success: true,
        taxonomyData,
        overallStats: {
          totalModels: Number(overallStatsRow?.total_models || uniqueModels.size),
          totalCapabilities: results.length,
          totalMatches: Number(overallStatsRow?.total_tag_matches || 0),
        },
        meta: {
          queryTimeMs: queryTime,
          capabilitiesReturned: results.length,
          cacheHint: "max-age=300", // 5 minutes
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "X-Query-Time": queryTime.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Taxonomy leaderboard overview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch taxonomy overview",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}
