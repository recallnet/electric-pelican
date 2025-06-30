/**
 * @file Tournament database operations index.
 * @description Re-exports all tournament database functions for backward compatibility.
 */

// Re-export all query functions
export {
  getCompleteTournamentData,
  getCurrentTournamentRunId,
  getTournamentBracket,
  getTournamentBySlug,
  getTournamentForStatus,
  getTournamentGenealogy,
  getTournamentUpvoteCount,
  getTournamentVersions,
  hasUserUpvotedTournament,
  resolveTournamentId,
  tournamentExists,
} from "./queries";

// Re-export all mutation functions
export {
  createTournament,
  createTournamentVersion,
  forkTournament,
  markTournamentRunCompleted,
  saveTournamentBracket,
  toggleTournamentUpvote,
  updateTournamentBracket,
  updateTournamentWithResponses,
} from "./mutations";

// Re-export utility functions
export { generateCodename } from "./utils";

// Re-export runtime constant
export { runtime } from "./queries";
