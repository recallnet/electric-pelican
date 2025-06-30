/**
 * @file Formatting utilities for dashboard table
 * @description Common formatting functions for model names and display values
 */

/**
 * Format model name for display (e.g., "anthropic/claude-3-sonnet" -> "Claude 3 Sonnet")
 */
export function formatModelName(modelId: string): string {
  const parts = modelId.split("/");
  const modelName = parts[parts.length - 1] || modelId;

  return modelName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
