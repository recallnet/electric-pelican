/**
 * @file Timeout and stuck match resolution logic
 * @description Handles tournament timeouts and forces resolution of stuck matches
 */

import { advanceWinners, getMatchesForRound, updateMatchResult } from "@/lib/bracket";
import { updateTournamentBracket } from "@/lib/tournament-db";
import { StreamingProgress, StreamingTournamentState } from "@/types/streaming";

import { MATCH_TIMEOUT_MS, TOURNAMENT_TIMEOUT_MS } from "./core";

/**
 * Check if tournament has exceeded timeout limits and force completion if needed.
 */
export async function checkTournamentTimeout(
  state: StreamingTournamentState,
  _onProgress?: (progress: StreamingProgress) => void,
): Promise<boolean> {
  const now = Date.now();
  const tournamentElapsed = now - state.tournamentStartTime;

  // Check if tournament has exceeded overall timeout
  if (tournamentElapsed > TOURNAMENT_TIMEOUT_MS) {
    console.warn(
      `[streaming] Tournament timeout exceeded: ${Math.round(tournamentElapsed / 1000)}s > ${Math.round(TOURNAMENT_TIMEOUT_MS / 1000)}s`,
    );

    // Force complete any remaining matches
    await forceCompleteStuckMatches(state);

    // Mark tournament as completed
    state.bracket.status = "completed";
    state.isComplete = true;

    console.log(`[streaming] Tournament force-completed due to timeout`);
    return true;
  }

  return false;
}

/**
 * Check for stuck matches and force resolution if they exceed timeout.
 */
export async function checkAndResolveStuckMatches(state: StreamingTournamentState): Promise<void> {
  const now = Date.now();

  // Convert Map.entries() to array for better TypeScript compatibility
  const matchEntries = Array.from(state.matchStartTimes.entries());

  for (const [matchId, startTime] of matchEntries) {
    const elapsed = now - startTime;

    // Skip if match already completed or already forced
    if (state.judgedMatches.has(matchId) || state.stuckMatches.has(matchId)) {
      continue;
    }

    // Check if match has exceeded timeout
    if (elapsed > MATCH_TIMEOUT_MS) {
      console.warn(
        `[streaming] Match timeout exceeded for ${matchId}: ${Math.round(elapsed / 1000)}s > ${Math.round(MATCH_TIMEOUT_MS / 1000)}s`,
      );

      // Force resolve this match
      await forceResolveMatch(state, matchId);
    }
  }
}

/**
 * Force resolve a stuck match with a random winner.
 */
export async function forceResolveMatch(
  state: StreamingTournamentState,
  matchId: string,
): Promise<void> {
  // Find the match in the bracket
  const match = state.bracket.matches.find((m) => m.id === matchId);
  if (!match || !match.modelA || !match.modelB) {
    console.error(
      `[streaming] Cannot force resolve match ${matchId} - match not found or incomplete`,
    );
    return;
  }

  // Random winner selection
  const randomWinner = Math.random() < 0.5 ? match.modelA : match.modelB;
  const loser = randomWinner === match.modelA ? match.modelB : match.modelA;

  console.log(
    `[streaming] Force resolving stuck match: ${randomWinner} vs ${loser} -> ${randomWinner} wins (timeout)`,
  );

  // Update bracket with forced result
  state.bracket = updateMatchResult(
    state.bracket,
    matchId,
    randomWinner,
    `Match timed out after ${Math.round(MATCH_TIMEOUT_MS / 1000)} seconds. ${randomWinner} randomly selected to advance.`,
  );

  // Mark match as judged and stuck
  state.judgedMatches.add(matchId);
  state.judgingMatches.delete(matchId);
  state.stuckMatches.add(matchId);

  // Save bracket to database
  try {
    await updateTournamentBracket(state.bracket);
  } catch (dbError) {
    console.error(`[streaming] Failed to save bracket after forcing match ${matchId}:`, dbError);
  }

  console.log(`[streaming] ✅ Match force-resolved: ${randomWinner} beats ${loser} (timeout)`);
}

/**
 * Force complete all remaining matches in the tournament.
 */
export async function forceCompleteStuckMatches(state: StreamingTournamentState): Promise<void> {
  console.log(`[streaming] Force completing all remaining matches due to tournament timeout`);

  // Get all incomplete matches across all rounds
  for (let round = state.currentRound; round <= state.bracket.totalRounds; round++) {
    const roundMatches = getMatchesForRound(state.bracket, round);

    for (const match of roundMatches) {
      // Skip if already judged
      if (state.judgedMatches.has(match.id) || match.winner) {
        continue;
      }

      // Skip if models aren't ready (shouldn't happen in timeout scenario)
      if (!match.modelA || !match.modelB) {
        continue;
      }

      await forceResolveMatch(state, match.id);
    }

    // Advance winners after completing each round
    if (round < state.bracket.totalRounds) {
      state.bracket = advanceWinners(state.bracket);
      state.currentRound = state.bracket.currentRound;
    }
  }
}
