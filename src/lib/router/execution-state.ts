/**
 * @file Execution state management for Router-3A
 * @description Manages execution state persistence and retrieval for workflow tracking
 */

import type {
  ExecutionError,
  ExecutionRequest,
  ExecutionResults,
  ExecutionState,
  ExecutionStatus,
  SingleExecutionState,
  StepExecutionState,
  WorkflowExecutionState,
} from "@/types/router";

/**
 * In-memory execution state store
 * In production, this would be Redis or a database
 */
const executionStates = new Map<string, ExecutionState>();

/**
 * Generate a unique execution ID
 */
export function generateExecutionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `exec_${timestamp}_${random}`;
}

/**
 * Initialize execution state
 */
export function initializeExecutionState(
  executionId: string,
  request: ExecutionRequest,
): ExecutionState {
  const now = Date.now();

  const state: ExecutionState = {
    executionId,
    status: "running",
    startTime: now,
    request,
    singleExecution: {
      status: "running",
      startTime: now,
    },
    workflowExecution: {
      status: "running",
      startTime: now,
      currentStepIndex: 0,
      stepStates: new Map(),
      errors: [],
    },
    errors: [],
  };

  // Initialize step states for workflow
  request.workflow.forEach((step, index) => {
    const stepState: StepExecutionState = {
      stepId: step.id,
      status: index === 0 ? "running" : "running", // All can start in parallel if no deps
      attempt: 0,
    };
    state.workflowExecution.stepStates.set(step.id, stepState);
  });

  executionStates.set(executionId, state);
  return state;
}

/**
 * Get execution state
 */
export function getExecutionState(executionId: string): ExecutionState | null {
  return executionStates.get(executionId) || null;
}

/**
 * Update execution status
 */
export function updateExecutionStatus(
  executionId: string,
  status: ExecutionStatus,
  endTime?: number,
): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  state.status = status;
  if (endTime) {
    state.endTime = endTime;
  }

  executionStates.set(executionId, state);
}

/**
 * Update single execution state
 */
export function updateSingleExecutionState(
  executionId: string,
  updates: Partial<SingleExecutionState>,
): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  Object.assign(state.singleExecution, updates);
  executionStates.set(executionId, state);
}

/**
 * Update workflow execution state
 */
export function updateWorkflowExecutionState(
  executionId: string,
  updates: Partial<WorkflowExecutionState>,
): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  Object.assign(state.workflowExecution, updates);
  executionStates.set(executionId, state);
}

/**
 * Update step execution state
 */
export function updateStepExecutionState(
  executionId: string,
  stepId: string,
  updates: Partial<StepExecutionState>,
): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  const currentStepState = state.workflowExecution.stepStates.get(stepId);
  if (currentStepState) {
    Object.assign(currentStepState, updates);
    state.workflowExecution.stepStates.set(stepId, currentStepState);
  }

  executionStates.set(executionId, state);
}

/**
 * Add execution error
 */
export function addExecutionError(executionId: string, error: ExecutionError): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  state.errors.push(error);

  // Also add to workflow errors if it's a step error
  if (error.stepId) {
    state.workflowExecution.errors.push(error);
  }

  executionStates.set(executionId, state);
}

/**
 * Mark step as completed
 */
export function markStepCompleted(executionId: string, stepId: string): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  // Update the step state to completed
  const stepState = state.workflowExecution.stepStates.get(stepId);
  if (stepState) {
    stepState.status = "completed";
    stepState.endTime = Date.now();
    state.workflowExecution.stepStates.set(stepId, stepState);
  }

  executionStates.set(executionId, state);
}

/**
 * Set execution results and mark as complete
 */
export function setExecutionResults(executionId: string, results: ExecutionResults): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  state.results = results;

  // Mark execution as complete by adding the isComplete flag
  (state as any).isComplete = true;

  executionStates.set(executionId, state);
}

/**
 * Mark execution as complete (for persistence)
 */
export function markExecutionComplete(executionId: string): void {
  const state = executionStates.get(executionId);
  if (!state) return;

  // Add isComplete flag for persistence layer
  (state as any).isComplete = true;

  executionStates.set(executionId, state);
}

/**
 * Check if execution is complete
 */
export function isExecutionComplete(executionId: string): boolean {
  const state = executionStates.get(executionId);
  if (!state) return false;

  const singleComplete =
    state.singleExecution.status === "completed" || state.singleExecution.status === "failed";
  const workflowComplete =
    state.workflowExecution.status === "completed" || state.workflowExecution.status === "failed";

  return singleComplete && workflowComplete;
}

/**
 * Get execution progress summary
 */
export function getExecutionProgress(executionId: string) {
  const state = executionStates.get(executionId);
  if (!state) return null;

  return {
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
      currentStep: getCurrentStepId(state),
      startTime: state.workflowExecution.startTime,
      endTime: state.workflowExecution.endTime,
      tokensUsed: calculateWorkflowTokens(state),
      cost: calculateWorkflowCost(state),
    },
  };
}

/**
 * Get current step ID for workflow
 */
function getCurrentStepId(state: ExecutionState): string | undefined {
  const runningSteps = Array.from(state.workflowExecution.stepStates.entries())
    .filter(([_, stepState]) => stepState.status === "running")
    .map(([stepId, _]) => stepId);

  return runningSteps[0];
}

/**
 * Calculate total tokens used in workflow
 */
function calculateWorkflowTokens(state: ExecutionState): number {
  return Array.from(state.workflowExecution.stepStates.values()).reduce((total, stepState) => {
    return total + (stepState.result?.tokensUsed || 0);
  }, 0);
}

/**
 * Calculate total cost for workflow
 */
function calculateWorkflowCost(state: ExecutionState): number {
  return Array.from(state.workflowExecution.stepStates.values()).reduce((total, stepState) => {
    return total + (stepState.result?.cost || 0);
  }, 0);
}

/**
 * Clean up old execution states (for memory management)
 */
export function cleanupOldExecutions(maxAge: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();

  for (const [executionId, state] of executionStates.entries()) {
    const age = now - state.startTime;
    if (age > maxAge && (state.status === "completed" || state.status === "failed")) {
      executionStates.delete(executionId);
    }
  }
}

/**
 * Get all execution states (for debugging)
 */
export function getAllExecutionStates(): Map<string, ExecutionState> {
  return new Map(executionStates);
}

/**
 * Clear all execution states (for testing)
 */
export function clearAllExecutionStates(): void {
  executionStates.clear();
}
