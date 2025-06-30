import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { ELOUpdate } from "@/types/api-models";
import type {
  HierarchicalELOUpdate,
  TagELOUpdate,
  UpdateHierarchicalELOParams,
} from "@/types/hierarchical-elo";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { calculateNewEloRating } from "./core";
import { getOrCreateModelScore, getOrCreateModelTagScore } from "./database";

// Lazy import database to avoid build-time connection issues
// import { db } from "../../../db";
// import { matchResults, modelScores, modelTagScores } from "../../../db/schema";

/**
 * ELO Score Update Operations
 *
 * Contains both global and hierarchical ELO update logic that share
 * the same core calculation algorithms and database patterns.
 */

/**
 * Update global ELO scores for two models after a head-to-head match.
 * Records the match result and updates both models' statistics.
 * Skips ELO updates for non-competitive matches (forfeit, random_advance).
 *
 * @param params - Match result parameters
 * @returns Array of ELO updates showing before/after scores
 */
export async function updateEloScores(params: {
  tournamentRunId: string;
  roundNumber: number;
  winnerModelId: string;
  loserModelId: string;
  resultType?: "judged" | "forfeit" | "random_advance";
}): Promise<ELOUpdate[]> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { matchResults, modelScores } = await import("../../../db/schema");

  const {
    tournamentRunId,
    roundNumber,
    winnerModelId,
    loserModelId,
    resultType = "judged",
  } = params;

  // Skip ELO updates for non-competitive results
  if (resultType !== "judged") {
    console.log(
      `[elo] Skipping ELO update for ${resultType} match: ${winnerModelId} vs ${loserModelId}`,
    );

    // Still record the match for historical purposes but with no score changes
    const [winnerScore, loserScore] = await Promise.all([
      getOrCreateModelScore(winnerModelId),
      getOrCreateModelScore(loserModelId),
    ]);

    if (!winnerScore || !loserScore) {
      throw new Error("Failed to get or create model scores");
    }

    const now = new Date();
    const matchResult = {
      id: nanoid(),
      tournamentRunId,
      roundNumber,
      winnerModelId,
      loserModelId,
      winnerScoreBefore: winnerScore.globalScore,
      loserScoreBefore: loserScore.globalScore,
      winnerScoreAfter: winnerScore.globalScore, // No change
      loserScoreAfter: loserScore.globalScore, // No change
      resultType,
      createdAt: now,
    };

    await db.insert(matchResults).values(matchResult);
    return []; // No ELO updates
  }

  // Get current scores for both models
  const [winnerScore, loserScore] = await Promise.all([
    getOrCreateModelScore(winnerModelId),
    getOrCreateModelScore(loserModelId),
  ]);

  if (!winnerScore || !loserScore) {
    throw new Error("Failed to get or create model scores");
  }

  // Calculate new ELO ratings
  const winnerNewRating = calculateNewEloRating(
    winnerScore.globalScore,
    loserScore.globalScore,
    1, // Winner gets score of 1
  );

  const loserNewRating = calculateNewEloRating(
    loserScore.globalScore,
    winnerScore.globalScore,
    0, // Loser gets score of 0
  );

  const now = new Date();

  // Update winner's score
  await db
    .update(modelScores)
    .set({
      globalScore: winnerNewRating,
      matchesPlayed: winnerScore.matchesPlayed + 1,
      wins: winnerScore.wins + 1,
      updatedAt: now,
    })
    .where(eq(modelScores.modelId, winnerModelId));

  // Update loser's score
  await db
    .update(modelScores)
    .set({
      globalScore: loserNewRating,
      matchesPlayed: loserScore.matchesPlayed + 1,
      losses: loserScore.losses + 1,
      updatedAt: now,
    })
    .where(eq(modelScores.modelId, loserModelId));

  // Record the match result for historical analysis
  const matchResult = {
    id: nanoid(),
    tournamentRunId,
    roundNumber,
    winnerModelId,
    loserModelId,
    winnerScoreBefore: winnerScore.globalScore,
    loserScoreBefore: loserScore.globalScore,
    winnerScoreAfter: winnerNewRating,
    loserScoreAfter: loserNewRating,
    resultType: (resultType as "judged" | "forfeit" | "random_advance") || "judged",
    createdAt: now,
  };

  await db.insert(matchResults).values(matchResult);

  // Return the ELO updates
  return [
    {
      modelId: winnerModelId,
      oldScore: winnerScore.globalScore,
      newScore: winnerNewRating,
      change: winnerNewRating - winnerScore.globalScore,
    },
    {
      modelId: loserModelId,
      oldScore: loserScore.globalScore,
      newScore: loserNewRating,
      change: loserNewRating - loserScore.globalScore,
    },
  ];
}

/**
 * Update hierarchical ELO scores for two models after a head-to-head match.
 * Updates scores for all relevant tags in the hierarchy (leaf tags + all parent tags).
 * Uses the same ELO algorithm as the global system for consistency.
 *
 * @param params - Match result parameters including tournament tag IDs
 * @returns Array of hierarchical ELO updates for both models
 */
