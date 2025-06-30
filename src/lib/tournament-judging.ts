/**
 * @file Tournament judging - Main orchestration logic
 * @description Re-exports from modular structure plus remaining functions
 */

import type { HierarchicalTagId } from "@/types/taxonomy";
import { JudgeMatchup, TournamentBracket } from "@/types/tournament";

import { advanceWinners, getMatchesForRound, updateMatchResult } from "./bracket";
import { updateEloScores, updateHierarchicalEloScores } from "./elo";

// Re-export split modules
export { judgeMatchup } from "./tournament-judging/matchup";
export { parseWinner, selectFallbackWinner } from "./tournament-judging/parser";

/**
 * Judge all matches in the current round of a tournament.
 * Returns updated bracket with match results.
 * Now includes ELO score updates for each match.
 */
export async function judgeCurrentRound(
  bracket: TournamentBracket,
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  tournamentRunId?: string,
  tournamentTagIds?: HierarchicalTagId[],
): Promise<{ updatedBracket: TournamentBracket; matches: JudgeMatchup[] }> {
  console.log(
    `[tournament] Starting judging for round ${bracket.currentRound} with judge model: ${judgeModel}`,
  );

  if (!bracket.modelResponses) {
    throw new Error("Tournament models have not been executed yet");
  }

  const currentRoundMatches = getMatchesForRound(bracket, bracket.currentRound);
  const readyMatches = currentRoundMatches.filter((m) => m.modelA && m.modelB && !m.winner);

  console.log(
    `[tournament] ${tournamentRunId || "NOT PROVIDED"}. Found ${readyMatches.length} matches ready for judging in round ${bracket.currentRound}`,
  );

  if (readyMatches.length === 0) {
    throw new Error("No matches ready for judging in current round");
  }

  let updatedBracket = { ...bracket };
  const judgeResults: JudgeMatchup[] = [];

  // Import judgeMatchup dynamically to avoid circular imports
  const { judgeMatchup } = await import("./tournament-judging/matchup");

  // Judge all matches in parallel
  const judgingPromises = readyMatches.map(async (match) => {
    const responseA = bracket.modelResponses![match.modelA!];
    const responseB = bracket.modelResponses![match.modelB!];

    // Handle cases where one or both models failed
    const modelAFailed = !responseA || responseA.status !== "success";
    const modelBFailed = !responseB || responseB.status !== "success";

    if (modelAFailed && modelBFailed) {
      // Both models failed - pick one at random to advance
      const randomWinner = Math.random() < 0.5 ? match.modelA! : match.modelB!;
      console.log(
        `[tournament] Both models failed in ${match.modelA} vs ${match.modelB}, randomly advancing ${randomWinner}`,
      );

      return {
        match,
        judgeResult: {
          winner: randomWinner,
          explanation: `Both models failed to generate responses. ${randomWinner} randomly selected to advance.`,
          resultType: "random_advance" as const,
        },
      };
    }

    if (modelAFailed) {
      // Model A failed, Model B wins by forfeit
      console.log(`[tournament] ${match.modelA} failed, ${match.modelB} wins by forfeit`);
      return {
        match,
        judgeResult: {
          winner: match.modelB!,
          explanation: `${match.modelA} failed to generate a response. ${match.modelB} wins by forfeit.`,
          resultType: "forfeit" as const,
        },
      };
    }

    if (modelBFailed) {
      // Model B failed, Model A wins by forfeit
      console.log(`[tournament] ${match.modelB} failed, ${match.modelA} wins by forfeit`);
      return {
        match,
        judgeResult: {
          winner: match.modelA!,
          explanation: `${match.modelB} failed to generate a response. ${match.modelA} wins by forfeit.`,
          resultType: "forfeit" as const,
        },
      };
    }

    // Both models succeeded, proceed with normal judging
    console.log(`[tournament] Judging match: ${match.modelA} vs ${match.modelB}`);
    const judgeResult = await judgeMatchup(
      challengePrompt,
      judgePrompt,
      judgeModel,
      match.modelA!,
      match.modelB!,
      responseA.response,
      responseB.response,
    );
    console.log(`[tournament] Judge result: ${judgeResult.winner} wins`);

    return {
      match,
      judgeResult: {
        ...judgeResult,
        resultType: "judged" as const,
      },
    };
  });

  const results = await Promise.all(judgingPromises);

  // Update bracket with results and ELO scores
  for (const { match, judgeResult } of results) {
    updatedBracket = updateMatchResult(
      updatedBracket,
      match.id,
      judgeResult.winner,
      judgeResult.explanation,
    );

    // Update ELO scores only for legitimate judged matches
    if (tournamentRunId && judgeResult.resultType === "judged") {
      const loserModel = judgeResult.winner === match.modelA ? match.modelB! : match.modelA!;

      // Global ELO update (existing) - wrapped in its own try-catch
      try {
        const eloUpdates = await updateEloScores({
          tournamentRunId,
          roundNumber: bracket.currentRound,
          winnerModelId: judgeResult.winner,
          loserModelId: loserModel,
          resultType: judgeResult.resultType,
        });

        console.log(`[elo] Round ${bracket.currentRound}: Score updates completed:`, eloUpdates);
      } catch (eloError) {
        // Log ELO update errors but don't fail the tournament
        console.error(
          `[elo] CRITICAL: Failed to update scores for Round ${bracket.currentRound} match ${match.id}:`,
          eloError,
        );
        console.error(`[elo] Match details: ${judgeResult.winner} vs ${loserModel}`);
        console.error(`[elo] Tournament run ID: ${tournamentRunId}`);

        // In the future, we might want to add this to a retry queue
        // For now, we'll continue but log the error prominently
      }

      // Hierarchical ELO update (NEW) - wrapped in its own try-catch
      if (tournamentTagIds?.length) {
        try {
          console.log(
            `[hierarchical-elo] Round ${bracket.currentRound}: Updating hierarchical scores for tags: ${tournamentTagIds.join(", ")}`,
          );

          const hierarchicalUpdates = await updateHierarchicalEloScores({
            tournamentRunId,
            roundNumber: bracket.currentRound,
            winnerModelId: judgeResult.winner,
            loserModelId: loserModel,
            tournamentTagIds,
            resultType: judgeResult.resultType,
          });

          console.log(
            `[hierarchical-elo] Round ${bracket.currentRound}: Hierarchical updates completed: ${hierarchicalUpdates.length} models updated`,
          );
        } catch (hierarchicalError) {
          // Log error but don't fail tournament - hierarchical ELO is supplementary
          console.error(
            `[hierarchical-elo] CRITICAL: Failed to update hierarchical scores for Round ${bracket.currentRound} match ${match.id}:`,
            hierarchicalError,
          );
          console.error(`[hierarchical-elo] Match details: ${judgeResult.winner} vs ${loserModel}`);
          console.error(`[hierarchical-elo] Tournament run ID: ${tournamentRunId}`);
          console.error(`[hierarchical-elo] Tournament tags: ${tournamentTagIds?.join(", ")}`);

          // Continue execution - tournaments must complete even if hierarchical ELO fails
        }
      }
    } else if (tournamentRunId) {
      console.log(
        `[elo] Round ${bracket.currentRound}: Skipping ELO update for ${judgeResult.resultType} match: ${judgeResult.winner} vs ${judgeResult.winner === match.modelA ? match.modelB : match.modelA}`,
      );
    } else {
      console.warn(
        `[elo] WARNING: No tournament run ID provided for Round ${bracket.currentRound} - ELO scores will not be updated!`,
      );
    }

    judgeResults.push({
      matchId: match.id,
      modelA: match.modelA!,
      modelB: match.modelB!,
      winner: judgeResult.winner,
      judgeExplanation: judgeResult.explanation,
      resultType: judgeResult.resultType,
    });
  }

  console.log(
    `[tournament] Round ${bracket.currentRound} judging completed. ${judgeResults.length} matches processed.`,
  );

  return {
    updatedBracket,
    matches: judgeResults,
  };
}

