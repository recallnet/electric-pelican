/**
 * @file /api/users/list endpoint
 * @description Returns paginated list of users with evaluation counts and top interests
 */

import { countDistinct, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db, schema } from "../../../../../db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json({ error: "Page must be at least 1" }, { status: 400 });
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Limit must be between 1 and 100" }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Get users with their evaluation counts
    const usersList = await db
      .select({
        id: schema.users.id,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
        provider: schema.users.provider,
        providerUsername: schema.users.providerUsername,
        createdAt: schema.users.createdAt,
        evaluationsCreated: countDistinct(schema.tournaments.id),
      })
      .from(schema.users)
      .leftJoin(schema.tournaments, eq(schema.tournaments.createdBy, schema.users.id))
      .groupBy(schema.users.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${schema.tournaments.id})`))
      .limit(limit)
      .offset(offset);

    // Get top tags for each user using simpler queries
    const usersWithTags = await Promise.all(
      usersList.map(async (user) => {
        // Get user's tournaments with tags
        const userTournaments = await db
          .select({
            tags: schema.tournaments.tags,
            tagIds: schema.tournaments.tagIds,
          })
          .from(schema.tournaments)
          .where(eq(schema.tournaments.createdBy, user.id));

        // Process tags client-side to avoid complex SQL
        const tagCounts = new Map<string, number>();

        userTournaments.forEach((tournament) => {
          // Prioritize hierarchical tags if they exist
          let tagsToProcess: string[] = [];

          if (
            tournament.tagIds &&
            Array.isArray(tournament.tagIds) &&
            tournament.tagIds.length > 0
          ) {
            tagsToProcess = tournament.tagIds;
          } else if (
            tournament.tags &&
            Array.isArray(tournament.tags) &&
            tournament.tags.length > 0
          ) {
            tagsToProcess = tournament.tags;
          }

          tagsToProcess.forEach((tag) => {
            if (tag && typeof tag === "string") {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          });
        });

        // Get top 3 most used tags
        const topTags = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map((entry) => entry[0]);

        return {
          ...user,
          topTags,
        };
      }),
    );

    // Format the response to match the contract
    const formattedUsers = usersWithTags.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      evaluationsCreated: user.evaluationsCreated,
      topTags: user.topTags || [],
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        hasMore: usersList.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
