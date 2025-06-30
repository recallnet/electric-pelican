/**
 * @file Main PromptChallengeForm component
 * @description Form component for configuring a tournament challenge prompt
 */

"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_JUDGE_PROMPT } from "@/config/defaults";
import { useChallengeGenerator } from "@/hooks/useChallengeGenerator";
import { useDevLogger } from "@/lib/dev-logger";
import { type PromptChallengeFormProps } from "@/types/components";

import { ChallengeTextarea } from "./ChallengeTextarea";
import { GenerationButton } from "./GenerationButton";
import { JudgePromptSection } from "./JudgePromptSection";
import { validatePrompt } from "./validation";

/**
 * Form component for configuring a tournament challenge prompt.
 * Provides validation, accessibility, and user guidance.
 */
export function PromptChallengeForm({
  onSubmit,
  initialPrompt = "",
  initialJudgePrompt = DEFAULT_JUDGE_PROMPT,
  loading = false,
  className = "",
}: PromptChallengeFormProps) {
  const logUI = useDevLogger("PromptChallengeForm");
  const { generateChallenge, isLoading, error: generatorError } = useChallengeGenerator();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [judgePrompt, setJudgePrompt] = useState(initialJudgePrompt);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle challenge generation
  const handleGenerateChallenge = useCallback(async () => {
    logUI("generate_challenge_clicked");

    const result = await generateChallenge();
    if (result) {
      setPrompt(result.challenge);
      setTouched(true);

      logUI("challenge_generated", {
        challenge: result.challenge.substring(0, 50) + "...",
      });
    }
  }, [generateChallenge, logUI]);

  // Validate prompt in real-time
  const validation = validatePrompt(prompt);
  const showErrors = touched && !validation.isValid;

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newPrompt = event.target.value;
      setPrompt(newPrompt);

      if (!touched) {
        setTouched(true);
      }

      logUI("prompt_change", {
        length: newPrompt.length,
        isValid: validatePrompt(newPrompt).isValid,
      });
    },
    [touched, logUI],
  );

  const handleJudgePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newJudgePrompt = event.target.value;
      setJudgePrompt(newJudgePrompt);

      logUI("judge_prompt_change", {
        length: newJudgePrompt.length,
      });
    },
    [logUI],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validation.isValid || loading || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      logUI("prompt_submit", { prompt: prompt.trim() });

      try {
        await onSubmit?.({ prompt: prompt.trim(), judgePrompt });
      } catch (error) {
        logUI("prompt_submit_error", { error });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validation.isValid, loading, isSubmitting, prompt, onSubmit, judgePrompt, logUI],
  );

  const handleBlur = useCallback(() => {
    if (!touched) {
      setTouched(true);
    }
    logUI("prompt_blur", { length: prompt.length, isValid: validation.isValid });
  }, [touched, prompt.length, validation.isValid, logUI]);

  const characterCount = prompt.length;
  const isDisabled = loading || isSubmitting;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Challenge</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Write a prompt that will challenge AI models. They'll compete to give the best response,
          and you'll pick a judge to evaluate their answers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="challenge-prompt" className="block text-sm font-medium text-gray-700">
              Challenge Prompt
            </label>
            <GenerationButton
              onClick={handleGenerateChallenge}
              isLoading={isLoading}
              disabled={isDisabled}
            />
          </div>

          <ChallengeTextarea
            value={prompt}
            onChange={handlePromptChange}
            onBlur={handleBlur}
            disabled={isDisabled}
            showErrors={showErrors}
            characterCount={characterCount}
          />

          {/* Generator error */}
          {generatorError && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-amber-600 rounded-full" aria-hidden="true" />
              Failed to generate challenge: {generatorError}. You can try again or write your own.
            </div>
          )}

          {/* Validation errors */}
          {showErrors && (
            <div id="challenge-prompt-errors" className="" role="alert" aria-live="polite">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <span
                    className="inline-block w-1 h-1 bg-red-600 rounded-full"
                    aria-hidden="true"
                  />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Section */}
        <JudgePromptSection
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          judgePrompt={judgePrompt}
          onChange={handleJudgePromptChange}
          disabled={isDisabled}
        />

        {/* Submit button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!validation.isValid || isDisabled}
            className="px-8 py-3 text-base cursor-pointer"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              "Continue to Model Selection"
            )}
          </Button>
        </div>

        {/* Accessibility hint */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Press Tab to navigate, Enter to submit when prompt is valid
          </p>
        </div>
      </form>
    </div>
  );
}
