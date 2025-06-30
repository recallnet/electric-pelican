/**
 * @file Workflow validation utilities
 * @description Validates workflow execution requirements and constraints
 */

import type { OptimizedWorkflowStep } from "@/types/router";

import { topologicalSort } from "./dependency-manager";

/**
 * Validate workflow execution requirements
 */
export function validateWorkflowExecution(
  prompt: string,
  workflow: OptimizedWorkflowStep[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!prompt || prompt.trim().length === 0) {
    errors.push("Prompt is required and cannot be empty");
  }

  if (!workflow || workflow.length === 0) {
    errors.push("Workflow must contain at least one step");
  } else {
    // Check for circular dependencies
    try {
      topologicalSort(workflow);
    } catch (error) {
      errors.push(
        `Workflow has circular dependencies: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Validate each step
    const stepIds = new Set(workflow.map((s) => s.id));
    for (const step of workflow) {
      if (!step.id) {
        errors.push("All workflow steps must have an ID");
      }

      if (!step.description) {
        errors.push(`Step ${step.id} missing description`);
      }

      if (!step.selectedModel || !step.selectedModel.modelId) {
        errors.push(`Step ${step.id} missing selected model`);
      }

      // Check dependencies exist
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${depId}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
