/**
 * @file Workflow dependency management
 * @description Handles topological sorting and dependency resolution for workflow steps
 */

import type { OptimizedWorkflowStep, StepResult } from "@/types/router";

/**
 * Topological sort of workflow steps based on dependencies
 */
export function topologicalSort(workflow: OptimizedWorkflowStep[]): OptimizedWorkflowStep[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: OptimizedWorkflowStep[] = [];
  const stepMap = new Map(workflow.map((step) => [step.id, step]));

  function visit(stepId: string): void {
    if (visiting.has(stepId)) {
      throw new Error(`Circular dependency detected involving step: ${stepId}`);
    }

    if (visited.has(stepId)) {
      return;
    }

    visiting.add(stepId);

    const step = stepMap.get(stepId);
    if (step) {
      // Visit dependencies first
      for (const depId of step.dependencies) {
        visit(depId);
      }

      result.push(step);
    }

    visiting.delete(stepId);
    visited.add(stepId);
  }

  // Visit all steps
  for (const step of workflow) {
    if (!visited.has(step.id)) {
      visit(step.id);
    }
  }

  return result;
}

/**
 * Wait for step dependencies to complete
 */
export async function waitForDependencies(
  dependencies: string[],
  runningSteps: Map<string, Promise<StepResult>>,
): Promise<void> {
  const dependencyPromises = dependencies
    .map((depId) => runningSteps.get(depId))
    .filter((promise): promise is Promise<StepResult> => promise !== undefined);

  if (dependencyPromises.length > 0) {
    await Promise.all(dependencyPromises);
  }
}

/**
 * Wait for any running step to complete
 */
export async function waitForAnyCompletion(
  runningSteps: Map<string, Promise<StepResult>>,
): Promise<void> {
  if (runningSteps.size === 0) {
    return;
  }

  await Promise.race(Array.from(runningSteps.values()));
}
