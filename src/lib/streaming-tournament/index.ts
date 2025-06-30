/**
 * @file Streaming tournament index
 * @description Re-exports all streaming tournament functionality for backward compatibility
 */

// Core execution
export { executeStreamingTournament, MATCH_TIMEOUT_MS, TOURNAMENT_TIMEOUT_MS } from "./core";

// Timeout and stuck match handling
export {
  checkAndResolveStuckMatches,
  checkTournamentTimeout,
  forceCompleteStuckMatches,
  forceResolveMatch,
} from "./timeout-handler";

// Judge management
export { checkAndJudgeReadyMatches } from "./judge-manager";

// Legacy function - kept for backward compatibility
// Note: This should be imported from the original file for now
// TODO: Move executeModelsWithStreamingJudging to legacy.ts module
export { executeModelsWithStreamingJudging } from "../streaming-tournament";
