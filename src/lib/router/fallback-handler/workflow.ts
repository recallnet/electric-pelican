/**
 * @file Fallback workflow creation
 * @description Creates fallback workflows when model selection completely fails
 */

import type { OptimizedWorkflowStep, SelectionReasoning, WorkflowStep } from "@/types/router";

import { handleModelSelectionFallback } from "./selection";

/**
 * Create fallback workflow when model selection completely fails
 */
export async function createFallbackWorkflow(originalWorkflow: WorkflowStep[]): Promise<{
  optimizedWorkflow: OptimizedWorkflowStep[];
  reasoning: SelectionReasoning[];
}> {
  const optimizedSteps: OptimizedWorkflowStep[] = [];
  const reasoning: SelectionReasoning[] = [];

  try {
    // Try to assign fallback models to each step
    for (const step of originalWorkflow) {
      const fallbackModel = await handleModelSelectionFallback(
        step,
        [],
        "Complete model selection failure",
      );

      const optimizedStep: OptimizedWorkflowStep = {
        ...step,
        primaryCapability: step.requiredCapabilities[0] || "semantic-understanding",
        selectedModel: fallbackModel,
      };

      optimizedSteps.push(optimizedStep);

      reasoning.push({
        stepId: step.id,
        selectedModelId: fallbackModel.modelId,
        reasoning: fallbackModel.reasoning,
        alternatives: [],
        confidence: fallbackModel.confidence ?? 0.5,
      });
    }
  } catch (error) {
    console.error("Fallback workflow creation failed:", error);
    throw new Error(
      `Failed to create fallback workflow: ${error}. Original workflow had ${originalWorkflow.length} steps.`,
    );
  }

  return {
    optimizedWorkflow: optimizedSteps,
    reasoning,
  };
}
