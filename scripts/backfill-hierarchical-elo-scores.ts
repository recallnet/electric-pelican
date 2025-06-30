#!/usr/bin/env tsx

/**
 * Backfill Historical Hierarchical ELO Scores
 *
 * This script processes all historical tournament data to calculate and populate
 * hierarchical ELO scores for all models across all capability tags.
 *
 * Process:
 * 1. Find all tournaments with hierarchical tags (tagIds)
 * 2. For each tournament, get all match results from tournament runs
 * 3. Process matches chronologically to calculate ELO scores
 * 4. Update hierarchical scores for all tags in each tournament's lineage
 * 5. Maintain same ELO algorithm as global system (K=32, starting 1200)
 *
 * Usage:
 *   tsx scripts/backfill-hierarchical-elo-scores.ts [options]
 *
 * Options:
 *   --dry-run          Preview changes without applying them
 *   --limit=N          Process only first N tournaments (for testing)
 *   --batch-size=N     Process tournaments in batches of N (default: 10)
 *   --reset            Clear all existing hierarchical scores before backfill
 *   --verbose          Show detailed progress information
 *   --tournament-id=ID Process only specific tournament ID
 */

import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { db } from "../db";
import { tournaments, tournamentRuns, matchResults, modelTagScores } from "../db/schema";
import { getTagLineage } from "../src/lib/tag-taxonomy";
import { calculateNewEloRating } from "../src/lib/elo-scoring";
import { nanoid } from "nanoid";
import type { HierarchicalTagId } from "../src/types/taxonomy";

// Command line argument parsing
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limit = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
const batchSize = parseInt(
  args.find((arg) => arg.startsWith("--batch-size="))?.split("=")[1] || "10",
);
const shouldReset = args.includes("--reset");
const isVerbose = args.includes("--verbose");
const specificTournamentId = args.find((arg) => arg.startsWith("--tournament-id="))?.split("=")[1];

interface ProcessingStats {
  tournamentsProcessed: number;
  matchesProcessed: number;
  modelsUpdated: number;
  tagsProcessed: number;
  errors: string[];
  startTime: number;
}

interface TournamentData {
  id: string;
  title: string;
  tagIds: HierarchicalTagId[];
  runId: string;
  matches: MatchData[];
}

interface MatchData {
  winnerModelId: string;
  loserModelId: string;
  resultType: string;
  createdAt: Date;
  roundNumber: number;
}

interface ModelTagScore {
  modelId: string;
  tagId: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

/**
 * Get or create a model tag score record.
 * Uses the same upsert pattern as the main system.
 */
async function getOrCreateModelTagScore(
  modelId: string,
  tagId: string,
  scores: Map<string, ModelTagScore>,
): Promise<ModelTagScore> {
  const key = `${modelId}:${tagId}`;

  if (scores.has(key)) {
    return scores.get(key)!;
  }

  // Check if it exists in database
  const existing = await db
    .select()
    .from(modelTagScores)
    .where(and(eq(modelTagScores.modelId, modelId), eq(modelTagScores.tagId, tagId)))
    .limit(1);

  let score: ModelTagScore;
  if (existing.length > 0 && existing[0]) {
    score = {
      modelId: existing[0].modelId,
      tagId: existing[0].tagId,
      eloScore: existing[0].eloScore,
      matchesPlayed: existing[0].matchesPlayed,
      wins: existing[0].wins,
      losses: existing[0].losses,
    };
  } else {
    // Create new score with starting values
    score = {
      modelId,
      tagId,
      eloScore: 1200, // Starting ELO
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    };
  }

  scores.set(key, score);
  return score;
}

/**
 * Update ELO scores for two models after a match.
 * Uses the same algorithm as the global ELO system.
 */
export function updateEloScoresForMatch(
  winnerScore: ModelTagScore,
  loserScore: ModelTagScore,
): void {
  // Calculate new ratings using the same algorithm as global ELO
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

  // Update winner stats
  winnerScore.eloScore = winnerNewRating;
  winnerScore.matchesPlayed += 1;
  winnerScore.wins += 1;

  // Update loser stats
  loserScore.eloScore = loserNewRating;
  loserScore.matchesPlayed += 1;
  loserScore.losses += 1;
}

/**
 * Get all tournaments with hierarchical tags.
 */
export async function getTournamentsWithTags(): Promise<
  Array<{
    id: string;
    title: string;
    tagIds: any;
  }>
> {
  let results;

  // Apply specific tournament filter if provided
  if (specificTournamentId) {
    results = await db
      .select({
        id: tournaments.id,
        title: tournaments.title,
        tagIds: tournaments.tagIds,
      })
      .from(tournaments)
      .where(eq(tournaments.id, specificTournamentId));
  } else {
    // Get all tournaments ordered by creation date
    results = await db
      .select({
        id: tournaments.id,
        title: tournaments.title,
        tagIds: tournaments.tagIds,
      })
      .from(tournaments)
      .orderBy(asc(tournaments.createdAt));
  }

  // Filter for tournaments that have tagIds
  return results.filter((t) => {
    if (!t.tagIds) return false;

    let tagIds: any[];
    if (typeof t.tagIds === "string") {
      try {
        tagIds = JSON.parse(t.tagIds);
      } catch {
        return false;
      }
    } else {
      tagIds = t.tagIds;
    }

    return Array.isArray(tagIds) && tagIds.length > 0;
  });
}

/**
 * Get all match results for a tournament.
 */
export async function getTournamentMatches(tournamentId: string): Promise<{
  runId: string | null;
  matches: MatchData[];
}> {
  // Get the most recent tournament run
  const runs = await db
    .select()
    .from(tournamentRuns)
    .where(eq(tournamentRuns.tournamentId, tournamentId))
    .orderBy(desc(tournamentRuns.startedAt))
    .limit(1);

  if (runs.length === 0 || !runs[0]) {
    return { runId: null, matches: [] };
  }

  const run = runs[0];

  // Get all match results for this tournament run
  const matches = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.tournamentRunId, run.id))
    .orderBy(asc(matchResults.createdAt)); // Process matches chronologically

  return {
    runId: run.id,
    matches: matches.map((match) => ({
      winnerModelId: match.winnerModelId,
      loserModelId: match.loserModelId,
      resultType: match.resultType || "judged",
      createdAt: match.createdAt,
      roundNumber: match.roundNumber,
    })),
  };
}

