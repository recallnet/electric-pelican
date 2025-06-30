/**
 * @file AI prompt analysis logic
 * @description Handles AI-powered prompt analysis and workflow breakdown
 */

import { generateRouterPrompt } from "@/lib/router/router-prompts";
import { validateTagIds } from "@/lib/tag-validation";
import type { ChatRequest } from "@/types/prompts";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Use AI model to analyze prompt and break into workflow steps
 */
export async function analyzePromptWithAI(prompt: string): Promise<{
  workflow: Array<{
    id: string;
    description: string;
    primaryCapability: HierarchicalTagId;
    estimatedTokens: number;
    dependencies: string[];
  }>;
  dominantCapability: HierarchicalTagId;
  estimatedComplexity: "simple" | "moderate" | "complex";
}> {
  // Skip AI analysis in test environment - but still fail cleanly
  if (!process.env.OPENROUTER_API_KEY || process.env.NODE_ENV === "test") {
    throw new Error("OpenRouter API key not available - cannot perform AI analysis");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    // Build the analysis prompt with real taxonomy
    const analysisPrompt = generateRouterPrompt(prompt);

    const body: ChatRequest = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a workflow analyzer that breaks prompts into capability-tagged steps. Be precise and use only the provided capability names. Most prompts are simple (1-2 steps).",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "workflow_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              workflow: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    capabilities: { type: "array", items: { type: "string" } },
                    dependencies: { type: "array", items: { type: "string" } },
                    tokens: { type: "number" },
                  },
                  required: ["description", "capabilities", "dependencies", "tokens"],
                  additionalProperties: false,
                },
              },
              dominantCapability: { type: "string" },
              complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
            },
            required: ["workflow", "dominantCapability", "complexity"],
            additionalProperties: false,
          },
        },
      },
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter workflow analysis failed", errorText);
      throw new Error(`OpenRouter API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenRouter API");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", content);
      throw new Error("Invalid JSON response from OpenRouter API");
    }

    // Validate that all capabilities are real
    const allCapabilities = [
      parsed.dominantCapability,
      ...parsed.workflow.flatMap((step: any) => step.capabilities),
    ];

    const validation = validateTagIds(allCapabilities);
    if (!validation.success) {
      console.error("AI returned invalid capabilities:", validation.invalidTags);
      throw new Error(`AI returned invalid capability tags: ${validation.invalidTags.join(", ")}`);
    }

    return {
      workflow: parsed.workflow.map((step: any, index: number) => ({
        id: `step-${index + 1}`,
        description: step.description,
        primaryCapability: step.capabilities[0] as HierarchicalTagId, // Use first capability as primary
        estimatedTokens: step.tokens,
        dependencies: step.dependencies,
      })),
      dominantCapability: parsed.dominantCapability as HierarchicalTagId,
      estimatedComplexity: parsed.complexity,
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error("AI workflow analysis failed:", error);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI workflow analysis timed out after 25 seconds");
    }

    // Re-throw the error instead of masking it with fallback
    throw error;
  }
}
