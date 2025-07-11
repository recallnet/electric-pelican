/**
 * @file Router Authentication Hook
 * @description Provides authentication state and helpers for the router page
 */

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

/**
 * Custom hook for router authentication functionality
 */
export function useRouterAuth() {
  const { user, authenticated, login } = usePrivy();

  /**
   * Checks if user is authenticated and executes callback if so, otherwise triggers login
   */
  const requireAuth = useCallback(
    (callback: () => void) => {
      if (authenticated && user) {
        callback();
      } else {
        login();
      }
    },
    [authenticated, user, login],
  );

  return {
    isAuthenticated: authenticated && !!user,
    user,
    login,
    requireAuth,
  };
}
