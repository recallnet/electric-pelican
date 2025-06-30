/**
 * Types related to error handling and classification
 */

/**
 * Classification result for OpenRouter API errors
 *
 * Based on OpenRouter's official error documentation:
 * https://openrouter.ai/docs/api-reference/errors
 */
export interface ErrorClassification {
  /** Whether the error indicates the model should be marked as unavailable */
  shouldMarkUnavailable: boolean;

  /** Whether the error is temporary and can be recovered from */
  isRecoverable: boolean;

  /** Human-readable explanation of the error classification */
  reason: string;
}
