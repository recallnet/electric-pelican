/**
 * @file Individual matchup judging logic
 * @description Core logic for judging individual tournament matches
 */

import { trackModelFailure, trackModelSuccess } from "../model-failure-tracker";
import { callOpenRouter } from "../openrouter-client";
import { parseWinner, selectFallbackWinner } from "./parser";

/**
 * Call judge model to evaluate a single matchup.
 * Returns the winner and judge explanation.
 * Includes retry logic for intermittent empty responses and failure tracking.
 */
export async function judgeMatchup(
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  modelA: string,
  modelB: string,
  responseA: string,
  responseB: string,
): Promise<{ winner: string; explanation: string }> {
  const judgeInput = `You are judging a tournament between AI models.

Original challenge: "${challengePrompt}"

Judge instructions: "${judgePrompt}"

Answer A (${modelA}):
${responseA}

Answer B (${modelB}):
${responseB}

Based on the judge instructions, explain your reasoning and declare the winner.
End your response with exactly "WINNER: A" or "WINNER: B".`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[judge] Attempt ${attempt}/${maxRetries} for ${modelA} vs ${modelB} using ${judgeModel}`,
      );

      const response = await callOpenRouter({
        model: judgeModel,
        messages: [
          {
            role: "user",
            content: judgeInput,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const judgeResponse = response.choices[0]?.message?.content?.trim();
      if (!judgeResponse) {
        const error = new Error(
          `Empty response from judge model (attempt ${attempt}/${maxRetries})`,
        );
        lastError = error;

        // Track failure for empty responses
        await trackModelFailure(judgeModel, error);

        if (attempt < maxRetries) {
          console.warn(`[judge] ${error.message}, retrying in ${attempt * 1000}ms...`);
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000)); // exponential backoff
          continue;
        }
        throw error;
      }

      // Success! Track it and parse the response
      await trackModelSuccess(judgeModel);

      const parsedWinner = parseWinner(judgeResponse);
      if (!parsedWinner) {
        console.error("Failed to parse winner from judge response:", judgeResponse);
        console.log("Attempting fallback parsing...");

        const fallbackResult = selectFallbackWinner(judgeResponse, modelA, modelB);
        return fallbackResult;
      }

      const actualWinner = parsedWinner === "A" ? modelA : modelB;
      console.log(`[judge] Success on attempt ${attempt}: ${actualWinner} wins`);

      return {
        winner: actualWinner,
        explanation: judgeResponse,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[judge] Attempt ${attempt} failed for ${modelA} vs ${modelB}:`,
        lastError.message,
      );

      // Track judge model failure
      await trackModelFailure(judgeModel, error);

      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // exponential backoff
        console.log(`[judge] Retrying ${judgeModel} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Judge model ${judgeModel} failed after ${maxRetries} attempts: ${lastError?.message}`,
  );
}
