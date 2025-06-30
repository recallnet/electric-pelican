/**
 * @file Execution events interface for Router-3B
 * @description Event emission interface for Router-3A to integrate with streaming system
 */

import type {
  CompletionEventData,
  ConnectionEventData,
  ErrorEventData,
  ExecutionEvent,
  ExecutionEventEmitter,
  IntermediateEventData,
  ModelUsageStats,
  ProgressEventData,
} from "@/types/router";

import { connectionManager } from "./streaming/connection-manager";
import { eventBuffer } from "./streaming/event-buffer";
import { executionEventBus } from "./streaming/event-bus";

/**
 * Implementation of the execution event emitter
 */
export class RouterExecutionEventEmitter implements ExecutionEventEmitter {
  constructor(_executionId: string) {
    // executionId is passed to factory but not stored since methods receive it as parameters
  }

  /**
   * Emit progress event
   */
  emitProgress(
    executionId: string,
    _mode: "single" | "workflow",
    progress: ProgressEventData,
  ): void {
    const event: ExecutionEvent = {
      type: "progress",
      executionId,
      timestamp: Date.now(),
      data: progress,
    };

    this.emitEvent(event);
  }

  /**
   * Emit intermediate result event
   */
  emitIntermediate(
    executionId: string,
    _mode: "single" | "workflow",
    result: IntermediateEventData,
  ): void {
    const event: ExecutionEvent = {
      type: "intermediate",
      executionId,
      timestamp: Date.now(),
      data: result,
    };

    this.emitEvent(event);
  }

  /**
   * Emit completion event
   */
  emitComplete(
    executionId: string,
    _mode: "single" | "workflow",
    result: CompletionEventData,
  ): void {
    const event: ExecutionEvent = {
      type: "complete",
      executionId,
      timestamp: Date.now(),
      data: result,
    };

    this.emitEvent(event);

    // Clean up after completion
    setTimeout(() => {
      this.cleanup(executionId);
    }, 30000); // Clean up after 30 seconds
  }

  /**
   * Emit error event
   */
  emitError(executionId: string, _mode: "single" | "workflow", error: ErrorEventData): void {
    const event: ExecutionEvent = {
      type: "error",
      executionId,
      timestamp: Date.now(),
      data: error,
    };

    this.emitEvent(event);

    // Clean up after error
    setTimeout(() => {
      this.cleanup(executionId);
    }, 60000); // Clean up after 1 minute for error analysis
  }

  /**
   * Emit connection event
   */
  emitConnection(executionId: string, connection: ConnectionEventData): void {
    const event: ExecutionEvent = {
      type: "connected",
      executionId,
      timestamp: Date.now(),
      data: connection,
    };

    this.emitEvent(event);
  }

  /**
   * Emit cancellation event
   */
  emitCancellation(executionId: string): void {
    const event: ExecutionEvent = {
      type: "cancelled",
      executionId,
      timestamp: Date.now(),
      data: {
        connectionId: "system",
        status: "disconnected",
      } as ConnectionEventData,
    };

    this.emitEvent(event);
    this.cleanup(executionId);
  }

  /**
   * Core event emission logic
   */
  private emitEvent(event: ExecutionEvent): void {
    try {
      // Add to buffer for reconnection support
      eventBuffer.addEvent(event);

      // Emit to event bus for real-time distribution
      executionEventBus.emit(event);

      // Broadcast to connected clients
      connectionManager.broadcastToExecution(event.executionId, event);
    } catch (error) {
      console.error("Error emitting execution event:", error);
    }
  }

  /**
   * Clean up resources for completed execution
   */
  private cleanup(executionId: string): void {
    try {
      // Clean up event bus
      executionEventBus.cleanup(executionId);

      // Clean up event buffer
      eventBuffer.clearBuffer(executionId);

      // Close connections
      connectionManager.closeExecutionConnections(executionId);
    } catch (error) {
      console.error("Error cleaning up execution resources:", error);
    }
  }
}

/**
 * Factory function to create event emitter for execution
 */
export function setupExecutionStreaming(executionId: string): ExecutionEventEmitter {
  return new RouterExecutionEventEmitter(executionId);
}

/**
 * Utility functions for creating event data
 */
export class ExecutionEventUtils {
  /**
   * Create progress event data
   */
  static createProgressData(
    executionMode: "single" | "workflow",
    currentStep: number,
    totalSteps: number,
    stepDescription: string,
    modelId: string,
    estimatedTimeRemaining: number,
  ): ProgressEventData {
    return {
      executionMode,
      currentStep,
      totalSteps,
      stepDescription,
      modelId,
      estimatedTimeRemaining,
      progressPercentage: Math.round((currentStep / totalSteps) * 100),
    };
  }

  /**
   * Create intermediate result data
   */
  static createIntermediateData(
    stepId: string,
    modelId: string,
    result: string,
    executionTime: number,
    tokensUsed: number,
    cost: number,
    executionMode: "single" | "workflow",
  ): IntermediateEventData {
    return {
      stepId,
      modelId,
      result,
      executionTime,
      tokensUsed,
      cost,
      executionMode,
    };
  }

  /**
   * Create completion event data
   */
  static createCompletionData(
    executionMode: "single" | "workflow",
    finalResult: string,
    totalExecutionTime: number,
    totalTokensUsed: number,
    totalCost: number,
    stepsCompleted: number,
    modelUsage: ModelUsageStats[],
  ): CompletionEventData {
    return {
      executionMode,
      finalResult,
      totalExecutionTime,
      totalTokensUsed,
      totalCost,
      stepsCompleted,
      modelUsage,
    };
  }

  /**
   * Create error event data
   */
  static createErrorData(
    executionMode: "single" | "workflow",
    errorType: string,
    errorMessage: string,
    retryable: boolean,
    stepId?: string,
    modelId?: string,
  ): ErrorEventData {
    return {
      executionMode,
      errorType: errorType as any,
      errorMessage,
      retryable,
      ...(stepId !== undefined && { stepId }),
      ...(modelId !== undefined && { modelId }),
    };
  }

  /**
   * Create model usage statistics
   */
  static createModelUsageStats(
    modelId: string,
    modelName: string,
    provider: string,
    tokensUsed: number,
    cost: number,
    executionTime: number,
    stepsExecuted: number,
  ): ModelUsageStats {
    return {
      modelId,
      modelName,
      provider,
      tokensUsed,
      cost,
      executionTime,
      stepsExecuted,
    };
  }

  /**
   * Calculate estimated time remaining
   */
  static calculateEstimatedTimeRemaining(
    currentStep: number,
    totalSteps: number,
    elapsedTime: number,
  ): number {
    if (currentStep === 0) return 0;

    const averageTimePerStep = elapsedTime / currentStep;
    const remainingSteps = totalSteps - currentStep;
    return Math.round(remainingSteps * averageTimePerStep);
  }

  /**
   * Format result for streaming (truncate if needed)
   */
  static formatResultForStreaming(result: string, maxLength: number = 5000): string {
    if (result.length <= maxLength) {
      return result;
    }
    return result.substring(0, maxLength) + "...";
  }
}

/**
 * Global event emitter factory
 */
export const createExecutionEventEmitter = setupExecutionStreaming;
