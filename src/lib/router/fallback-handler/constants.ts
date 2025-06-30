/**
 * @file Fallback model constants and data
 * @description Static fallback model definitions and capability mappings
 */

import type { ModelRecommendation } from "@/types/router";

/**
 * Default fallback models with known good performance
 */
export const FALLBACK_MODELS: Record<string, ModelRecommendation> = {
  "claude-3-sonnet": {
    modelId: "claude-3-sonnet",
    modelName: "Claude 3 Sonnet",
    provider: "Anthropic",
    eloScore: 1400,
    eloScores: {},
    averageElo: 1400,
    confidence: 0.8,
    reasoning: "Fallback selection: Claude 3 Sonnet (reliable general-purpose model)",
  },
  "gpt-4": {
    modelId: "gpt-4",
    modelName: "GPT-4",
    provider: "OpenAI",
    eloScore: 1380,
    eloScores: {},
    averageElo: 1380,
    confidence: 0.8,
    reasoning: "Fallback selection: GPT-4 (reliable general-purpose model)",
  },
  "gpt-4o": {
    modelId: "gpt-4o",
    modelName: "GPT-4o",
    provider: "OpenAI",
    eloScore: 1350,
    eloScores: {},
    averageElo: 1350,
    confidence: 0.7,
    reasoning: "Fallback selection: GPT-4o (balanced performance and speed)",
  },
};

/**
 * Capability-specific fallback models
 */
export const CAPABILITY_FALLBACKS: Record<string, string[]> = {
  "artistic-creation": ["claude-3-sonnet", "gpt-4"],
  "algorithm-implementation": ["gpt-4", "claude-3-sonnet"],
  "data-analysis": ["gpt-4", "claude-3-sonnet"],
  "visual-design": ["claude-3-sonnet", "gpt-4o"],
  "technical-documentation": ["claude-3-sonnet", "gpt-4"],
  "creative-writing": ["claude-3-sonnet", "gpt-4"],
  "content-interpretation": ["gpt-4", "claude-3-sonnet"],
  "semantic-understanding": ["claude-3-sonnet", "gpt-4"],
};

/**
 * Model-based ELO heuristics when data is missing
 */
export const MODEL_HEURISTICS: Record<string, number> = {
  "claude-3-sonnet": 1350,
  "gpt-4": 1320,
  "gpt-4o": 1280,
  "claude-3-haiku": 1250,
  "gpt-3.5-turbo": 1200,
};

/**
 * Capability-based ELO adjustments
 */
export const CAPABILITY_ADJUSTMENTS: Record<string, number> = {
  "artistic-creation": 1.1,
  "algorithm-implementation": 1.0,
  "data-analysis": 0.95,
  "visual-design": 1.05,
  "technical-documentation": 1.0,
  "creative-writing": 1.1,
  "content-interpretation": 1.0,
  "semantic-understanding": 1.0,
};
