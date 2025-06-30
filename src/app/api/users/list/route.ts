/**
 * @file /api/users/list endpoint
 * @description Returns paginated list of users with evaluation counts
 */

import { countDistinct, desc, sql } from "drizzle-orm";
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
      .leftJoin(schema.tournaments, sql`${schema.tournaments.createdBy} = ${schema.users.id}`)
      .groupBy(schema.users.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${schema.tournaments.id})`))
      .limit(limit)
      .offset(offset);

    // Format the response to match the contract (remove extra fields and add empty topTags)
    const formattedUsers = usersList.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      evaluationsCreated: user.evaluationsCreated,
      topTags: [], // Empty array since we're not showing tags anymore
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
