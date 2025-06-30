/**
 * ELO Rating System - Unified Export
 *
 * Re-exports all ELO functions for backward compatibility.
 * Maintains existing import paths while providing access to the new modular structure.
 */

// Core ELO calculation functions and constants
export * from "./core";

// Database operations for both global and hierarchical systems
export * from "./database";

// Update functions for both global and hierarchical ELO
export * from "./updates";

// Query functions for leaderboards and statistics
export * from "./queries";

// Named re-exports for clarity
export { calculateExpectedScore, calculateNewEloRating, K_FACTOR, STARTING_ELO } from "./core";
export { getOrCreateModelScore, getOrCreateModelTagScore } from "./database";
export { getLeaderboard, getModelStats, getModelTagScores, getTagLeaderboard } from "./queries";
export { updateEloScores, updateHierarchicalEloScores } from "./updates";
