/**
 * @file Tournament database query operations.
 * @description Read-only database operations for tournament data retrieval.
 */

import { and, desc, eq, sql } from "drizzle-orm";

import type { TournamentBracket } from "@/types/tournament";

import { db, schema } from "../../../../db";
import { generateCodename } from "./utils";

/** Specifies the runtime environment for database operations */
export const runtime = "nodejs";

/**
 * Retrieves a tournament bracket from the database.
 * @description Returns the most recent tournament run for the given tournament ID.
 *
 * @param tournamentId - ID of the tournament to retrieve
 * @returns Promise resolving to the tournament bracket or null if not found
 */
export async function getTournamentBracket(
  tournamentId: string,
): Promise<TournamentBracket | null> {
  const runs = await db
    .select()
    .from(schema.tournamentRuns)
    .where(eq(schema.tournamentRuns.tournamentId, tournamentId))
    .orderBy(desc(schema.tournamentRuns.startedAt))
    .limit(1);

  if (runs.length === 0) {
    return null;
  }

  const run = runs[0];
  if (!run) {
    return null;
  }
  // PostgreSQL jsonb returns parsed objects, SQLite returns strings
  const bracket =
    typeof run.bracketData === "string"
      ? JSON.parse(run.bracketData)
      : (run.bracketData as TournamentBracket);
  return bracket;
}

/**
 * Resolves a tournament identifier to its canonical ID.
 * @description Accepts either a UUID primary key or a slug and returns the canonical primary key ID.
 *
 * @param identifier - Tournament UUID or slug to resolve
 * @returns Promise resolving to the canonical tournament ID or null if not found
 */
export async function resolveTournamentId(identifier: string): Promise<string | null> {
  // Try direct ID match first
  const byId = await db
    .select({ id: schema.tournaments.id })
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, identifier))
    .limit(1);

  if (byId.length) return byId[0]!.id;

  // Fallback to slug match
  const bySlug = await db
    .select({ id: schema.tournaments.id })
    .from(schema.tournaments)
    .where(eq(schema.tournaments.slug, identifier))
    .limit(1);

  if (bySlug.length) return bySlug[0]!.id;

  return null;
}

/**
 * Checks if a tournament exists.
 * @description Verifies existence of a tournament by ID or slug.
 *
 * @param identifier - Tournament UUID or slug to check
 * @returns Promise resolving to true if tournament exists, false otherwise
 */
export async function tournamentExists(identifier: string): Promise<boolean> {
  const id = await resolveTournamentId(identifier);
  return id !== null;
}

/**
 * Gets the current tournament run ID.
 * @description Returns the ID of the most recent run for a tournament.
 *
 * @param tournamentId - ID of the tournament
 * @returns Promise resolving to the run ID or null if no runs exist
 */
export async function getCurrentTournamentRunId(tournamentId: string): Promise<string | null> {
  const runs = await db
    .select({ id: schema.tournamentRuns.id })
    .from(schema.tournamentRuns)
    .where(eq(schema.tournamentRuns.tournamentId, tournamentId))
    .orderBy(desc(schema.tournamentRuns.startedAt))
    .limit(1);

  return runs.length > 0 ? runs[0]!.id : null;
}

/**
 * Retrieves complete tournament data.
 * @description Gets tournament metadata, latest run results, and additional metadata
 * for public viewing of tournament results.
 *
 * @param tournamentId - ID of the tournament to retrieve
 * @param requestingUserId - Optional ID of the requesting user for personalized data
 * @returns Promise resolving to complete tournament data or null if not found
 */
export async function getCompleteTournamentData(tournamentId: string, requestingUserId?: string) {
  // Get tournament metadata
  const tournaments = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  if (tournaments.length === 0) {
    return null;
  }

  const tournament = tournaments[0];
  if (!tournament) {
    return null;
  }

  // Get author info (try to get display name, fallback to codename)
  const authors = await db
    .select({
      name: schema.users.name,
      displayName: schema.users.displayName,
    })
    .from(schema.users)
    .where(eq(schema.users.id, tournament.createdBy))
    .limit(1);

  // Consistent with tournament list API - check displayName first, then name, then generate codename
  const authorName =
    authors[0]?.displayName || authors[0]?.name || generateCodename(tournament.createdBy);

  // Get upvote count
  const upvoteCount = await getTournamentUpvoteCount(tournamentId);

  // Get user's upvote status if requesting user provided
  let hasUpvoted = false;
  if (requestingUserId) {
    hasUpvoted = await hasUserUpvotedTournament(tournamentId, requestingUserId);
  }

  // Get latest tournament run
  const runs = await db
    .select()
    .from(schema.tournamentRuns)
    .where(eq(schema.tournamentRuns.tournamentId, tournamentId))
    .orderBy(desc(schema.tournamentRuns.startedAt))
    .limit(1);

  if (runs.length === 0) {
    return {
      tournament: {
        ...tournament,
        authorName,
        upvoteCount,
        hasUpvoted,
      },
      run: null,
      bracket: null,
    };
  }

  const run = runs[0];
  if (!run) {
    return {
      tournament: {
        ...tournament,
        authorName,
        upvoteCount,
        hasUpvoted,
      },
      run: null,
      bracket: null,
    };
  }

  // PostgreSQL jsonb returns parsed objects, SQLite returns strings
  const bracket =
    typeof run.bracketData === "string"
      ? JSON.parse(run.bracketData)
      : (run.bracketData as TournamentBracket);

  return {
    tournament: {
      ...tournament,
      authorName,
      authorId: tournament.createdBy, // Include author ID for profile linking
      upvoteCount,
      hasUpvoted,
    },
    run,
    bracket,
  };
}

