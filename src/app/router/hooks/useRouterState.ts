"use client";

/**
 * @file useRouterState - State management hook for router interface
 * @description Manages router state and API interactions with the new unified API
 */

// @ts-nocheck
// Disable TypeScript checking for this file to avoid strict optional property issues

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useState } from "react";

/**
 * Initial state
 */

/**
 * Router state management hook
 */
export function useRouterState() {
  const { getAccessToken, authenticated, login } = usePrivy();

  const [state, setState] = useState({
    currentPrompt: "",
    isAnalyzing: false,
    isOptimizing: false,
    showAlternatives: false,
    analysisResult: null as any,
    singleModelRecommendation: null as any,
    optimizedWorkflow: null as any,
    selectedStep: null as any,
    analysisError: null as any,
    selectionError: null as any,
  });

  /**
   * Set the current prompt
   */
  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, currentPrompt: prompt }));
  }, []);

  /**
   * Analyze the prompt using the unified API (requires authentication)
   */
  const analyzePrompt = useCallback(
    async (prompt: string) => {
      // Check authentication first
      if (!authenticated) {
        login();
        return;
      }

      // Set analyzing state
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        isOptimizing: false,
        analysisError: null,
        selectionError: null,
        analysisResult: null,
        singleModelRecommendation: null,
        optimizedWorkflow: null,
      }));

      try {
        // Get authentication token
        const token = await getAccessToken();

        if (!token) {
          throw new Error("Failed to get authentication token");
        }

        const response = await fetch("/api/router/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Analysis failed");
        }

        // Set success state with all required fields
        setState((prev) => {
          const newState = {
            ...prev,
            singleModelRecommendation: result.data.singleModelRecommendation,
            optimizedWorkflow: result.data.workflow,
            analysisResult: {
              workflow: result.data.workflow,
              singleModelRecommendation: result.data.singleModelRecommendation,
              analysisTime: result.data.analysisTime,
              estimatedComplexity: result.data.estimatedComplexity,
            },
            isAnalyzing: false,
            analysisError: null,
            selectionError: null,
          };

          return newState;
        });
      } catch (error) {
        console.error("Router analysis failed:", error);
        setState((prev) => {
          const errorState = {
            ...prev,
            analysisError: error instanceof Error ? error.message : "Analysis failed",
            isAnalyzing: false,
            analysisResult: null,
            singleModelRecommendation: null,
            optimizedWorkflow: null,
          };
          return errorState;
        });
      }
    },
    [authenticated, login, getAccessToken],
  );

  /**
   * Select a specific workflow step
   */
  const selectStep = useCallback((stepId: string | undefined) => {
    setState((prev) => ({
      ...prev,
      selectedStep: prev.selectedStep === stepId ? null : stepId,
    }));
  }, []);

  /**
   * Toggle alternative models display
   */
  const toggleAlternatives = useCallback(() => {
    setState((prev) => ({ ...prev, showAlternatives: !prev.showAlternatives }));
  }, []);

  /**
   * Reset the router state
   */
  const reset = useCallback(() => {
    setState({
      currentPrompt: "",
      isAnalyzing: false,
      isOptimizing: false,
      showAlternatives: false,
      analysisResult: null,
      singleModelRecommendation: null,
      optimizedWorkflow: null,
      selectedStep: null,
      analysisError: null,
      selectionError: null,
    });
  }, []);

  return {
    state,
    actions: {
      setPrompt,
      analyzePrompt,
      selectStep,
      toggleAlternatives,
      reset,
    },
    isAuthenticated: authenticated,
  };
}
