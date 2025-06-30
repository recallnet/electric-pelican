import { NextRequest, NextResponse } from "next/server";

import {
  getLeastMeasuredCapabilities,
  getUnmeasuredCapabilities,
} from "@/lib/capability-analytics";
import { getTagInfo } from "@/lib/tag-taxonomy";

export const runtime = "nodejs";

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Generate creative challenge and judge pairs for AI model tournaments
 * Enhanced to prioritize least-measured capabilities for better coverage
 */
export async function POST(_request: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("[challenge-generator] Missing OPENROUTER_API_KEY");
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }

    // Get least-measured capabilities to target
    const leastMeasured = await getLeastMeasuredCapabilities(3);
    const unmeasured = await getUnmeasuredCapabilities();

    // Prefer completely unmeasured capabilities if available, but randomize selection
    const targetCapabilities =
      unmeasured.length >= 3
        ? shuffleArray(unmeasured)
            .slice(0, 3)
            .map((tagId) => {
              const tagInfo = getTagInfo(tagId);
              return {
                tagId,
                tagName: tagInfo?.name || tagId,
                tagDescription: tagInfo?.description || "",
                avgMatchesPerModel: 0,
                totalModels: 0,
                totalMatches: 0,
              };
            })
        : leastMeasured;

    const capabilityContext = targetCapabilities
      .map(
        (cap) =>
          `- ${cap.tagName}: ${cap.tagDescription} (${cap.avgMatchesPerModel} avg matches/model)`,
      )
      .join("\n");

    const enhancedPrompt = `You are creating challenges for a head-to-head AI model tournament. Your goal is to create a challenge that tests one of these UNDER-EVALUATED capabilities:

${capabilityContext}

Choose any of these capabilities (at least one) to focus on and create a challenge that specifically tests it without stating the capability name. The challenge should be:

A statement — a short request that two freelancers will respond to. It should be expressive, varied, and text-based, while clearly testing the chosen capability.

The models will be judged according to this judgement statement: "Compare these two responses and determine which one better answers the challenge prompt".

Constraints:

All responses from the freelancers must be text-based only (e.g., plain text, code, SVG, markdown). We definitely encourage statements that will require SVG generation, math, code, logic, and legal issues.

Be intellectually rich and don't talk down, everyone here is well read and deeply intelligent. The prompt should invite solutions, not feel like a test.

No board game design challenges.

Examples of capability-focused challenges:

For "Algorithm Implementation": Write Python code to solve the traveling salesman problem for 5 cities using dynamic programming
For "Artistic Creation": Generate an SVG of a pelican riding a bicycle with an impressionist art style
For "Legal Reasoning": Analyze the potential legal implications of AI-generated art in copyright law
For "Financial Markets": Explain how a sudden crypto market crash would affect traditional banking liquidity
For "Scene Understanding": Describe what safety concerns you would have in this scenario: a child's birthday party in a park during a thunderstorm

Return only the challenge text, nothing else. Make sure the challenge clearly tests the capability you chose.`;

    console.log(
      "[challenge-generator] Targeting capabilities:",
      targetCapabilities.map((c) => `${c.tagName} (${c.avgMatchesPerModel} matches)`).join(", "),
    );

    console.log(
      `[challenge-generator] Selection method: ${unmeasured.length >= 3 ? `randomized from ${unmeasured.length} unmeasured` : `least measured from database`}`,
    );

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": "Savant - Enhanced Challenge Generator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: 0.6, // High creativity for varied challenges
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[challenge-generator] OpenRouter API error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("[challenge-generator] No content in OpenRouter response:", data);
      throw new Error("Empty response from OpenAI");
    }

    console.log(
      "[challenge-generator] Successfully generated capability-focused challenge:",
      content.substring(0, 50) + "...",
    );

    return NextResponse.json({
      challenge: content,
      targetedCapabilities: targetCapabilities.map((c) => ({
        tagId: c.tagId,
        tagName: c.tagName,
        avgMatches: c.avgMatchesPerModel,
      })),
    });
  } catch (error) {
    console.error("[challenge-generator] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET endpoint for convenience - just calls POST
 */
export async function GET(_request: NextRequest) {
  return POST(_request);
}
