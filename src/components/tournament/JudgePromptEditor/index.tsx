/**
 * @file Judge prompt editor main component
 * @description Orchestrates judge prompt editing with AI generation and validation
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { useDevLogger } from "@/lib/dev-logger";
import { type JudgePromptEditorProps } from "@/types/components";

import { GenerationControls } from "./GenerationControls";
import { PromptTextarea } from "./PromptTextarea";
import { StatusIndicator } from "./StatusIndicator";
import { useJudgePromptGeneration } from "./useJudgePromptGeneration";
import { validateJudgePrompt } from "./validation";

/**
 * Component for editing and generating judge prompts.
 * Integrates with the judge prompt API and provides comprehensive validation.
 */
export function JudgePromptEditor({
  challengePrompt,
  onPromptChange,
  initialJudgePrompt = "",
  loading = false,
  className = "",
}: JudgePromptEditorProps) {
  const logUI = useDevLogger("JudgePromptEditor");

  const [judgePrompt, setJudgePrompt] = useState(initialJudgePrompt);
  const [touched, setTouched] = useState(false);

  const { isGenerating, apiError, hasGenerated, canGenerate, handleGeneratePrompt, clearApiError } =
    useJudgePromptGeneration({
      challengePrompt,
      loading,
      onPromptChange: onPromptChange || undefined,
    });

  // Validate prompt in real-time
  const validation = validateJudgePrompt(judgePrompt);
  const showErrors = touched && !validation.isValid;

  // Notify parent when prompt changes
  useEffect(() => {
    if (validation.isValid && onPromptChange) {
      onPromptChange(judgePrompt.trim());
    }
  }, [judgePrompt, validation.isValid, onPromptChange]);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newPrompt = event.target.value;
      setJudgePrompt(newPrompt);

      if (!touched) {
        setTouched(true);
      }

      // Clear API error when user starts editing
      if (apiError) {
        clearApiError();
      }

      logUI("prompt_change", {
        length: newPrompt.length,
        isValid: validateJudgePrompt(newPrompt).isValid,
      });
    },
    [touched, apiError, logUI, clearApiError],
  );

  const handleBlur = useCallback(() => {
    if (!touched) {
      setTouched(true);
    }
    logUI("prompt_blur", {
      length: judgePrompt.length,
      isValid: validation.isValid,
    });
  }, [touched, judgePrompt.length, validation.isValid, logUI]);

  const handleGenerate = useCallback(() => {
    setTouched(true);
    handleGeneratePrompt(setJudgePrompt);
  }, [handleGeneratePrompt]);

  const isDisabled = loading || isGenerating;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Judge Instructions</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate AI-powered judge instructions or write your own. The judge will use these
          instructions to evaluate and compare model responses.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Generate Button Section */}
        <GenerationControls
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          hasGenerated={hasGenerated}
          apiError={apiError}
          challengePrompt={challengePrompt}
          onGenerate={handleGenerate}
        />

        {/* Judge Prompt Text Area */}
        <PromptTextarea
          value={judgePrompt}
          onChange={handlePromptChange}
          onBlur={handleBlur}
          disabled={isDisabled}
          validation={validation}
          showErrors={showErrors}
        />

        {/* Status and Guidance */}
        <StatusIndicator validation={validation} />
      </div>
    </div>
  );
}
