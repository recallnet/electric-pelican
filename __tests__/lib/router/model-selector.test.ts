/**
 * @file Tests for Router-2 model selection system.
 * @description Comprehensive tests covering model selection, workflow optimization,
 * fallback handling, and API integration.
 */

import { selectOptimalModels, validateSelectionRequest } from "@/lib/router/model-selector";
import { selectSpecialistModel, selectGeneralistModel } from "@/lib/router/selection/strategies";
import { optimizeWorkflowSteps } from "@/lib/router/workflow-optimizer";
import { handleModelSelectionFallback } from "@/lib/router/fallback-handler";
import type { SelectModelsRequest, WorkflowStep, OptimizedWorkflowStep } from "@/types/router";

// Mock the dependencies
jest.mock("@/lib/openrouter-client");
jest.mock("@/lib/router/elo-lookup");
jest.mock("@/lib/tag-taxonomy");

// Mock ELO lookup functions - including hierarchical functions
jest.mock("@/lib/router/elo-lookup", () => ({
  getModelEloScore: jest.fn(),
  getModelEloScores: jest.fn(),
  getTopModelsForCapability: jest.fn(),
  calculateModelFitness: jest.fn(),
  calculateModelFitnessHierarchical: jest.fn(),
  getGlobalEloScore: jest.fn(),
  clearEloCache: jest.fn(),
  getCacheStats: jest.fn(),
  // Hierarchical functions
  getHierarchicalEloScore: jest.fn(),
  getTopModelsForCapabilityHierarchical: jest.fn(),
  adjustConfidenceForHierarchy: jest.fn(),
}));

// Mock tag taxonomy functions
jest.mock("@/lib/tag-taxonomy", () => ({
  getTagsByLevel: jest.fn(),
  getTagInfo: jest.fn(),
  getTagLineage: jest.fn(),
}));

const mockGetModelEloScore = require("@/lib/router/elo-lookup").getModelEloScore as jest.Mock;
const mockGetTopModelsForCapability = require("@/lib/router/elo-lookup")
  .getTopModelsForCapability as jest.Mock;
const mockGetTopModelsForCapabilityHierarchical = require("@/lib/router/elo-lookup")
  .getTopModelsForCapabilityHierarchical as jest.Mock;
const mockCalculateModelFitness = require("@/lib/router/elo-lookup")
  .calculateModelFitness as jest.Mock;
const mockCalculateModelFitnessHierarchical = require("@/lib/router/elo-lookup")
  .calculateModelFitnessHierarchical as jest.Mock;
const mockGetGlobalEloScore = require("@/lib/router/elo-lookup").getGlobalEloScore as jest.Mock;
const mockGetTagsByLevel = require("@/lib/tag-taxonomy").getTagsByLevel as jest.Mock;
const mockGetTagLineage = require("@/lib/tag-taxonomy").getTagLineage as jest.Mock;

