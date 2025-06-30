/**
 * @file Challenge textarea component
 * @description Main prompt textarea with validation display
 */

import React from "react";

import { MAX_PROMPT_LENGTH } from "./validation";

interface ChallengeTextareaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  disabled: boolean;
  showErrors: boolean;
  characterCount: number;
}

/**
 * Main prompt textarea with validation display and character count
 */
export function ChallengeTextarea({
  value,
  onChange,
  onBlur,
  disabled,
  showErrors,
  characterCount,
}: ChallengeTextareaProps) {
  return (
    <div className="relative">
      <textarea
        id="challenge-prompt"
        name="challengePrompt"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        rows={6}
        className={`
          w-full px-4 py-3 text-sm border rounded-lg resize-y min-h-[120px] max-h-[400px]
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-cyan-50
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${showErrors ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
        `}
        placeholder="Example: Write a creative short story about a robot discovering art for the first time. Include vivid descriptions and emotional depth."
        aria-describedby={`
          challenge-prompt-help
          ${showErrors ? "challenge-prompt-errors" : ""}
          challenge-prompt-count
        `.trim()}
        aria-invalid={showErrors}
        aria-required="true"
      />

      {/* Character count */}
      <div
        id="challenge-prompt-count"
        className={`
          absolute bottom-2 right-2 text-xs px-2 py-1 rounded
          ${characterCount > MAX_PROMPT_LENGTH ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50"}
        `}
        aria-live="polite"
      >
        {characterCount}/{MAX_PROMPT_LENGTH}
      </div>
    </div>
  );
}
