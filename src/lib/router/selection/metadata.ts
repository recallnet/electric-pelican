/**
 * @file Model metadata handling
 * @description Handles model metadata retrieval and estimation
 */

import type { ModelMetadata } from "@/types/router";

/**
 * Get model metadata from the models API
 * @param modelId - The model ID to look up
 * @returns Model metadata from API or fallback values
 */
export async function getModelMetadata(modelId: string): Promise<ModelMetadata> {
  try {
    // Check if we're in a test environment or if fetch is available
    if (typeof fetch !== "undefined" && typeof window !== "undefined") {
      // Query the models API for real metadata
      const response = await fetch(`/api/models?q=${encodeURIComponent(modelId)}&limit=1`);

      if (response?.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          const model = data.models[0];

          return {
            modelId: model.id || modelId,
            modelName: model.name || modelId,
            provider: extractProvider(model.id) || "Unknown",
            costPer1kTokens: estimateCostFromModel(model.id),
            averageLatencyMs: estimateLatencyFromModel(model.id),
            maxContextLength: model.context_length || 32000,
          };
        }
      }
    }
  } catch (error) {
    // Silent fallback in test environments
    if (process.env.NODE_ENV !== "test") {
      console.warn(`Failed to fetch model metadata for ${modelId}:`, error);
    }
  }

  // Fallback to estimated values based on model ID patterns
  return {
    modelId,
    modelName: formatModelName(modelId),
    provider: extractProvider(modelId) || "Unknown",
    costPer1kTokens: estimateCostFromModel(modelId),
    averageLatencyMs: estimateLatencyFromModel(modelId),
    maxContextLength: estimateContextLength(modelId),
  };
}

/**
 * Extract provider from model ID
 */
export function extractProvider(modelId: string): string {
  if (modelId.includes("claude")) return "Anthropic";
  if (modelId.includes("gpt")) return "OpenAI";
  if (modelId.includes("gemini")) return "Google";
  if (modelId.includes("llama")) return "Meta";
  if (modelId.includes("mistral")) return "Mistral AI";
  return "Unknown";
}

/**
 * Format model name for display
 */
export function formatModelName(modelId: string): string {
  // Convert model IDs to readable names
  const nameMap: Record<string, string> = {
    "claude-3-sonnet": "Claude 3 Sonnet",
    "claude-3-haiku": "Claude 3 Haiku",
    "claude-3-opus": "Claude 3 Opus",
    "gpt-4": "GPT-4",
    "gpt-4o": "GPT-4o",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
  };

  return nameMap[modelId] || modelId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Estimate cost based on model patterns
 */
export function estimateCostFromModel(modelId: string): number {
  // Based on typical pricing patterns as of 2024
  if (modelId.includes("claude-3-opus")) return 0.015;
  if (modelId.includes("claude-3-sonnet")) return 0.003;
  if (modelId.includes("claude-3-haiku")) return 0.00025;
  if (modelId.includes("gpt-4-turbo")) return 0.01;
  if (modelId.includes("gpt-4o")) return 0.005;
  if (modelId.includes("gpt-4")) return 0.03;
  if (modelId.includes("gpt-3.5")) return 0.0005;
  if (modelId.includes("gemini-pro")) return 0.00025;
  if (modelId.includes("llama")) return 0.0002;

  // Conservative default
  return 0.001;
}

/**
 * Estimate latency based on model patterns
 */
export function estimateLatencyFromModel(modelId: string): number {
  // Based on typical performance patterns
  if (modelId.includes("haiku")) return 800; // Fast models
  if (modelId.includes("gpt-4o")) return 1200; // Optimized models
  if (modelId.includes("gpt-3.5")) return 1000; // Fast models
  if (modelId.includes("claude-3-sonnet")) return 1800; // Balanced models
  if (modelId.includes("gpt-4")) return 2500; // Slower but high-quality
  if (modelId.includes("opus")) return 3000; // Highest quality, slower

  // Conservative default
  return 2000;
}

/**
 * Estimate context length based on model patterns
 */
export function estimateContextLength(modelId: string): number {
  if (modelId.includes("claude-3")) return 200000;
  if (modelId.includes("gpt-4")) return 128000;
  if (modelId.includes("gpt-3.5")) return 16000;
  if (modelId.includes("gemini")) return 32000;

  // Conservative default
  return 32000;
}
