import { NextResponse } from "next/server";

import { createTournamentBracket } from "@/lib/bracket";
import {
  getTournamentBracket,
  resolveTournamentId,
  saveTournamentBracket,
} from "@/lib/tournament-db";
import { CreateBracketRequest, CreateBracketResponse } from "@/types/tournament";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;

  try {
    const resolvedId = await resolveTournamentId(tournamentId);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" } satisfies CreateBracketResponse,
        { status: 404 },
      );
    }

    const body: CreateBracketRequest = await request.json();

    // Validate input
    if (!Array.isArray(body.models) || ![4, 8, 16].includes(body.models.length)) {
      return NextResponse.json(
        {
          success: false,
          error: "Models array must contain exactly 4, 8, or 16 model IDs",
        } satisfies CreateBracketResponse,
        { status: 400 },
      );
    }

    if (!body.judgeModel || typeof body.judgeModel !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "judgeModel is required and must be a string",
        } satisfies CreateBracketResponse,
        { status: 400 },
      );
    }

    // Create bracket structure
    const bracket = createTournamentBracket(resolvedId, body.models);

    // Save to database
    await saveTournamentBracket(bracket);

    return NextResponse.json({
      success: true,
      bracket,
    } satisfies CreateBracketResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create bracket";

    return NextResponse.json({ success: false, error: message } satisfies CreateBracketResponse, {
      status: 500,
    });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;

  try {
    const resolvedId = await resolveTournamentId(tournamentId);
    if (!resolvedId) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" } satisfies CreateBracketResponse,
        { status: 404 },
      );
    }

    const bracket = await getTournamentBracket(resolvedId);

    if (!bracket) {
      return NextResponse.json(
        {
          success: false,
          error: "No bracket found for this tournament",
        } satisfies CreateBracketResponse,
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      bracket,
    } satisfies CreateBracketResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get bracket";

    return NextResponse.json({ success: false, error: message } satisfies CreateBracketResponse, {
      status: 500,
    });
  }
}
