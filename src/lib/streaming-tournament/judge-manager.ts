/**
 * @file Ready match checking and judging logic
 * @description Core streaming logic - judge matches as soon as both models are ready
 */

import { getMatchesForRound, updateMatchResult } from "@/lib/bracket";
import { updateEloScores, updateHierarchicalEloScores } from "@/lib/elo";
import { updateTournamentBracket } from "@/lib/tournament-db";
import { judgeMatchup } from "@/lib/tournament-judging";
import { StreamingProgress, StreamingTournamentState } from "@/types/streaming";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { JudgeMatchup } from "@/types/tournament";

import { checkAndResolveStuckMatches, checkTournamentTimeout } from "./timeout-handler";

/**
 * Check for newly ready matches and judge them immediately.
 * This is the core streaming logic - judge as soon as both models in a match are ready.
 */
export async function checkAndJudgeReadyMatches(
  state: StreamingTournamentState,
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  tournamentRunId: string | undefined,
  tournamentTagIds: HierarchicalTagId[] | undefined,
  onProgress: ((progress: StreamingProgress) => void) | undefined,
  allMatches: JudgeMatchup[],
): Promise<void> {
  let madeProgress = true;

  // Keep checking for ready matches until no more progress can be made
  while (madeProgress && !state.isComplete) {
    madeProgress = false;

    // Check for tournament timeout first
    const tournamentTimedOut = await checkTournamentTimeout(state, onProgress);
    if (tournamentTimedOut) {
      break;
    }

    // Check for stuck matches and resolve them
    await checkAndResolveStuckMatches(state);

    const roundMatches = getMatchesForRound(state.bracket, state.currentRound);
    const readyMatches = roundMatches.filter((match) => {
      // Match is ready if:
      // 1. Both models have completed (success or failure)
      // 2. Match hasn't been judged yet
      // 3. Match is not currently being judged (prevents race conditions)
      // 4. Match doesn't already have a winner
      const modelAReady = match.modelA && state.modelResponses[match.modelA] !== undefined;
      const modelBReady = match.modelB && state.modelResponses[match.modelB] !== undefined;
      const notJudged = !state.judgedMatches.has(match.id);
      const notCurrentlyJudging = !state.judgingMatches.has(match.id);
      const noWinner = !match.winner;

      return modelAReady && modelBReady && notJudged && notCurrentlyJudging && noWinner;
    });

    console.log(
      `[streaming] Round ${state.currentRound}: Found ${readyMatches.length} ready matches`,
    );

    // Judge all ready matches in parallel
    if (readyMatches.length > 0) {
      await Promise.all(
        readyMatches.map(async (match) => {
          // RACE CONDITION FIX: Mark match as being judged immediately
          if (state.judgingMatches.has(match.id) || state.judgedMatches.has(match.id)) {
            // Another parallel call already started judging this match
            return null;
          }
          state.judgingMatches.add(match.id);

          try {
            await judgeMatch(
              state,
              match,
              challengePrompt,
              judgePrompt,
              judgeModel,
              tournamentRunId,
              tournamentTagIds,
              allMatches,
              onProgress,
            );
          } catch (error) {
            console.error(`[streaming] Error judging match ${match.id}:`, error);
            // Remove from judging set even if error occurred
            state.judgingMatches.delete(match.id);
          }
        }),
      );

      madeProgress = true;
    }

    // After judging matches, check if we can advance to next round or complete tournament
    const allCurrentRoundMatches = getMatchesForRound(state.bracket, state.currentRound);
    const allMatchesJudged = allCurrentRoundMatches.every(
      (match) => state.judgedMatches.has(match.id) || match.winner,
    );

    if (allMatchesJudged) {
      if (state.currentRound < state.bracket.totalRounds) {
        console.log(`[streaming] Round ${state.currentRound} complete, advancing to next round`);

        // Advance winners to next round
        const { advanceWinners } = await import("@/lib/bracket");
        state.bracket = advanceWinners(state.bracket);
        state.currentRound = state.bracket.currentRound;

        // Update progress
        onProgress?.({
          type: "round_completed",
          currentRound: state.currentRound,
          totalModelsCompleted: state.completedModels.size,
          totalModelsRunning: state.pendingModels.size,
          totalMatchesJudged: state.judgedMatches.size,
          totalMatchesReady: 0,
          tournamentStatus: "judging",
        });

        madeProgress = true;
      } else {
        // Final round complete - tournament is finished
        console.log(`[streaming] Final round ${state.currentRound} complete, tournament finished!`);

        state.bracket.status = "completed";
        state.isComplete = true;

        // Update progress
        onProgress?.({
          type: "tournament_completed",
          currentRound: state.currentRound,
          totalModelsCompleted: state.completedModels.size,
          totalModelsRunning: state.pendingModels.size,
          totalMatchesJudged: state.judgedMatches.size,
          totalMatchesReady: 0,
          tournamentStatus: "completed",
        });

        break;
      }
    }

    // Legacy check - should not be needed with above fix
    if (state.currentRound > state.bracket.totalRounds) {
      state.bracket.status = "completed";
      state.isComplete = true;
      console.log(`[streaming] Tournament completed!`);
      break;
    }
  }
}

/**
 * Judge a single match with proper error handling and ELO updates
 */
