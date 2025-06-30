/**
 * @file Core model selection logic for the router system.
 * @description Orchestrates the entire model selection process, combining ELO lookup,
 * strategy selection, workflow optimization, and fallback handling.
 */

import type {
  ModelRecommendation,
  OptimizedWorkflowStep,
  SelectionReasoning,
  SelectModelsRequest,
  SelectModelsResponse,
  WorkflowStep,
} from "@/types/router";

import { getDominantCapability } from "./capability-mapper";
import { createFallbackWorkflow, handleModelSelectionFallback } from "./fallback-handler";
import {
  estimateCost,
  estimateTime,
  getSelectionStrategy,
  selectGeneralistModel,
  selectSpecialistModel,
} from "./selection-strategies";
import { optimizeWorkflowSteps, validateOptimizedWorkflow } from "./workflow-optimizer";

/**
 * Main entry point for model selection
 * @param request - Model selection request with workflow and preferences
 * @returns Complete model selection response
 */
export async function selectOptimalModels(
  request: SelectModelsRequest,
): Promise<SelectModelsResponse> {
  const startTime = Date.now();

  try {
    // Get selection strategy based on preferences
    const strategy = getSelectionStrategy(request.preferences);

    // Assign models to each workflow step
    const stepsWithModels = await assignModelsToSteps(
      request.workflow,
      strategy,
      request.preferences?.excludeModels || [],
    );

    // Optimize workflow by merging compatible steps
    const optimizedWorkflow = optimizeWorkflowSteps(stepsWithModels);

    // Validate the optimized workflow
    const validation = validateOptimizedWorkflow(optimizedWorkflow);
    if (!validation.isValid) {
      console.warn("Workflow validation failed:", validation.errors);
      // Continue with fallback
      const fallback = await createFallbackWorkflow(request.workflow);
      return createErrorResponse(request, fallback, validation.errors);
    }

    // Generate single-model recommendation
    const singleModelRecommendation = await generateSingleModelRecommendation(
      request.workflow,
      request.preferences?.excludeModels || [],
    );

    // Create selection reasoning
    const reasoning = generateSelectionReasoning(optimizedWorkflow);

    // Calculate cost and time estimates
    const { totalCost, totalTime } = await calculateEstimates(optimizedWorkflow);

    const response: SelectModelsResponse = {
      success: true,
      data: {
        optimizedWorkflow,
        singleModelRecommendation,
        modelSelectionReasoning: reasoning,
        estimatedCost: totalCost,
        estimatedTime: totalTime,
      },
    };

    const duration = Date.now() - startTime;
    console.log(`Model selection completed in ${duration}ms`);

    return response;
  } catch (error) {
    console.error("Model selection failed:", error);

    // Create fallback response
    const fallback = await createFallbackWorkflow(request.workflow);
    return createErrorResponse(request, fallback, [`Model selection error: ${error}`]);
  }
}

/**
 * Assign models to individual workflow steps
 * @param workflow - Array of workflow steps
 * @param strategy - Selection strategy to use
 * @param excludeModels - Models to exclude
 * @returns Steps with assigned models
 */
async function assignModelsToSteps(
  workflow: WorkflowStep[],
  strategy: any,
  excludeModels: string[],
): Promise<OptimizedWorkflowStep[]> {
  const stepsWithModels: OptimizedWorkflowStep[] = [];

  for (const step of workflow) {
    let selectedModel: ModelRecommendation | null = null;

    try {
      // Always try specialist selection first for single capabilities
      if (step.requiredCapabilities.length === 1) {
        selectedModel = await selectSpecialistModel(
          step.requiredCapabilities[0]!,
          { ...strategy, name: "specialist" }, // Force specialist strategy
          excludeModels,
        );
      }

      // Only use generalist as fallback if specialist failed
      if (!selectedModel && step.requiredCapabilities.length > 0) {
        const capabilities = step.requiredCapabilities.map((cap) => ({ tagId: cap }));
        selectedModel = await selectGeneralistModel(capabilities, strategy, excludeModels);
      }

      // Use fallback if both strategies failed
      if (!selectedModel) {
        selectedModel = await handleModelSelectionFallback(
          step,
          excludeModels,
          "Primary and generalist selection failed",
        );
      }
    } catch (error) {
      console.warn(`Model selection failed for step ${step.id}:`, error);
      selectedModel = await handleModelSelectionFallback(
        step,
        excludeModels,
        `Selection error: ${error}`,
      );
    }

    const optimizedStep: OptimizedWorkflowStep = {
      ...step,
      primaryCapability: step.requiredCapabilities[0] || "semantic-understanding",
      selectedModel,
    };

    stepsWithModels.push(optimizedStep);
  }

  return stepsWithModels;
}

/**
 * Generate single-model recommendation for the entire workflow
 * @param workflow - Original workflow steps
 * @param excludeModels - Models to exclude
 * @returns Single model recommendation
 */
