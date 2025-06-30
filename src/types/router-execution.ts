/**
 * Extended execution state type that includes the result data
 * Used for persistence when execution is complete
 */
export interface CompletedExecutionState {
  isComplete: boolean;
  originalPrompt: string;
  analysisResult: any;
  singleModelRecommendation: any;
  optimizedWorkflow: any[];
  singleResult?: any;
  workflowResult?: any;
  intermediateResults: any[];
  comparisonData?: any;
  totalExecutionTime?: number;
}
