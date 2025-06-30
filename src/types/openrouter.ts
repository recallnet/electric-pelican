/**
 * OpenRouter API types
 */

/**
 * Options for fetching models from OpenRouter
 */
export interface FetchOptions {
  /** Filter models by capability */
  capability?: "text" | "images" | "all";

  /** Maximum number of models to return */
  limit?: number;
}

/**
 * Message structure for OpenRouter chat API
 */
export interface OpenRouterMessage {
  /** Role of the message sender */
  role: "user" | "assistant" | "system";

  /** Message content */
  content: string;
}

/**
 * OpenRouter API request structure
 */
export interface OpenRouterRequest {
  /** Model ID to use for generation */
  model: string;

  /** Array of messages in the conversation */
  messages: OpenRouterMessage[];

  /** Maximum number of tokens to generate */
  max_tokens?: number;

  /** Temperature for controlling randomness (0-1) */
  temperature?: number;
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterResponse {
  /** Generated choices */
  choices: {
    /** Message containing the generated content */
    message: {
      /** Generated text */
      content: string;

      /** Role of the message (usually 'assistant') */
      role: string;
    };
    /** Index of the choice */
    index: number;
    /** Reason for finishing */
    finish_reason: string;
  }[];

  /** Model usage information */
  usage?: {
    /** Number of prompt tokens */
    prompt_tokens: number;
    /** Number of completion tokens */
    completion_tokens: number;
    /** Total tokens used */
    total_tokens: number;
  };

  /** ID of the completion */
  id: string;

  /** Type of object */
  object: string;

  /** Timestamp of creation */
  created: number;

  /** Model used for generation */
  model: string;
}