async function generateSingleModelRecommendation(
  workflow: WorkflowStep[],
  excludeModels: string[],
): Promise<ModelRecommendation> {
  try {
    // Collect all capabilities from the workflow
    const allCapabilities = workflow.flatMap((step) => step.requiredCapabilities);
    const uniqueCapabilities = [...new Set(allCapabilities)];

    // Find dominant capability
    const dominantCapability = getDominantCapability(
      uniqueCapabilities,
      workflow.map((s) => s.description).join(" "),
    );

    // Try to select a generalist model that can handle all capabilities
    const capabilities = uniqueCapabilities.map((cap) => ({ tagId: cap }));
    let singleModel = await selectGeneralistModel(capabilities, undefined, excludeModels);

    // If generalist selection fails, use specialist for dominant capability
    if (!singleModel) {
      singleModel = await selectSpecialistModel(dominantCapability, undefined, excludeModels);
    }

    // Final fallback
    if (!singleModel) {
      const mockStep: WorkflowStep = {
        id: "single-model-step",
        description: "Complete entire workflow",
        requiredCapabilities: [dominantCapability],
        dependencies: [],
        estimatedTokens: workflow.reduce((sum, step) => sum + step.estimatedTokens, 0),
        priority: 1,
      };

      singleModel = await handleModelSelectionFallback(
        mockStep,
        excludeModels,
        "Single model selection fallback",
      );
    }

    // Update reasoning for single model context
    singleModel.reasoning = `Single-model recommendation: ${singleModel.reasoning}. Can handle dominant capability: ${dominantCapability}`;

    return singleModel;
  } catch (error) {
    console.error("Single model recommendation failed:", error);
    throw new Error(
      `Failed to generate single model recommendation: ${error}. Dominant capability: ${getDominantCapability(
        workflow.flatMap((s) => s.requiredCapabilities),
        workflow.map((s) => s.description).join(" "),
      )}`,
    );
  }
}

/**
 * Generate reasoning for each model selection decision
 * @param workflow - Optimized workflow with model assignments
 * @returns Array of selection reasoning
 */
function generateSelectionReasoning(workflow: OptimizedWorkflowStep[]): SelectionReasoning[] {
  return workflow.map((step) => ({
    stepId: step.id,
    selectedModelId: step.selectedModel.modelId,
    reasoning: step.selectedModel.reasoning,
    alternatives: [], // Could be populated with runner-up models
    confidence: step.selectedModel.confidence ?? 0.5, // Default confidence if not provided
  }));
}

/**
 * Calculate cost and time estimates for the workflow
 * @param workflow - Optimized workflow with model assignments
 * @returns Total cost and time estimates
 */
async function calculateEstimates(workflow: OptimizedWorkflowStep[]): Promise<{
  totalCost: number;
  totalTime: number;
}> {
  let totalCost = 0;
  let totalTime = 0;

  for (const step of workflow) {
    try {
      const stepCost = await estimateCost(step.selectedModel, step.estimatedTokens);
      const stepTime = await estimateTime(step.selectedModel, step.estimatedTokens);

      totalCost += stepCost;
      totalTime += stepTime;
    } catch (error) {
      console.warn(`Failed to calculate estimates for step ${step.id}:`, error);
      // Use conservative estimates
      totalCost += 0.01; // $0.01 fallback
      totalTime += 2000; // 2 seconds fallback
    }
  }

  return { totalCost, totalTime };
}

/**
 * Create error response with fallback workflow
 * @param request - Original request
 * @param fallback - Fallback workflow and reasoning
 * @param errors - Array of error messages
 * @returns Error response with fallback data
 */
async function createErrorResponse(
  request: SelectModelsRequest,
  fallback: { optimizedWorkflow: OptimizedWorkflowStep[]; reasoning: SelectionReasoning[] },
  errors: string[],
): Promise<SelectModelsResponse> {
  console.warn("Creating error response with fallback:", errors);

  // Generate single-model recommendation as fallback
  const singleModelRecommendation = await generateSingleModelRecommendation(
    request.workflow,
    request.preferences?.excludeModels || [],
  );

  // Calculate estimates for fallback
  const { totalCost, totalTime } = await calculateEstimates(fallback.optimizedWorkflow);

  return {
    success: false, // Indicate this is a fallback response
    data: {
      optimizedWorkflow: fallback.optimizedWorkflow,
      singleModelRecommendation,
      modelSelectionReasoning: fallback.reasoning,
      estimatedCost: totalCost,
      estimatedTime: totalTime,
    },
  };
}

/**
 * Validate model selection request
 * @param request - The request to validate
 * @returns Validation result
 */
export function validateSelectionRequest(request: SelectModelsRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.workflow || request.workflow.length === 0) {
    errors.push("Workflow is required and must contain at least one step");
  }

  if (request.workflow) {
    for (const step of request.workflow) {
      if (!step.id || step.id.trim() === "") {
        errors.push(`Step missing required ID: ${JSON.stringify(step)}`);
      }

      if (!step.description || step.description.trim() === "") {
        errors.push(`Step ${step.id} missing required description`);
      }

      if (!step.requiredCapabilities || step.requiredCapabilities.length === 0) {
        errors.push(`Step ${step.id} missing required capabilities`);
      }

      if (step.estimatedTokens < 0) {
        errors.push(`Step ${step.id} has negative token estimate`);
      }
    }
  }

  // Validate preferences if provided
  if (request.preferences) {
    if (request.preferences.maxModels !== undefined && request.preferences.maxModels < 1) {
      errors.push("maxModels must be at least 1");
    }

    if (
      request.preferences.minEloThreshold !== undefined &&
      request.preferences.minEloThreshold < 1000
    ) {
      errors.push("minEloThreshold must be at least 1000");
    }

    if (request.preferences.excludeModels && request.preferences.excludeModels.length > 50) {
      errors.push("excludeModels list cannot exceed 50 models");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
