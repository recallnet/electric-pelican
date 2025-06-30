/**
 * OpenRouter Error Classification System
 *
 * Classifies errors from OpenRouter API calls to determine whether a model
 * should be marked as unavailable or if the error is temporary/user-caused.
 *
 * Based on OpenRouter's official error documentation:
 * https://openrouter.ai/docs/api-reference/errors
 */

import { ErrorClassification } from "@/types/errors";

/**
 * Type guard to check if an unknown value is an Error object
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === "string" ? message : String(message);
  }
  return String(error);
}

/**
 * Classifies an OpenRouter API error to determine appropriate response.
 *
 * @param error - Error object from OpenRouter API call
 * @returns Classification indicating whether to mark model unavailable and why
 */
export function classifyOpenRouterError(error: unknown): ErrorClassification {
  // Create safe typed version of the error with proper type narrowing
  const err = error as {
    response?: { status?: number };
    status?: number;
    message?: string;
    error?: { code?: number; metadata?: { reasons?: string[] } };
  };

  const status = err.response?.status || err.status || err.error?.code;
  const message = getErrorMessage(error).toLowerCase();
  const errorData = err.error || {};

  // Permanent failures - mark as unavailable
  if (status === 502) {
    return {
      shouldMarkUnavailable: true,
      isRecoverable: true, // Admin can check if model comes back online
      reason: `Model down or invalid response (502): ${getErrorMessage(error)}`,
    };
  }

  if (status === 503) {
    return {
      shouldMarkUnavailable: true,
      isRecoverable: true,
      reason: `No available provider meets routing requirements (503): ${getErrorMessage(error)}`,
    };
  }

  if (status === 401 && message.includes("invalid") && message.includes("key")) {
    return {
      shouldMarkUnavailable: true,
      isRecoverable: true, // Admin can add API key
      reason: `Invalid credentials - may need API key provisioning (401): ${getErrorMessage(error)}`,
    };
  }

  // Temporary failures - don't mark as unavailable
  if (status === 408) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: true,
      reason: `Request timeout (408) - temporary issue`,
    };
  }

  if (status === 429) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: true,
      reason: `Rate limited (429) - temporary issue`,
    };
  }

  if (status === 402) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: true,
      reason: `Insufficient credits (402) - account issue, not model issue`,
    };
  }

  // User-caused failures - don't mark as unavailable
  if (status === 400) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: false,
      reason: `Bad request (400) - user/prompt issue: ${getErrorMessage(error)}`,
    };
  }

  if (status === 403 && errorData.metadata?.reasons) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: false,
      reason: `Content moderation (403) - prompt flagged: ${errorData.metadata.reasons.join(", ")}`,
    };
  }

  // Empty response errors (common with some models)
  if (message.includes("empty response") || message.includes("no content")) {
    return {
      shouldMarkUnavailable: true,
      isRecoverable: true,
      reason: `Model returned empty response: ${getErrorMessage(error)}`,
    };
  }

  // Network/connection errors - temporary
  if (message.includes("network") || message.includes("connection") || message.includes("fetch")) {
    return {
      shouldMarkUnavailable: false,
      isRecoverable: true,
      reason: `Network/connection error - temporary issue: ${getErrorMessage(error)}`,
    };
  }

  // Unknown errors - be conservative, mark as unavailable
  return {
    shouldMarkUnavailable: true,
    isRecoverable: true,
    reason: `Unknown error (${status || "no status"}): ${getErrorMessage(error)}`,
  };
}
