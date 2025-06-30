/**
 * @file Validation utilities for prompt challenge form
 * @description Validation constants and functions for prompt input
 */

import { type PromptValidationResult } from "@/types/tournament";

// Validation constants
export const MIN_PROMPT_LENGTH = 10;
export const MAX_PROMPT_LENGTH = 2000;

/**
 * Validates a prompt challenge input
 */
export function validatePrompt(prompt: string): PromptValidationResult {
  const errors: string[] = [];
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    errors.push("Challenge prompt is required");
  } else if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
    errors.push(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters long`);
  } else if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    errors.push(`Prompt must be no more than ${MAX_PROMPT_LENGTH} characters long`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
