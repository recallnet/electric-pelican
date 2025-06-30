import { callOpenRouter } from "./openrouter-client";

const JUDGE_PROMPT_MODEL = "anthropic/claude-3-sonnet";

/**
 * Generate a judge prompt using OpenRouter API based on a challenge prompt.
 * Returns structured instructions for an AI judge to evaluate responses.
 */
export async function generateJudgePrompt(challengePrompt: string): Promise<string> {
  if (!challengePrompt.trim()) {
    throw new Error("Challenge prompt cannot be empty");
  }

  const metaPrompt = `Given this challenge prompt: "${challengePrompt}"

Generate clear, concise instructions for an AI judge to evaluate and compare two responses to this prompt. The instructions should:
1. Specify 2-3 key criteria for evaluation (e.g., accuracy, clarity, completeness)
2. Ask the judge to explain their reasoning
3. Ask the judge to declare a clear winner (Answer A or Answer B)
4. Be under 200 words

Return only the judge instructions, nothing else.`;

  const response = await callOpenRouter({
    model: JUDGE_PROMPT_MODEL,
    messages: [
      {
        role: "user",
        content: metaPrompt,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const judgePrompt = response.choices[0]?.message?.content?.trim();
  if (!judgePrompt) {
    throw new Error("OpenRouter returned empty response");
  }

  return judgePrompt;
}
