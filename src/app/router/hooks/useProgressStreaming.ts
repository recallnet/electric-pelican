/**
 * @file Progress streaming hook for real-time execution updates
 * @description Provides real-time progress updates via Server-Sent Events
 */

import { useCallback, useEffect, useState } from "react";

import type {
  CompletionEventData,
  ErrorEventData,
  ExecutionEvent,
  IntermediateEventData,
  ProgressEventData,
} from "@/types/router";
import type {
  CompletionResult,
  ExecutionProgress,
  IntermediateResult,
  ProgressStreamingState,
} from "@/types/router-ui";

/**
 * Hook for streaming execution progress updates
 */
export function useProgressStreaming(executionId: string | null) {
  const [state, setState] = useState<ProgressStreamingState>({
    intermediateResults: [],
    isConnected: false,
    isExecuting: false,
  });

  const [_eventSource, setEventSource] = useState<EventSource | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const executionEvent: ExecutionEvent = JSON.parse(event.data);

      switch (executionEvent.type) {
        case "progress": {
          const progressData = executionEvent.data as ProgressEventData;
          const progressUpdate: ExecutionProgress = {
            status: "running",
            currentStep: progressData.currentStep,
            totalSteps: progressData.totalSteps,
            stepDescription: progressData.stepDescription,
            modelId: progressData.modelId,
            estimatedTimeRemaining: progressData.estimatedTimeRemaining,
            progressPercentage: progressData.progressPercentage,
          };

          setState((prev) => ({
            ...prev,
            [progressData.executionMode === "single" ? "singleProgress" : "workflowProgress"]:
              progressUpdate,
            isExecuting: true,
          }));
          break;
        }

        case "intermediate": {
          const intermediateData = executionEvent.data as IntermediateEventData;
          const result: IntermediateResult = {
            stepId: intermediateData.stepId,
            modelId: intermediateData.modelId,
            result: intermediateData.result,
            executionTime: intermediateData.executionTime,
            tokensUsed: intermediateData.tokensUsed,
            cost: intermediateData.cost,
            executionMode: intermediateData.executionMode,
          };

          setState((prev) => {
            // Check if we already have this result (deduplicate by stepId + executionMode)
            const existingIndex = prev.intermediateResults.findIndex(
              (r) => r.stepId === result.stepId && r.executionMode === result.executionMode,
            );

            if (existingIndex >= 0) {
              // Update existing result
              const updatedResults = [...prev.intermediateResults];
              updatedResults[existingIndex] = result;
              return { ...prev, intermediateResults: updatedResults };
            } else {
              // Add new result
              return { ...prev, intermediateResults: [...prev.intermediateResults, result] };
            }
          });
          break;
        }

        case "complete": {
          const completionData = executionEvent.data as CompletionEventData;
          const completionResult: CompletionResult = {
            executionMode: completionData.executionMode,
            finalResult: completionData.finalResult,
            totalExecutionTime: completionData.totalExecutionTime,
            totalTokensUsed: completionData.totalTokensUsed,
            totalCost: completionData.totalCost,
            stepsCompleted: completionData.stepsCompleted,
            modelUsage: completionData.modelUsage,
          };

          setState((prev) => {
            const newState = {
              ...prev,
              [completionData.executionMode === "single" ? "singleResult" : "workflowResult"]:
                completionResult,
              [completionData.executionMode === "single" ? "singleProgress" : "workflowProgress"]: {
                ...prev[
                  completionData.executionMode === "single" ? "singleProgress" : "workflowProgress"
                ],
                status: "completed",
                endTime: Date.now(),
                progressPercentage: 100,
              } as ExecutionProgress,
            };

            // Only set isExecuting to false if BOTH executions are complete
            const singleComplete = completionData.executionMode === "single" || !!prev.singleResult;
            const workflowComplete =
              completionData.executionMode === "workflow" || !!prev.workflowResult;
            newState.isExecuting = !(singleComplete && workflowComplete);

            return newState;
          });
          break;
        }

        case "error": {
          const errorData = executionEvent.data as ErrorEventData;
          const errorMessage = `${errorData.errorType}: ${errorData.errorMessage}`;

          setState((prev) => ({
            ...prev,
            error: errorMessage,
            [errorData.executionMode === "single" ? "singleProgress" : "workflowProgress"]: {
              ...prev[errorData.executionMode === "single" ? "singleProgress" : "workflowProgress"],
              status: "failed",
              errorMessage,
              endTime: Date.now(),
            } as ExecutionProgress,
            isExecuting: false,
          }));
          break;
        }

        case "connected":
          setState((prev) => ({ ...prev, isConnected: true }));
          break;
      }
    } catch (error) {
      console.error("Failed to parse progress event:", error);
    }
  }, []);

  // Connect/disconnect logic
  useEffect(() => {
    if (!executionId) return;

    const newEventSource = new EventSource(`/api/router/execution/${executionId}/stream`);

    newEventSource.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    newEventSource.onmessage = handleMessage;

    newEventSource.onerror = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    setEventSource(newEventSource);

    return () => {
      newEventSource.close();
      setEventSource(null);
    };
  }, [executionId, handleMessage]);

  const cancelExecution = useCallback(async () => {
    if (!executionId) return;

    try {
      const response = await fetch(`/api/router/execution/${executionId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel execution: ${response.statusText}`);
      }

      setState((prev) => {
        const newState = { ...prev, isExecuting: false };
        if (prev.singleProgress) {
          newState.singleProgress = { ...prev.singleProgress, status: "cancelled" };
        }
        if (prev.workflowProgress) {
          newState.workflowProgress = { ...prev.workflowProgress, status: "cancelled" };
        }
        return newState;
      });
    } catch (error) {
      console.error("Failed to cancel execution:", error);
      setState((prev) => ({ ...prev, error: "Failed to cancel execution" }));
    }
  }, [executionId]);

  const reset = useCallback(() => {
    setState({
      intermediateResults: [],
      isConnected: false,
      isExecuting: false,
    });
  }, []);

  return {
    ...state,
    cancelExecution,
    reset,
  };
}
