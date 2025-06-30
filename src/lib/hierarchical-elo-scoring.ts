/**
 * @file Hierarchical ELO scoring module redirect.
 * @description Backward compatibility redirect for @/lib/hierarchical-elo-scoring imports.
 * The hierarchical ELO functionality has been moved to @/lib/elo/ directory structure.
 */

// Re-export all hierarchical ELO functionality from the new locations
export * from "./elo/database";
export * from "./elo/queries";
export * from "./elo/updates";
