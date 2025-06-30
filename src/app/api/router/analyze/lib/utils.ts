/**
 * @file Utility functions for router analysis
 * @description Common utility functions and fallback logic
 */

import { getTagLineage } from "@/lib/tag-taxonomy";
import type { RouterAnalysisResponse } from "@/types/api-router";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Get display name for a capability
 */
export function getCapabilityDisplayName(capability: HierarchicalTagId): string {
  const lineage = getTagLineage(capability);
  return lineage[lineage.length - 1]?.name || capability;
}

/**
 * Create fallback response when everything fails
 */
export function createFallbackResponse(
  prompt: string,
  startTime: number,
): RouterAnalysisResponse["data"] {
  const analysisTime = Date.now() - startTime;

  return {
    originalPrompt: prompt,
    singleModelRecommendation: {
      modelId: "anthropic/claude-3-5-sonnet-20241022",
      modelName: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      eloScore: 1400,
      reasoning: "Fallback model - analysis failed",
      dominantCapability: "semantic-understanding",
    },
    workflow: [
      {
        id: "step-1",
        description: `Complete the task: ${prompt}`,
        primaryCapability: "semantic-understanding",
        capabilityName: "Semantic Understanding",
        estimatedTokens: 1000,
        selectedModel: {
          modelId: "anthropic/claude-3-5-sonnet-20241022",
          modelName: "Claude 3.5 Sonnet",
          provider: "Anthropic",
          eloScore: 1400,
          reasoning: "Fallback model",
          selectedForCapability: "semantic-understanding",
          selectedForCapabilityName: "Semantic Understanding",
        },
        dependencies: [],
      },
    ],
    analysisTime,
    estimatedComplexity: "simple",
  };
}

/**
 * Get base URL for API calls (handles both server and client contexts)
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    console.log("[router] Using client-side base URL:", window.location.origin);
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log("[router] Using Vercel URL:", url);
    return url;
  }

  if (process.env.NEXTAUTH_URL) {
    console.log("[router] Using NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    return process.env.NEXTAUTH_URL;
  }

  console.log("[router] Using localhost fallback: http://localhost:3000");
  return "http://localhost:3000";
}

/**
 * Extract display name from model ID.
 */
export function getModelDisplayName(modelId: string): string {
  // Extract readable name from OpenRouter model ID
  const parts = modelId.split("/");
  const modelName = parts[parts.length - 1] || modelId;

  // Convert kebab-case to Title Case
  return modelName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extract provider from model ID.
 */
export function getModelProvider(modelId: string): string {
  const parts = modelId.split("/");
  return parts[0] || "unknown";
}
