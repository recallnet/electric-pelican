// Centralized app-wide defaults for prompts, models, and judges

/**
 * The default prompt shown to users when starting a new tournament.
 */
export const DEFAULT_PROMPT = "Generate an SVG of a pelican riding a bicycle";

/**
 * The default contestant model IDs to pre-select for tournaments.
 * These are used as fallbacks when random selection is not available.
 */
export const DEFAULT_CONTESTANT_MODELS = [
  "deepseek/deepseek-chat-v3-0324",
  "qwen/qwen3-30b-a3b",
  "mistralai/mistral-medium-3",
  "microsoft/phi-4-reasoning-plus:free",
];

/**
 * The default judge model ID to use for tournaments.
 */
export const DEFAULT_JUDGE_MODEL = "openai/gpt-4.1-mini";

/**
 * Full model data for the default judge to ensure correct display even if not in initial API fetch.
 */
export const DEFAULT_JUDGE_MODEL_DATA = {
  id: "openai/gpt-4.1-mini",
  name: "GPT-4.1 Mini",
  provider: "OpenAI",
  family: "GPT",
  contextWindow: 128000,
  capabilities: ["text"],
  pricing: { input: 0.15, output: 0.6 },
  hidden: false,
  description: "A compact and efficient model by OpenAI for various text tasks.",
  rank: 0,
  tokens_served: 0,
  isNew: false,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalRequests: 0,
  input_modalities: ["text"],
  output_modalities: ["text"],
  context_length: 128000,
  created: 0,
};

/**
 * The default judging instructions for AI judges to evaluate model responses.
 */
export const DEFAULT_JUDGE_PROMPT =
  "Compare these two responses and determine which one better answers the challenge prompt.";
