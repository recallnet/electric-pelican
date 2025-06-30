/**
 * @file Tournament bracket module.
 * @description Provides functions for managing tournament brackets, including creation,
 * match updates, and winner advancement. Supports 4, 8, and 16 model tournaments.
 * This module is the core implementation of the tournament bracket logic and ensures
 * fair competition between AI models.
 */

import { v4 as uuidv4 } from "uuid";

import { BracketMatch, TournamentBracket } from "@/types/tournament";

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * @description Implements the Fisher-Yates shuffle algorithm for random seeding of models.
 * This ensures fair and random initial matchups in the tournament bracket.
 * The algorithm runs in O(n) time and modifies the array in-place.
 *
 * @param array - Array to shuffle
 * @returns New array with elements in random order
 * @example
 * ```ts
 * const models = ['model1', 'model2', 'model3', 'model4'];
 * const shuffled = shuffleArray(models);
 * // Returns something like: ['model3', 'model1', 'model4', 'model2']
 * ```
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] as [T, T];
  }
  return shuffled;
}

/**
 * Create bracket structure for a tournament.
 * @description Creates a tournament bracket with randomly seeded models.
 * Supports 4, 8, and 16 model tournaments with appropriate number of rounds.
 * The bracket structure follows a standard single-elimination tournament format
 * where winners advance to the next round until a final winner is determined.
 *
 * @param tournamentId - ID of the tournament this bracket belongs to
 * @param models - Array of model IDs to include in the bracket
 * @returns Tournament bracket structure with initial matches
 * @throws Error if bracket size is not 4, 8, or 16
 * @example
 * ```ts
 * const bracket = createTournamentBracket('tournament123', ['model1', 'model2', 'model3', 'model4']);
 * // Returns a bracket structure with 2 rounds and randomly seeded initial matches
 * ```
 */
export function createTournamentBracket(tournamentId: string, models: string[]): TournamentBracket {
  const bracketSize = models.length;

  // Validate bracket size
  if (![4, 8, 16].includes(bracketSize)) {
    throw new Error("Bracket size must be 4, 8, or 16 models");
  }

  const totalRounds = Math.log2(bracketSize);
  const seededModels = shuffleArray(models);

  // Generate all matches for all rounds
  const matches: BracketMatch[] = [];
  let matchesInRound = bracketSize / 2;

  for (let round = 1; round <= totalRounds; round++) {
    for (let position = 1; position <= matchesInRound; position++) {
      const match: BracketMatch = {
        id: uuidv4(),
        round,
        position,
        modelA: null,
        modelB: null,
        winner: null,
      };

      // For first round, assign models directly
      if (round === 1) {
        const modelAIndex = (position - 1) * 2;
        const modelBIndex = modelAIndex + 1;
        match.modelA = seededModels[modelAIndex] || null;
        match.modelB = seededModels[modelBIndex] || null;
      }

      matches.push(match);
    }
    matchesInRound = Math.floor(matchesInRound / 2);
  }

  return {
    tournamentId,
    bracketSize,
    totalRounds,
    matches,
    status: "created",
    currentRound: 1,
  };
}

/**
 * Advance winners to the next round in the bracket.
 * @description Updates the bracket structure by moving winners from completed matches
 * to their next round matches. Updates tournament status when all rounds complete.
 * This function is called after each round is completed to progress the tournament.
 * It handles the logic of placing winners in the correct positions for the next round
 * and determines when the tournament is complete.
 *
 * @param bracket - Current tournament bracket state
 * @returns Updated tournament bracket with winners advanced
 * @example
 * ```ts
 * const updatedBracket = advanceWinners(currentBracket);
 * if (updatedBracket.status === 'completed') {
 *   // Tournament is finished, winner is in the final match
 * }
 * ```
 */
export function advanceWinners(bracket: TournamentBracket): TournamentBracket {
  const updatedBracket = { ...bracket };
  const { matches, currentRound, totalRounds } = updatedBracket;

  // Get completed matches from current round
  const currentRoundMatches = matches.filter((m) => m.round === currentRound && m.winner !== null);

  // Check if all matches in current round are complete
  const totalMatchesInRound = matches.filter((m) => m.round === currentRound).length;

  if (currentRoundMatches.length < totalMatchesInRound) {
    // Not all matches complete yet
    return updatedBracket;
  }

  // Advance winners to next round
  if (currentRound < totalRounds) {
    const nextRound = currentRound + 1;
    const nextRoundMatches = matches.filter((m) => m.round === nextRound);

    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];

      if (nextMatch) {
        if (index % 2 === 0) {
          nextMatch.modelA = match.winner;
        } else {
          nextMatch.modelB = match.winner;
        }
      }
    });

    updatedBracket.currentRound = nextRound;
  } else {
    // Tournament complete
    updatedBracket.status = "completed";
  }

  return updatedBracket;
}

/**
 * Get all matches for a specific round.
 * @description Filters and returns matches from a specific round number.
 * Useful for displaying or processing matches round by round.
 * Round numbers start at 1 and increase up to the total number of rounds.
 *
 * @param bracket - Tournament bracket to get matches from
 * @param round - Round number to filter by (1-based index)
 * @returns Array of matches in the specified round
 * @example
 * ```ts
 * const firstRoundMatches = getMatchesForRound(bracket, 1);
 * // Returns all matches from the first round
 * ```
 */
export function getMatchesForRound(bracket: TournamentBracket, round: number): BracketMatch[] {
  return bracket.matches.filter((m) => m.round === round);
}

/**
 * Update a match with the winner and judge explanation.
 * @description Sets the winner and optional judge explanation for a specific match.
 * Validates that the winner is a participant in the match to prevent invalid results.
 * This function is called after a judge has determined the winner of a match.
 * The judge explanation provides context for why a particular model was chosen as the winner.
 *
 * @param bracket - Tournament bracket to update
 * @param matchId - ID of the match to update
 * @param winner - ID of the winning model
 * @param judgeExplanation - Optional explanation from the judge detailing the decision
 * @returns Updated tournament bracket
 * @throws Error if match not found or winner is invalid
 * @example
 * ```ts
 * const updatedBracket = updateMatchResult(
 *   bracket,
 *   'match123',
 *   'model1',
 *   'Model 1 provided a more comprehensive and accurate response'
 * );
 * ```
 */
export function updateMatchResult(
  bracket: TournamentBracket,
  matchId: string,
  winner: string,
  judgeExplanation?: string,
): TournamentBracket {
  const updatedBracket = { ...bracket };
  const match = updatedBracket.matches.find((m) => m.id === matchId);

  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  if (winner !== match.modelA && winner !== match.modelB) {
    throw new Error(`Winner ${winner} is not a participant in this match`);
  }

  match.winner = winner;
  if (judgeExplanation) {
    match.judgeExplanation = judgeExplanation;
  }

  return updatedBracket;
}
