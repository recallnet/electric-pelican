import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TournamentSummary } from "@/types/app";

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

/**
 * GET /api/user/[id]/tournaments
 *
 * Fetches all tournaments created by a specific user.
 * Returns the same format as the dashboard API for consistency.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Lazy import database to avoid build-time connection issues
    const { db, schema } = await import("../../../../../../db");

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // First, get the user info to verify they exist
    const users = await db
      .select({
        id: schema.users.id,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all tournaments created by this user
    const tournaments = await db
      .select({
        id: schema.tournaments.id,
        slug: schema.tournaments.slug,
        title: schema.tournaments.title,
        prompt: schema.tournaments.prompt, // Add missing field
        models: schema.tournaments.models,
        tagIds: schema.tournaments.tagIds, // Hierarchical tags
        createdBy: schema.tournaments.createdBy,
        createdAt: schema.tournaments.createdAt,
        forkCount: schema.tournaments.forkCount, // Add missing field
      })
      .from(schema.tournaments)
      .where(eq(schema.tournaments.createdBy, userId))
      .orderBy(desc(schema.tournaments.createdAt));

    // Format tournaments for response with status lookup
    const formattedTournaments: TournamentSummary[] = await Promise.all(
      tournaments.map(async (tournament) => {
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
        let status: "completed" | "in-progress" = "in-progress";
        if (runs.length > 0) {
          const runStatus = runs[0]?.status;
          if (runStatus === "completed") {
            status = "completed";
          }
        }

        const authorDisplayName =
          user.displayName || user.name || generateCodename(tournament.createdBy);

        return {
          id: tournament.id,
          slug: tournament.slug,
          title: tournament.title,
          prompt: tournament.prompt, // Add missing field
          models: tournament.models
            ? (() => {
                try {
                  // Handle both string (SQLite) and object (PostgreSQL) formats
                  if (typeof tournament.models === "string") {
                    // If it looks like a single model ID (not JSON array), wrap it in an array
                    if (!tournament.models.startsWith("[") && tournament.models.trim() !== "") {
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
          createdBy: tournament.createdBy,
          authorName: authorDisplayName,
          ...(user.avatarUrl && { authorAvatarUrl: user.avatarUrl }),
          upvoteCount: 0, // Add missing field - could be fetched separately if needed
          hasUpvoted: false, // Add missing field - would need user context
          forkCount: tournament.forkCount || 0, // Add missing field
          createdAt: new Date(tournament.createdAt).toISOString(),
          status,
          isOwner: true, // This endpoint only returns user's own tournaments
        };
      }),
    );

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName || user.name || user.email || "Unknown User",
        avatarUrl: user.avatarUrl || undefined,
      },
      tournaments: formattedTournaments,
    });
  } catch (error) {
    console.error("Error fetching user tournaments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
