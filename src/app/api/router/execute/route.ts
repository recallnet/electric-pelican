/**
 * @file Router execution API endpoint
 * @description POST /api/router/execute - Start parallel execution of workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { executeParallelWorkflows } from "@/lib/router/execution/engine";
import type { ExecutionRequest } from "@/types/router";

// Request validation schema
const ExecutionRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  workflow: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        requiredCapabilities: z.array(z.string()),
        primaryCapability: z.string(),
        selectedModel: z.object({
          modelId: z.string(),
          modelName: z.string(),
          provider: z.string(),
          eloScore: z.number(),
          reasoning: z.string(),
          selectedForCapability: z.string().optional(),
          selectedForCapabilityName: z.string().optional(),
          dominantCapability: z.string().optional(),
        }),
        mergedSteps: z.array(z.string()).optional(),
        dependencies: z.array(z.string()),
        estimatedTokens: z.number(),
        priority: z.number(),
      }),
    )
    .min(1, "Workflow must contain at least one step"),
  singleModelRecommendation: z.object({
    modelId: z.string(),
    modelName: z.string(),
    provider: z.string(),
    eloScore: z.number(),
    reasoning: z.string(),
    selectedForCapability: z.string().optional(),
    selectedForCapabilityName: z.string().optional(),
    dominantCapability: z.string().optional(),
  }),
  options: z
    .object({
      includeIntermediateResults: z.boolean().optional(),
      maxRetries: z.number().min(0).optional(),
      timeout: z.number().min(1000).optional(),
      maxConcurrentSteps: z.number().min(1).optional(),
    })
    .optional(),
});

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/router/execute",
    status: "ready",
    message: "Router execution endpoint ready",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("[ROUTER] Execution API called");

    // Parse and validate request body
    const body = await request.json();
    console.log("[ROUTER] Request body parsed successfully");

    const validationResult = ExecutionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("[ROUTER] Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const executionRequest = validationResult.data as ExecutionRequest;
    console.log(
      `[ROUTER] Valid request for prompt: "${executionRequest.prompt.substring(0, 50)}..."`,
    );

    // Start actual parallel execution
    const executionResult = await executeParallelWorkflows(executionRequest);

    const duration = Date.now() - startTime;
    console.log(`[ROUTER] Execution started in ${duration}ms: ${executionResult.executionId}`);

    return NextResponse.json({
      success: true,
      data: {
        executionId: executionResult.executionId,
        status: "started",
        estimatedTime: executionResult.estimatedTime,
        streamUrl: `/api/router/execution/${executionResult.executionId}/stream`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ROUTER] Execution start failed in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start execution",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
