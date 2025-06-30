/**
 * @file Execution orchestration and tracking
 * @description Handles single model and workflow execution with state tracking and streaming
 */

import type { CompletionResult, ExecutionRequest } from "@/types/router";

import { ExecutionEventUtils } from "../execution-events";
import { updateSingleExecutionState, updateWorkflowExecutionState } from "../execution-state";
import { executeSingleModel } from "../single-executor";
import { executeWorkflow } from "../workflow-executor/index";

/**
 * Execute single model with state tracking and streaming
 */
export async function executeSingleModelWithTracking(
  executionId: string,
  request: ExecutionRequest,
  eventEmitter: any,
): Promise<CompletionResult> {
  const startTime = Date.now();

  updateSingleExecutionState(executionId, {
    status: "running",
    startTime,
    modelId: request.singleModelRecommendation.modelId,
  });

  // Emit progress update
  eventEmitter.emitProgress(
    executionId,
    "single",
    ExecutionEventUtils.createProgressData(
      "single",
      1,
      1,
      `Executing with ${request.singleModelRecommendation.modelName}`,
      request.singleModelRecommendation.modelId,
      ExecutionEventUtils.calculateEstimatedTimeRemaining(1, 1, Date.now() - startTime),
    ),
  );

  try {
    const result = await executeSingleModel(
      request.prompt,
      request.singleModelRecommendation,
      request.options,
    );

    updateSingleExecutionState(executionId, {
      status: "completed",
      endTime: Date.now(),
      result,
    });

    // Emit intermediate result
    eventEmitter.emitIntermediate(
      executionId,
      "single",
      ExecutionEventUtils.createIntermediateData(
        "single-model",
        request.singleModelRecommendation.modelId,
        ExecutionEventUtils.formatResultForStreaming(result.content),
        result.duration,
        result.tokensUsed,
        result.cost,
        "single",
      ),
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    updateSingleExecutionState(executionId, {
      status: "failed",
      endTime: Date.now(),
      error: {
        type: "model_error",
        message: errorMessage,
        timestamp: Date.now(),
        retryable: false,
      },
    });

    // Emit error event
    eventEmitter.emitError(
      executionId,
      "single",
      ExecutionEventUtils.createErrorData(
        "single",
        "model_error",
        errorMessage,
        false,
        "single-model",
        request.singleModelRecommendation.modelId,
      ),
    );

    // Return error result instead of throwing
    return {
      content: `Single model execution failed: ${errorMessage}`,
      tokensUsed: 0,
      cost: 0,
      duration: Date.now() - startTime,
      modelUsed: request.singleModelRecommendation.modelId,
      metadata: {
        approach: "single-model",
        error: errorMessage,
        success: false,
      },
    };
  }
}

/**
 * Execute workflow with state tracking and streaming
 */
export async function executeWorkflowWithTracking(
  executionId: string,
  request: ExecutionRequest,
  eventEmitter: any,
): Promise<CompletionResult> {
  const startTime = Date.now();

  updateWorkflowExecutionState(executionId, {
    status: "running",
    startTime,
    currentStepIndex: 0,
  });

  try {
    const result = await executeWorkflow(
      request.prompt,
      request.workflow,
      executionId,
      request.options,
      eventEmitter, // Pass event emitter to workflow executor
    );

    updateWorkflowExecutionState(executionId, {
      status: "completed",
      endTime: Date.now(),
      result,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    updateWorkflowExecutionState(executionId, {
      status: "failed",
      endTime: Date.now(),
      errors: [
        {
          type: "system",
          message: errorMessage,
          timestamp: Date.now(),
          retryable: false,
        },
      ],
    });

    // Emit error event
    eventEmitter.emitError(
      executionId,
      "workflow",
      ExecutionEventUtils.createErrorData("workflow", "system", errorMessage, false),
    );

    // Return error result instead of throwing
    return {
      content: `Workflow execution failed: ${errorMessage}`,
      tokensUsed: 0,
      cost: 0,
      duration: Date.now() - startTime,
      modelUsed: "workflow",
      metadata: {
        approach: "workflow",
        error: errorMessage,
        success: false,
      },
    };
  }
}
