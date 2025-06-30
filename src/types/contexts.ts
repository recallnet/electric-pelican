/**
 * Type definitions for React context components
 */

import type { Dispatch } from "react";

import type { Tournament } from "../../db";

/**
 * Step in a tournament creation wizard
 */
export type TournamentWizardStep = "prompt" | "models" | "judge" | "confirm" | "complete";

/**
 * Tournament Wizard context state
 */
export interface TournamentWizardState {
  /** Current step in the wizard flow */
  currentStep: TournamentWizardStep;
  /** Tournament challenge prompt */
  prompt: string;
  /** Instructions for judging responses */
  judgePrompt: string;
  /** Selected model for judging */
  judgeModel: string;
  /** List of selected model IDs */
  selectedModelIds: string[];
  /** Number of models needed for tournament */
  requiredModelCount: number;
  /** ID of created tournament if available */
  tournamentId: string | null;
  /** Whether wizard has all required data */
  isComplete: boolean;
  /** Current loading state */
  loading: boolean;
}

/**
 * Internal wizard state for TournamentWizardContext
 */
export interface WizardState {
  prompt?: string;
  judgePrompt?: string;
  models: string[];
  bracketSize?: number;
  judgeModel?: string;
}

/**
 * Internal wizard actions for TournamentWizardContext
 */
export type WizardAction =
  | { type: "SET_PROMPT"; prompt: string }
  | { type: "SET_JUDGE_PROMPT"; judgePrompt: string }
  | { type: "SET_MODELS"; models: string[]; bracketSize: number }
  | { type: "SET_JUDGE"; judgeModel: string }
  | { type: "RESET" }
  | { type: "RESTORE"; state: WizardState };

/**
 * Internal context value type for TournamentWizardContext
 */
export interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

/**
 * Tournament Wizard context actions
 */
export interface TournamentWizardContextType {
  /** Current wizard state */
  state: TournamentWizardState;
  /** Set the tournament prompt */
  setPrompt: (prompt: string, judgePrompt?: string) => void;
  /** Set the judge model */
  setJudgeModel: (modelId: string) => void;
  /** Set selected models */
  setSelectedModels: (modelIds: string[]) => void;
  /** Go to the next step in the wizard */
  nextStep: () => void;
  /** Go to the previous step in the wizard */
  prevStep: () => void;
  /** Go to a specific step in the wizard */
  goToStep: (step: TournamentWizardStep) => void;
  /** Create a tournament with current data */
  createTournament: () => Promise<Tournament | null>;
  /** Reset the wizard state */
  reset: () => void;
}
