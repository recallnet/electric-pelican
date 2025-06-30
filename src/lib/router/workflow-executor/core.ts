/**
 * @file Core workflow execution logic
 * @description Main orchestration for multi-step workflow execution with streaming support
 */

import type {
  CompletionResult,
  ExecutionOptions,
  OptimizedWorkflowStep,
  StepResult,
} from "@/types/router";

import { createExecutionContext } from "../context-manager";
import { executeStepWithRetry, handleStepFailure } from "../error-recovery";
import { createModelExecutor } from "../model-executor";
import { topologicalSort, waitForAnyCompletion, waitForDependencies } from "./dependency-manager";
import { aggregateWorkflowResults } from "./result-aggregator";
import { calculateEstimatedTimeRemaining, formatResultForStreaming } from "./utils";

/**
 * Execute a multi-step workflow with streaming support
 */
export async function executeWorkflow(
  originalPrompt: string,
  workflow: OptimizedWorkflowStep[],
  executionId: string,
  options: ExecutionOptions = {},
  eventEmitter?: any,
): Promise<CompletionResult> {
  const startTime = Date.now();
  const context = createExecutionContext(executionId, originalPrompt);
  const modelExecutor = createModelExecutor();
  const results: StepResult[] = [];
  const errors: string[] = [];

  try {
    // Sort workflow by dependencies (topological sort)
    const sortedWorkflow = topologicalSort(workflow);

    // Track concurrent executions
    const maxConcurrent = options.maxConcurrentSteps || 3;
    const runningSteps = new Map<string, Promise<StepResult>>();

    for (let stepIndex = 0; stepIndex < sortedWorkflow.length; stepIndex++) {
      const step = sortedWorkflow[stepIndex];

      if (!step) {
        console.warn(`Step at index ${stepIndex} is undefined, skipping`);
        continue;
      }

      try {
        // Emit progress event if streaming is enabled
        if (eventEmitter) {
          const elapsedTime = Date.now() - startTime;
          const estimatedTimeRemaining = calculateEstimatedTimeRemaining(
            stepIndex,
            sortedWorkflow.length,
            elapsedTime,
          );

          eventEmitter.emitProgress(executionId, "workflow", {
            executionMode: "workflow",
            currentStep: stepIndex + 1,
            totalSteps: sortedWorkflow.length,
            stepDescription: step.description,
            modelId: step.selectedModel.modelId,
            estimatedTimeRemaining,
            progressPercentage: Math.round((stepIndex / sortedWorkflow.length) * 100),
          });
        }

        // Wait for dependencies to complete
        await waitForDependencies(step.dependencies, runningSteps);

        // Check if we've hit concurrency limit
        while (runningSteps.size >= maxConcurrent) {
          await waitForAnyCompletion(runningSteps);
        }

        // Build context for this step
        const stepContext = context.buildPrompt(step);

        // Start step execution
        const stepPromise = executeStepWithRetry(step, stepContext, modelExecutor, options)
          .then(async (result) => {
            // Add result to context
            context.addResult(step.id, result);
            results.push(result);

            // Emit updated progress after step completion
            if (eventEmitter) {
              const completedSteps = results.length;
              const elapsedTime = Date.now() - startTime;
              const estimatedTimeRemaining = calculateEstimatedTimeRemaining(
                completedSteps,
                sortedWorkflow.length,
                elapsedTime,
              );

              eventEmitter.emitProgress(executionId, "workflow", {
                executionMode: "workflow",
                currentStep: completedSteps + 1,
                totalSteps: sortedWorkflow.length,
                stepDescription:
                  completedSteps < sortedWorkflow.length
                    ? `Completed: ${step.description}. Next: ${sortedWorkflow[completedSteps]?.description || "Finishing up"}`
                    : `Completed: ${step.description}`,
                modelId:
                  completedSteps < sortedWorkflow.length && sortedWorkflow[completedSteps]
                    ? sortedWorkflow[completedSteps]!.selectedModel.modelId
                    : step.selectedModel.modelId,
                estimatedTimeRemaining,
                progressPercentage: Math.round((completedSteps / sortedWorkflow.length) * 100),
              });

              // Emit intermediate result
              eventEmitter.emitIntermediate(executionId, "workflow", {
                stepId: step.id,
                modelId: step.selectedModel.modelId,
                result: formatResultForStreaming(result.content),
                executionTime: result.duration,
                tokensUsed: result.tokensUsed,
                cost: result.cost,
                executionMode: "workflow",
              });
            }

            // Remove from running steps
            runningSteps.delete(step.id);

            return result;
          })
          .catch(async (error) => {
            // Handle step failure
            const failure = await handleStepFailure(step, error, workflow, results);

            if (failure.fallbackResult) {
              context.addResult(step.id, failure.fallbackResult);
              results.push(failure.fallbackResult);
            }

            // Emit error event if streaming is enabled
            if (eventEmitter) {
              eventEmitter.emitError(executionId, "workflow", {
                executionMode: "workflow",
                stepId: step.id,
                modelId: step.selectedModel.modelId,
                errorType: "step_error",
                errorMessage: error instanceof Error ? error.message : "Unknown step error",
                retryable: true,
              });
            }

            errors.push(`Step ${step.id} failed: ${error.message}`);
            runningSteps.delete(step.id);

            throw error;
          });

        runningSteps.set(step.id, stepPromise);
      } catch (error) {
        console.warn(`Failed to start step ${step.id}:`, error);
        errors.push(
          `Failed to start step ${step.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Wait for all remaining steps to complete
    await Promise.allSettled(Array.from(runningSteps.values()));

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Aggregate results
    return aggregateWorkflowResults(originalPrompt, results, duration, errors);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      content: `Workflow execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
      cost: results.reduce((sum, r) => sum + r.cost, 0),
      duration,
      modelUsed: "workflow",
      stepResults: results,
      metadata: {
        approach: "workflow",
        stepsCompleted: results.filter((r) => r.success).length,
        totalSteps: workflow.length,
        errors,
        success: false,
      },
    };
  }
}