/**
 * Retrieves a tournament by its slug.
 * @description Looks up a tournament using its URL-friendly slug identifier.
 *
 * @param slug - URL-friendly slug of the tournament
 * @returns Promise resolving to tournament data or null if not found
 */
export async function getTournamentBySlug(slug: string) {
  const tournaments = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.slug, slug))
    .limit(1);

  if (tournaments.length === 0) {
    return null;
  }

  return tournaments[0];
}

/**
 * Gets tournament data for status API.
 * @description Retrieves core tournament fields required for the tournament status response.
 *
 * @param tournamentId - ID of the tournament
 * @returns Promise resolving to tournament status data or null if not found
 */
export async function getTournamentForStatus(tournamentId: string) {
  const tournaments = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  if (tournaments.length === 0) {
    return null;
  }

  const tournament = tournaments[0]!; // Safe because we checked length above

  // Parse any JSON fields if needed
  const models =
    typeof tournament.models === "string" ? JSON.parse(tournament.models) : tournament.models || [];

  const tagIds =
    typeof tournament.tagIds === "string" ? JSON.parse(tournament.tagIds) : tournament.tagIds || [];

  return {
    id: tournament.id,
    title: tournament.title,
    prompt: tournament.prompt,
    judgePrompt: tournament.judgePrompt,
    judgeModel: tournament.judgeModel,
    models,
    tagIds,
    createdAt: tournament.createdAt,
    createdBy: tournament.createdBy,
  };
}

/**
 * Gets the genealogy of a tournament.
 * @description Retrieves the ancestry chain (parent/child relationships) for a tournament.
 *
 * @param tournamentId - ID of the tournament
 * @returns Promise resolving to tournament genealogy data
 */
export async function getTournamentGenealogy(tournamentId: string) {
  // Get children (forks/versions)
  const children = await db
    .select({
      tournament: schema.tournaments,
      fork: schema.forks,
    })
    .from(schema.tournaments)
    .leftJoin(schema.forks, eq(schema.forks.childTournamentId, schema.tournaments.id))
    .where(eq(schema.tournaments.parentId, tournamentId));

  // Get parent
  const current = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  let parent = null;
  if (current.length > 0 && current[0]?.parentId) {
    const parentResult = await db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, current[0].parentId))
      .limit(1);

    if (parentResult.length > 0) {
      parent = parentResult[0];
    }
  }

  return {
    current: current.length > 0 ? current[0] : null,
    parent,
    children: children.map((c) => c.tournament),
  };
}

/**
 * Gets all versions of a tournament.
 * @description Retrieves all versions of a tournament, including the original.
 *
 * @param tournamentId - ID of any version of the tournament
 * @returns Promise resolving to array of tournament versions
 */
export async function getTournamentVersions(tournamentId: string) {
  const current = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.id, tournamentId))
    .limit(1);

  if (current.length === 0) {
    return [];
  }

  const tournament = current[0];
  if (!tournament) {
    return [];
  }

  const rootId = tournament.originalId || tournament.id;

  const versions = await db
    .select()
    .from(schema.tournaments)
    .where(eq(schema.tournaments.originalId ?? schema.tournaments.id, rootId))
    .orderBy(desc(schema.tournaments.version));

  return versions;
}

/**
 * Gets the total upvote count for a tournament.
 * @description Counts the number of users who have upvoted a tournament.
 *
 * @param tournamentId - ID of the tournament
 * @returns Promise resolving to the upvote count
 */
export async function getTournamentUpvoteCount(tournamentId: string): Promise<number> {
  const result = await db
    .select({ count: sql`COUNT(*)` })
    .from(schema.tournamentUpvotes)
    .where(eq(schema.tournamentUpvotes.tournamentId, tournamentId));

  // PostgreSQL compatibility: count(*) returns string, convert to number
  return parseInt(String(result[0]?.count || 0), 10);
}

/**
 * Checks if a user has upvoted a tournament.
 * @description Verifies if a specific user has upvoted a tournament.
 *
 * @param tournamentId - ID of the tournament
 * @param userId - ID of the user to check
 * @returns Promise resolving to true if user has upvoted, false otherwise
 */
export async function hasUserUpvotedTournament(
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select()
    .from(schema.tournamentUpvotes)
    .where(
      and(
        eq(schema.tournamentUpvotes.tournamentId, tournamentId),
        eq(schema.tournamentUpvotes.userId, userId),
      ),
    )
    .limit(1);

  return result.length > 0;
}
