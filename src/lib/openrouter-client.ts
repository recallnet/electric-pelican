import { OpenRouterRequest, OpenRouterResponse } from "@/types/openrouter";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Call OpenRouter chat completions API with authentication.
 * Throws on network errors or non-200 responses.
 */
export async function callOpenRouter(request: OpenRouterRequest): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable not set");
  }

  console.log(`Making OpenRouter API call for model: ${request.model}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": "Savant",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenRouter API error for ${request.model} (${response.status}):`, errorText);
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  console.log(`OpenRouter API success for model: ${request.model}`);
  return response.json();
}
