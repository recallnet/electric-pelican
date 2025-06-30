/**
 * @file Prompt textarea component for judge prompt editor
 * @description Textarea with validation, character count, and accessibility features
 */

import { type JudgePromptValidationResult } from "@/types/tournament";

import { MAX_JUDGE_PROMPT_LENGTH } from "./validation";

interface PromptTextareaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  disabled: boolean;
  validation: JudgePromptValidationResult;
  showErrors: boolean;
}

export function PromptTextarea({
  value,
  onChange,
  onBlur,
  disabled,
  validation,
  showErrors,
}: PromptTextareaProps) {
  const characterCount = value.length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          id="judge-prompt"
          name="judgePrompt"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          rows={8}
          className={`
            w-full px-4 py-3 text-sm border rounded-lg resize-y min-h-[160px] max-h-[600px]
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${showErrors ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
          `}
          placeholder="Click 'Generate Instructions' to create AI-powered judge instructions, or write your own custom instructions here..."
          aria-describedby={`
            judge-prompt-help
            ${showErrors ? "judge-prompt-errors" : ""}
            judge-prompt-count
          `.trim()}
          aria-invalid={showErrors}
          aria-required="true"
        />

        {/* Character count */}
        <div
          id="judge-prompt-count"
          className={`
            absolute bottom-2 right-2 text-xs px-2 py-1 rounded
            ${characterCount > MAX_JUDGE_PROMPT_LENGTH ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50"}
          `}
          aria-live="polite"
        >
          {characterCount}/{MAX_JUDGE_PROMPT_LENGTH}
        </div>
      </div>

      {/* Help text */}
      <p id="judge-prompt-help" className="text-sm text-gray-600">
        Provide clear instructions for how the AI judge should evaluate and compare model responses.
        Good instructions specify criteria, scoring methods, and decision-making guidelines.
      </p>

      {/* Validation errors */}
      {showErrors && (
        <div id="judge-prompt-errors" className="space-y-1" role="alert" aria-live="polite">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" aria-hidden="true" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
