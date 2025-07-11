/**
 * @file Judge prompt section component
 * @description Advanced judge prompt section with collapsible interface
 */

import React from "react";

interface JudgePromptSectionProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  judgePrompt: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}

/**
 * Advanced section for configuring judge prompt instructions
 */
export function JudgePromptSection({
  showAdvanced,
  setShowAdvanced,
  judgePrompt,
  onChange,
  disabled,
}: JudgePromptSectionProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        aria-expanded={showAdvanced}
        aria-controls="advanced-section"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Judge Instructions
      </button>

      {showAdvanced && (
        <div id="advanced-section" className="space-y-2">
          <div className="relative">
            <textarea
              id="judge-prompt"
              name="judgePrompt"
              value={judgePrompt}
              onChange={onChange}
              disabled={disabled}
              rows={3}
              className={`
                w-full px-4 py-3 text-sm border rounded-lg resize-y min-h-[80px] max-h-[200px]
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-cyan-50
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                border-gray-300
              `}
              placeholder="Instructions for how the AI judge should evaluate responses..."
              aria-describedby="judge-prompt-help"
            />
          </div>
        </div>
      )}
    </div>
  );
}
