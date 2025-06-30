/**
 * @file Workflow optimization for model selection.
 * @description Merges compatible workflow steps and optimizes model assignments
 * to reduce complexity and improve efficiency.
 */

import type { OptimizedWorkflowStep, WorkflowStep } from "@/types/router";

import {
  areStepsCompatible,
  createMergedDescription,
  findCircularDependencies,
} from "./workflow-optimizer-utils";

/**
 * Optimize workflow by merging compatible steps
 * @param steps - Array of workflow steps with model assignments
 * @returns Optimized workflow steps
 */
export function optimizeWorkflowSteps(steps: OptimizedWorkflowStep[]): OptimizedWorkflowStep[] {
  if (steps.length <= 1) {
    return steps;
  }

  const optimized: OptimizedWorkflowStep[] = [];
  const processed = new Set<string>();

  for (const step of steps) {
    if (processed.has(step.id)) {
      continue;
    }

    // Find steps that can be merged with this one
    const compatibleSteps = findCompatibleSteps(step, steps, processed);
    if (compatibleSteps.length > 0) {
      // Merge compatible steps
      const mergedStep = mergeWorkflowSteps(step, compatibleSteps);
      optimized.push(mergedStep);

      // Mark all merged steps as processed
      processed.add(step.id);
      compatibleSteps.forEach((s) => processed.add(s.id));
    } else {
      // No compatible steps, add as-is
      optimized.push(step);
      processed.add(step.id);
    }
  }

  return optimized;
}

/**
 * Find steps that can be merged with the given step
 * @param targetStep - The step to find compatible steps for
 * @param allSteps - All workflow steps
 * @param processed - Set of already processed step IDs
 * @returns Array of compatible steps
 */
function findCompatibleSteps(
  targetStep: OptimizedWorkflowStep,
  allSteps: OptimizedWorkflowStep[],
  processed: Set<string>,
): OptimizedWorkflowStep[] {
  const compatible: OptimizedWorkflowStep[] = [];

  for (const step of allSteps) {
    if (step.id === targetStep.id || processed.has(step.id)) {
      continue;
    }

    if (areStepsCompatible(targetStep, step)) {
      compatible.push(step);
    }
  }

  return compatible;
}

/**
 * Merge multiple workflow steps into a single optimized step
 * @param primaryStep - The primary step to merge into
 * @param additionalSteps - Additional steps to merge
 * @returns Merged workflow step
 */
function mergeWorkflowSteps(
  primaryStep: OptimizedWorkflowStep,
  additionalSteps: OptimizedWorkflowStep[],
): OptimizedWorkflowStep {
  const allSteps = [primaryStep, ...additionalSteps];

  // Combine descriptions
  const descriptions = allSteps.map((s) => s.description);
  const mergedDescription = createMergedDescription(descriptions);

  // Combine capabilities (remove duplicates)
  const allCapabilities = allSteps.flatMap((s) => s.requiredCapabilities);
  const uniqueCapabilities = [...new Set(allCapabilities)];

  // Combine dependencies (exclude self-references and internal dependencies)
  const allDependencies = allSteps.flatMap((s) => s.dependencies);
  const stepIds = new Set(allSteps.map((s) => s.id));

  // Filter out dependencies that are internal to the merged steps
  const externalDependencies = allDependencies.filter((dep) => !stepIds.has(dep));
  const uniqueDependencies = [...new Set(externalDependencies)];

  // Sum estimated tokens
  const totalTokens = allSteps.reduce((sum, step) => sum + step.estimatedTokens, 0);

  // Use highest priority
  const maxPriority = Math.max(...allSteps.map((s) => s.priority));

  // Track merged step IDs for validation
  const mergedStepIds = allSteps.map((s) => s.id);

  // Use the primary step's ID as the base, but make it clear it's merged
  const mergedId = allSteps.length > 1 ? `merged-${primaryStep.id}` : primaryStep.id;

  return {
    id: mergedId,
    description: mergedDescription,
    requiredCapabilities: uniqueCapabilities,
    primaryCapability: uniqueCapabilities[0] || "semantic-understanding",
    selectedModel: primaryStep.selectedModel, // All steps use the same model
    mergedSteps: mergedStepIds,
    dependencies: uniqueDependencies,
    estimatedTokens: totalTokens,
    priority: maxPriority,
  };
}

/**
 * Validate workflow structure after optimization
 * @param workflow - Optimized workflow steps
 * @returns Validation result with any issues found
 */
export function validateOptimizedWorkflow(workflow: OptimizedWorkflowStep[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build a map of all step IDs including merged steps
  const allStepIds = new Set<string>();
  workflow.forEach((step) => {
    allStepIds.add(step.id);
    // Add merged step IDs if they exist
    if (step.mergedSteps) {
      step.mergedSteps.forEach((mergedId) => allStepIds.add(mergedId));
    }
  });

  // Check for circular dependencies
  const circularDeps = findCircularDependencies(workflow);
  if (circularDeps.length > 0) {
    errors.push(`Circular dependencies detected: ${circularDeps.join(", ")}`);
  }

  // Check for missing dependencies - but account for merged steps
  for (const step of workflow) {
    for (const dep of step.dependencies) {
      if (!allStepIds.has(dep)) {
        errors.push(`Step ${step.id} depends on missing step: ${dep}`);
      }
    }
  }

  // Check for overly complex merged steps
  for (const step of workflow) {
    if (step.mergedSteps && step.mergedSteps.length > 4) {
      warnings.push(
        `Step ${step.id} merges many steps (${step.mergedSteps.length}), consider splitting`,
      );
    }

    if (step.estimatedTokens > 10000) {
      warnings.push(
        `Step ${step.id} has high token usage (${step.estimatedTokens}), may hit limits`,
      );
    }

    if (step.requiredCapabilities.length > 6) {
      warnings.push(
        `Step ${step.id} requires many capabilities (${step.requiredCapabilities.length}), may be unfocused`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate optimization metrics for the workflow
 * @param originalSteps - Original workflow steps before optimization
 * @param optimizedSteps - Optimized workflow steps
 * @returns Optimization metrics
 */
export function calculateOptimizationMetrics(
  originalSteps: WorkflowStep[],
  optimizedSteps: OptimizedWorkflowStep[],
): {
  stepsReduced: number;
  reductionPercentage: number;
  modelsUsed: number;
  averageTokensPerStep: number;
  complexityScore: number;
} {
  const stepsReduced = originalSteps.length - optimizedSteps.length;
  const reductionPercentage =
    originalSteps.length > 0 ? (stepsReduced / originalSteps.length) * 100 : 0;

  const uniqueModels = new Set(optimizedSteps.map((s) => s.selectedModel.modelId));
  const modelsUsed = uniqueModels.size;

  const totalTokens = optimizedSteps.reduce((sum, step) => sum + step.estimatedTokens, 0);
  const averageTokensPerStep = optimizedSteps.length > 0 ? totalTokens / optimizedSteps.length : 0;

  // Calculate complexity score (lower is better)
  const dependencyComplexity = optimizedSteps.reduce(
    (sum, step) => sum + step.dependencies.length,
    0,
  );
  const capabilityComplexity = optimizedSteps.reduce(
    (sum, step) => sum + step.requiredCapabilities.length,
    0,
  );
  const complexityScore = dependencyComplexity + capabilityComplexity + modelsUsed;

  return {
    stepsReduced,
    reductionPercentage,
    modelsUsed,
    averageTokensPerStep,
    complexityScore,
  };
}
