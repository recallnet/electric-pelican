/**
 * @file Judge prompt validation logic
 * @description Validation functions and constants for judge prompts
 */

import { type JudgePromptValidationResult } from "@/types/tournament";

// Validation constants
export const MIN_JUDGE_PROMPT_LENGTH = 20;
export const MAX_JUDGE_PROMPT_LENGTH = 3000;

/**
 * Validates a judge prompt input
 */
export function validateJudgePrompt(prompt: string): JudgePromptValidationResult {
  const errors: string[] = [];
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    errors.push("Judge prompt is required");
  } else if (trimmedPrompt.length < MIN_JUDGE_PROMPT_LENGTH) {
    errors.push(`Judge prompt must be at least ${MIN_JUDGE_PROMPT_LENGTH} characters long`);
  } else if (trimmedPrompt.length > MAX_JUDGE_PROMPT_LENGTH) {
    errors.push(`Judge prompt must be no more than ${MAX_JUDGE_PROMPT_LENGTH} characters long`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
