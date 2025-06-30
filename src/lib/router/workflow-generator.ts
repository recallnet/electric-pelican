/**
 * @file Workflow generation utilities for the router system.
 * @description Creates structured workflows with dependencies, optimization,
 * and validation logic.
 */

import type { WorkflowStep } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Generate workflow steps from router model response
 * @param routerResponse - Raw response from the router model
 * @param _originalPrompt - The original user prompt (unused currently)
 * @returns Array of structured workflow steps
 */
export function generateWorkflowSteps(
  routerResponse: {
    workflow: Array<{
      description: string;
      capabilities: string[];
      dependencies: string[];
      tokens: number;
    }>;
  },
  _originalPrompt: string,
): WorkflowStep[] {
  const steps: WorkflowStep[] = [];

  routerResponse.workflow.forEach((step, index) => {
    const stepId = `step-${index + 1}`;

    // Map string dependencies to actual step IDs
    const dependencies = step.dependencies
      .map((dep) => {
        // Handle both "step-1" format and numeric index format
        if (dep.startsWith("step-")) {
          return dep;
        }
        // Convert numeric index to step ID
        const depIndex = parseInt(dep, 10);
        if (!isNaN(depIndex) && depIndex > 0 && depIndex <= index) {
          return `step-${depIndex}`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    steps.push({
      id: stepId,
      description: step.description,
      requiredCapabilities: step.capabilities as HierarchicalTagId[],
      dependencies,
      estimatedTokens: Math.max(50, Math.min(2000, step.tokens)), // Clamp to reasonable range
      priority: index + 1,
    });
  });

  return steps;
}

/**
 * Optimize workflow by removing redundant steps and fixing dependencies
 * @param steps - Array of workflow steps to optimize
 * @returns Optimized workflow steps
 */
export function optimizeWorkflow(steps: WorkflowStep[]): WorkflowStep[] {
  if (steps.length <= 1) {
    return steps;
  }

  // Remove redundant steps (same description and capabilities)
  const uniqueSteps = deduplicateSteps(steps);

  // Fix broken dependencies
  const validatedSteps = validateDependencies(uniqueSteps);

  // Optimize step ordering
  const orderedSteps = optimizeStepOrder(validatedSteps);

  return orderedSteps;
}

/**
 * Remove duplicate steps with identical descriptions and capabilities
 */
function deduplicateSteps(steps: WorkflowStep[]): WorkflowStep[] {
  const seen = new Set<string>();
  const uniqueSteps: WorkflowStep[] = [];

  for (const step of steps) {
    const signature = `${step.description}|${step.requiredCapabilities.sort().join(",")}`;

    if (!seen.has(signature)) {
      seen.add(signature);
      uniqueSteps.push(step);
    }
  }

  return uniqueSteps;
}

/**
 * Validate and fix broken dependencies
 */
function validateDependencies(steps: WorkflowStep[]): WorkflowStep[] {
  const stepIds = new Set(steps.map((s) => s.id));

  return steps.map((step) => ({
    ...step,
    dependencies: step.dependencies.filter((depId) => stepIds.has(depId)),
  }));
}

/**
 * Optimize step ordering to minimize dependencies and improve parallelization
 */
function optimizeStepOrder(steps: WorkflowStep[]): WorkflowStep[] {
  // Topological sort to ensure dependencies are respected
  const sorted = topologicalSort(steps);

  // Re-assign step IDs and priorities based on new order
  return sorted.map((step, index) => ({
    ...step,
    id: `step-${index + 1}`,
    priority: index + 1,
    // Update dependencies to use new IDs
    dependencies: step.dependencies
      .map((oldId) => {
        const oldIndex = steps.findIndex((s) => s.id === oldId);
        if (oldIndex === -1) return oldId;

        const oldStep = steps[oldIndex];
        if (!oldStep) return oldId;

        const newIndex = sorted.findIndex((s) => s.description === oldStep.description);
        return newIndex === -1 ? oldId : `step-${newIndex + 1}`;
      })
      .filter((depId) => {
        const depIndex = parseInt(depId.replace("step-", ""), 10);
        return !isNaN(depIndex) && depIndex <= index + 1;
      }),
  }));
}

/**
 * Topological sort for workflow steps based on dependencies
 */
function topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: WorkflowStep[] = [];
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  function visit(stepId: string): boolean {
    if (visiting.has(stepId)) {
      // Circular dependency detected, skip this dependency
      return false;
    }

    if (visited.has(stepId)) {
      return true;
    }

    const step = stepMap.get(stepId);
    if (!step) return false;

    visiting.add(stepId);

    // Visit all dependencies first
    for (const depId of step.dependencies) {
      if (!visit(depId)) {
        // Remove circular dependency
        step.dependencies = step.dependencies.filter((d) => d !== depId);
      }
    }

    visiting.delete(stepId);
    visited.add(stepId);
    sorted.push(step);

    return true;
  }

  // Visit all steps
  for (const step of steps) {
    visit(step.id);
  }

  return sorted;
}

/**
 * Create a simple single-step workflow for fallback cases
 * @param prompt - The original user prompt
 * @param dominantCapability - The primary capability required
 * @returns Single-step workflow
 */
export function createFallbackWorkflow(
  prompt: string,
  dominantCapability: HierarchicalTagId,
): WorkflowStep[] {
  return [
    {
      id: "step-1",
      description: `Complete the task: ${prompt}`,
      requiredCapabilities: [dominantCapability],
      dependencies: [],
      estimatedTokens: Math.min(1000, Math.max(100, prompt.length * 2)),
      priority: 1,
    },
  ];
}

/**
 * Validate workflow structure and constraints
 * @param steps - Workflow steps to validate
 * @returns Validation result with errors
 */
export function validateWorkflow(steps: WorkflowStep[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic constraints
  if (steps.length === 0) {
    errors.push("Workflow must have at least one step");
  }

  if (steps.length > 8) {
    errors.push("Workflow cannot have more than 8 steps");
  }

  // Check step IDs are unique
  const stepIds = steps.map((s) => s.id);
  const uniqueIds = new Set(stepIds);
  if (stepIds.length !== uniqueIds.size) {
    errors.push("Step IDs must be unique");
  }

  // Check dependencies are valid
  for (const step of steps) {
    for (const depId of step.dependencies) {
      if (!stepIds.includes(depId)) {
        errors.push(`Step ${step.id} has invalid dependency: ${depId}`);
      }

      // Check for self-dependency
      if (depId === step.id) {
        errors.push(`Step ${step.id} cannot depend on itself`);
      }
    }

    // Check capabilities
    if (step.requiredCapabilities.length === 0) {
      warnings.push(`Step ${step.id} has no required capabilities`);
    }

    if (step.requiredCapabilities.length > 3) {
      warnings.push(
        `Step ${step.id} has too many capabilities (${step.requiredCapabilities.length})`,
      );
    }

    // Check token estimates
    if (step.estimatedTokens < 50) {
      warnings.push(`Step ${step.id} has very low token estimate (${step.estimatedTokens})`);
    }

    if (step.estimatedTokens > 2000) {
      warnings.push(`Step ${step.id} has very high token estimate (${step.estimatedTokens})`);
    }
  }

  // Check for circular dependencies
  if (hasCircularDependencies(steps)) {
    errors.push("Workflow has circular dependencies");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for circular dependencies in workflow
 */
function hasCircularDependencies(steps: WorkflowStep[]): boolean {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function hasCycle(stepId: string): boolean {
    if (visiting.has(stepId)) {
      return true; // Circular dependency found
    }

    if (visited.has(stepId)) {
      return false;
    }

    const step = stepMap.get(stepId);
    if (!step) return false;

    visiting.add(stepId);

    for (const depId of step.dependencies) {
      if (hasCycle(depId)) {
        return true;
      }
    }

    visiting.delete(stepId);
    visited.add(stepId);

    return false;
  }

  for (const step of steps) {
    if (hasCycle(step.id)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate total estimated tokens for a workflow
 * @param steps - Workflow steps
 * @returns Total token estimate
 */
export function calculateWorkflowTokens(steps: WorkflowStep[]): number {
  return steps.reduce((total, step) => total + step.estimatedTokens, 0);
}

/**
 * Determine workflow complexity based on steps and dependencies
 * @param steps - Workflow steps
 * @returns Complexity level
 */
export function determineComplexity(steps: WorkflowStep[]): "simple" | "moderate" | "complex" {
  const totalTokens = calculateWorkflowTokens(steps);
  const totalDependencies = steps.reduce((total, step) => total + step.dependencies.length, 0);

  if (steps.length <= 2 && totalTokens < 500 && totalDependencies === 0) {
    return "simple";
  }

  if (steps.length <= 5 && totalTokens < 1500 && totalDependencies <= 3) {
    return "moderate";
  }

  return "complex";
}
