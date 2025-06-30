/**
 * @file Router component type definitions
 * @description Type definitions for router components and pages
 */

/**
 * Props for router result page
 */
export interface RouterResultPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Props for router result content
 */
export interface RouterResultContentProps {
  resultId: string;
}

/**
 * Router state interface that matches what RouterInterface expects
 */
export interface RouterState {
  currentPrompt: string;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  analysisError?: string | undefined;
  selectionError?: string | undefined;
  analysisResult?:
    | {
        workflow: any[];
        singleModelRecommendation: any;
        analysisTime: number;
        estimatedComplexity: string;
      }
    | null
    | undefined;
  singleModelRecommendation?: any | undefined;
  optimizedWorkflow?: any[] | undefined;
  selectedStep?: string | undefined;
  showAlternatives: boolean;
}

/**
 * Router actions interface
 */
export interface RouterActions {
  setPrompt: (prompt: string) => void;
  analyzePrompt: (prompt: string) => Promise<void>;
  selectStep: (stepId: string | undefined) => void;
  toggleAlternatives: () => void;
  reset: () => void;
}
