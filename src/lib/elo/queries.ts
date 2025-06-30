import { and, desc, eq, sql } from "drizzle-orm";

import type { MatchResult, ModelScore } from "@/types/api-models";
import type { ModelTagScore } from "@/types/hierarchical-elo";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { getOrCreateModelScore } from "./database";

// Lazy import database to avoid build-time connection issues
// import { db } from "../../../db";
// import { matchResults, modelScores, modelTagScores } from "../../../db/schema";

/**
 * ELO Query Operations
 *
 * Leaderboard and statistics functions for both global and hierarchical ELO systems.
 */

/**
 * Get global leaderboard of models sorted by ELO rating.
 * Includes pagination and sorting options.
 *
 * @param options - Query options for pagination and sorting
 * @returns Paginated list of model scores with rankings
 */
export async function getLeaderboard(
  options: {
    page?: number;
    limit?: number;
    sortBy?: "globalScore" | "winRate" | "matchesPlayed";
    order?: "asc" | "desc";
  } = {},
): Promise<{
  models: ModelScore[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { modelScores } = await import("../../../db/schema");

  const { page = 1, limit = 50, sortBy = "globalScore", order = "desc" } = options;

  const offset = (page - 1) * limit;

  // Build sort column
  let sortColumn;
  switch (sortBy) {
    case "winRate":
      // Calculate win rate as wins / matches_played, handling division by zero
      sortColumn = sql`CASE WHEN ${modelScores.matchesPlayed} = 0 THEN 0 ELSE CAST(${modelScores.wins} AS REAL) / ${modelScores.matchesPlayed} END`;
      break;
    case "matchesPlayed":
      sortColumn = modelScores.matchesPlayed;
      break;
    default:
      sortColumn = modelScores.globalScore;
  }

  // Get total count
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(modelScores);

  const total = parseInt(String(totalResult[0]?.count || 0), 10);

  // Get paginated results with ranking
  const results = await db
    .select({
      modelId: modelScores.modelId,
      globalScore: modelScores.globalScore,
      matchesPlayed: modelScores.matchesPlayed,
      wins: modelScores.wins,
      losses: modelScores.losses,
      updatedAt: modelScores.updatedAt,
    })
    .from(modelScores)
    .orderBy(order === "desc" ? desc(sortColumn) : sortColumn)
    .limit(limit)
    .offset(offset);

  // Add calculated fields and rankings
  const modelsWithRanking: ModelScore[] = results.map((model, index) => ({
    modelId: model.modelId,
    globalScore: model.globalScore,
    matchesPlayed: model.matchesPlayed,
    wins: model.wins,
    losses: model.losses,
    winRate: model.matchesPlayed > 0 ? model.wins / model.matchesPlayed : 0,
    rank: offset + index + 1,
    lastActive: model.updatedAt.toISOString(),
  }));

  return {
    models: modelsWithRanking,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get detailed statistics for a specific model.
 * Includes ELO history and recent match results.
 *
 * @param modelId - OpenRouter model ID
 * @returns Detailed model statistics and history
 */
export async function getModelStats(modelId: string): Promise<{
  modelScore: ModelScore;
  recentMatches: MatchResult[];
  eloHistory: Array<{ date: string; score: number; change: number }>;
}> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { matchResults } = await import("../../../db/schema");

  // Get current model score
  const scoreResult = await getOrCreateModelScore(modelId);

  if (!scoreResult) {
    throw new Error(`Failed to get or create model score for ${modelId}`);
  }

  const modelScore: ModelScore = {
    modelId: scoreResult.modelId,
    globalScore: scoreResult.globalScore,
    matchesPlayed: scoreResult.matchesPlayed,
    wins: scoreResult.wins,
    losses: scoreResult.losses,
    winRate: scoreResult.matchesPlayed > 0 ? scoreResult.wins / scoreResult.matchesPlayed : 0,
    rank: 0, // Will be calculated separately if needed
    lastActive: scoreResult.updatedAt.toISOString(),
  };

  // Get recent matches (last 20)
  const recentMatchesData = await db
    .select()
    .from(matchResults)
    .where(
      sql`${matchResults.winnerModelId} = ${modelId} OR ${matchResults.loserModelId} = ${modelId}`,
    )
    .orderBy(desc(matchResults.createdAt))
    .limit(20);

  const recentMatches: MatchResult[] = recentMatchesData.map((match) => ({
    tournamentRunId: match.tournamentRunId,
    roundNumber: match.roundNumber,
    winnerModelId: match.winnerModelId,
    loserModelId: match.loserModelId,
    winnerScoreBefore: match.winnerScoreBefore,
    loserScoreBefore: match.loserScoreBefore,
    winnerScoreAfter: match.winnerScoreAfter,
    loserScoreAfter: match.loserScoreAfter,
    resultType: (match.resultType || "judged") as "judged" | "forfeit" | "random_advance",
    createdAt: match.createdAt.toISOString(),
  }));

  // Build ELO history from match results
  const eloHistory = recentMatchesData
    .map((match) => {
      const isWinner = match.winnerModelId === modelId;
      const scoreBefore = isWinner ? match.winnerScoreBefore : match.loserScoreBefore;
      const scoreAfter = isWinner ? match.winnerScoreAfter : match.loserScoreAfter;

      return {
        date: match.createdAt.toISOString(),
        score: scoreAfter,
        change: scoreAfter - scoreBefore,
      };
    })
    .reverse(); // Reverse to show chronological order

  return {
    modelScore,
    recentMatches,
    eloHistory,
  };
}

/**
 * Get all tag scores for a specific model.
 * Returns scores sorted by ELO rating descending.
 *
 * @param modelId - OpenRouter model ID
 * @returns Array of model tag scores with calculated win rates
 */
export async function getModelTagScores(modelId: string): Promise<ModelTagScore[]> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { modelTagScores } = await import("../../../db/schema");

  const scores = await db
    .select()
    .from(modelTagScores)
    .where(eq(modelTagScores.modelId, modelId))
    .orderBy(sql`${modelTagScores.eloScore} DESC`);

  return scores.map((score, index) => ({
    modelId: score.modelId,
    tagId: score.tagId as HierarchicalTagId,
    eloScore: score.eloScore,
    matchesPlayed: score.matchesPlayed,
    wins: score.wins,
    losses: score.losses,
    winRate: score.matchesPlayed > 0 ? score.wins / score.matchesPlayed : 0,
    rank: index + 1, // Simple ranking based on sort order
    lastActive: score.updatedAt.toISOString(),
  }));
}

/**
 * Get leaderboard for a specific tag.
 * Returns models sorted by specified field and order.
 *
 * @param tagId - Hierarchical tag ID
 * @param options - Query options for pagination and sorting
 * @returns Paginated list of model tag scores with rankings
 */
export async function getTagLeaderboard(
  tagId: HierarchicalTagId,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "eloScore" | "winRate" | "matchesPlayed";
    order?: "asc" | "desc";
    includeInactive?: boolean;
  } = {},
): Promise<{
  models: ModelTagScore[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { modelTagScores } = await import("../../../db/schema");

  const {
    page = 1,
    limit = 50,
    sortBy = "eloScore",
    order = "desc",
    includeInactive = true,
  } = options;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  let whereClause = eq(modelTagScores.tagId, tagId);
  if (!includeInactive) {
    // Only include models with matches in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    whereClause = and(whereClause, sql`${modelTagScores.updatedAt} > ${thirtyDaysAgo}`)!;
  }

  // Build sort column
  let sortColumn;
  switch (sortBy) {
    case "winRate":
      sortColumn = sql`CASE WHEN ${modelTagScores.matchesPlayed} = 0 THEN 0 ELSE CAST(${modelTagScores.wins} AS REAL) / ${modelTagScores.matchesPlayed} END`;
      break;
    case "matchesPlayed":
      sortColumn = modelTagScores.matchesPlayed;
      break;
    default:
      sortColumn = modelTagScores.eloScore;
  }

  // Get total count for this tag
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(modelTagScores)
    .where(whereClause);

  const total = parseInt(String(totalResult[0]?.count || 0), 10);

  // Get paginated results with proper sorting
  const results = await db
    .select()
    .from(modelTagScores)
    .where(whereClause)
    .orderBy(order === "desc" ? desc(sortColumn) : sortColumn)
    .limit(limit)
    .offset(offset);

  // Add calculated fields and rankings
  const modelsWithRanking: ModelTagScore[] = results.map((score, index) => ({
    modelId: score.modelId,
    tagId: score.tagId as HierarchicalTagId,
    eloScore: score.eloScore,
    matchesPlayed: score.matchesPlayed,
    wins: score.wins,
    losses: score.losses,
    winRate: score.matchesPlayed > 0 ? score.wins / score.matchesPlayed : 0,
    rank: offset + index + 1,
    lastActive: score.updatedAt.toISOString(),
  }));

  return {
    models: modelsWithRanking,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
