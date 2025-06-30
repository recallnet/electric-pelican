import { NextRequest, NextResponse } from "next/server";

import {
  getCurrentTournamentRunId,
  getTournamentBracket,
  getTournamentForStatus,
  tournamentExists,
  updateTournamentBracket,
} from "@/lib/tournament-db";
import { getTournamentWinner, runTournamentJudging } from "@/lib/tournament-judging";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { JudgeTournamentResponse } from "@/types/tournament";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tournamentId = id;

    // Check if tournament exists
    const exists = await tournamentExists(tournamentId);
    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament not found",
          tournamentComplete: false,
          currentRound: 0,
          matches: [],
        } satisfies JudgeTournamentResponse,
        { status: 404 },
      );
    }

    // Get tournament bracket
    const bracket = await getTournamentBracket(tournamentId);
    if (!bracket) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament bracket not found",
          tournamentComplete: false,
          currentRound: 0,
          matches: [],
        } satisfies JudgeTournamentResponse,
        { status: 404 },
      );
    }

    // Validate input
    if (!body.judgePrompt || typeof body.judgePrompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "judgePrompt is required and must be a string",
          tournamentComplete: false,
          currentRound: bracket.currentRound,
          matches: [],
        } satisfies JudgeTournamentResponse,
        { status: 400 },
      );
    }

    // Check if tournament is ready for judging
    if (!bracket.modelResponses) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament models have not been executed yet",
          tournamentComplete: false,
          currentRound: bracket.currentRound,
          matches: [],
        } satisfies JudgeTournamentResponse,
        { status: 400 },
      );
    }

    const { judgePrompt, challengePrompt, judgeModel } = body;

    if (!challengePrompt || !judgeModel) {
      return NextResponse.json(
        {
          success: false,
          error: "challengePrompt and judgeModel are required",
          tournamentComplete: false,
          currentRound: bracket.currentRound,
          matches: [],
        } satisfies JudgeTournamentResponse,
        { status: 400 },
      );
    }

    // Get the current tournament run ID for ELO updates
    const tournamentRunId = await getCurrentTournamentRunId(tournamentId);
    if (!tournamentRunId) {
      console.warn(
        `[judge] No tournament run ID found for ${tournamentId}, ELO updates will be skipped`,
      );
    }

    // Get tournament data for hierarchical ELO tags
    const tournament = await getTournamentForStatus(tournamentId);
    const tournamentTagIds: HierarchicalTagId[] = tournament?.tagIds
      ? Array.isArray(tournament.tagIds)
        ? tournament.tagIds
        : JSON.parse(tournament.tagIds as string)
      : [];

    if (tournamentTagIds.length > 0) {
      console.log(`[judge] Tournament has hierarchical tags: ${tournamentTagIds.join(", ")}`);
    } else {
      console.log(`[judge] Tournament has no hierarchical tags - only global ELO will be updated`);
    }

    // Run tournament judging with ELO updates
    const { finalBracket, allMatches } = await runTournamentJudging(
      bracket,
      challengePrompt!,
      judgePrompt,
      judgeModel!,
      tournamentRunId || undefined, // Pass tournament run ID for ELO updates
      tournamentTagIds, // Pass tournament tags for hierarchical ELO updates
    );

    // Update bracket in database
    await updateTournamentBracket(finalBracket);

    // Get final winner if tournament is complete
    const winner = getTournamentWinner(finalBracket);

    const responsePayload: JudgeTournamentResponse = {
      success: true,
      tournamentComplete: !finalBracket.matches.some((m) => m.winner === null),
      currentRound: finalBracket.currentRound,
      matches: allMatches,
    };
    if (winner) responsePayload.winner = winner;

    return NextResponse.json(responsePayload satisfies JudgeTournamentResponse);
  } catch (error) {
    console.error("Tournament judging error:", error);
    const message = error instanceof Error ? error.message : "Failed to judge tournament";

    return NextResponse.json(
      {
        success: false,
        error: message,
        tournamentComplete: false,
        currentRound: 0,
        matches: [],
      } satisfies JudgeTournamentResponse,
      { status: 500 },
    );
  }
}
