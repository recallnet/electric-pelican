import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/privy";
import { getTournamentUpvoteCount, hasUserUpvotedTournament } from "@/lib/tournament-db";
import { TournamentRecord } from "@/types/app";

import { db, schema } from "../../../../../db";

export const runtime = "nodejs";

/**
 * Generate a sci-fi codename from a user ID for display purposes.
 * Creates consistent, memorable names like "CyberVoid", "QuantumByte", etc.
 */
function generateCodename(userId: string): string {
  const prefixes = [
    "Cyber",
    "Quantum",
    "Neural",
    "Data",
    "Code",
    "Pixel",
    "Binary",
    "Matrix",
    "Vector",
    "Logic",
    "Nano",
    "Crypto",
    "Digital",
    "Plasma",
    "Fusion",
    "Nexus",
  ];

  const suffixes = [
    "Void",
    "Byte",
    "Core",
    "Link",
    "Node",
    "Wave",
    "Grid",
    "Flux",
    "Echo",
    "Spark",
    "Prime",
    "Edge",
    "Storm",
    "Pulse",
    "Shift",
    "Ghost",
  ];

  // Use simple hash of userId to pick consistent prefix/suffix
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }

  const prefixIndex = Math.abs(hash) % prefixes.length;
  const suffixIndex = Math.abs(hash >> 8) % suffixes.length;

  return `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageStr = searchParams.get("page") ?? "1";
  const ownerOnly = searchParams.get("owner") === "true";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = 20; // tournaments per page
  const offset = (page - 1) * limit;

  try {
    // Get user from auth token (optional - for filtering user's tournaments)
    let userId: string | null = null;
    try {
      const user = await getAuthenticatedUser(req);
      userId = user?.sub || null;
    } catch {
      // Not authenticated, show only public tournaments
    }

    // If owner=true is requested but user is not authenticated, return empty result
    if (ownerOnly && !userId) {
      return NextResponse.json({
        tournaments: [],
        total: 0,
        page,
        hasMore: false,
      });
    }

    // Get tournaments from database with optional owner filtering
    // Note: tagIds column might not exist yet if migration hasn't been run
    const baseQuery = db
      .select({
        id: schema.tournaments.id,
        slug: schema.tournaments.slug,
        title: schema.tournaments.title,
        prompt: schema.tournaments.prompt,
        models: schema.tournaments.models,
        tagIds: schema.tournaments.tagIds, // Hierarchical tags
        bracketSize: schema.tournaments.bracketSize,
        createdBy: schema.tournaments.createdBy,
        createdAt: schema.tournaments.createdAt,
        updatedAt: schema.tournaments.updatedAt,
        forkCount: schema.tournaments.forkCount,
        version: schema.tournaments.version,
      })
      .from(schema.tournaments);

    // Apply owner filter if requested, otherwise get all tournaments
    const allTournaments =
      ownerOnly && userId
        ? await baseQuery
            .where(eq(schema.tournaments.createdBy, userId))
            .orderBy(desc(schema.tournaments.createdAt))
            .limit(limit)
            .offset(offset)
        : await baseQuery.orderBy(desc(schema.tournaments.createdAt)).limit(limit).offset(offset);

    // Get total count for pagination (with same filtering)
    const totalQuery = db.select({ count: schema.tournaments.id }).from(schema.tournaments);
    const totalResult =
      ownerOnly && userId
        ? await totalQuery.where(eq(schema.tournaments.createdBy, userId))
        : await totalQuery;
    const total = totalResult.length;

    // Format tournaments for response with error handling
    const formattedTournaments = await Promise.all(
      allTournaments.map(async (tournament: TournamentRecord) => {
        let status: "completed" | "in-progress" = "in-progress";
        let authorDisplayName = generateCodename(tournament.createdBy);
        let authorAvatarUrl: string | null = null;
        let upvoteCount = 0;
        let hasUpvoted = false;

        try {
          // Get the latest tournament run for this tournament
          const runs = await db
            .select({
              status: schema.tournamentRuns.status,
            })
            .from(schema.tournamentRuns)
            .where(eq(schema.tournamentRuns.tournamentId, tournament.id))
            .orderBy(desc(schema.tournamentRuns.startedAt))
            .limit(1);

          // Determine status based on run status
          if (runs.length > 0) {
            const runStatus = runs[0]?.status;
            if (runStatus === "completed") {
              status = "completed";
            }
          }
        } catch (error) {
          console.error(`Error fetching runs for tournament ${tournament.id}:`, error);
          // Use default status
        }

        try {
          // Get author info (try to get display name, fallback to codename)
          const authors = await db
            .select({
              name: schema.users.name,
              displayName: schema.users.displayName,
              avatarUrl: schema.users.avatarUrl,
            })
            .from(schema.users)
            .where(eq(schema.users.id, tournament.createdBy))
            .limit(1);

          authorDisplayName =
            authors[0]?.displayName || authors[0]?.name || generateCodename(tournament.createdBy);
          authorAvatarUrl = authors[0]?.avatarUrl || null;
        } catch (error) {
          console.error(`Error fetching author for tournament ${tournament.id}:`, error);
          // Use default codename
        }

        try {
          // Get upvote count
          upvoteCount = await getTournamentUpvoteCount(tournament.id);

          // Get user's upvote status if requesting user provided
          if (userId) {
            hasUpvoted = await hasUserUpvotedTournament(tournament.id, userId);
          }
        } catch (error) {
          console.error(`Error fetching upvotes for tournament ${tournament.id}:`, error);
          // Use default values
        }

        return {
          id: tournament.id,
          slug: tournament.slug,
          title: tournament.title,
          prompt: tournament.prompt,
          models: tournament.models
            ? (() => {
                try {
                  // Handle both string (SQLite) and object (PostgreSQL) formats
                  if (typeof tournament.models === "string") {
                    // If it looks like a single model ID (not JSON array), wrap it in an array
                    if (!tournament.models.startsWith("[")) {
                      return [tournament.models];
                    }
                    return JSON.parse(tournament.models);
                  }
                  return tournament.models;
                } catch (e) {
                  console.error("Error parsing models field:", tournament.models, e);
                  // If parsing fails, try to handle as a single model ID
                  return typeof tournament.models === "string" ? [tournament.models] : [];
                }
              })()
            : [],
          // Use hierarchical tags only
          tagIds: tournament.tagIds
            ? (() => {
                try {
                  if (typeof tournament.tagIds === "string") {
                    return JSON.parse(tournament.tagIds);
                  }
                  return tournament.tagIds;
                } catch (e) {
                  console.error("Error parsing tagIds field:", tournament.tagIds, e);
                  return [];
                }
              })()
            : [],
          bracketSize: tournament.bracketSize,
          createdBy: tournament.createdBy,
          authorName: authorDisplayName,
          authorAvatarUrl,
          upvoteCount,
          hasUpvoted,
          createdAt: new Date(tournament.createdAt).toISOString(),
          updatedAt: new Date(tournament.updatedAt).toISOString(),
          forkCount: tournament.forkCount || 0,
          version: tournament.version || 1,
          status,
          isOwner: userId === tournament.createdBy,
        };
      }),
    );

    return NextResponse.json({
      tournaments: formattedTournaments,
      total,
      page,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Tournament list error:", error);
    return NextResponse.json(
      {
        tournaments: [], // Always return an empty array so frontend doesn't break
        total: 0,
        page,
        hasMore: false,
        error: "Failed to fetch tournaments",
      },
      { status: 500 },
    );
  }
}
