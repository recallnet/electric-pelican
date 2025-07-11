/**
 * @file Unauthenticated Analyze Button Component
 * @description Analyze button for unauthenticated users that triggers login
 */

import { usePrivy } from "@privy-io/react-auth";
import { UserIcon } from "lucide-react";

/**
 * Analyze button component for unauthenticated users
 */
export function UnauthenticatedAnalyzeButton() {
  const { login } = usePrivy();

  return (
    <button
      onClick={login}
      className="interactive-surface-primary text-on-primary rounded-md py-3 px-6 font-semibold w-full flex items-center justify-center gap-2"
    >
      <UserIcon className="w-4 h-4" />
      Sign In to Analyze
    </button>
  );
}
