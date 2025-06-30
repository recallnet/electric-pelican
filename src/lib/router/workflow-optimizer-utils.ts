/**
 * @file Workflow optimization utilities
 * @description Helper functions for workflow step compatibility and validation
 */

import type { OptimizedWorkflowStep } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Check if two steps can be merged
 * @param step1 - First step
 * @param step2 - Second step
 * @returns Whether the steps are compatible for merging
 */
export function areStepsCompatible(
  step1: OptimizedWorkflowStep,
  step2: OptimizedWorkflowStep,
): boolean {
  // Must use the same model
  if (step1.selectedModel.modelId !== step2.selectedModel.modelId) {
    return false;
  }

  // Check for dependency conflicts
  if (hasDependencyConflict(step1, step2)) {
    return false;
  }

  // Check if capabilities are complementary
  if (!areCapabilitiesCompatible(step1.requiredCapabilities, step2.requiredCapabilities)) {
    return false;
  }

  // Check token limits (don't merge if combined tokens would be too high)
  const combinedTokens = step1.estimatedTokens + step2.estimatedTokens;
  if (combinedTokens > 8000) {
    // Conservative limit
    return false;
  }

  return true;
}

/**
 * Check if there's a dependency conflict between two steps
 * @param step1 - First step
 * @param step2 - Second step
 * @returns Whether there's a dependency conflict
 */
export function hasDependencyConflict(
  step1: OptimizedWorkflowStep,
  step2: OptimizedWorkflowStep,
): boolean {
  // Step1 depends on step2, or step2 depends on step1
  if (step1.dependencies.includes(step2.id) || step2.dependencies.includes(step1.id)) {
    return true;
  }

  // Check for indirect dependencies through other steps
  // This is a simplified check - a full implementation would do transitive closure
  const step1Deps = new Set(step1.dependencies);
  const step2Deps = new Set(step2.dependencies);

  // If they have conflicting dependencies, they can't be merged
  for (const dep of step1Deps) {
    if (step2Deps.has(dep) && step1.priority !== step2.priority) {
      return true;
    }
  }

  return false;
}

/**
 * Check if capabilities are compatible for merging
 * @param caps1 - First set of capabilities
 * @param caps2 - Second set of capabilities
 * @returns Whether capabilities are compatible
 */
export function areCapabilitiesCompatible(
  caps1: HierarchicalTagId[],
  caps2: HierarchicalTagId[],
): boolean {
  // Allow merging if capabilities are related or complementary
  const combinedCaps = [...new Set([...caps1, ...caps2])];

  // Don't merge if there are too many different capabilities
  if (combinedCaps.length > 5) {
    return false;
  }

  // Check for conflicting capability types
  const conflictingPairs: Array<[string, string]> = [
    ["artistic-creation", "algorithm-implementation"],
    ["visual-design", "data-analysis"],
    ["creative-writing", "technical-documentation"],
  ];

  for (const [cap1, cap2] of conflictingPairs) {
    const hasCap1 = combinedCaps.some((c) => c.includes(cap1));
    const hasCap2 = combinedCaps.some((c) => c.includes(cap2));

    if (hasCap1 && hasCap2) {
      return false;
    }
  }

  return true;
}

/**
 * Create a coherent description from multiple step descriptions
 * @param descriptions - Array of step descriptions
 * @returns Merged description
 */
export function createMergedDescription(descriptions: string[]): string {
  if (descriptions.length === 1) {
    return descriptions[0]!;
  }

  if (descriptions.length === 2) {
    return `${descriptions[0]} and ${descriptions[1]}`;
  }

  // For multiple descriptions, create a list
  const lastDescription = descriptions[descriptions.length - 1];
  const otherDescriptions = descriptions.slice(0, -1);

  return `${otherDescriptions.join(", ")}, and ${lastDescription}`;
}

/**
 * Find circular dependencies in workflow
 * @param workflow - Workflow steps to check
 * @returns Array of step IDs involved in circular dependencies
 */
export function findCircularDependencies(workflow: OptimizedWorkflowStep[]): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[] = [];

  const dependencyMap = new Map<string, string[]>();
  workflow.forEach((step) => {
    dependencyMap.set(step.id, step.dependencies);
  });

  function hasCycle(stepId: string): boolean {
    if (recursionStack.has(stepId)) {
      cycles.push(stepId);
      return true;
    }

    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const dependencies = dependencyMap.get(stepId) || [];
    for (const dep of dependencies) {
      if (hasCycle(dep)) {
        return true;
      }
    }

    recursionStack.delete(stepId);
    return false;
  }

  for (const step of workflow) {
    if (!visited.has(step.id)) {
      hasCycle(step.id);
    }
  }

  return [...new Set(cycles)];
}
