/**
 * @file Status indicator for judge prompt editor
 * @description Shows validation status and accessibility guidance
 */

import { type JudgePromptValidationResult } from "@/types/tournament";

interface StatusIndicatorProps {
  validation: JudgePromptValidationResult;
}

export function StatusIndicator({ validation }: StatusIndicatorProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <>
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-700">Judge instructions ready</span>
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-600">Instructions needed</span>
            </>
          )}
        </div>

        <p className="text-gray-500">
          Press Tab to navigate, use generate button for AI assistance
        </p>
      </div>
    </div>
  );
}