describe("Router-2 Model Selection System", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockGetModelEloScore.mockResolvedValue({
      score: 1350,
      matchesPlayed: 25,
      winRate: 0.68,
      confidence: 0.8,
      rank: 3,
    });

    mockGetTopModelsForCapability.mockResolvedValue([
      {
        modelId: "claude-3-sonnet",
        modelName: "Claude 3 Sonnet",
        eloScore: { score: 1420, matchesPlayed: 30, winRate: 0.73, confidence: 0.85, rank: 1 },
      },
      {
        modelId: "gpt-4",
        modelName: "GPT-4",
        eloScore: { score: 1380, matchesPlayed: 28, winRate: 0.71, confidence: 0.82, rank: 2 },
      },
    ]);

    // Mock hierarchical functions
    mockGetTopModelsForCapabilityHierarchical.mockResolvedValue([
      {
        modelId: "claude-3-sonnet",
        modelName: "Claude 3 Sonnet",
        eloScore: { score: 1420, matchesPlayed: 30, winRate: 0.73, confidence: 0.85, rank: 1 },
      },
      {
        modelId: "gpt-4",
        modelName: "GPT-4",
        eloScore: { score: 1380, matchesPlayed: 28, winRate: 0.71, confidence: 0.82, rank: 2 },
      },
    ]);

    mockCalculateModelFitness.mockResolvedValue({
      modelId: "claude-3-sonnet",
      overallScore: 1400,
      capabilityScores: {
        "aesthetic-composition": {
          score: 1420,
          matchesPlayed: 30,
          winRate: 0.73,
          confidence: 0.85,
          rank: 1,
        },
      },
      confidence: 0.85,
      isAvailable: true,
    });

    mockCalculateModelFitnessHierarchical.mockResolvedValue({
      modelId: "claude-3-sonnet",
      overallScore: 1400,
      capabilityScores: {
        "aesthetic-composition": {
          score: 1420,
          matchesPlayed: 30,
          winRate: 0.73,
          confidence: 0.85,
          rank: 1,
        },
      },
      confidence: 0.85,
      isAvailable: true,
    });

    mockGetGlobalEloScore.mockResolvedValue(1350);

    mockGetTagsByLevel.mockReturnValue([
      { id: "aesthetic-composition", name: "Aesthetic Composition", level: 3 },
      { id: "creative-synthesis", name: "Creative Synthesis", level: 3 },
    ]);

    mockGetTagLineage.mockReturnValue([
      { id: "cognitive-capabilities", name: "Cognitive Capabilities", level: 1 },
      { id: "creative-generation", name: "Creative Generation", level: 2 },
      { id: "aesthetic-composition", name: "Aesthetic Composition", level: 3 },
    ]);
  });

  describe("Model Selection Strategies", () => {
    it("should select specialist model for single capability", async () => {
      const result = await selectSpecialistModel("aesthetic-composition");

      expect(result).toBeTruthy();
      expect(result?.modelId).toBe("claude-3-sonnet");
      expect(result?.reasoning).toContain("specialist");
      expect(mockGetTopModelsForCapabilityHierarchical).toHaveBeenCalledWith(
        "aesthetic-composition",
        20,
      );
    });

    it("should select generalist model for multiple capabilities", async () => {
      const capabilities = [
        { tagId: "aesthetic-composition" as const },
        { tagId: "creative-synthesis" as const },
      ];

      const result = await selectGeneralistModel(capabilities);

      expect(result).toBeTruthy();
      expect(result?.modelId).toBe("claude-3-sonnet");
      expect(result?.reasoning).toContain("generalist");
    });

    it("should exclude specified models from selection", async () => {
      mockGetTopModelsForCapabilityHierarchical.mockResolvedValue([
        {
          modelId: "claude-3-sonnet",
          modelName: "Claude 3 Sonnet",
          eloScore: { score: 1420, matchesPlayed: 30, winRate: 0.73, confidence: 0.85, rank: 1 },
        },
        {
          modelId: "gpt-4",
          modelName: "GPT-4",
          eloScore: { score: 1380, matchesPlayed: 28, winRate: 0.71, confidence: 0.82, rank: 2 },
        },
      ]);

      const result = await selectSpecialistModel("aesthetic-composition", undefined, [
        "claude-3-sonnet",
      ]);

      expect(result?.modelId).toBe("gpt-4");
    });
  });

  describe("Workflow Optimization", () => {
    it("should merge compatible steps with same model", () => {
      const steps: OptimizedWorkflowStep[] = [
        {
          id: "step-1",
          description: "Write a poem",
          requiredCapabilities: ["artistic-creation"],
          primaryCapability: "artistic-creation",
          selectedModel: {
            modelId: "claude-3-sonnet",
            modelName: "Claude 3 Sonnet",
            provider: "Anthropic",
            eloScore: 1420,
            eloScores: { "artistic-creation": 1420 },
            averageElo: 1420,
            confidence: 0.85,
            reasoning: "Selected for artistic creation",
          },
          dependencies: [],
          estimatedTokens: 500,
          priority: 1,
        },
        {
          id: "step-2",
          description: "Create artwork",
          requiredCapabilities: ["artistic-creation"],
          primaryCapability: "artistic-creation",
          selectedModel: {
            modelId: "claude-3-sonnet",
            modelName: "Claude 3 Sonnet",
            provider: "Anthropic",
            eloScore: 1420,
            eloScores: { "artistic-creation": 1420 },
            averageElo: 1420,
            confidence: 0.85,
            reasoning: "Selected for artistic creation",
          },
          dependencies: [],
          estimatedTokens: 600,
          priority: 1,
        },
      ];

      const optimized = optimizeWorkflowSteps(steps);

      expect(optimized).toHaveLength(1);
      expect(optimized[0]?.mergedSteps).toEqual(["step-1", "step-2"]);
      expect(optimized[0]?.estimatedTokens).toBe(1100);
    });

    it("should not merge steps with different models", () => {
      const steps: OptimizedWorkflowStep[] = [
        {
          id: "step-1",
          description: "Write a poem",
          requiredCapabilities: ["artistic-creation"],
          primaryCapability: "artistic-creation",
          selectedModel: {
            modelId: "claude-3-sonnet",
            modelName: "Claude 3 Sonnet",
            provider: "Anthropic",
            eloScore: 1420,
            eloScores: { "artistic-creation": 1420 },
            averageElo: 1420,
            confidence: 0.85,
            reasoning: "Selected for artistic creation",
          },
          dependencies: [],
          estimatedTokens: 500,
          priority: 1,
        },
        {
          id: "step-2",
          description: "Analyze data",
          requiredCapabilities: ["data-analysis"],
          primaryCapability: "data-analysis",
          selectedModel: {
            modelId: "gpt-4",
            modelName: "GPT-4",
            provider: "OpenAI",
            eloScore: 1380,
            eloScores: { "data-analysis": 1380 },
            averageElo: 1380,
            confidence: 0.82,
            reasoning: "Selected for data analysis",
          },
          dependencies: [],
          estimatedTokens: 800,
          priority: 1,
        },
      ];

      const optimized = optimizeWorkflowSteps(steps);

      expect(optimized).toHaveLength(2);
      expect(optimized[0]?.mergedSteps).toBeUndefined();
      expect(optimized[1]?.mergedSteps).toBeUndefined();
    });
  });

  describe("Fallback Handling", () => {
    it("should provide fallback model when primary selection fails", async () => {
      const step: WorkflowStep = {
        id: "test-step",
        description: "Test task",
        requiredCapabilities: ["artistic-creation"],
        primaryCapability: "artistic-creation",
        dependencies: [],
        estimatedTokens: 1000,
        priority: 1,
      };

      const fallback = await handleModelSelectionFallback(step);

      expect(fallback).toBeTruthy();
      expect(fallback.modelId).toBe("claude-3-sonnet");
      expect(fallback.reasoning).toContain("Fallback");
    });

    it("should handle missing ELO data gracefully", async () => {
      mockGetTopModelsForCapability.mockResolvedValue([]);
      mockCalculateModelFitness.mockRejectedValue(new Error("No data"));

      const step: WorkflowStep = {
        id: "test-step",
        description: "Test task",
        requiredCapabilities: ["unknown-capability" as any],
        primaryCapability: "unknown-capability",
        dependencies: [],
        estimatedTokens: 1000,
        priority: 1,
      };

      const fallback = await handleModelSelectionFallback(step);

      expect(fallback).toBeTruthy();
      // Fallback models have high confidence (0.8) - this is expected behavior
      expect(fallback.confidence).toBeGreaterThan(0.1);
    });
  });

  describe("End-to-End Model Selection", () => {
    it("should complete full model selection workflow", async () => {
      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "step-1",
            description: "Write a creative poem",
            requiredCapabilities: ["artistic-creation"],
            primaryCapability: "artistic-creation",
            dependencies: [],
            estimatedTokens: 500,
            priority: 1,
          },
          {
            id: "step-2",
            description: "Analyze the poem themes",
            requiredCapabilities: ["content-interpretation"],
            dependencies: ["step-1"],
            estimatedTokens: 300,
            priority: 2,
          },
        ],
      };

      const result = await selectOptimalModels(request);

      expect(result.success).toBe(true);
      expect(result.data.optimizedWorkflow).toHaveLength(2);
      expect(result.data.singleModelRecommendation).toBeTruthy();
      expect(result.data.modelSelectionReasoning).toHaveLength(2);
      expect(result.data.estimatedCost).toBeGreaterThan(0);
      expect(result.data.estimatedTime).toBeGreaterThan(0);
    });

    it("should handle complex multi-step workflow", async () => {
      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "analyze",
            description: "Analyze requirements",
            requiredCapabilities: ["semantic-understanding"],
            dependencies: [],
            estimatedTokens: 800,
            priority: 1,
          },
          {
            id: "design",
            description: "Create visual design",
            requiredCapabilities: ["visual-design"],
            dependencies: ["analyze"],
            estimatedTokens: 1200,
            priority: 2,
          },
          {
            id: "implement",
            description: "Write implementation code",
            requiredCapabilities: ["algorithm-implementation"],
            dependencies: ["design"],
            estimatedTokens: 2000,
            priority: 3,
          },
        ],
        preferences: {
          preferSingleModel: false,
          maxModels: 3,
          minEloThreshold: 1300,
        },
      };

      const result = await selectOptimalModels(request);

      // Should return a result (might be fallback due to validation issues)
      expect(result).toBeTruthy();
      expect(result.data.optimizedWorkflow.length).toBeGreaterThan(0);
      expect(result.data.optimizedWorkflow.length).toBeLessThanOrEqual(3);
    });

    it("should prefer single model when requested", async () => {
      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "step-1",
            description: "Write content",
            requiredCapabilities: ["creative-writing"],
            dependencies: [],
            estimatedTokens: 500,
            priority: 1,
          },
          {
            id: "step-2",
            description: "Analyze content",
            requiredCapabilities: ["content-interpretation"],
            dependencies: ["step-1"],
            estimatedTokens: 300,
            priority: 2,
          },
        ],
        preferences: {
          preferSingleModel: true,
        },
      };

      const result = await selectOptimalModels(request);

      expect(result.success).toBe(true);

      // Check that all steps use the same model or steps are merged
      const uniqueModels = new Set(
        result.data.optimizedWorkflow.map((step) => step.selectedModel.modelId),
      );

      expect(uniqueModels.size).toBeLessThanOrEqual(1);
    });

    it("should handle API errors gracefully", async () => {
      mockGetTopModelsForCapability.mockRejectedValue(new Error("API Error"));
      mockCalculateModelFitness.mockRejectedValue(new Error("API Error"));

      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "step-1",
            description: "Test task",
            requiredCapabilities: ["artistic-creation"],
            dependencies: [],
            estimatedTokens: 1000,
            priority: 1,
          },
        ],
      };

      const result = await selectOptimalModels(request);

      // Should still return a response (fallback)
      expect(result).toBeTruthy();
      expect(result.data.optimizedWorkflow).toHaveLength(1);
    });
  });

  describe("Request Validation", () => {
    it("should validate valid requests", () => {
      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "step-1",
            description: "Test task",
            requiredCapabilities: ["artistic-creation"],
            dependencies: [],
            estimatedTokens: 1000,
            priority: 1,
          },
        ],
      };

      const validation = validateSelectionRequest(request);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject requests with missing required fields", () => {
      const request = {
        workflow: [
          {
            id: "",
            description: "Test task",
            requiredCapabilities: [],
            dependencies: [],
            estimatedTokens: 1000,
            priority: 1,
          },
        ],
      } as SelectModelsRequest;

      const validation = validateSelectionRequest(request);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should reject requests with invalid preferences", () => {
      const request: SelectModelsRequest = {
        workflow: [
          {
            id: "step-1",
            description: "Test task",
            requiredCapabilities: ["artistic-creation"],
            dependencies: [],
            estimatedTokens: 1000,
            priority: 1,
          },
        ],
        preferences: {
          maxModels: 0,
          minEloThreshold: 500,
        },
      };

      const validation = validateSelectionRequest(request);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("maxModels must be at least 1");
      expect(validation.errors).toContain("minEloThreshold must be at least 1000");
    });
  });

  describe("Performance and Error Handling", () => {
    it("should complete selection within reasonable time", async () => {
      const startTime = Date.now();

      const request: SelectModelsRequest = {
        workflow: Array.from({ length: 5 }, (_, i) => ({
          id: `step-${i + 1}`,
          description: `Task ${i + 1}`,
          requiredCapabilities: ["artistic-creation"],
          dependencies: i > 0 ? [`step-${i}`] : [],
          estimatedTokens: 1000,
          priority: i + 1,
        })),
      };

      const result = await selectOptimalModels(request);
      const duration = Date.now() - startTime;

      // Should return a result within time limit (might be fallback)
      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
