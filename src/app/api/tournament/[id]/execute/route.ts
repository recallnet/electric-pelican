import { NextRequest, NextResponse } from "next/server";

import { createTournamentBracket } from "@/lib/bracket";
import { executeModelsWithStreamingJudging } from "@/lib/streaming-tournament";
import {
  getCompleteTournamentData,
  getCurrentTournamentRunId,
  getTournamentBracket,
  markTournamentRunCompleted,
  resolveTournamentId,
  saveTournamentBracket,
  updateTournamentBracket,
  updateTournamentWithResponses,
} from "@/lib/tournament-db";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { Tournament } from "@/types/tournament";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const resolvedId = await resolveTournamentId(id);
    if (!resolvedId) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    // Get tournament data from database
    const tournamentData = await getCompleteTournamentData(resolvedId);
    if (!tournamentData?.tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const tournament = tournamentData.tournament as Tournament; // Properly typed tournament object

    // Parse models from JSON string with robust error handling
    const models = (() => {
      try {
        // Handle both string (SQLite) and object (PostgreSQL) formats
        const modelData = tournament.models;

        if (typeof modelData === "string" && modelData) {
          // If it looks like a single model ID (not JSON array), wrap it in an array
          const modelString: string = modelData; // Explicitly type as string to satisfy TypeScript
          if (!modelString.startsWith("[")) {
            return [modelString];
          }
          return JSON.parse(modelString);
        }
        // Handle array case or return empty array as fallback
        return Array.isArray(modelData) ? modelData : [];
      } catch (err) {
        // Fallback to empty array in case of parsing error
        console.error("Error parsing models:", err);
        return [];
      }
    })();

    // Validate prompt and models
    if (!tournament.prompt) {
      return NextResponse.json(
        { success: false, error: "challengePrompt is required" },
        { status: 400 },
      );
    }

    // Validate models array
    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { success: false, error: "models array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Check if bracket exists, create if not
    let bracket = await getTournamentBracket(resolvedId);
    if (!bracket) {
      console.log(`[execute] Creating bracket for tournament ${resolvedId}`);
      bracket = createTournamentBracket(resolvedId, models);
      await saveTournamentBracket(bracket);
    }

    // Get the current tournament run ID for ELO updates
    const tournamentRunId = await getCurrentTournamentRunId(resolvedId);
    if (!tournamentRunId) {
      console.warn(
        `[execute] No tournament run ID found for ${resolvedId}, ELO updates will be skipped`,
      );
    }

    // Extract tournament tagIds for hierarchical ELO with robust error handling
    const tournamentTagIds: HierarchicalTagId[] = (() => {
      try {
        console.log(
          `[execute] Raw tournament.tagIds:`,
          tournament.tagIds,
          `(type: ${typeof tournament.tagIds})`,
        );

        if (!tournament.tagIds) {
          console.log(`[execute] No tagIds found, returning empty array`);
          return [];
        }

        if (Array.isArray(tournament.tagIds)) {
          console.log(
            `[execute] tagIds is already an array with ${tournament.tagIds.length} items`,
          );
          return tournament.tagIds;
        }

        if (typeof tournament.tagIds === "string") {
          console.log(`[execute] tagIds is a string, attempting to parse:`, tournament.tagIds);
          const parsed = JSON.parse(tournament.tagIds);
          console.log(
            `[execute] Parsed tagIds:`,
            parsed,
            `(type: ${typeof parsed}, isArray: ${Array.isArray(parsed)})`,
          );
          return Array.isArray(parsed) ? parsed : [];
        }

        console.log(`[execute] tagIds is unexpected type, returning empty array`);
        return [];
      } catch (err) {
        console.error(`[execute] Error parsing tournament tagIds:`, err);
        console.log(`[execute] Raw tournament.tagIds when error occurred:`, tournament.tagIds);
        return [];
      }
    })();

    if (tournamentTagIds.length > 0) {
      console.log(`[execute] Tournament has hierarchical tags: ${tournamentTagIds.join(", ")}`);
    } else {
      console.log(
        `[execute] Tournament has no hierarchical tags - only global ELO will be updated`,
      );
    }

    // Use judge prompt from tournament or default
    const judgePrompt =
      tournament.judgePrompt ||
      "Compare these two responses and determine which one better answers the challenge prompt. Consider accuracy, completeness, clarity, and helpfulness.";

    console.log(`[execute] Starting streaming tournament execution for ${resolvedId}`);
    console.log(`[execute] Models: ${models.length}, Judge: ${tournament.judgeModel}`);

    // Execute tournament with streaming judging - this handles both model execution and judging!
    const { responses, finalBracket, allMatches } = await executeModelsWithStreamingJudging(
      models,
      tournament.prompt || "",
      bracket,
      judgePrompt,
      tournament.judgeModel || "not-specified",
      tournamentRunId || undefined,
      tournamentTagIds, // Pass tournament tags for hierarchical ELO updates
      (progress) => {
        // Log streaming progress for debugging
        console.log(
          `[execute] Streaming progress: ${progress.type} - Models: ${progress.totalModelsCompleted}/${progress.totalModelsCompleted + progress.totalModelsRunning}, Matches: ${progress.totalMatchesJudged}, Round: ${progress.currentRound}`,
        );
      },
    );

    // Update database with model responses
    await updateTournamentWithResponses(resolvedId, responses);

    // Update bracket with final results
    await updateTournamentBracket(finalBracket);

    // CRITICAL FIX: Explicitly mark tournament as completed in database
    if (finalBracket.status === "completed" && tournamentRunId) {
      const winner = finalBracket.matches.find((m) => m.round === finalBracket.totalRounds)?.winner;
      console.log(
        `[execute] Marking tournament run ${tournamentRunId} as completed with winner: ${winner}`,
      );

      await markTournamentRunCompleted(tournamentRunId, winner || null);
    }

    console.log(`[execute] Tournament ${resolvedId} completed with streaming execution`);
    console.log(`[execute] Total matches judged: ${allMatches.length}`);
    console.log(`[execute] Final status: ${finalBracket.status}`);

    // Calculate progress (should be 100% since we completed everything)
    const progress = Math.round((Object.keys(responses).length / models.length) * 100);

    return NextResponse.json({
      success: true,
      progress,
      responses,
      streamingEnabled: true, // Flag to indicate this used the new streaming approach
      totalMatches: allMatches.length,
      finalStatus: finalBracket.status,
      completed: finalBracket.status === "completed", // NEW: Explicit completion flag
    });
  } catch (err) {
    console.error("Tournament execution error:", err);
    const message = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
