/**
 * @file Router event and streaming types
 * @description Type definitions for execution events and streaming interfaces
 */

import type { ExecutionError } from "./execution";

/**
 * Execution event for streaming
 */
export interface ExecutionEvent {
  type: "progress" | "intermediate" | "complete" | "error" | "cancelled" | "connected";
  executionId: string;
  timestamp: number;
  data: ExecutionEventData;
}

/**
 * Union type for all event data
 */
export type ExecutionEventData =
  | ProgressEventData
  | IntermediateEventData
  | CompletionEventData
  | ErrorEventData
  | ConnectionEventData;

/**
 * Progress event data
 */
export interface ProgressEventData {
  executionMode: "single" | "workflow";
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  modelId: string;
  estimatedTimeRemaining: number;
  progressPercentage: number;
}

/**
 * Intermediate result event data
 */
export interface IntermediateEventData {
  stepId: string;
  modelId: string;
  result: string;
  executionTime: number;
  tokensUsed: number;
  cost: number;
  executionMode: "single" | "workflow";
}

/**
 * Completion event data
 */
export interface CompletionEventData {
  executionMode: "single" | "workflow";
  finalResult: string;
  totalExecutionTime: number;
  totalTokensUsed: number;
  totalCost: number;
  stepsCompleted: number;
  modelUsage: ModelUsageStats[];
}

/**
 * Error event data
 */
export interface ErrorEventData {
  executionMode: "single" | "workflow";
  stepId?: string;
  modelId?: string;
  errorType: ExecutionError["type"];
  errorMessage: string;
  retryable: boolean;
}

/**
 * Connection event data
 */
export interface ConnectionEventData {
  connectionId: string;
  status: "connected" | "disconnected";
}

/**
 * Model usage statistics
 */
export interface ModelUsageStats {
  modelId: string;
  modelName: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  executionTime: number;
  stepsExecuted: number;
}

/**
 * Client connection information
 */
export interface ClientConnection {
  connectionId: string;
  executionId: string;
  connectionType: "sse" | "websocket";
  lastSeen: number;
  preferences: StreamingPreferences;
}

/**
 * Streaming preferences for clients
 */
export interface StreamingPreferences {
  includeIntermediateResults: boolean;
  progressUpdateInterval: number;
  maxResultLength: number;
}

/**
 * Event emitter interface for execution events
 */
export interface ExecutionEventEmitter {
  emitProgress(executionId: string, mode: "single" | "workflow", progress: ProgressEventData): void;

  emitIntermediate(
    executionId: string,
    mode: "single" | "workflow",
    result: IntermediateEventData,
  ): void;

  emitComplete(executionId: string, mode: "single" | "workflow", result: CompletionEventData): void;

  emitError(executionId: string, mode: "single" | "workflow", error: ErrorEventData): void;

  emitConnection(executionId: string, connection: ConnectionEventData): void;
}

/**
 * Event listener function type
 */
export type EventListener = (event: ExecutionEvent) => void;

/**
 * Stream handler interface
 */
export interface StreamHandler {
  connectionId: string;
  send(event: ExecutionEvent): void;
  close(): void;
}

/**
 * Buffered event for retry scenarios
 */
export interface BufferedEvent {
  event: ExecutionEvent;
  timestamp: number;
  retryCount: number;
}
