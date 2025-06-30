import { OpenRouterModel, ProcessedModel } from "@/types/models";
import { FetchOptions } from "@/types/openrouter";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * The IDs of models that must always appear first in the API response.
 */
export const defaultModels = [
  "deepseek/deepseek-chat-v3-0324",
  "google/gemini-2.5-pro-preview",
  "qwen/qwen3-30b-a3b",
  "anthropic/claude-sonnet-4",
  "microsoft/phi-4-reasoning-plus:free",
  "mistralai/mistral-medium-3",
  "meta-llama/llama-3.3-8b-instruct:free",
  "openai/gpt-4o-mini",
  "openai/o3-pro",
];

// Cache configuration (currently unused but kept for future implementation)
// const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

// type CacheEntry = { timestamp: number; data: ProcessedModel[] };

// Simple in-memory cache (module-scoped – OK for single-instance Vercel Function).
// const cache = new Map<string, CacheEntry>();
// const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// function buildCacheKey({ capability, limit }: FetchOptions) {
//   return `${capability}-${limit}`;
// }

/**
 * Fetches models from OpenRouter API and processes them into our format.
 * Handles caching and error cases.
 */
export async function fetchOpenRouterModels({
  capability = "all",
  limit = 100,
}: FetchOptions = {}): Promise<ProcessedModel[]> {
  // Cache implementation planned for future
  // const cache = new Map<string, { data: ProcessedModel[]; timestamp: number }>();
  // const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // function buildCacheKey(options?: FetchOptions): string {
  //   return JSON.stringify(options || {});
  // }

  try {
    // Fetch models from OpenRouter
    const response = await fetch(OPENROUTER_MODELS_URL);
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data;

    // Filter by capability if specified
    const filtered = models.filter((m) => {
      if (capability === "all") return true;
      return m.capabilities?.includes(capability);
    });

    // Process models into our format
    const processed: ProcessedModel[] = filtered.map((m) => ({
      id: m.id,
      name: m.name || m.id.split("/").pop() || m.id, // Fallback to last part of ID or full ID
      description: m.description || "",
      provider: m.id.split("/")[0] ?? "unknown",
      rank: 0, // temp
      tokens_served: m.tokens_served || 0, // Default to 0 since new API doesn't provide this
      isNew: false, // temp
      capabilities: m.capabilities || m.architecture?.input_modalities || ["text"],
      input_modalities: m.input_modalities || m.architecture?.input_modalities || ["text"],
      output_modalities: m.output_modalities || m.architecture?.output_modalities || ["text"],
      context_length: m.context_length || 4096, // Default to 4096 if not specified
      created: typeof m.created === "number" ? m.created : Math.floor(Date.now() / 1000),
    }));

    // Log processed models for debugging
    console.log(`Processed ${processed.length} models:`, JSON.stringify(processed, null, 2));

    // Apply limit after processing
    return processed.slice(0, limit);
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return [];
  }
}
