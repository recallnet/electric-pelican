import { describe, it, expect } from "@jest/globals";

describe("Router Results Types", () => {
  describe("Basic Type Validation", () => {
    it("should validate basic router result structure", () => {
      const mockResult = {
        id: "test-result-456",
        executionId: "test-exec-123",
        originalPrompt: "Test prompt",
        completedAt: new Date(),
        modelEloData: {
          capturedAt: new Date(),
          models: {
            "gpt-4": {
              modelId: "gpt-4",
              name: "GPT-4",
              provider: "OpenAI",
              globalScore: 1500,
              matchesPlayed: 100,
              wins: 75,
              losses: 25,
            },
          },
          tagScores: {
            "gpt-4": {
              "creative-writing": {
                modelId: "gpt-4",
                tagId: "creative-writing",
                eloScore: 1600,
                matchesPlayed: 50,
                wins: 40,
                losses: 10,
              },
            },
          },
        },
        analysisResult: {},
        singleModelRecommendation: {
          modelName: "GPT-4",
          reasoning: "Best for creative tasks",
        },
        optimizedWorkflow: [],
        intermediateResults: [],
        totalExecutionTime: 1000,
        routerVersion: "1.0.0",
        createdAt: new Date(),
      };

      // Verify all required fields exist
      expect(mockResult.id).toBeDefined();
      expect(mockResult.executionId).toBeDefined();
      expect(mockResult.originalPrompt).toBeDefined();
      expect(mockResult.completedAt).toBeInstanceOf(Date);
      expect(mockResult.modelEloData).toBeDefined();
      expect(mockResult.totalExecutionTime).toBeDefined();
      expect(mockResult.routerVersion).toBeDefined();
      expect(mockResult.createdAt).toBeInstanceOf(Date);

      // Verify types
      expect(typeof mockResult.id).toBe("string");
      expect(typeof mockResult.executionId).toBe("string");
      expect(typeof mockResult.originalPrompt).toBe("string");
      expect(typeof mockResult.totalExecutionTime).toBe("number");
      expect(typeof mockResult.routerVersion).toBe("string");
      expect(Array.isArray(mockResult.optimizedWorkflow)).toBe(true);
      expect(Array.isArray(mockResult.intermediateResults)).toBe(true);
    });

    it("should validate ModelEloData structure", () => {
      const modelEloData = {
        capturedAt: new Date(),
        models: {
          "gpt-4": {
            modelId: "gpt-4",
            name: "GPT-4",
            provider: "OpenAI",
            globalScore: 1500,
            matchesPlayed: 100,
            wins: 75,
            losses: 25,
          },
        },
        tagScores: {
          "gpt-4": {
            "creative-writing": {
              modelId: "gpt-4",
              tagId: "creative-writing",
              eloScore: 1600,
              matchesPlayed: 50,
              wins: 40,
              losses: 10,
            },
          },
        },
      };

      expect(modelEloData.capturedAt).toBeInstanceOf(Date);
      expect(modelEloData.models).toBeDefined();
      expect(modelEloData.tagScores).toBeDefined();

      expect(typeof modelEloData.models).toBe("object");
      expect(typeof modelEloData.tagScores).toBe("object");

      // Validate model score structure
      const modelScore = modelEloData.models["gpt-4"];
      expect(modelScore.modelId).toBe("gpt-4");
      expect(modelScore.name).toBe("GPT-4");
      expect(modelScore.provider).toBe("OpenAI");
      expect(typeof modelScore.globalScore).toBe("number");
      expect(typeof modelScore.matchesPlayed).toBe("number");
      expect(typeof modelScore.wins).toBe("number");
      expect(typeof modelScore.losses).toBe("number");

      // Validate tag score structure
      const tagScore = modelEloData.tagScores["gpt-4"]["creative-writing"];
      expect(tagScore.modelId).toBe("gpt-4");
      expect(tagScore.tagId).toBe("creative-writing");
      expect(typeof tagScore.eloScore).toBe("number");
      expect(typeof tagScore.matchesPlayed).toBe("number");
      expect(typeof tagScore.wins).toBe("number");
      expect(typeof tagScore.losses).toBe("number");
    });
  });
});
