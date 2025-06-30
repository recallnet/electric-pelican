/**
 * @file Tournament judging index
 * @description Re-exports all tournament judging functionality
 */

// Parser utilities
export { parseWinner, selectFallbackWinner } from "./parser";

// Individual matchup judging
export { judgeMatchup } from "./matchup";

// Re-export remaining functions from main file temporarily
export {
  getTournamentWinner,
  judgeCurrentRound,
  runTournamentJudging,
} from "../tournament-judging";
