/**
 * @file Integration test for the unified router API
 * @description Tests the complete router pipeline from prompt analysis to model selection
 * in a single API call, as implemented in the new architecture.
 */

import { NextRequest } from "next/server";
import { POST as unifiedRouterRoute } from "@/app/api/router/analyze/route";

describe("Unified Router API Integration", () => {
  beforeEach(() => {
    // Mock fetch for ELO lookups
    global.fetch = jest.fn().mockImplementation((url: string) => {
      // Mock leaderboard API calls
      if (url.includes("/api/leaderboard/")) {
        // const _capability = url.split("/").pop();
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              leaderboard: [
                {
                  modelId: "anthropic/claude-3-sonnet",
                  modelName: "Claude 3 Sonnet",
                  provider: "Anthropic",
                  eloScore: 1847,
                  wins: 15,
                  losses: 5,
                  winRate: 0.75,
                },
              ],
            }),
        });
      }

      // For any other calls, return empty success
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Error Handling (No API Key in Test Environment)", () => {
    it("should fail cleanly when OpenRouter API key is not available", async () => {
      const complexPrompt =
        "write a poem about the night sky and happiness, then create an SVG that perfectly represents the message of the poem";

      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: complexPrompt }),
      });

      const response = await unifiedRouterRoute(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.data.singleModelRecommendation).toBeDefined();
      expect(data.data.workflow).toBeDefined();
      expect(data.data.workflow.length).toBe(1);
      // Should contain fallback reasoning
      expect(data.data.singleModelRecommendation.reasoning).toContain("analysis failed");
    });

    it("should handle simple prompts with error response", async () => {
      const simplePrompt = "explain quantum computing";

      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: simplePrompt }),
      });

      const response = await unifiedRouterRoute(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.data.singleModelRecommendation).toBeDefined();
      expect(data.data.workflow).toBeDefined();
      expect(data.data.workflow.length).toBe(1);
    });

    it("should provide fallback model selection even when AI analysis fails", async () => {
      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: "perform a very rare AI task" }),
      });

      const response = await unifiedRouterRoute(request);
      const data = await response.json();

      expect(data.success).toBe(false);

      // Should still get a model assignment (fallback)
      expect(data.data.workflow[0].selectedModel).toBeDefined();
      expect(data.data.workflow[0].selectedModel.modelId).toBe(
        "anthropic/claude-3-5-sonnet-20241022",
      );
      expect(data.data.workflow[0].selectedModel.reasoning).toContain("Fallback model");
    });

    it("should handle API errors gracefully with fallback response", async () => {
      // Mock API failure
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error("Network error"));
      });

      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: "test prompt" }),
      });

      const response = await unifiedRouterRoute(request);
      const data = await response.json();

      // Should return error response since AI analysis fails and no fallback
      expect(data.success).toBe(false);
      expect(data.data.singleModelRecommendation).toBeDefined();
      expect(data.data.workflow).toBeDefined();
      expect(data.data.workflow.length).toBe(1);
      // Verify it's the createFallbackResponse (not AI analysis fallback)
      expect(data.data.singleModelRecommendation.reasoning).toContain("analysis failed");
    });

    it("should validate prompt length requirements", async () => {
      const shortPrompt = "hi";

      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: shortPrompt }),
      });

      const response = await unifiedRouterRoute(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      // In validation errors, the fallback response is still provided
      expect(data.data.singleModelRecommendation).toBeDefined();
    });
  });

  describe("API Structure (Error Response Format)", () => {
    it("should return consistent error structure across different prompts", async () => {
      const prompts = ["write code", "create art", "analyze data", "write documentation"];

      const results = await Promise.all(
        prompts.map(async (prompt) => {
          const request = new NextRequest("http://localhost:3000/api/router/analyze", {
            method: "POST",
            body: JSON.stringify({ prompt }),
          });
          const response = await unifiedRouterRoute(request);
          return response.json();
        }),
      );

      // All should have consistent error structure
      results.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.data.singleModelRecommendation).toBeDefined();
        expect(result.data.workflow).toBeDefined();
        expect(Array.isArray(result.data.workflow)).toBe(true);
        expect(result.data.workflow.length).toBe(1);
      });
    });

    it("should provide fallback capabilities in error responses", async () => {
      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: "create a complex multi-step AI workflow" }),
      });

      const response = await unifiedRouterRoute(request);
      const data = await response.json();

      expect(data.success).toBe(false);

      // Check that fallback capabilities are provided
      expect(data.data.workflow[0].primaryCapability).toBeDefined();
      expect(data.data.workflow[0].capabilityName).toBeDefined();
      expect(data.data.singleModelRecommendation.dominantCapability).toBeDefined();
    });
  });

  describe("Request Validation", () => {
    it("should reject invalid request format", async () => {
      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ invalidField: "test" }),
      });

      const response = await unifiedRouterRoute(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      // Validation errors still provide fallback data structure
      expect(data.data.singleModelRecommendation).toBeDefined();
    });

    it("should reject empty prompts", async () => {
      const request = new NextRequest("http://localhost:3000/api/router/analyze", {
        method: "POST",
        body: JSON.stringify({ prompt: "" }),
      });

      const response = await unifiedRouterRoute(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      // Validation errors still provide fallback data structure
      expect(data.data.singleModelRecommendation).toBeDefined();
    });
  });
});