/**
 * Run complete tournament judging, progressing through all rounds.
 * Returns final bracket with winner.
 * Now includes ELO score updates for all matches.
 */
export async function runTournamentJudging(
  bracket: TournamentBracket,
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  tournamentRunId?: string,
  tournamentTagIds?: HierarchicalTagId[],
): Promise<{ finalBracket: TournamentBracket; allMatches: JudgeMatchup[] }> {
  console.log(`[tournament] Starting complete tournament judging for ${bracket.tournamentId}`);
  console.log(
    `[tournament] Tournament has ${bracket.totalRounds} rounds with ${bracket.matches.length} total matches`,
  );
  console.log(
    `[tournament] Tournament run ID: ${tournamentRunId || "NOT PROVIDED - ELO UPDATES WILL BE SKIPPED!"}`,
  );

  if (tournamentTagIds?.length) {
    console.log(`[tournament] Hierarchical tags: ${tournamentTagIds.join(", ")}`);
  } else {
    console.log(`[tournament] No hierarchical tags - only global ELO will be updated`);
  }

  let currentBracket = { ...bracket };
  const allMatches: JudgeMatchup[] = [];

  while (currentBracket.status !== "completed") {
    console.log(
      `[tournament] ===== PROCESSING ROUND ${currentBracket.currentRound} of ${currentBracket.totalRounds} =====`,
    );

    const { updatedBracket, matches } = await judgeCurrentRound(
      currentBracket,
      challengePrompt,
      judgePrompt,
      judgeModel,
      tournamentRunId,
      tournamentTagIds,
    );

    allMatches.push(...matches);
    console.log(
      `[tournament] Round ${currentBracket.currentRound} completed. ${matches.length} matches judged.`,
    );

    currentBracket = advanceWinners(updatedBracket);
    console.log(
      `[tournament] Advanced to round ${currentBracket.currentRound}. Status: ${currentBracket.status}`,
    );

    // Safety check to prevent infinite loops
    if (currentBracket.currentRound > currentBracket.totalRounds) {
      console.error(
        `[tournament] SAFETY BREAK: Current round ${currentBracket.currentRound} exceeds total rounds ${currentBracket.totalRounds}`,
      );
      break;
    }
  }

  console.log(`[tournament] ===== TOURNAMENT COMPLETE =====`);
  console.log(`[tournament] Total matches processed: ${allMatches.length}`);
  console.log(`[tournament] Final status: ${currentBracket.status}`);

  if (tournamentRunId) {
    console.log(`[tournament] ELO updates were processed for tournament run: ${tournamentRunId}`);
    if (tournamentTagIds?.length) {
      console.log(
        `[tournament] Hierarchical ELO updates were processed for tags: ${tournamentTagIds.join(", ")}`,
      );
    }
  } else {
    console.warn(`[tournament] WARNING: No ELO updates were processed (missing tournament run ID)`);
  }

  return {
    finalBracket: currentBracket,
    allMatches,
  };
}

/**
 * Get the final winner of a completed tournament.
 */
export function getTournamentWinner(bracket: TournamentBracket): string | null {
  // Check if tournament is actually completed by looking at final match
  const finalMatch = bracket.matches.find((m) => m.round === bracket.totalRounds && m.winner);

  if (finalMatch && finalMatch.winner) {
    return finalMatch.winner;
  }

  // Fallback to checking bracket status (legacy behavior)
  if (bracket.status !== "completed") {
    return null;
  }

  return finalMatch?.winner || null;
}
