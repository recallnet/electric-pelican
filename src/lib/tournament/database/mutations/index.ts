/**
 * @file Tournament database mutations index
 * @description Re-exports all tournament mutation functions for backward compatibility
 */

// Tournament creation
export { createTournament, runtime } from "./tournament-creation";

// Bracket management
export {
  markTournamentRunCompleted,
  saveTournamentBracket,
  updateTournamentBracket,
  updateTournamentWithResponses,
} from "./bracket-management";

// Versioning and forking
export { createTournamentVersion, forkTournament } from "./versioning-forking";

// User interactions
export { toggleTournamentUpvote } from "./user-interactions";
