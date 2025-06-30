import type { ChatRequest, EnhancedPromptMetadata } from "@/types/prompts";

import { formatTagsForPrompt, suggestTagsFromPrompt, validateTagNames } from "./tag-validation";

/**
 * Generate a short title and capability tags for an input prompt using GPT-4o-mini.
 * Now supports hierarchical tagging with fallback to legacy free-text tags.
 * Takes both the challenge prompt and judging criteria to create more accurate metadata.
 *
 * In CI / test environments or when no `OPENROUTER_API_KEY` is present, the function
 * returns `null` to avoid external network calls.
 *
 * @param challengePrompt The full challenge prompt entered by the user.
 * @param judgePrompt Optional judging instructions that specify evaluation criteria.
 * @returns Enhanced metadata object with both hierarchical and legacy tags, or `null` if generation was skipped/failed.
 */
export async function generatePromptMetadata(
  challengePrompt: string,
  judgePrompt?: string,
): Promise<EnhancedPromptMetadata | null> {
  // Skip remote call when the API key is missing or in tests
  if (!process.env.OPENROUTER_API_KEY || process.env.NODE_ENV === "test") {
    // Provide fallback suggestions in test/dev environments
    return generateFallbackMetadata(challengePrompt);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000); // 25 s safety timeout

  // Build JSON-schema instructions for structured output with hierarchical tags
  const responseFormat = {
    type: "json_schema" as const,
    json_schema: {
      name: "prompt_metadata",
      strict: true,
      schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A concise 3-6 word title for the prompt",
          },
          capabilities: {
            type: "array",
            description: "1-3 AI capability tags that best describe what skills this prompt tests",
            items: {
              type: "string",
              description: "Capability name from the provided taxonomy (exact match required)",
            },
            minItems: 1,
            maxItems: 3,
          },
        },
        required: ["title", "capabilities"],
        additionalProperties: false,
      },
    },
  } as const;

  // Build the analysis prompt including judging criteria if available
  let analysisPrompt = `Analyze this prompt and generate tournament metadata:

CHALLENGE PROMPT:
${challengePrompt}`;

  if (judgePrompt && judgePrompt.trim()) {
    analysisPrompt += `

JUDGING CRITERIA:
${judgePrompt}

Consider how the judging criteria influence what skills and capabilities are being tested. The metadata should reflect not just what the prompt asks for, but what will actually be evaluated.`;
  }

  // Add the hierarchical tag taxonomy to the prompt
  const taxonomyPrompt = formatTagsForPrompt(); // Include ALL leaf tags from taxonomy
  analysisPrompt += `

${taxonomyPrompt}

Select 1-3 capability tags that most precisely describe the AI skills being tested. Use the exact capability names from the list above.`;

  const body: ChatRequest = {
    model: "openai/gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `You are creating metadata for an AI model tournament using a structured capability taxonomy.

Your task is to:
1. Write a catchy, descriptive title (3–6 words) that would make someone want to participate
2. Select 1-3 capability tags from the provided taxonomy that precisely capture what AI skills this prompt tests

The capability tags must be exact matches from the provided list. Focus on the core capabilities being evaluated:
- What must the model understand? (e.g., Scene Understanding, Semantic Understanding)
- What must the model produce? (e.g., Creative Writing, Algorithm Implementation, Structured Output)
- What reasoning is required? (e.g., Logical Reasoning, Causal Reasoning, Analogical Reasoning)
- What knowledge is needed? (e.g., Scientific Knowledge, Technical Specialization)

Analyze what the model must do well to succeed at both the prompt AND the judging criteria. Be precise like a benchmark designer.`,
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ],
    response_format: responseFormat,
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("OpenRouter metadata generation failed", await res.text());
      return generateFallbackMetadata(challengePrompt);
    }

    // The OpenRouter response includes the model's JSON inside `choices[0].message.content`.
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };

    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return generateFallbackMetadata(challengePrompt);
    }

    // Parse the JSON payload guardedly.
    let parsed: { title: string; capabilities: string[] } | null = null;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return generateFallbackMetadata(challengePrompt);
    }

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.capabilities) ||
      parsed.capabilities.length === 0
    ) {
      return generateFallbackMetadata(challengePrompt);
    }

    // Validate the AI-generated capability names against our taxonomy
    const validation = validateTagNames(parsed.capabilities);

    if (!validation.success) {
      console.warn("AI generated invalid capability tags:", validation.invalidTags);
      return generateFallbackMetadata(challengePrompt);
    }

    // Always dual-write: return both hierarchical and legacy formats
    return {
      title: parsed.title,
      tagIds: validation.validTags,
      tags: validation.validTags, // Legacy format uses the same values for now
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.warn("OpenRouter metadata generation timed out");
      return generateFallbackMetadata(challengePrompt);
    }

    console.error("Prompt metadata generation error", err);
    return generateFallbackMetadata(challengePrompt);
  }
}

/**
 * Generates fallback metadata using keyword-based tag suggestions
 * @param challengePrompt - The prompt to analyze
 * @returns Basic metadata with suggested tags
 */
export function generateFallbackMetadata(challengePrompt: string): EnhancedPromptMetadata {
  const fallbackTagIds = suggestTagsFromPrompt(challengePrompt, 3);
  const title =
    challengePrompt.length > 30
      ? challengePrompt.slice(0, 30).trim() + "..."
      : challengePrompt.trim();

  // Always dual-write: return both hierarchical and legacy formats
  return {
    title,
    tagIds: fallbackTagIds,
    tags: fallbackTagIds, // Legacy compatibility
  };
}