export async function updateHierarchicalEloScores(
  params: UpdateHierarchicalELOParams,
): Promise<HierarchicalELOUpdate[]> {
  const {
    tournamentRunId: _tournamentRunId,
    roundNumber: _roundNumber,
    winnerModelId,
    loserModelId,
    tournamentTagIds,
    resultType = "judged",
  } = params;

  // Skip ELO updates for non-competitive results
  if (resultType !== "judged") {
    console.log(
      `[hierarchical-elo] Skipping hierarchical ELO update for ${resultType} match: ${winnerModelId} vs ${loserModelId}`,
    );
    return []; // No ELO updates
  }

  // Defensive check: ensure tournamentTagIds is a non-empty array
  console.log(
    `[hierarchical-elo] Received tournamentTagIds:`,
    tournamentTagIds,
    `(type: ${typeof tournamentTagIds})`,
  );

  if (!tournamentTagIds) {
    console.log(
      `[hierarchical-elo] tournamentTagIds is null/undefined, skipping hierarchical ELO update`,
    );
    return [];
  }

  if (!Array.isArray(tournamentTagIds)) {
    console.log(
      `[hierarchical-elo] tournamentTagIds is not an array (type: ${typeof tournamentTagIds}), skipping hierarchical ELO update`,
    );
    return [];
  }

  if (tournamentTagIds.length === 0) {
    console.log(
      `[hierarchical-elo] tournamentTagIds is empty array, skipping hierarchical ELO update`,
    );
    return [];
  }

  console.log(
    `[hierarchical-elo] Processing ${tournamentTagIds.length} tournament tag IDs:`,
    tournamentTagIds,
  );

  // Import getTagLineage from the tag taxonomy
  const { getTagLineage } = await import("../tag-taxonomy");

  // Build set of all tags to update (leaf tags + all parent tags in hierarchy)
  const allTagsToUpdate = new Set<HierarchicalTagId>();

  for (const leafTag of tournamentTagIds) {
    const lineage = getTagLineage(leafTag); // Returns [pillar, family, leaf] or [pillar, leaf]
    lineage.forEach((tag) => allTagsToUpdate.add(tag.id as HierarchicalTagId));
  }

  console.log(
    `[hierarchical-elo] Updating scores for ${allTagsToUpdate.size} tags: ${Array.from(allTagsToUpdate).join(", ")}`,
  );

  // Get current scores for both models for all relevant tags
  const winnerTagUpdates: TagELOUpdate[] = [];
  const loserTagUpdates: TagELOUpdate[] = [];

  // Process each tag update
  for (const tagId of allTagsToUpdate) {
    try {
      // Get current scores for both models for this tag
      const [winnerScore, loserScore] = await Promise.all([
        getOrCreateModelTagScore(winnerModelId, tagId),
        getOrCreateModelTagScore(loserModelId, tagId),
      ]);

      // Calculate new ELO ratings using the same algorithm as global system
      const winnerNewRating = calculateNewEloRating(
        winnerScore.eloScore,
        loserScore.eloScore,
        1, // Winner gets score of 1
      );

      const loserNewRating = calculateNewEloRating(
        loserScore.eloScore,
        winnerScore.eloScore,
        0, // Loser gets score of 0
      );

      const now = new Date();

      // Lazy import database
      const { db } = await import("../../../db");
      const { modelTagScores } = await import("../../../db/schema");

      // Update winner's tag score
      await db
        .update(modelTagScores)
        .set({
          eloScore: winnerNewRating,
          matchesPlayed: winnerScore.matchesPlayed + 1,
          wins: winnerScore.wins + 1,
          updatedAt: now,
        })
        .where(
          sql`${modelTagScores.modelId} = ${winnerModelId} AND ${modelTagScores.tagId} = ${tagId}`,
        );

      // Update loser's tag score
      await db
        .update(modelTagScores)
        .set({
          eloScore: loserNewRating,
          matchesPlayed: loserScore.matchesPlayed + 1,
          losses: loserScore.losses + 1,
          updatedAt: now,
        })
        .where(
          sql`${modelTagScores.modelId} = ${loserModelId} AND ${modelTagScores.tagId} = ${tagId}`,
        );

      // Record the updates
      winnerTagUpdates.push({
        modelId: winnerModelId,
        tagId,
        oldScore: winnerScore.eloScore,
        newScore: winnerNewRating,
        change: winnerNewRating - winnerScore.eloScore,
      });

      loserTagUpdates.push({
        modelId: loserModelId,
        tagId,
        oldScore: loserScore.eloScore,
        newScore: loserNewRating,
        change: loserNewRating - loserScore.eloScore,
      });

      console.log(
        `[hierarchical-elo] Updated ${tagId}: ${winnerModelId} ${winnerScore.eloScore}→${winnerNewRating} (+${winnerNewRating - winnerScore.eloScore}), ${loserModelId} ${loserScore.eloScore}→${loserNewRating} (${loserNewRating - loserScore.eloScore})`,
      );
    } catch (error) {
      console.error(`[hierarchical-elo] Failed to update scores for tag ${tagId}:`, error);
      // Continue with other tags even if one fails
    }
  }

  return [
    {
      modelId: winnerModelId,
      tagUpdates: winnerTagUpdates,
      globalUpdate: { oldScore: 0, newScore: 0, change: 0 }, // Placeholder - global update handled separately
    },
    {
      modelId: loserModelId,
      tagUpdates: loserTagUpdates,
      globalUpdate: { oldScore: 0, newScore: 0, change: 0 }, // Placeholder - global update handled separately
    },
  ];
}
