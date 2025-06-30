"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useReducer } from "react";

import { DEFAULT_JUDGE_MODEL } from "@/config/defaults";
import type { WizardAction, WizardContextValue, WizardState } from "@/types/contexts";

const baseState: WizardState = {
  models: [],
  judgeModel: DEFAULT_JUDGE_MODEL,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.prompt };
    case "SET_JUDGE_PROMPT":
      return { ...state, judgePrompt: action.judgePrompt };
    case "SET_MODELS":
      return { ...state, models: action.models, bracketSize: action.bracketSize };
    case "SET_JUDGE":
      return { ...state, judgeModel: action.judgeModel };
    case "RESET":
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingTournamentState");
      }
      return baseState;
    case "RESTORE":
      return action.state;
    default:
      return state;
  }
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function TournamentWizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, baseState);

  // On mount, restore any saved state from sessionStorage (client-only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("pendingTournamentState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WizardState;
        dispatch({ type: "RESTORE", state: parsed });
      } catch (err) {
        console.warn("Failed to parse saved tournament state:", err);
      }
    }
  }, []);

  // Persist state on any change so that it can survive page reload/login
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("pendingTournamentState", JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save tournament state:", err);
      }
    }
  }, [state]);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
      <StepAnnouncer />
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within TournamentWizardProvider");
  return ctx;
}

// Export reducer for unit tests (not part of public API)
export { reducer };

// Export WizardState type for testing
export type { WizardState };

function StepAnnouncer() {
  const pathname = usePathname();
  const message =
    pathname === "/challenge"
      ? "Step 1 of 3: Prompt"
      : pathname === "/models"
        ? "Step 2 of 3: Models"
        : pathname.startsWith("/eval/setup")
          ? "Step 3 of 3: Confirm"
          : "";

  return (
    <p aria-live="polite" className="sr-only" data-testid="step-announcer">
      {message}
    </p>
  );
}
