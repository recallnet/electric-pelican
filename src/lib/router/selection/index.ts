/**
 * @file Router selection module index
 * @description Re-exports all selection functionality for backward compatibility
 */

// Re-export core strategies
export {
  calculateStrategyScore,
  getSelectionStrategy,
  selectGeneralistModel,
  SELECTION_STRATEGIES,
  selectSpecialistModel,
} from "./strategies";

// Re-export metadata functions
export {
  estimateContextLength,
  estimateCostFromModel,
  estimateLatencyFromModel,
  extractProvider,
  formatModelName,
  getModelMetadata,
} from "./metadata";

// Re-export scoring functions
export { estimateCost, estimateTime } from "./scoring";
