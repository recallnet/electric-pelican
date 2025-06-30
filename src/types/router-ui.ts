/**
 * @file Router UI type definitions
 * @description Provides type-safe interfaces for router UI components and state management
 */

import type {
  ExecutionStatus,
  ModelRecommendation,
  OptimizedWorkflowStep,
  WorkflowAnalysis,
} from "./router";

/**
 * Router component state interface
 */
export interface RouterState {
  // Input state
  currentPrompt: string;

  // Analysis state
  isAnalyzing: boolean;
  analysisResult?: WorkflowAnalysis;
  analysisError?: string;

  // Model selection state
  isOptimizing: boolean;
  optimizedWorkflow?: OptimizedWorkflowStep[];
  singleModelRecommendation?: ModelRecommendation;
  selectionError?: string;

  // UI state
  selectedStep?: string;
  showAlternatives: boolean;
}

/**
 * Router component actions interface
 */
export interface RouterActions {
  // Input actions
  setPrompt: (prompt: string) => void;

  // Analysis actions
  analyzePrompt: (prompt: string) => Promise<void>;

  // UI actions
  selectStep: (stepId: string) => void;
  toggleAlternatives: () => void;
  reset: () => void;

  // Execution actions (placeholders for Router-3)
  executeWorkflow: () => void;
  executeSingleModel: () => void;
  executeBoth: () => void;
}

/**
 * Props for PromptInput component
 */
export interface PromptInputProps {
  promptInput: string;
  isAnalyzing: boolean;
  analysisError?: string;
  onPromptChange: (prompt: string) => void;
  onAnalyze: (prompt: string) => void;
  onClear: () => void;
}

/**
 * Props for WorkflowVisualization component
 */
export interface WorkflowVisualizationProps {
  workflow: OptimizedWorkflowStep[];
  isOptimizing: boolean;
  selectedStep?: string;
  onStepSelect: (stepId: string | undefined) => void;
  selectionError?: string;
  readOnly?: boolean;
}

/**
 * Props for WorkflowStepCard component
 */
export interface WorkflowStepCardProps {
  step: OptimizedWorkflowStep;
  stepNumber: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Props for ModelSelectionPanel component
 */
export interface ModelSelectionPanelProps {
  recommendation?: ModelRecommendation;
  isOptimizing: boolean;
  selectionError?: string;
}

/**
 * Props for CapabilityBadge component
 */
export interface CapabilityBadgeProps {
  capability: string;
  eloScore?: number;
  rank?: number;
  showRank?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
}

// ===== ROUTER-4B: EXECUTION PROGRESS TYPES =====

/**
 * Progress state for a single execution mode
 */
export interface ExecutionProgress {
  status: ExecutionStatus;
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  modelId: string;
  estimatedTimeRemaining: number;
  progressPercentage: number;
  startTime?: number;
  endTime?: number;
  tokensUsed?: number;
  cost?: number;
  errorMessage?: string;
}

/**
 * Intermediate result from workflow execution
 */
export interface IntermediateResult {
  stepId: string;
  modelId: string;
  result: string;
  executionTime: number;
  tokensUsed: number;
  cost: number;
  executionMode: "single" | "workflow";
}

/**
 * Final completion result
 */
export interface CompletionResult {
  executionMode: "single" | "workflow";
  finalResult: string;
  totalExecutionTime: number;
  totalTokensUsed: number;
  totalCost: number;
  stepsCompleted: number;
  modelUsage: Array<{
    modelId: string;
    modelName: string;
    provider: string;
    tokensUsed: number;
    cost: number;
    executionTime: number;
    stepsExecuted: number;
  }>;
}

/**
 * Progress streaming hook state
 */
export interface ProgressStreamingState {
  singleProgress?: ExecutionProgress;
  workflowProgress?: ExecutionProgress;
  intermediateResults: IntermediateResult[];
  singleResult?: CompletionResult;
  workflowResult?: CompletionResult;
  isConnected: boolean;
  isExecuting: boolean;
  error?: string;
}
