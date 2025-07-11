/**
 * @file Prompt Persistence Hook
 * @description Preserves user prompt input during authentication flow
 */

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

/**
 * Hook for preserving prompt state during authentication
 */
export function usePromptPersistence() {
  const { authenticated, login } = usePrivy();
  const [prompt, setPrompt] = useState("");

  /**
   * Save prompt to session storage and trigger authentication
   */
  const saveAndAuth = (currentPrompt: string) => {
    if (currentPrompt.trim()) {
      sessionStorage.setItem("router-prompt", currentPrompt);
    }
    login();
  };

  /**
   * Restore prompt from session storage after authentication
   */
  useEffect(() => {
    if (authenticated) {
      const saved = sessionStorage.getItem("router-prompt");
      if (saved) {
        setPrompt(saved);
        sessionStorage.removeItem("router-prompt");
      }
    }
  }, [authenticated]);

  return { prompt, setPrompt, saveAndAuth };
}
