/**
 * @file Main prompt analyzer for the router system.
 * @description Orchestrates the complete prompt analysis process including
 * AI model calls, capability mapping, and workflow generation.
 */

import type { RouterModelResponse, WorkflowAnalysis } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { callOpenRouter } from "../openrouter-client";
import { getDominantCapability, mapCapabilities } from "./capability-mapper";
import { generateFallbackPrompt, generateRouterPrompt, ROUTER_MODEL } from "./router-prompts";
import {
  createFallbackWorkflow,
  determineComplexity,
  generateWorkflowSteps,
  optimizeWorkflow,
  validateWorkflow,
} from "./workflow-generator";

/**
 * Configuration for prompt analysis
 */
export const ROUTER_CONFIG = {
  MAX_STEPS: parseInt(process.env.ROUTER_MAX_STEPS || "8", 10),
  TIMEOUT_MS: 25000, // 25 seconds
  MAX_RETRIES: 2,
};

/**
 * Analyze a user prompt and decompose it into a structured workflow
 * @param prompt - The user prompt to analyze
 * @returns Complete workflow analysis
 */
export async function analyzePrompt(prompt: string): Promise<WorkflowAnalysis> {
  const startTime = Date.now();

  // Validate input
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  if (prompt.length > 10000) {
    throw new Error("Prompt is too long (max 10,000 characters)");
  }

  try {
    // Try main analysis with router model
    const routerResponse = await callRouterModel(prompt);
    const workflow = generateWorkflowSteps(routerResponse, prompt);
    const optimizedWorkflow = optimizeWorkflow(workflow);

    // Validate the generated workflow
    const validation = validateWorkflow(optimizedWorkflow);
    if (!validation.isValid) {
      console.warn("Generated workflow is invalid:", validation.errors);
      return createFallbackAnalysis(prompt, startTime);
    }

    // Determine dominant capability from all steps
    const allCapabilities = optimizedWorkflow.flatMap((step) => step.requiredCapabilities);
    const dominantCapability = getDominantCapability(allCapabilities, prompt);

    const analysisTime = Date.now() - startTime;

    return {
      originalPrompt: prompt,
      workflow: optimizedWorkflow,
      dominantCapability,
      estimatedComplexity: determineComplexity(optimizedWorkflow),
      analysisTime,
    };
  } catch (error) {
    console.error("Router analysis failed:", error);
    return createFallbackAnalysis(prompt, startTime);
  }
}

/**
 * Call the router model to analyze the prompt
 */
async function callRouterModel(prompt: string): Promise<RouterModelResponse> {
  const routerPrompt = generateRouterPrompt(prompt);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTER_CONFIG.TIMEOUT_MS);

  try {
    const response = await callOpenRouter({
      model: ROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: routerPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty response from router model");
    }

    // Parse JSON response
    let parsed: RouterModelResponse;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse router response:", content);
      throw new Error("Invalid JSON response from router model");
    }

    // Validate response structure
    if (!parsed.workflow || !Array.isArray(parsed.workflow) || parsed.workflow.length === 0) {
      throw new Error("Router model returned invalid workflow structure");
    }

    // Limit to max steps
    if (parsed.workflow.length > ROUTER_CONFIG.MAX_STEPS) {
      console.warn(
        `Workflow has ${parsed.workflow.length} steps, limiting to ${ROUTER_CONFIG.MAX_STEPS}`,
      );
      parsed.workflow = parsed.workflow.slice(0, ROUTER_CONFIG.MAX_STEPS);
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Router analysis timed out");
    }

    throw error;
  }
}

/**
 * Create a fallback analysis when main analysis fails
 */
function createFallbackAnalysis(prompt: string, startTime: number): WorkflowAnalysis {
  console.warn("Using fallback analysis for prompt");

  // Use capability mapping to determine the dominant capability
  const capabilities = mapCapabilities(prompt);
  const dominantCapability = getDominantCapability(capabilities, prompt);

  // Create simple single-step workflow
  const fallbackWorkflow = createFallbackWorkflow(prompt, dominantCapability);

  return {
    originalPrompt: prompt,
    workflow: fallbackWorkflow,
    dominantCapability,
    estimatedComplexity: "simple",
    analysisTime: Date.now() - startTime,
  };
}

/**
 * Get a simple capability analysis for very basic prompts
 * @param prompt - The user prompt
 * @returns Primary capability required
 */
export async function getSimpleCapability(prompt: string): Promise<HierarchicalTagId> {
  // For simple analysis, try the fallback prompt first
  try {
    const fallbackPrompt = generateFallbackPrompt(prompt);

    const response = await callOpenRouter({
      model: ROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: fallbackPrompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const capability = response.choices[0]?.message?.content?.trim();

    // Validate that it's a known capability
    if (capability && isValidCapability(capability)) {
      return capability as HierarchicalTagId;
    }
  } catch (error) {
    console.warn("Fallback capability analysis failed:", error);
  }

  // Final fallback: use local capability mapping
  const capabilities = mapCapabilities(prompt);
  return getDominantCapability(capabilities, prompt);
}

/**
 * Check if a string is a valid capability ID
 */
function isValidCapability(capability: string): boolean {
  const validCapabilities = [
    "creative-writing",
    "algorithm-implementation",
    "formal-writing",
    "logical-reasoning",
    "semantic-understanding",
    "technical-documentation",
  ];

  return validCapabilities.includes(capability);
}

/**
 * Validate prompt before analysis
 * @param prompt - The prompt to validate
 * @returns Validation result
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  error?: string;
} {
  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "Prompt must be a non-empty string" };
  }

  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: "Prompt cannot be empty" };
  }

  if (trimmed.length < 10) {
    return { isValid: false, error: "Prompt must be at least 10 characters long" };
  }

  if (trimmed.length > 10000) {
    return { isValid: false, error: "Prompt is too long (max 10,000 characters)" };
  }

  return { isValid: true };
}

/**
 * Get analysis statistics for monitoring
 * @param analysis - The workflow analysis
 * @returns Analysis statistics
 */
export function getAnalysisStats(analysis: WorkflowAnalysis) {
  return {
    stepCount: analysis.workflow.length,
    totalTokens: analysis.workflow.reduce((sum, step) => sum + step.estimatedTokens, 0),
    totalDependencies: analysis.workflow.reduce((sum, step) => sum + step.dependencies.length, 0),
    uniqueCapabilities: new Set(analysis.workflow.flatMap((step) => step.requiredCapabilities))
      .size,
    complexity: analysis.estimatedComplexity,
    analysisTime: analysis.analysisTime,
  };
}
