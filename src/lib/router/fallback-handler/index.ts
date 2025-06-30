/**
 * @file Fallback handler index
 * @description Re-exports all fallback handling functionality
 */

// Constants and data
export * from "./constants";

// Core selection logic
export {
  getGeneralFallback,
  handleModelSelectionFallback,
  tryCapabilityFallback,
} from "./selection";

// Hierarchy navigation
export { tryParentCapabilityFallback } from "./hierarchy";

// Workflow creation
export { createFallbackWorkflow } from "./workflow";

// ELO handling
export { handleMissingEloData } from "./elo-handling";

// Validation
export { validateFallbackSelection } from "./validation";
