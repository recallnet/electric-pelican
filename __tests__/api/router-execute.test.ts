/**
 * @file Tests for Router Execute API endpoint
 * @description Tests for POST /api/router/execute
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/router/execute/route";
import type { ExecutionRequest, OptimizedWorkflowStep, ModelRecommendation } from "@/types/router";

// Mock the execution engine with the correct path
jest.mock("@/lib/router/execution/engine", () => ({
  executeParallelWorkflows: jest.fn().mockResolvedValue({
    executionId: "exec_test123",
    status: "started",
    estimatedTime: 3000,
    streamUrl: "/api/router/execution/exec_test123/stream",
  }),
}));

describe("/api/router/execute", () => {
  const createMockModel = (
    modelId: string = "anthropic/claude-3-5-sonnet",
  ): ModelRecommendation => ({
    modelId,
    modelName: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    eloScore: 1400,
    reasoning: "Best for creative writing",
    selectedForCapability: "creative-writing",
    selectedForCapabilityName: "Creative Writing",
  });

  const createMockWorkflowStep = (
    id: string,
    dependencies: string[] = [],
  ): OptimizedWorkflowStep => ({
    id,
    description: `Step ${id} task`,
    requiredCapabilities: ["creative-writing"],
    primaryCapability: "creative-writing",
    selectedModel: createMockModel(),
    dependencies,
    estimatedTokens: 150,
    priority: 1,
  });

  const createValidRequest = (): ExecutionRequest => ({
    prompt: "Write a haiku about coding",
    workflow: [createMockWorkflowStep("step-1")],
    singleModelRecommendation: createMockModel(),
    options: {
      includeIntermediateResults: true,
      maxRetries: 2,
      timeout: 5000,
    },
  });

  const createNextRequest = (body: any): NextRequest => {
    return new NextRequest("http://localhost:3001/api/router/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Valid Requests", () => {
    it("should accept valid execution request", async () => {
      const validRequest = createValidRequest();
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.executionId).toBe("exec_test123");
      expect(responseData.data.status).toBe("started");
    });

    it("should accept request without options", async () => {
      const validRequest = createValidRequest();
      delete validRequest.options;
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it("should accept multi-step workflow", async () => {
      const validRequest = createValidRequest();
      validRequest.workflow = [
        createMockWorkflowStep("step-1"),
        createMockWorkflowStep("step-2", ["step-1"]),
      ];
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });

  describe("Request Validation", () => {
    it("should reject empty prompt", async () => {
      const invalidRequest = createValidRequest();
      invalidRequest.prompt = "";
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Invalid request format");
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["prompt"],
            message: "Prompt is required",
          }),
        ]),
      );
    });

    it("should reject missing prompt", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest as any).prompt;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["prompt"],
            message: "Required",
          }),
        ]),
      );
    });

    it("should reject empty workflow", async () => {
      const invalidRequest = createValidRequest();
      invalidRequest.workflow = [];
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["workflow"],
            message: "Workflow must contain at least one step",
          }),
        ]),
      );
    });

    it("should reject missing requiredCapabilities", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest.workflow[0] as any).requiredCapabilities;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["workflow", 0, "requiredCapabilities"],
            message: "Required",
          }),
        ]),
      );
    });

    it("should reject missing primaryCapability", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest.workflow[0] as any).primaryCapability;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["workflow", 0, "primaryCapability"],
            message: "Required",
          }),
        ]),
      );
    });

    it("should reject missing priority", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest.workflow[0] as any).priority;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["workflow", 0, "priority"],
            message: "Required",
          }),
        ]),
      );
    });

    it("should reject missing model eloScore", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest.workflow[0]!.selectedModel as any).eloScore;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["workflow", 0, "selectedModel", "eloScore"],
            message: "Required",
          }),
        ]),
      );
    });

    it("should reject missing singleModelRecommendation", async () => {
      const invalidRequest = createValidRequest();
      delete (invalidRequest as any).singleModelRecommendation;
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["singleModelRecommendation"],
            message: "Required",
          }),
        ]),
      );
    });
  });

  describe("Model Validation", () => {
    it("should accept model with all required fields", async () => {
      const validRequest = createValidRequest();
      validRequest.singleModelRecommendation = {
        modelId: "anthropic/claude-3-5-sonnet",
        modelName: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        eloScore: 1400,
        reasoning: "Best overall model",
        selectedForCapability: "creative-writing",
        selectedForCapabilityName: "Creative Writing",
        dominantCapability: "creative-writing",
      };
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it("should accept model without optional fields", async () => {
      const validRequest = createValidRequest();
      validRequest.singleModelRecommendation = {
        modelId: "anthropic/claude-3-5-sonnet",
        modelName: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        eloScore: 1400,
        reasoning: "Best overall model",
      };
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });

  describe("Options Validation", () => {
    it("should accept valid options", async () => {
      const validRequest = createValidRequest();
      validRequest.options = {
        includeIntermediateResults: false,
        maxRetries: 3,
        timeout: 10000,
        maxConcurrentSteps: 2,
      };
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it("should reject negative maxRetries", async () => {
      const invalidRequest = createValidRequest();
      invalidRequest.options = { maxRetries: -1 };
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
    });

    it("should reject invalid timeout", async () => {
      const invalidRequest = createValidRequest();
      invalidRequest.options = { timeout: 500 }; // Less than 1000ms minimum
      const request = createNextRequest(invalidRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3001/api/router/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Failed to start execution");
    });
  });

  describe("Response Format", () => {
    it("should return correct response format", async () => {
      const validRequest = createValidRequest();
      const request = createNextRequest(validRequest);

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData).toEqual({
        success: true,
        data: {
          executionId: expect.stringMatching(/^exec_/),
          status: "started",
          estimatedTime: expect.any(Number),
          streamUrl: expect.stringContaining("/api/router/execution/"),
        },
      });
    });
  });
});
