/**
 * @file Router state management types
 * @description Type definitions for execution state persistence and tracking
 */

import type {
  ExecutionError,
  ExecutionRequest,
  ExecutionResults,
  ExecutionStatus,
  StepResult,
} from "./execution";

/**
 * Execution state for persistence
 */
export interface ExecutionState {
  executionId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  request: ExecutionRequest;
  singleExecution: SingleExecutionState;
  workflowExecution: WorkflowExecutionState;
  results?: ExecutionResults;
  errors: ExecutionError[];
}

/**
 * Single execution state
 */
export interface SingleExecutionState {
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  modelId?: string;
  result?: import("./execution").CompletionResult;
  error?: ExecutionError;
}

/**
 * Workflow execution state
 */
export interface WorkflowExecutionState {
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  currentStepIndex: number;
  stepStates: Map<string, StepExecutionState>;
  result?: import("./execution").CompletionResult;
  errors: ExecutionError[];
}

/**
 * Individual step execution state
 */
export interface StepExecutionState {
  stepId: string;
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  attempt: number;
  result?: StepResult;
  error?: ExecutionError;
}
