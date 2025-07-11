"use client";

/**
 * @file PromptInput - Prompt input and analysis component
 * @description Handles user prompt input and triggers analysis
 */

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { PromptInputProps } from "@/types/router-ui";

const DEFAULT_PROMPT =
  "Compose two accounts of the same moonlit desert caravan—first as a formal diplomatic briefing to a monarch, then retold as a comforting bedtime story for the caravan leader's young daughter. Finally, craft me a perfect SVG that represents the scene of the story.";

/**
 * Prompt input component with analysis trigger
 */
export default function PromptInput({
  promptInput,
  isAnalyzing,
  analysisError,
  onPromptChange,
  onAnalyze,
  onClear,
  readOnly = false,
  isAuthenticated = false,
}: PromptInputProps & { readOnly?: boolean; isAuthenticated?: boolean }) {
  const { login } = usePrivy();
  const [localPrompt, setLocalPrompt] = useState(promptInput || DEFAULT_PROMPT);

  // Update local prompt when prop changes (but only if it's not empty)
  useEffect(() => {
    if (promptInput !== undefined && promptInput.trim() !== "") {
      setLocalPrompt(promptInput);
    }
  }, [promptInput]);

  // Notify parent of default prompt on mount if no prompt is provided
  useEffect(() => {
    if (!promptInput || promptInput.trim() === "") {
      onPromptChange(DEFAULT_PROMPT);
    }
  }, []); // Only run on mount

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    onPromptChange(value);
  };

  const handleAnalyze = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (localPrompt && localPrompt.trim()) {
      await onAnalyze(localPrompt.trim());
    }
  };

  const handleClear = () => {
    setLocalPrompt("");
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but not Shift+Enter for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (localPrompt && localPrompt.trim() && !isAnalyzing) {
        handleAnalyze();
      }
    }
  };

  const canAnalyze = localPrompt && localPrompt.trim() && !isAnalyzing;

  // Read-only mode - just display the prompt
  if (readOnly) {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="text-gray-800 whitespace-pre-wrap">{promptInput || localPrompt}</div>
      </div>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-4">
          <textarea
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to accomplish... For example: 'Write a poem about the night sky, then design an SVG that represents it'"
            className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-cyan-50 dark:border-gray-600 dark:placeholder-gray-400"
            disabled={isAnalyzing}
            rows={4}
          />

          <div className="text-xs text-gray-500 text-center">
            {isAuthenticated
              ? "Press Enter to analyze • Shift+Enter for new line"
              : "Sign in to analyze your prompt • Shift+Enter for new line"}
          </div>

          {/* Error Display */}
          {analysisError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">⚠️ Analysis failed: {analysisError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleAnalyze} disabled={!canAnalyze} className="px-8 py-3">
              {isAnalyzing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing...
                </>
              ) : !isAuthenticated ? (
                <>🔐 Sign In to Analyze</>
              ) : (
                <>🔍 Analyze Prompt</>
              )}
            </Button>

            {localPrompt && (
              <Button
                onClick={handleClear}
                disabled={isAnalyzing}
                variant="outline"
                className="px-6 py-3"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-pulse">🤖</div>
              <span className="text-sm">Analyzing prompt and generating workflow...</span>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
