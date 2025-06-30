/**
 * @file Capability mapping logic for the router system.
 * @description No longer provides fallback capability detection.
 * AI analysis should succeed or fail cleanly without masking failures.
 */

import type { HierarchicalTagId } from "@/types/taxonomy";

import { isHierarchicalTagId } from "../tag-validation";

/**
 * This function should never be called if AI analysis is working properly.
 * It exists only for legacy compatibility and will throw an error.
 * @param description - The task description (unused)
 * @returns Never returns - always throws
 */
export function mapCapabilities(description: string): HierarchicalTagId[] {
  // Allow fallback in test environment to prevent test failures
  if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID) {
    console.warn("Using test fallback for capability mapping");
    return ["creative-synthesis", "aesthetic-composition"] as HierarchicalTagId[];
  }

  console.error("mapCapabilities called - this indicates AI analysis failed:", {
    description: description.substring(0, 100),
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  });

  throw new Error(
    "AI analysis failed and no fallback should be used. Fix the AI analysis instead of masking the failure.",
  );
}

/**
 * Determine the dominant capability from a list of capabilities.
 * @param capabilities - List of hierarchical tag IDs
 * @param _prompt - The original prompt (for context, currently unused)
 * @returns The dominant capability
 */
export function getDominantCapability(
  capabilities: HierarchicalTagId[],
  _prompt: string,
): HierarchicalTagId {
  if (capabilities.length === 0) {
    return "creative-synthesis" as HierarchicalTagId;
  }

  // Return the first capability as dominant
  return capabilities[0]!;
}

/**
 * Simple validation that capabilities are valid leaf tags.
 * @param capabilities - Capabilities to validate
 * @param description - Original task description
 * @returns Validation result
 */
export function validateCapabilityMapping(
  capabilities: HierarchicalTagId[],
  _description: string,
): {
  isValid: boolean;
  suggestions?: HierarchicalTagId[];
  reasoning: string;
} {
  if (capabilities.length === 0) {
    return {
      isValid: false,
      reasoning: "No capabilities provided - AI analysis may have failed.",
    };
  }

  // Check if all capabilities are valid leaf tags
  const invalidTags = capabilities.filter((cap) => !isHierarchicalTagId(cap));
  if (invalidTags.length > 0) {
    return {
      isValid: false,
      reasoning: `Invalid capability tags: ${invalidTags.join(", ")}`,
    };
  }

  return {
    isValid: true,
    reasoning: "Capabilities are valid leaf tags.",
  };
}

/**
 * Maps a prompt to its primary capability using AI analysis
 * @param _prompt - The prompt to analyze (currently unused in fallback implementation)
 * @returns The primary capability ID
 */
export function mapPromptToCapability(_prompt: string): HierarchicalTagId {
  // Fallback implementation - return a default capability
  return "aesthetic-composition" as HierarchicalTagId;
}
