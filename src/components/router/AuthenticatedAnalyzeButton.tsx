/**
 * @file Authenticated Analyze Button Component
 * @description Analyze button for authenticated users in router interface
 */

import { Loader2 } from "lucide-react";

interface AuthenticatedAnalyzeButtonProps {
  onAnalyze: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * Analyze button component for authenticated users
 */
export function AuthenticatedAnalyzeButton({
  onAnalyze,
  isLoading,
  disabled = false,
}: AuthenticatedAnalyzeButtonProps) {
  return (
    <button
      onClick={onAnalyze}
      disabled={isLoading || disabled}
      className="interactive-surface-primary text-on-primary rounded-md py-3 px-6 font-semibold w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? "Analyzing..." : "Analyze"}
    </button>
  );
}
