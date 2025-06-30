import { NextRequest, NextResponse } from "next/server";

import {
  getTournamentBracket,
  getTournamentForStatus,
  tournamentExists,
} from "@/lib/tournament-db";
import { getTournamentWinner } from "@/lib/tournament-judging";
import { TournamentBracket, TournamentPhase, TournamentStatusResponse } from "@/types/tournament";

/**
 * Calculate tournament progress percentage based on current state.
 * @param phase - Current tournament phase
 * @param currentRound - Current round number
 * @param totalRounds - Total number of rounds
 * @param completedMatches - Number of completed matches in current round
 * @param totalMatches - Total matches in current round
 * @returns Progress percentage (0-100)
 */
function calculateTournamentProgress(
  phase: string,
  currentRound: number,
  totalRounds: number,
  completedMatches: number,
  totalMatches: number,
): number {
  switch (phase) {
    case "setup":
      return 0;
    case "executing_models":
      return 10;
    case "judging": {
      // Base progress: 20% for model execution + progress through rounds
      const baseProgress = 20;
      const roundsProgress = ((currentRound - 1) / totalRounds) * 60; // 60% for all rounds
      const safeTotalMatches = totalMatches === 0 ? 1 : totalMatches;
      const currentRoundProgress =
        (completedMatches / safeTotalMatches) * (60 / Math.max(totalRounds, 1));
      return Math.min(baseProgress + roundsProgress + currentRoundProgress, 90);
    }
    case "completed":
      return 100;
    case "failed":
      return 0;
    default:
      return 0;
  }
}

/**
 * Determine tournament phase based on bracket status and actual tournament state.
 * @param bracket - Tournament bracket data
 * @returns Tournament phase
 */
function determineTournamentPhase(bracket: TournamentBracket): TournamentPhase {
  // Check if models have responses (indicates model execution phase)
  const hasModelResponses =
    bracket.modelResponses && Object.keys(bracket.modelResponses).length > 0;

  // Check if any matches have been judged (indicates judging phase)
  const hasJudgedMatches =
    bracket.matches && bracket.matches.some((match) => match.winner !== null);

  // Check if tournament is actually completed by looking at final match
  const finalMatch = bracket.matches?.find((m) => m.round === bracket.totalRounds);
  const isActuallyCompleted = finalMatch && finalMatch.winner !== null;

  // Prioritize actual completion status over bracket.status
  if (isActuallyCompleted) {
    return "completed";
  }

  // First check the bracket status
  switch (bracket.status) {
    case "completed":
      return "completed";
    case "models_executed":
      // Double-check if judging has started
      if (hasJudgedMatches) {
        return "judging";
      }
      return "executing_models";
    case "running":
      return "judging";
    case "created":
      // For "created" status, we need to be smarter and look at actual state
      break;
    default:
      return "failed";
  }

  // Smart phase detection for "created" status tournaments
  if (hasJudgedMatches) {
    // If matches are being judged, we're in judging phase
    return "judging";
  } else if (hasModelResponses) {
    // If models have responded but no matches judged yet, we're executing models
    return "executing_models";
  } else {
    // No responses yet, still in setup
    return "setup";
  }
}

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tournamentId } = await params;

    // Check if tournament exists
    const exists = await tournamentExists(tournamentId);
    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament not found",
        } satisfies TournamentStatusResponse,
        { status: 404 },
      );
    }

    // Get tournament bracket and tournament data (in parallel)
    const [bracket, tournamentData] = await Promise.all([
      getTournamentBracket(tournamentId),
      getTournamentForStatus(tournamentId),
    ]);

    if (!bracket) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament bracket not found",
        } satisfies TournamentStatusResponse,
        { status: 404 },
      );
    }

    if (!tournamentData) {
      return NextResponse.json(
        {
          success: false,
          error: "Tournament data not found",
        } satisfies TournamentStatusResponse,
        { status: 404 },
      );
    }

    // Determine tournament phase
    const phase = determineTournamentPhase(bracket);

    // Calculate progress
    const currentRoundMatches = bracket.matches.filter((m) => m.round === bracket.currentRound);
    const completedMatches = currentRoundMatches.filter((m) => m.winner !== null);
    const progress = calculateTournamentProgress(
      phase,
      bracket.currentRound,
      bracket.totalRounds,
      completedMatches.length,
      currentRoundMatches.length,
    );

    // Get winner if tournament is complete
    const winner = getTournamentWinner(bracket);

    // Convert modelResponses to the expected format
    const convertedModelResponses = bracket.modelResponses
      ? Object.fromEntries(
          Object.entries(bracket.modelResponses).map(([modelId, response]) => [
            modelId,
            { response: response.response, status: "success" as const, timestamp: Date.now() },
          ]),
        )
      : undefined;

    // Explicitly construct the response to match the expected type
    const response: TournamentStatusResponse = {
      success: true,
      tournament: {
        id: tournamentId,
        title: tournamentData.title,
        phase: phase as TournamentPhase,
        currentRound: bracket.currentRound,
        totalRounds: bracket.totalRounds,
        progress,
        bracketSize: bracket.bracketSize,
        matches: bracket.matches || [],
        modelResponses: convertedModelResponses,
        prompt: tournamentData.prompt,
        judgePrompt: tournamentData.judgePrompt,
        models: tournamentData.models,
        judgeModel: tournamentData.judgeModel,
        createdAt: tournamentData.createdAt,
        createdBy: tournamentData.createdBy,
        tagIds: tournamentData.tagIds,
        ...(winner !== null && { winner }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Status route error:", error);
    const message = error instanceof Error ? error.message : "Failed to get tournament status";

    return NextResponse.json(
      {
        success: false,
        error: message,
      } satisfies TournamentStatusResponse,
      { status: 500 },
    );
  }
}