/**
 * Process a single tournament and update hierarchical ELO scores.
 */
export async function processTournament(
  tournament: { id: string; title: string; tagIds: any },
  scores: Map<string, ModelTagScore>,
  stats: ProcessingStats,
): Promise<void> {
  try {
    // Parse tagIds
    let tagIds: HierarchicalTagId[];
    if (typeof tournament.tagIds === "string") {
      tagIds = JSON.parse(tournament.tagIds);
    } else {
      tagIds = tournament.tagIds;
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      if (isVerbose) {
        console.log(`⚠️  Tournament ${tournament.id} has no valid tagIds, skipping`);
      }
      return;
    }

    // Get all matches for this tournament
    const { runId, matches } = await getTournamentMatches(tournament.id);

    if (!runId || matches.length === 0) {
      if (isVerbose) {
        console.log(`⚠️  Tournament ${tournament.id} has no matches, skipping`);
      }
      return;
    }

    // Build set of all tags to update (leaf tags + all parent tags)
    const allTagsToUpdate = new Set<HierarchicalTagId>();

    for (const leafTag of tagIds) {
      const lineage = getTagLineage(leafTag);
      lineage.forEach((tag) => allTagsToUpdate.add(tag.id as HierarchicalTagId));
    }

    if (isVerbose) {
      console.log(`📊 Processing tournament: ${tournament.title}`);
      console.log(`   📋 Tags: ${Array.from(allTagsToUpdate).join(", ")}`);
      console.log(`   🥊 Matches: ${matches.length}`);
    }

    // Process each match chronologically
    for (const match of matches) {
      // Skip non-judged matches (forfeit, random_advance)
      if (match.resultType !== "judged") {
        if (isVerbose) {
          console.log(
            `   ⏭️  Skipping ${match.resultType} match: ${match.winnerModelId} vs ${match.loserModelId}`,
          );
        }
        continue;
      }

      // Update scores for all tags in the hierarchy
      for (const tagId of allTagsToUpdate) {
        const winnerScore = await getOrCreateModelTagScore(match.winnerModelId, tagId, scores);
        const loserScore = await getOrCreateModelTagScore(match.loserModelId, tagId, scores);

        updateEloScoresForMatch(winnerScore, loserScore);
      }

      stats.matchesProcessed++;

      if (isVerbose && stats.matchesProcessed % 10 === 0) {
        console.log(`   ⚡ Processed ${stats.matchesProcessed} matches...`);
      }
    }

    stats.tournamentsProcessed++;
    stats.tagsProcessed += allTagsToUpdate.size;

    console.log(
      `✅ Completed tournament: ${tournament.title} (${matches.filter((m) => m.resultType === "judged").length} judged matches)`,
    );
  } catch (error) {
    const errorMsg = `Failed to process tournament ${tournament.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
}

/**
 * Save all updated scores to the database.
 */
export async function saveScoresToDatabase(
  scores: Map<string, ModelTagScore>,
  stats: ProcessingStats,
): Promise<void> {
  if (isDryRun) {
    console.log(`\n🔍 DRY RUN: Would update ${scores.size} model-tag score records`);
    return;
  }

  console.log(`\n💾 Saving ${scores.size} model-tag score records to database...`);

  const batchSize = 100;
  const scoreArray = Array.from(scores.values());

  for (let i = 0; i < scoreArray.length; i += batchSize) {
    const batch = scoreArray.slice(i, i + batchSize);

    try {
      // Use upsert pattern to handle existing records
      for (const score of batch) {
        const now = new Date();

        await db
          .insert(modelTagScores)
          .values({
            id: nanoid(),
            modelId: score.modelId,
            tagId: score.tagId,
            eloScore: score.eloScore,
            matchesPlayed: score.matchesPlayed,
            wins: score.wins,
            losses: score.losses,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [modelTagScores.modelId, modelTagScores.tagId],
            set: {
              eloScore: score.eloScore,
              matchesPlayed: score.matchesPlayed,
              wins: score.wins,
              losses: score.losses,
              updatedAt: now,
            },
          });
      }

      console.log(
        `   📝 Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(scoreArray.length / batchSize)}`,
      );
    } catch (error) {
      const errorMsg = `Failed to save batch starting at index ${i}: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  stats.modelsUpdated = new Set(scoreArray.map((s) => s.modelId)).size;
  console.log(`✅ Successfully saved all score records`);
}

