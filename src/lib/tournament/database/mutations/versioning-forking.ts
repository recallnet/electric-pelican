/**
 * @file Tournament versioning and forking mutations
 * @description Write operations for creating tournament versions and forks
 */

import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db, schema } from "../../../../../db";

/**
 * Creates a new version of an existing tournament.
 * @description Copies tournament configuration and creates a new tournament run.
 * Only the original creator can create new versions.
 *
 * @param tournamentId - ID of the tournament to version
 * @param userId - ID of the user attempting to create the version
 * @returns Promise resolving to the new tournament version's ID
 * @throws Error if tournament not found or user is not authorized
 */
export async function createTournamentVersion(
  tournamentId: string,
  userId: string,
): Promise<string> {
  const tournament = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  if (tournament.length === 0) {
    throw new Error("Tournament not found");
  }

  const originalTournament = tournament[0];
  if (!originalTournament) {
    throw new Error("Tournament not found");
  }

  // Permission: only creator can create versions
  if (originalTournament.createdBy !== userId) {
    throw new Error("Unauthorized: Only the creator can version this tournament");
  }

  // Determine root ancestor (originalId)
  const rootId = originalTournament.originalId || originalTournament.id;

  // Determine next version number by querying max version for rootId
  const maxVersionRow = await db
    .select({ maxVersion: sql`MAX(version)` })
    .from(schema.tournaments)
    .where(eq(schema.tournaments.originalId ?? schema.tournaments.id, rootId));

  // Fallback if SQL helper not recognized: calculate via getTournamentVersions length
  let nextVersion = 2;
  if (maxVersionRow.length > 0 && maxVersionRow[0]?.maxVersion !== null) {
    nextVersion = (maxVersionRow[0]!.maxVersion as number) + 1;
  }

  const newTournamentId = uuidv4();
  const now = new Date();

  // Create new tournament with same configuration
  await db.insert(schema.tournaments).values({
    id: newTournamentId,
    slug: `${originalTournament.slug}-v${nextVersion}`,
    title: `${originalTournament.title} (Version ${nextVersion})`,
    prompt: originalTournament.prompt,
    judgePrompt: originalTournament.judgePrompt,
    models: originalTournament.models,
    judgeModel: originalTournament.judgeModel,
    bracketSize: originalTournament.bracketSize,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    parentId: tournamentId,
    forkCount: 0,
    version: nextVersion,
    originalId: rootId,
    tags: originalTournament.tags,
  });

  return newTournamentId;
}

/**
 * Creates a fork of an existing tournament.
 * @description Creates a copy of a tournament under a new user's ownership.
 *
 * @param tournamentId - ID of the tournament to fork
 * @param userId - ID of the user creating the fork
 * @param newTitle - Optional new title for the forked tournament
 * @returns Promise resolving to the forked tournament's ID
 * @throws Error if tournament not found
 */
export async function forkTournament(
  tournamentId: string,
  userId: string,
  newTitle?: string,
): Promise<string> {
  const tournament = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  if (tournament.length === 0) {
    throw new Error("Tournament not found");
  }

  const originalTournament = tournament[0];
  if (!originalTournament) {
    throw new Error("Tournament not found");
  }

  const newTournamentId = uuidv4();
  const now = new Date();

  // Create fork record
  await db.insert(schema.forks).values({
    id: uuidv4(),
    parentTournamentId: tournamentId,
    childTournamentId: newTournamentId,
    createdAt: now,
  });

  // Increment fork count on original tournament
  await db
    .update(schema.tournaments)
    .set({
      forkCount: (originalTournament.forkCount || 0) + 1,
    })
    .where(eq(schema.tournaments.id, tournamentId));

  // Create new tournament
  const forkTitle = newTitle || `Fork of ${originalTournament.title}`;
  await db.insert(schema.tournaments).values({
    id: newTournamentId,
    slug: `${originalTournament.slug}-fork-${now}`,
    title: forkTitle,
    prompt: originalTournament.prompt,
    judgePrompt: originalTournament.judgePrompt,
    models: originalTournament.models,
    judgeModel: originalTournament.judgeModel,
    bracketSize: originalTournament.bracketSize,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    parentId: tournamentId,
    forkCount: 0,
    version: 1,
    originalId: newTournamentId, // new fork lineage root
    tags: originalTournament.tags,
  });

  return newTournamentId;
}
