/**
 * @file Generation controls for judge prompt editor
 * @description Generate button and error handling UI
 */

import { Button } from "@/components/ui/button";

interface GenerationControlsProps {
  canGenerate: boolean;
  isGenerating: boolean;
  hasGenerated: boolean;
  apiError: string | null;
  challengePrompt: string;
  onGenerate: () => void;
}

export function GenerationControls({
  canGenerate,
  isGenerating,
  hasGenerated,
  apiError,
  challengePrompt,
  onGenerate,
}: GenerationControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="judge-prompt" className="text-sm font-medium text-gray-700">
          Judge Instructions
        </label>
        <Button onClick={onGenerate} disabled={!canGenerate} variant="outline" className="gap-2">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              Generating...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {hasGenerated ? "Regenerate Instructions" : "Generate Instructions"}
            </>
          )}
        </Button>
      </div>

      {!canGenerate && !challengePrompt.trim() && (
        <p className="text-sm text-amber-600">
          Please enter a challenge prompt first to generate judge instructions.
        </p>
      )}

      {/* API Error Display */}
      {apiError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.896-.833-2.664 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-red-800">
              <strong>Generation Failed:</strong> {apiError}
            </p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={!canGenerate}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