async function judgeMatch(
  state: StreamingTournamentState,
  match: any,
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  tournamentRunId: string | undefined,
  tournamentTagIds: HierarchicalTagId[] | undefined,
  allMatches: JudgeMatchup[],
  onProgress?: (progress: StreamingProgress) => void,
): Promise<void> {
  // Track match start time for timeout monitoring
  if (!state.matchStartTimes.has(match.id)) {
    state.matchStartTimes.set(match.id, Date.now());
  }

  const responseA = state.modelResponses[match.modelA!];
  const responseB = state.modelResponses[match.modelB!];

  // Handle model failures
  const modelAFailed = !responseA || responseA.status !== "success";
  const modelBFailed = !responseB || responseB.status !== "success";

  let judgeResult: {
    winner: string;
    explanation: string;
    resultType: "judged" | "forfeit" | "random_advance";
  };

  if (modelAFailed && modelBFailed) {
    // Both failed - random selection
    const randomWinner = Math.random() < 0.5 ? match.modelA! : match.modelB!;
    console.log(
      `[streaming] Both models failed in ${match.modelA} vs ${match.modelB}, randomly advancing ${randomWinner}`,
    );
    judgeResult = {
      winner: randomWinner,
      explanation: `Both models failed to generate responses. ${randomWinner} randomly selected to advance.`,
      resultType: "random_advance",
    };
  } else if (modelAFailed) {
    // Model A failed
    console.log(`[streaming] ${match.modelA} failed, ${match.modelB} wins by forfeit`);
    judgeResult = {
      winner: match.modelB!,
      explanation: `${match.modelA} failed to generate a response. ${match.modelB} wins by forfeit.`,
      resultType: "forfeit",
    };
  } else if (modelBFailed) {
    // Model B failed
    console.log(`[streaming] ${match.modelB} failed, ${match.modelA} wins by forfeit`);
    judgeResult = {
      winner: match.modelA!,
      explanation: `${match.modelB} failed to generate a response. ${match.modelA} wins by forfeit.`,
      resultType: "forfeit",
    };
  } else {
    // Both succeeded - normal judging
    console.log(`[streaming] Judging match: ${match.modelA} vs ${match.modelB}`);

    try {
      const result = await judgeMatchup(
        challengePrompt,
        judgePrompt,
        judgeModel,
        match.modelA!,
        match.modelB!,
        responseA.response,
        responseB.response,
      );
      judgeResult = {
        ...result,
        resultType: "judged",
      };
    } catch (judgeError) {
      // CRITICAL: Handle judge failures that could orphan matches
      console.error(`[streaming] Judge failed for ${match.modelA} vs ${match.modelB}:`, judgeError);

      // Fall back to random winner instead of leaving match orphaned
      const randomWinner = Math.random() < 0.5 ? match.modelA! : match.modelB!;
      console.log(
        `[streaming] Falling back to random winner due to judge failure: ${randomWinner}`,
      );

      judgeResult = {
        winner: randomWinner,
        explanation: `Judge model failed: ${judgeError instanceof Error ? judgeError.message : "Unknown error"}. ${randomWinner} randomly selected to advance.`,
        resultType: "random_advance",
      };
    }
  }

  // Update bracket
  state.bracket = updateMatchResult(
    state.bracket,
    match.id,
    judgeResult.winner,
    judgeResult.explanation,
  );

  // Mark match as judged and remove from judging set
  state.judgedMatches.add(match.id);
  state.judgingMatches.delete(match.id);

  // Clean up match timing tracking
  state.matchStartTimes.delete(match.id);

  // Save bracket to database immediately for real-time status updates
  try {
    await updateTournamentBracket(state.bracket);
  } catch (dbError) {
    console.error(`[streaming] Failed to save bracket after match ${match.id}:`, dbError);
  }

  // Update ELO scores for legitimate matches
  if (tournamentRunId && judgeResult.resultType === "judged") {
    try {
      const loserModel = judgeResult.winner === match.modelA ? match.modelB! : match.modelA!;

      // Global ELO update (existing)
      await updateEloScores({
        tournamentRunId,
        roundNumber: state.currentRound,
        winnerModelId: judgeResult.winner,
        loserModelId: loserModel,
        resultType: judgeResult.resultType,
      });

      // Hierarchical ELO update (new) - only if we have tag IDs
      if (tournamentTagIds && tournamentTagIds.length > 0) {
        await updateHierarchicalEloScores({
          tournamentRunId,
          roundNumber: state.currentRound,
          winnerModelId: judgeResult.winner,
          loserModelId: loserModel,
          tournamentTagIds: tournamentTagIds,
          resultType: judgeResult.resultType,
        });
      }
    } catch (eloError) {
      console.error(`[streaming] ELO update failed for match ${match.id}:`, eloError);
    }
  }

  // Add to complete matches list
  allMatches.push({
    matchId: match.id,
    modelA: match.modelA!,
    modelB: match.modelB!,
    winner: judgeResult.winner,
    judgeExplanation: judgeResult.explanation,
    resultType: judgeResult.resultType,
  });

  // Emit match_judged progress event
  onProgress?.({
    type: "match_judged",
    matchId: match.id,
    winner: judgeResult.winner,
    judgeExplanation: judgeResult.explanation,
    totalModelsCompleted: state.completedModels.size,
    totalModelsRunning: state.pendingModels.size,
    totalMatchesJudged: state.judgedMatches.size,
    totalMatchesReady: 0, // Will be calculated dynamically in the main loop
    currentRound: state.currentRound,
    tournamentStatus: state.pendingModels.size > 0 ? "models_executing" : "judging",
  });

  console.log(
    `[streaming] ✅ Match judged: ${judgeResult.winner} beats ${judgeResult.winner === match.modelA ? match.modelB : match.modelA}`,
  );
}
