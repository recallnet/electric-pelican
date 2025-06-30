/**
 * @file Core execution engine for Router-3A with streaming integration
 * @description Main orchestration logic for parallel single-model and workflow execution
 */

import type { ExecutionRequest, ExecutionStartResponse } from "@/types/router";
import type { ExecutionResults } from "@/types/router";

import { ExecutionEventUtils, setupExecutionStreaming } from "../execution-events";
import {
  generateExecutionId,
  getExecutionState,
  initializeExecutionState,
  setExecutionResults,
  updateExecutionStatus,
} from "../execution-state";
import { executeSingleModelWithTracking, executeWorkflowWithTracking } from "./orchestrator";
import {
  estimateExecutionTime,
  generateExecutionComparison,
  validateExecutionRequest,
} from "./step-processor";

/**
 * Start parallel execution of single-model and workflow approaches
 */
export async function executeParallelWorkflows(
  request: ExecutionRequest,
): Promise<ExecutionStartResponse> {
  // Generate unique execution ID
  const executionId = generateExecutionId();

  // Initialize execution state
  initializeExecutionState(executionId, request);

  // Set up streaming for this execution
  const eventEmitter = setupExecutionStreaming(executionId);

  // Validate request
  const validation = validateExecutionRequest(request);
  if (!validation.isValid) {
    updateExecutionStatus(executionId, "failed");

    // Emit error event
    eventEmitter.emitError(
      executionId,
      "single",
      ExecutionEventUtils.createErrorData(
        "single",
        "validation_error",
        `Invalid execution request: ${validation.errors.join(", ")}`,
        false,
      ),
    );

    throw new Error(`Invalid execution request: ${validation.errors.join(", ")}`);
  }

  // Estimate execution time
  const estimatedTime = estimateExecutionTime(request);

  // Emit initial progress events for both approaches
  eventEmitter.emitProgress(
    executionId,
    "single",
    ExecutionEventUtils.createProgressData(
      "single",
      0,
      1,
      "Starting single model execution",
      request.singleModelRecommendation.modelId,
      estimatedTime,
    ),
  );

  eventEmitter.emitProgress(
    executionId,
    "workflow",
    ExecutionEventUtils.createProgressData(
      "workflow",
      0,
      request.workflow.length,
      "Starting workflow execution",
      request.workflow[0]?.selectedModel?.modelId || "unknown",
      estimatedTime,
    ),
  );

  // Start both executions in parallel (don't await)
  Promise.all([
    executeSingleModelWithTracking(executionId, request, eventEmitter).then((singleResult) => {
      // Emit completion event for single model
      eventEmitter.emitComplete(
        executionId,
        "single",
        ExecutionEventUtils.createCompletionData(
          "single",
          ExecutionEventUtils.formatResultForStreaming(singleResult.content),
          singleResult.duration,
          singleResult.tokensUsed,
          singleResult.cost,
          1,
          [
            {
              modelId: singleResult.modelUsed,
              modelName: request.singleModelRecommendation.modelName,
              provider: request.singleModelRecommendation.provider,
              tokensUsed: singleResult.tokensUsed,
              cost: singleResult.cost,
              executionTime: singleResult.duration,
              stepsExecuted: 1,
            },
          ],
        ),
      );
      return singleResult;
    }),
    executeWorkflowWithTracking(executionId, request, eventEmitter).then((workflowResult) => {
      // Emit completion event for workflow
      eventEmitter.emitComplete(
        executionId,
        "workflow",
        ExecutionEventUtils.createCompletionData(
          "workflow",
          ExecutionEventUtils.formatResultForStreaming(workflowResult.content),
          workflowResult.duration,
          workflowResult.tokensUsed,
          workflowResult.cost,
          request.workflow.length,
          [
            {
              modelId: workflowResult.modelUsed,
              modelName: workflowResult.modelUsed, // Use modelUsed as fallback for modelName
              provider: "workflow", // Workflow can use multiple providers
              tokensUsed: workflowResult.tokensUsed,
              cost: workflowResult.cost,
              executionTime: workflowResult.duration,
              stepsExecuted: request.workflow.length,
            },
          ],
        ),
      );
      return workflowResult;
    }),
  ])
    .then(async ([singleResult, workflowResult]) => {
      // Both executions completed - generate comparison and finalize
      const comparison = generateExecutionComparison(singleResult, workflowResult);

      const results: ExecutionResults = {
        single: singleResult,
        workflow: workflowResult,
        comparison,
      };

      setExecutionResults(executionId, results);
      updateExecutionStatus(executionId, "completed", Date.now());

      // Add additional properties required for CompletedExecutionState
      const state = getExecutionState(executionId);
      if (state) {
        // Add the properties needed for persistence
        (state as any).originalPrompt = request.prompt;
        (state as any).analysisResult = state.results;
        (state as any).singleModelRecommendation = request.singleModelRecommendation;
        (state as any).optimizedWorkflow = request.workflow;
        (state as any).singleResult = singleResult;
        (state as any).workflowResult = workflowResult;
        (state as any).intermediateResults = []; // TODO: Add actual intermediate results
        (state as any).comparisonData = comparison;
        (state as any).totalExecutionTime = state.endTime ? state.endTime - state.startTime : 0;
      }

      console.log(`Execution ${executionId} completed successfully`);
    })
    .catch((error) => {
      // Handle execution failure
      console.error(`Execution ${executionId} failed:`, error);
      updateExecutionStatus(executionId, "failed", Date.now());

      // Emit error event
      eventEmitter.emitError(
        executionId,
        "single",
        ExecutionEventUtils.createErrorData(
          "single",
          "execution_error",
          error instanceof Error ? error.message : "Unknown execution error",
          true,
        ),
      );
    });

  return {
    executionId,
    status: "started",
    estimatedTime,
    streamUrl: `/api/router/execution/${executionId}/stream`,
  };
}

/**
 * Get execution status
 */
export function getExecutionStatus(executionId: string) {
  const state = getExecutionState(executionId);
  if (!state) {
    throw new Error(`Execution ${executionId} not found`);
  }

  return {
    executionId: state.executionId,
    status: state.status,
    progress: {
      single: {
        status: state.singleExecution.status,
        startTime: state.singleExecution.startTime,
        endTime: state.singleExecution.endTime,
        tokensUsed: state.singleExecution.result?.tokensUsed,
        cost: state.singleExecution.result?.cost,
      },
      workflow: {
        status: state.workflowExecution.status,
        stepsCompleted: Array.from(state.workflowExecution.stepStates.values()).filter(
          (step) => step.status === "completed",
        ).length,
        totalSteps: state.request.workflow.length,
        startTime: state.workflowExecution.startTime,
        endTime: state.workflowExecution.endTime,
        tokensUsed: state.workflowExecution.result?.tokensUsed,
        cost: state.workflowExecution.result?.cost,
      },
    },
    results: state.results,
    errors: state.errors,
    startTime: state.startTime,
    endTime: state.endTime,
    duration: state.endTime ? state.endTime - state.startTime : undefined,
  };
}
