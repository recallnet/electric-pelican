import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { ApiContracts } from "@/contracts/api";

// Remove the top-level db import to avoid build-time database connection issues
// import { db } from "../../../../../../db";
// import { tournamentRuns,tournaments } from "../../../../../../db/schema";

/**
 * GET /api/models/[id]/evaluations
 *
 * Returns paginated list of evaluations (tournaments) that a specific model participated in.
 * Includes the result of each evaluation and opponent information.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Lazy import database to avoid build-time connection issues
    const { db } = await import("../../../../../../db");
    const { tournamentRuns, tournaments } = await import("../../../../../../db/schema");

    const { searchParams } = new URL(request.url);

    // Handle params as Promise in Next.js 15
    const resolvedParams = await params;

    // Validate parameters
    const paramsSchema = ApiContracts["GET /api/models/:id/evaluations"].request.params;
    const querySchema = ApiContracts["GET /api/models/:id/evaluations"].request.query;

    const validatedParams = paramsSchema.parse(resolvedParams);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(rawQuery);

    // Decode the model ID and parse pagination
    const modelId = decodeURIComponent(validatedParams.id);
    const page = validatedQuery.page ? parseInt(validatedQuery.page, 10) : 1;
    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit, 10) : 20;

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be 1-100)" },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    // Get tournaments where this model participated
    // We need to check both the models array and match results
    // PostgreSQL compatibility: Use ::text cast instead of json_extract
    const tournamentsQuery = db
      .select({
        id: tournaments.id,
        title: tournaments.title,
        prompt: tournaments.prompt,
        models: tournaments.models,
        createdAt: tournaments.createdAt,
        status: tournamentRuns.status,
        winnerModel: tournamentRuns.winnerModel,
      })
      .from(tournaments)
      .leftJoin(tournamentRuns, eq(tournaments.id, tournamentRuns.tournamentId))
      .where(sql`${tournaments.models}::text LIKE '%' || ${modelId} || '%'`)
      .orderBy(desc(tournaments.createdAt))
      .limit(limit)
      .offset(offset);

    const tournamentsData = await tournamentsQuery;

    // Get total count for pagination
    // PostgreSQL compatibility: Use ::text cast instead of json_extract
    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournaments)
      .where(sql`${tournaments.models}::text LIKE '%' || ${modelId} || '%'`);
    // PostgreSQL compatibility: count(*) returns string, convert to number
    const total = parseInt(String(totalQuery[0]?.count || 0), 10);

    // Transform the data to match the API contract
    const evaluations = tournamentsData.map((tournament) => {
      let result: "win" | "loss" | "ongoing" = "ongoing";
      let opponent: string | undefined;

      // Determine result based on tournament status and winner
      if (tournament.status === "completed" && tournament.winnerModel) {
        result = tournament.winnerModel === modelId ? "win" : "loss";

        // Find an opponent (just pick the first model that isn't this one)
        if (tournament.models && Array.isArray(tournament.models)) {
          const models = tournament.models as string[];
          opponent = models.find((m) => m !== modelId);
        }
      } else if (tournament.status === "failed") {
        result = "loss"; // Consider failed tournaments as losses
      }

      return {
        tournamentId: tournament.id,
        title: tournament.title,
        prompt: tournament.prompt,
        result,
        opponent,
        createdAt: tournament.createdAt.toISOString(),
      };
    });

    const response = {
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Validate response against contract
    const responseSchema = ApiContracts["GET /api/models/:id/evaluations"].response;
    const validatedResponse = responseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Model evaluations API error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
