/**
 * @file Standardized router mock data and utilities
 * @description Provides consistent mock data structures for router tests
 */

import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Create a mock ELO score response for API calls
 */
export function createMockEloScoreResponse(
  eloScore: number,
  matchesPlayed: number = 15,
  winRate: number = 0.7,
  rank: number = 1,
) {
  return {
    ok: true,
    json: async () => ({
      success: true,
      tagScores: [
        {
          eloScore,
          matchesPlayed,
          winRate,
          rank,
        },
      ],
    }),
  };
}

/**
 * Create a mock empty ELO score response (no data available)
 */
export function createMockEmptyEloResponse() {
  return {
    ok: true,
    json: async () => ({
      success: true,
      tagScores: [],
    }),
  };
}

/**
 * Create a mock top models response for leaderboard API
 */
export function createMockTopModelsResponse(
  models: Array<{
    modelId: string;
    modelName?: string;
    eloScore: number;
    matchesPlayed?: number;
    winRate?: number;
    rank?: number;
  }>,
  limit?: number,
) {
  // Apply limit if specified
  const limitedModels = limit ? models.slice(0, limit) : models;

  return {
    ok: true,
    json: async () => ({
      success: true,
      models: limitedModels.map((model, index) => ({
        modelId: model.modelId,
        modelName: model.modelName || model.modelId,
        eloScore: model.eloScore,
        matchesPlayed: model.matchesPlayed || 15,
        winRate: model.winRate || 0.7,
        rank: model.rank || index + 1,
      })),
    }),
  };
}

/**
 * Create a mock error response
 */
export function createMockErrorResponse(status: number = 500, message: string = "API Error") {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      error: message,
    }),
  };
}

/**
 * Generate mock models for testing
 */
export function generateMockModels(
  count: number,
  baseScore: number = 1400,
): Array<{
  modelId: string;
  modelName: string;
  eloScore: number;
  matchesPlayed: number;
  winRate: number;
  rank: number;
}> {
  return Array.from({ length: count }, (_, i) => ({
    modelId: `model-${i}`,
    modelName: `Model ${i}`,
    eloScore: baseScore - i * 10,
    matchesPlayed: 15,
    winRate: 0.7,
    rank: i + 1,
  }));
}

/**
 * Mock fetch function that respects limit parameters
 */
export function createMockFetchWithLimit() {
  return jest.fn().mockImplementation((url: string) => {
    // Extract limit from URL if present
    const urlObj = new URL(url, "http://localhost");
    const limit = parseInt(urlObj.searchParams.get("limit") || "10");

    // Return appropriate response based on URL
    if (url.includes("/api/leaderboard/")) {
      const models = generateMockModels(10);
      return Promise.resolve(createMockTopModelsResponse(models, limit));
    }

    if (url.includes("/tag-scores")) {
      return Promise.resolve(createMockEloScoreResponse(1400));
    }

    // Default response
    return Promise.resolve(createMockErrorResponse(404, "Not found"));
  });
}

/**
 * Standard test models for consistent testing
 */
export const MOCK_MODELS = {
  CLAUDE_SONNET: {
    modelId: "claude-3-sonnet",
    modelName: "Claude 3 Sonnet",
    eloScore: 1450,
    matchesPlayed: 20,
    winRate: 0.75,
    rank: 1,
  },
  GPT_4: {
    modelId: "openai/gpt-4",
    modelName: "GPT-4",
    eloScore: 1420,
    matchesPlayed: 18,
    winRate: 0.72,
    rank: 2,
  },
  GEMINI_PRO: {
    modelId: "google/gemini-pro",
    modelName: "Gemini Pro",
    eloScore: 1380,
    matchesPlayed: 15,
    winRate: 0.67,
    rank: 3,
  },
};

/**
 * Standard capability tags for testing
 */
export const MOCK_CAPABILITIES = {
  AESTHETIC_COMPOSITION: "aesthetic-composition" as HierarchicalTagId,
  ARTISTIC_EXPRESSION: "artistic-expression" as HierarchicalTagId,
  CREATIVITY_INNOVATION: "creativity-innovation" as HierarchicalTagId,
  ALGORITHM_IMPLEMENTATION: "algorithm-implementation" as HierarchicalTagId,
  CODE_GENERATION: "code-generation" as HierarchicalTagId,
  TECHNICAL_IMPLEMENTATION: "technical-implementation" as HierarchicalTagId,
};

/**
 * Create comprehensive router test data structure
 */
export const createRouterTestData = () => ({
  // Current router analysis response structure
  analysisResult: {
    capabilities: ["reasoning", "code-generation", "creative-writing"],
    complexity: "medium",
    recommendedModels: [
      {
        id: "openai/gpt-4",
        name: "GPT-4",
        reasoning: "Best for complex reasoning tasks",
        confidence: 0.95,
        eloScore: 1450,
      },
      {
        id: "anthropic/claude-3-sonnet",
        name: "Claude 3 Sonnet",
        reasoning: "Good balance of capabilities",
        confidence: 0.88,
        eloScore: 1420,
      },
    ],
    workflow: {
      steps: [
        {
          id: "analyze",
          name: "Analyze Prompt",
          status: "completed",
          duration: 1200,
        },
        {
          id: "select",
          name: "Select Models",
          status: "completed",
          duration: 800,
        },
        {
          id: "execute",
          name: "Execute Requests",
          status: "in-progress",
          duration: null,
        },
      ],
    },
  },

  // Execution result structure
  executionResult: {
    requestId: "test-request-123",
    status: "completed",
    models: [
      {
        id: "openai/gpt-4",
        status: "completed",
        response: "Mock GPT-4 response",
        metadata: {
          tokensUsed: 150,
          responseTime: 2500,
        },
      },
    ],
    metadata: {
      totalDuration: 5000,
      requestsCompleted: 1,
      requestsFailed: 0,
    },
  },

  // Streaming event structure
  streamingEvents: [
    {
      type: "analysis-started",
      timestamp: Date.now(),
      data: { prompt: "test prompt" },
    },
    {
      type: "models-selected",
      timestamp: Date.now() + 1000,
      data: { selectedModels: ["openai/gpt-4"] },
    },
    {
      type: "execution-completed",
      timestamp: Date.now() + 5000,
      data: { results: [] },
    },
  ],
});

/**
 * Mock execution ID generator for consistent testing
 */
export const mockExecutionId = (id: string = "exec_test123") => id;
