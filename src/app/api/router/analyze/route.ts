/**
 * @file Unified router API endpoint for complete prompt analysis and model selection.
 * @description Handles POST requests to analyze user prompts, break them into workflow steps,
 * and select optimal models for each step using hierarchical ELO scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { RouterAnalysisResponse } from "@/types/api-router";

import { analyzePromptWithAI } from "./lib/analysis";
import { assignModelsToWorkflow, selectSingleModel } from "./lib/selection";
import { createFallbackResponse } from "./lib/utils";

/**
 * Request validation schema
 */
const analyzeRequestSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(10000, "Prompt is too long"),
});

/**
 * POST /api/router/analyze
 * Complete router analysis: prompt → workflow steps → model selection
 */
export async function POST(request: NextRequest): Promise<NextResponse<RouterAnalysisResponse>> {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          data: createFallbackResponse(body.prompt || "", startTime),
        },
        { status: 400 },
      );
    }

    const { prompt } = validation.data;

    console.log(`[router] Analyzing prompt: ${prompt.substring(0, 100)}...`);

    // Step 1: Use AI to analyze prompt and break into workflow steps
    const workflowAnalysis = await analyzePromptWithAI(prompt);

    // Step 2: For each step, find the best model using hierarchical ELO lookup
    const workflowWithModels = await assignModelsToWorkflow(workflowAnalysis.workflow);

    // Step 3: Determine single best model for the entire prompt
    const singleModelRecommendation = await selectSingleModel(workflowAnalysis.dominantCapability);

    const analysisTime = Date.now() - startTime;

    console.log(
      `[router] Analysis complete in ${analysisTime}ms: ${workflowWithModels.length} steps, dominant: ${workflowAnalysis.dominantCapability}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        originalPrompt: prompt,
        singleModelRecommendation,
        workflow: workflowWithModels,
        analysisTime,
        estimatedComplexity: workflowAnalysis.estimatedComplexity,
      },
    });
  } catch (error) {
    console.error("[router] Complete analysis failed:", error);

    return NextResponse.json(
      {
        success: false,
        data: createFallbackResponse("", startTime),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/router/analyze
 * Return API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: "/api/router/analyze",
    method: "POST",
    description: "Complete router analysis: prompt → workflow steps → model selection",
    parameters: {
      prompt: {
        type: "string",
        required: true,
        minLength: 10,
        maxLength: 10000,
        description: "The user prompt to analyze and route",
      },
    },
    response: {
      success: "boolean",
      data: {
        originalPrompt: "string",
        singleModelRecommendation: "Single best model for the entire prompt",
        workflow: "Array of workflow steps with assigned models",
        analysisTime: "number (milliseconds)",
        estimatedComplexity: "'simple' | 'moderate' | 'complex'",
      },
    },
  });
}
