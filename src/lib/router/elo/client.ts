/**
 * @file ELO API client and caching
 * @description Handles API calls and caching for ELO score lookups
 */

import type { EloScore } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Get the base URL for internal API calls
 * @returns Base URL for API calls
 */
function getBaseUrl(): string {
  // Check if we're running on the server
  if (typeof window === "undefined") {
    // Server-side: use environment variable or localhost
    if (process.env.VERCEL_URL) {
      const url = `https://${process.env.VERCEL_URL}`;
      console.log(`[router-elo] Using Vercel URL: ${url}`);
      return url;
    }
    if (process.env.NEXTAUTH_URL) {
      console.log(`[router-elo] Using NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
      return process.env.NEXTAUTH_URL;
    }
    console.log(`[router-elo] Using localhost fallback`);
    return "http://localhost:3000";
  }
  // Client-side: use current origin
  console.log(`[router-elo] Using client origin: ${window.location.origin}`);
  return window.location.origin;
}

/**
 * Create absolute URL for internal API calls
 * @param path - API path (should start with /)
 * @returns Absolute URL
 */
function createApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}

// Simple in-memory cache for ELO scores
const eloCache = new Map<string, { data: EloScore; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for ELO lookups
 */
function getCacheKey(modelId: string, tagId: HierarchicalTagId): string {
  return `${modelId}:${tagId}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Get ELO score for a specific model and capability
 * @param modelId - The model ID to look up
 * @param tagId - The capability tag ID
 * @returns ELO score with metadata
 */
export async function getModelEloScore(
  modelId: string,
  tagId: HierarchicalTagId,
): Promise<EloScore> {
  const cacheKey = getCacheKey(modelId, tagId);
  const cached = eloCache.get(cacheKey);

  // Return cached result if valid
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    // Query the hierarchical ELO API
    const response = await fetch(
      createApiUrl(
        `/api/models/${encodeURIComponent(modelId)}/tag-scores?tagId=${encodeURIComponent(tagId)}`,
      ),
      {
        cache: "no-cache",
      },
    );

    if (!response.ok) {
      throw new Error(`ELO lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.tagScores || data.tagScores.length === 0) {
      // No ELO data available for this model-capability pair
      return createFallbackEloScore(modelId, tagId);
    }

    const tagScore = data.tagScores[0]; // First result should be the exact match

    const eloScore: EloScore = {
      score: tagScore.eloScore,
      matchesPlayed: tagScore.matchesPlayed,
      winRate: tagScore.winRate,
      confidence: calculateConfidence(tagScore.matchesPlayed, tagScore.winRate),
      rank: tagScore.rank,
    };

    // Cache the result
    eloCache.set(cacheKey, { data: eloScore, timestamp: Date.now() });

    return eloScore;
  } catch (error) {
    console.warn(`Failed to fetch ELO score for ${modelId}:${tagId}:`, error);
    return createFallbackEloScore(modelId, tagId);
  }
}

/**
 * Get ELO scores for multiple capabilities for a single model
 * @param modelId - The model ID to look up
 * @param tagIds - Array of capability tag IDs
 * @returns Map of tag IDs to ELO scores
 */
export async function getModelEloScores(
  modelId: string,
  tagIds: HierarchicalTagId[],
): Promise<Record<HierarchicalTagId, EloScore>> {
  const scores: Record<HierarchicalTagId, EloScore> = {};

  // Use Promise.all for parallel lookups
  const scorePromises = tagIds.map(async (tagId) => {
    const score = await getModelEloScore(modelId, tagId);
    return { tagId, score };
  });

  const results = await Promise.all(scorePromises);

  results.forEach(({ tagId, score }) => {
    scores[tagId] = score;
  });

  return scores;
}

/**
 * Get top models for a specific capability
 * @param tagId - The capability tag ID
 * @param limit - Maximum number of models to return
 * @returns Array of model IDs with their ELO scores
 */
export async function getTopModelsForCapability(
  tagId: HierarchicalTagId,
  limit: number = 10,
): Promise<Array<{ modelId: string; modelName: string; eloScore: EloScore }>> {
  try {
    const response = await fetch(
      createApiUrl(`/api/leaderboard/${encodeURIComponent(tagId)}?limit=${limit}`),
      {
        cache: "no-cache",
      },
    );

    if (!response.ok) {
      throw new Error(`Leaderboard lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.models) {
      return [];
    }

    return data.models.map((model: any) => ({
      modelId: model.modelId,
      modelName: model.modelName || model.modelId,
      eloScore: {
        score: model.eloScore,
        matchesPlayed: model.matchesPlayed,
        winRate: model.winRate,
        confidence: calculateConfidence(model.matchesPlayed, model.winRate),
        rank: model.rank,
      },
    }));
  } catch (error) {
    console.warn(`Failed to fetch top models for ${tagId}:`, error);
    return [];
  }
}

/**
 * Get global ELO score as fallback when capability-specific score is unavailable
 * @param modelId - The model ID
 * @returns Global ELO score or default
 */
export async function getGlobalEloScore(modelId: string): Promise<number> {
  try {
    const response = await fetch(createApiUrl(`/api/models/${encodeURIComponent(modelId)}/stats`), {
      cache: "no-cache",
    });

    if (!response.ok) {
      return 1200; // Default ELO
    }

    const data = await response.json();
    return data.globalElo || 1200;
  } catch (error) {
    console.warn(`Failed to fetch global ELO for ${modelId}:`, error);
    return 1200;
  }
}

/**
 * Check if a model is currently available
 * @param modelId - The model ID to check
 * @returns Whether the model is available
 */
export async function checkModelAvailability(modelId: string): Promise<boolean> {
  try {
    // Query the models API to check availability
    const response = await fetch(
      createApiUrl(`/api/models?q=${encodeURIComponent(modelId)}&limit=1`),
      {
        cache: "no-cache",
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.models && data.models.length > 0;
  } catch (error) {
    console.warn(`Failed to check availability for ${modelId}:`, error);
    return false; // Conservative fallback
  }
}

/**
 * Create fallback ELO score when no data is available
 */
export function createFallbackEloScore(_modelId: string, _tagId: HierarchicalTagId): EloScore {
  // Use conservative defaults
  return {
    score: 1200, // Starting ELO
    matchesPlayed: 0,
    winRate: 0.5,
    confidence: 0.1, // Very low confidence for fallback
    rank: 999, // Low rank
  };
}

/**
 * Calculate confidence based on matches played and win rate
 */
export function calculateConfidence(matchesPlayed: number, winRate: number): number {
  // More matches = higher confidence
  // Win rates closer to 0.5 = lower confidence (less decisive)
  const matchConfidence = Math.min(matchesPlayed / 20, 1.0); // Max confidence at 20+ matches
  const winRateConfidence = Math.abs(winRate - 0.5) * 2; // 0 at 50% win rate, 1 at 0% or 100%

  return Math.min(matchConfidence * 0.7 + winRateConfidence * 0.3, 1.0);
}

/**
 * Clear the ELO cache (useful for testing or manual refresh)
 */
export function clearEloCache(): void {
  eloCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): { size: number; hitRate: number } {
  const size = eloCache.size;
  // Hit rate would need to be tracked separately in a production system
  return { size, hitRate: 0.9 }; // Placeholder
}
