import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { HierarchicalTagId } from "@/types/taxonomy";

import { STARTING_ELO } from "./core";

// Lazy import database to avoid build-time connection issues
// import { db } from "../../../db";
// import { modelScores, modelTagScores } from "../../../db/schema";

/**
 * Database operations for ELO scores shared between global and hierarchical systems.
 *
 * Uses PostgreSQL's upsert patterns to handle race conditions with concurrent tournaments.
 */

/**
 * Get or create a model's global ELO score record.
 * Creates new record with starting rating if model hasn't been scored before.
 * Uses PostgreSQL's upsert pattern to handle race conditions with concurrent tournaments.
 *
 * @param modelId - OpenRouter model ID (e.g., "anthropic/claude-3-sonnet")
 * @returns Model score record from database
 */
export async function getOrCreateModelScore(modelId: string) {
  // Lazy import database
  const { db } = await import("../../../db");
  const { modelScores } = await import("../../../db/schema");

  const now = new Date();

  // Use PostgreSQL's upsert feature (INSERT ... ON CONFLICT ... DO NOTHING)
  // This will attempt to insert, but if the record already exists, it won't fail
  const newScore = {
    id: nanoid(),
    modelId,
    globalScore: STARTING_ELO,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db
      .insert(modelScores)
      .values(newScore)
      .onConflictDoNothing({ target: modelScores.modelId });

    // After attempting insert, we need to fetch the record (whether it was just inserted or already existed)
    const score = await db
      .select()
      .from(modelScores)
      .where(eq(modelScores.modelId, modelId))
      .limit(1);

    if (score.length > 0 && score[0]) {
      return score[0];
    }

    throw new Error(`Failed to get model score after upsert for ${modelId}`);
  } catch (error) {
    console.error(`Failed to get or create model score for ${modelId}:`, error);
    // Even if insert fails, try to get the existing record as a fallback
    const existingScore = await db
      .select()
      .from(modelScores)
      .where(eq(modelScores.modelId, modelId))
      .limit(1);

    if (existingScore.length > 0 && existingScore[0]) {
      return existingScore[0];
    }

    // If we still can't get a record, rethrow the error
    throw error;
  }
}

/**
 * Get or create a model's ELO score record for a specific tag.
 * Creates new record with starting rating if model hasn't been scored for this tag before.
 * Uses PostgreSQL's upsert pattern to handle race conditions with concurrent tournaments.
 *
 * @param modelId - OpenRouter model ID (e.g., "anthropic/claude-3-sonnet")
 * @param tagId - Hierarchical tag ID from taxonomy
 * @returns Model tag score record from database
 */
export async function getOrCreateModelTagScore(
  modelId: string,
  tagId: HierarchicalTagId,
): Promise<{
  id: string;
  modelId: string;
  tagId: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  createdAt: Date;
  updatedAt: Date;
}> {
  // Lazy import database
  const { db } = await import("../../../db");
  const { modelTagScores } = await import("../../../db/schema");
  const { sql } = await import("drizzle-orm");

  const now = new Date();

  // Use PostgreSQL's upsert feature (INSERT ... ON CONFLICT ... DO NOTHING)
  // This will attempt to insert, but if the record already exists, it won't fail
  const newScore = {
    id: nanoid(),
    modelId,
    tagId,
    eloScore: STARTING_ELO,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db
      .insert(modelTagScores)
      .values(newScore)
      .onConflictDoNothing({ target: [modelTagScores.modelId, modelTagScores.tagId] });

    // After attempting insert, we need to fetch the record (whether it was just inserted or already existed)
    const score = await db
      .select()
      .from(modelTagScores)
      .where(sql`${modelTagScores.modelId} = ${modelId} AND ${modelTagScores.tagId} = ${tagId}`)
      .limit(1);

    if (score.length > 0 && score[0]) {
      return score[0];
    }

    throw new Error(`Failed to get model tag score after upsert for ${modelId}:${tagId}`);
  } catch (error) {
    console.error(`Failed to get or create model tag score for ${modelId}:${tagId}:`, error);
    // Even if insert fails, try to get the existing record as a fallback
    const existingScore = await db
      .select()
      .from(modelTagScores)
      .where(sql`${modelTagScores.modelId} = ${modelId} AND ${modelTagScores.tagId} = ${tagId}`)
      .limit(1);

    if (existingScore.length > 0 && existingScore[0]) {
      return existingScore[0];
    }

    // If we still can't get a record, rethrow the error
    throw error;
  }
}
