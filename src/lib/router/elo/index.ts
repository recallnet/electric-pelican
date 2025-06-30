/**
 * @file Router ELO module index
 * @description Re-exports all ELO functionality for backward compatibility
 */

// Re-export client functions
export {
  calculateConfidence,
  checkModelAvailability,
  clearEloCache,
  createFallbackEloScore,
  getCacheStats,
  getGlobalEloScore,
  getModelEloScore,
  getModelEloScores,
  getTopModelsForCapability,
} from "./client";

// Re-export scoring functions
export { calculateModelFitness, calculateModelFitnessHierarchical } from "./scoring";

// Re-export hierarchical functions
export {
  adjustConfidenceForHierarchy,
  getHierarchicalEloScore,
  getTopModelsForCapabilityHierarchical,
} from "./hierarchical";
