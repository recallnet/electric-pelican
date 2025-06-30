/**
 * @file ELO scoring module redirect.
 * @description Backward compatibility redirect for @/lib/elo-scoring imports.
 * The ELO functionality has been moved to @/lib/elo/ directory structure.
 */

// Re-export all ELO functionality from the new location
export * from "./elo/core";
export * from "./elo/database";
export * from "./elo/queries";
export * from "./elo/updates";

// Re-export the main index as default
