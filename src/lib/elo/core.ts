/**
 * Core ELO Rating System Implementation
 *
 * Pure ELO calculation functions and constants shared between
 * global and hierarchical ELO systems.
 *
 * Standard ELO algorithm with:
 * - Starting rating: 1200
 * - K-factor: 32 (standard for active competitors)
 * - Unbounded scoring (can go below 1200)
 */

/**
 * ELO system constants
 */
export const STARTING_ELO = 1200;
export const K_FACTOR = 32;

/**
 * Calculate expected score for a player given their rating and opponent's rating.
 * Uses standard ELO formula: E = 1 / (1 + 10^((opponent - player) / 400))
 *
 * @param playerRating - Current ELO rating of the player
 * @param opponentRating - Current ELO rating of the opponent
 * @returns Expected score (0-1, where 1 = certain win, 0.5 = even match)
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a match.
 * Uses standard ELO formula: NewRating = OldRating + K * (ActualScore - ExpectedScore)
 *
 * @param currentRating - Current ELO rating
 * @param opponentRating - Opponent's ELO rating
 * @param actualScore - Actual match result (1 = win, 0 = loss, 0.5 = draw)
 * @returns New ELO rating (rounded to nearest integer)
 */
export function calculateNewEloRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number,
): number {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);
  const newRating = currentRating + K_FACTOR * (actualScore - expectedScore);
  return Math.round(newRating);
}