/**
 * Reset all existing hierarchical ELO scores.
 */
async function resetExistingScores(): Promise<void> {
  if (isDryRun) {
    console.log(`🔍 DRY RUN: Would clear all existing hierarchical ELO scores`);
    return;
  }

  console.log(`🗑️  Clearing all existing hierarchical ELO scores...`);

  try {
    const result = await db.delete(modelTagScores);
    console.log(`✅ Cleared existing scores`);
  } catch (error) {
    console.error(
      `❌ Failed to clear existing scores: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

/**
 * Main execution function.
 */
async function main(): Promise<void> {
  const stats: ProcessingStats = {
    tournamentsProcessed: 0,
    matchesProcessed: 0,
    modelsUpdated: 0,
    tagsProcessed: 0,
    errors: [],
    startTime: Date.now(),
  };

  console.log(`🚀 Starting Hierarchical ELO Backfill`);
  console.log(`   Mode: ${isDryRun ? "DRY RUN" : "LIVE UPDATE"}`);
  console.log(`   Batch Size: ${batchSize}`);
  console.log(`   Limit: ${limit || "No limit"}`);
  console.log(`   Reset: ${shouldReset ? "Yes" : "No"}`);
  console.log(`   Specific Tournament: ${specificTournamentId || "All tournaments"}`);
  console.log(`   Verbose: ${isVerbose ? "Yes" : "No"}`);

  try {
    // Reset existing scores if requested
    if (shouldReset) {
      await resetExistingScores();
    }

    // Get all tournaments with hierarchical tags
    console.log(`\n📋 Finding tournaments with hierarchical tags...`);
    const allTournaments = await getTournamentsWithTags();

    const tournamentsToProcess = limit ? allTournaments.slice(0, parseInt(limit)) : allTournaments;

    console.log(`📊 Found ${allTournaments.length} tournaments with tags`);
    console.log(`🎯 Processing ${tournamentsToProcess.length} tournaments`);

    if (tournamentsToProcess.length === 0) {
      console.log(`⚠️  No tournaments found with hierarchical tags. Exiting.`);
      return;
    }

    // Track all model-tag scores in memory for batch processing
    const scores = new Map<string, ModelTagScore>();

    // Process tournaments in batches
    for (let i = 0; i < tournamentsToProcess.length; i += batchSize) {
      const batch = tournamentsToProcess.slice(i, i + batchSize);

      console.log(
        `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tournamentsToProcess.length / batchSize)}`,
      );

      // Process tournaments in parallel within each batch
      await Promise.all(batch.map((tournament) => processTournament(tournament, scores, stats)));

      console.log(`✅ Completed batch ${Math.floor(i / batchSize) + 1}`);
    }

    // Save all scores to database
    await saveScoresToDatabase(scores, stats);

    // Print final statistics
    const duration = (Date.now() - stats.startTime) / 1000;

    console.log(`\n🎉 Backfill Complete!`);
    console.log(`📊 Statistics:`);
    console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`);
    console.log(`   🏆 Tournaments: ${stats.tournamentsProcessed}`);
    console.log(`   🥊 Matches: ${stats.matchesProcessed}`);
    console.log(`   🤖 Models: ${stats.modelsUpdated}`);
    console.log(`   🏷️  Tags: ${stats.tagsProcessed}`);
    console.log(`   📝 Score Records: ${scores.size}`);
    console.log(`   ❌ Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      stats.errors.forEach((error) => console.log(`   • ${error}`));
    }

    if (isDryRun) {
      console.log(`\n🔍 This was a DRY RUN - no changes were made to the database`);
      console.log(`   Remove --dry-run flag to apply changes`);
    }
  } catch (error) {
    console.error(`💥 Fatal error during backfill:`, error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}
