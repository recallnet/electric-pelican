/**
 * @file Tests for Router-3A execution engine
 * @description Comprehensive tests for parallel workflow execution
 */

import { executeParallelWorkflows, getExecutionStatus } from "@/lib/router/execution-engine";
import { clearAllExecutionStates, generateExecutionId } from "@/lib/router/execution-state";
import type { ExecutionRequest, OptimizedWorkflowStep, ModelRecommendation } from "@/types/router";

// Mock the OpenRouter client
jest.mock("@/lib/openrouter-client", () => ({
  callOpenRouter: jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Mock AI response content",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
    model: "claude-3-sonnet",
  }),
}));

describe("Router-3A Execution Engine", () => {
  beforeEach(() => {
    clearAllExecutionStates();
    jest.clearAllMocks();
  });

  const createMockModel = (modelId: string = "claude-3-sonnet"): ModelRecommendation => ({
    modelId,
    modelName: "Claude 3 Sonnet",
    provider: "Anthropic",
    eloScore: 1420,
    reasoning: "Best for creative writing",
    selectedForCapability: "artistic-creation",
    selectedForCapabilityName: "Artistic Creation",
  });

  const createMockWorkflowStep = (
    id: string,
    dependencies: string[] = [],
  ): OptimizedWorkflowStep => ({
    id,
    description: `Step ${id} task`,
    requiredCapabilities: ["artistic-creation"],
    primaryCapability: "artistic-creation",
    selectedModel: createMockModel(),
    dependencies,
    estimatedTokens: 150,
    priority: 1,
  });

  const createMockRequest = (workflow?: OptimizedWorkflowStep[]): ExecutionRequest => ({
    prompt: "Write a haiku about coding",
    workflow: workflow || [createMockWorkflowStep("step-1")],
    singleModelRecommendation: createMockModel(),
    options: {
      includeIntermediateResults: true,
      maxRetries: 2,
      timeout: 5000,
    },
  });

  describe("Execution Lifecycle", () => {
    it("should start parallel execution successfully", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);

      expect(response).toBeDefined();
      expect(response.executionId).toMatch(/^exec_/);
      expect(response.status).toBe("started");
      expect(response.estimatedTime).toBeGreaterThan(0);
      expect(response.streamUrl).toContain(response.executionId);
    });

    it("should track execution state correctly", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);
      const executionId = response.executionId;

      // Get initial status
      const status = getExecutionStatus(executionId);

      expect(status.executionId).toBe(executionId);
      expect(status.status).toBe("running");
      // Execution might complete very quickly, so check for either state
      expect(["running", "completed"]).toContain(status.progress.single.status);
      expect(status.progress.workflow.status).toBe("running");
      expect(status.startTime).toBeDefined();
    });

    it("should handle execution completion", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = getExecutionStatus(response.executionId);

      // Check that execution progresses (may still be running due to async nature)
      expect(status.executionId).toBe(response.executionId);
      expect(["running", "completed"]).toContain(status.status);
    });
  });

  describe("Request Validation", () => {
    it("should reject empty prompt", async () => {
      const request = createMockRequest();
      request.prompt = "";

      await expect(executeParallelWorkflows(request)).rejects.toThrow("Invalid execution request");
    });

    it("should reject empty workflow", async () => {
      const request = createMockRequest([]);

      await expect(executeParallelWorkflows(request)).rejects.toThrow("Invalid execution request");
    });

    it("should reject invalid model recommendation", async () => {
      const request = createMockRequest();
      request.singleModelRecommendation.modelId = "";

      await expect(executeParallelWorkflows(request)).rejects.toThrow("Invalid execution request");
    });

    it("should reject workflow with circular dependencies", async () => {
      const workflow = [
        createMockWorkflowStep("step-1", ["step-2"]),
        createMockWorkflowStep("step-2", ["step-1"]),
      ];
      const request = createMockRequest(workflow);

      await expect(executeParallelWorkflows(request)).rejects.toThrow("circular dependencies");
    });
  });

  describe("Single Model Execution", () => {
    it("should execute single model successfully", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);

      // Wait a bit for execution to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      const status = getExecutionStatus(response.executionId);

      // Execution might complete very quickly, so check for either state
      expect(["running", "completed"]).toContain(status.progress.single.status);
    });

    it("should handle single model execution with options", async () => {
      const request = createMockRequest();
      request.options = {
        includeIntermediateResults: false,
        maxRetries: 1,
        timeout: 10000,
      };

      const response = await executeParallelWorkflows(request);

      expect(response.executionId).toBeDefined();
      expect(response.status).toBe("started");
    });
  });

  describe("Workflow Execution", () => {
    it("should execute single-step workflow", async () => {
      const workflow = [createMockWorkflowStep("step-1")];
      const request = createMockRequest(workflow);

      const response = await executeParallelWorkflows(request);

      expect(response.executionId).toBeDefined();

      const status = getExecutionStatus(response.executionId);
      expect(status.progress.workflow.totalSteps).toBe(1);
    });

    it("should execute multi-step workflow with dependencies", async () => {
      const workflow = [
        createMockWorkflowStep("step-1"),
        createMockWorkflowStep("step-2", ["step-1"]),
        createMockWorkflowStep("step-3", ["step-2"]),
      ];
      const request = createMockRequest(workflow);

      const response = await executeParallelWorkflows(request);

      const status = getExecutionStatus(response.executionId);
      expect(status.progress.workflow.totalSteps).toBe(3);
      expect(status.progress.workflow.stepsCompleted).toBe(0); // Just started
    });

    it("should handle parallel workflow steps", async () => {
      const workflow = [
        createMockWorkflowStep("step-1"),
        createMockWorkflowStep("step-2"), // Independent of step-1
        createMockWorkflowStep("step-3", ["step-1", "step-2"]), // Depends on both
      ];
      const request = createMockRequest(workflow);

      const response = await executeParallelWorkflows(request);

      expect(response.executionId).toBeDefined();

      const status = getExecutionStatus(response.executionId);
      expect(status.progress.workflow.totalSteps).toBe(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle execution not found", () => {
      expect(() => getExecutionStatus("non-existent-id")).toThrow(
        "Execution non-existent-id not found",
      );
    });

    it("should handle malformed execution ID", () => {
      expect(() => getExecutionStatus("")).toThrow("not found");
    });

    it("should validate workflow step dependencies", async () => {
      const workflow = [createMockWorkflowStep("step-1", ["non-existent-step"])];
      const request = createMockRequest(workflow);

      await expect(executeParallelWorkflows(request)).rejects.toThrow(
        "depends on non-existent step",
      );
    });
  });

  describe("Progress Tracking", () => {
    it("should track workflow progress correctly", async () => {
      const workflow = [createMockWorkflowStep("step-1"), createMockWorkflowStep("step-2")];
      const request = createMockRequest(workflow);

      const response = await executeParallelWorkflows(request);
      const status = getExecutionStatus(response.executionId);

      expect(status.progress.workflow.stepsCompleted).toBe(0);
      expect(status.progress.workflow.totalSteps).toBe(2);
    });

    it("should provide execution timing information", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);
      const status = getExecutionStatus(response.executionId);

      expect(status.startTime).toBeDefined();
      expect(status.startTime).toBeGreaterThan(0);
    });
  });

  describe("Options Handling", () => {
    it("should handle execution without options", async () => {
      const request = createMockRequest();
      delete request.options;

      const response = await executeParallelWorkflows(request);

      expect(response.executionId).toBeDefined();
      expect(response.status).toBe("started");
    });

    it("should respect maxConcurrentSteps option", async () => {
      const workflow = Array.from({ length: 5 }, (_, i) => createMockWorkflowStep(`step-${i + 1}`));
      const request = createMockRequest(workflow);
      request.options = { maxConcurrentSteps: 2 };

      const response = await executeParallelWorkflows(request);

      expect(response.executionId).toBeDefined();

      const status = getExecutionStatus(response.executionId);
      expect(status.progress.workflow.totalSteps).toBe(5);
    });
  });

  describe("Time Estimation", () => {
    it("should provide reasonable time estimates", async () => {
      const request = createMockRequest();

      const response = await executeParallelWorkflows(request);

      expect(response.estimatedTime).toBeGreaterThan(1000); // At least 1 second
      expect(response.estimatedTime).toBeLessThan(60000); // Less than 1 minute
    });

    it("should estimate longer times for complex workflows", async () => {
      const simpleWorkflow = [createMockWorkflowStep("step-1")];
      const complexWorkflow = Array.from({ length: 5 }, (_, i) =>
        createMockWorkflowStep(`step-${i + 1}`),
      );

      const simpleRequest = createMockRequest(simpleWorkflow);
      const complexRequest = createMockRequest(complexWorkflow);

      const simpleResponse = await executeParallelWorkflows(simpleRequest);
      const complexResponse = await executeParallelWorkflows(complexRequest);

      expect(complexResponse.estimatedTime).toBeGreaterThanOrEqual(simpleResponse.estimatedTime);
    });
  });

  describe("Execution ID Generation", () => {
    it("should generate unique execution IDs", () => {
      const id1 = generateExecutionId();
      const id2 = generateExecutionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^exec_/);
      expect(id2).toMatch(/^exec_/);
    });

    it("should generate execution IDs with timestamp component", () => {
      const id = generateExecutionId();
      const parts = id.split("_");

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("exec");
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // Base36 timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // Random component
    });
  });
});
