/**
 * @file Model type definitions.
 * @description Contains type definitions for AI models from OpenRouter and their
 * processed representations used in the application.
 */

/**
 * Raw model data from OpenRouter API.
 * @interface
 * @description Represents a model as returned by the OpenRouter API.
 * Contains all metadata about a model's capabilities, pricing, and limitations.
 * @example
 * ```ts
 * const model: OpenRouterModel = {
 *   id: "openai/gpt-4",
 *   name: "GPT-4",
 *   description: "Most capable GPT-4 model...",
 *   created: 1683836400,
 *   context_length: 8192,
 *   architecture: {
 *     modality: "text",
 *     input_modalities: ["text"],
 *     output_modalities: ["text"]
 *   }
 * };
 * ```
 */
export interface OpenRouterModel {
  /** Unique model identifier (e.g., "openai/gpt-4") */
  id: string;
  /** Alternative identifier for the model */
  canonical_slug?: string;
  /** Associated Hugging Face model ID if applicable */
  hugging_face_id?: string;
  /** Human-readable model name */
  name: string;
  /** Detailed model description */
  description: string;
  /** Creation timestamp (Unix seconds) */
  created: number;
  /** Maximum context length in tokens */
  context_length: number;
  /** Model architecture details */
  architecture: {
    /** Primary modality (e.g., "text", "multimodal") */
    modality: string;
    /** Supported input types */
    input_modalities: string[];
    /** Supported output types */
    output_modalities: string[];
    /** Tokenizer information if available */
    tokenizer?: string;
    /** Instruction format type */
    instruct_type?: string | null;
  };
  /** Per-unit pricing information */
  pricing?: {
    /** Cost per prompt token */
    prompt: string;
    /** Cost per completion token */
    completion: string;
    /** Cost per API request */
    request: string;
    /** Cost per image */
    image: string;
    /** Cost per web search */
    web_search: string;
    /** Cost per internal reasoning step */
    internal_reasoning: string;
  };
  /** Provider-specific limitations */
  top_provider?: {
    /** Maximum context length from provider */
    context_length: number;
    /** Maximum tokens in completion */
    max_completion_tokens: number;
    /** Whether content moderation is applied */
    is_moderated: boolean;
  };
  /** Additional request limitations */
  per_request_limits?: {
    /** Maximum tokens per request */
    tokens?: number;
    /** Maximum concurrent requests */
    concurrent?: number;
    /** Maximum requests per minute */
    requests_per_minute?: number;
    /** Maximum tokens per minute */
    tokens_per_minute?: number;
  };
  /** Supported API parameters */
  supported_parameters?: string[];
  /** Legacy: Total tokens processed */
  tokens_served?: number;
  /** Legacy: Model capabilities */
  capabilities?: string[];
  /** Legacy: Input modalities */
  input_modalities?: string[];
  /** Legacy: Output modalities */
  output_modalities?: string[];
}

/**
 * Processed model data for application use.
 * @interface
 * @description A simplified and normalized representation of a model
 * used throughout the application. This format standardizes the model
 * metadata and adds application-specific fields.
 * @example
 * ```ts
 * const model: ProcessedModel = {
 *   id: "openai/gpt-4",
 *   name: "GPT-4",
 *   description: "Advanced language model",
 *   provider: "openai",
 *   rank: 1,
 *   tokens_served: 1000000,
 *   isNew: false,
 *   capabilities: ["text"],
 *   input_modalities: ["text"],
 *   output_modalities: ["text"],
 *   context_length: 8192,
 *   created: 1683836400
 * };
 * ```
 */
export interface ProcessedModel {
  /** Unique model identifier */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Model description */
  description: string;
  /** Provider name (e.g., "openai", "anthropic") */
  provider: string;
  /** Model ranking for display */
  rank: number;
  /** Total tokens processed */
  tokens_served: number;
  /** Whether this is a newly added model */
  isNew: boolean;
  /** Model capabilities (e.g., ["text", "code"]) */
  capabilities: string[];
  /** Supported input types */
  input_modalities: string[];
  /** Supported output types */
  output_modalities: string[];
  /** Maximum context length in tokens */
  context_length: number;
  /** Creation timestamp (Unix seconds) */
  created: number;
}

/**
 * Response from the models API endpoint.
 * @interface
 * @description Contains a list of processed models along with
 * caching metadata. Used by the frontend to display available models.
 * @example
 * ```ts
 * const response: ModelsResponse = {
 *   models: [
 *     { id: "gpt-4", name: "GPT-4", ... },
 *     { id: "claude-2", name: "Claude 2", ... }
 *   ],
 *   cached: true,
 *   timestamp: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export interface ModelsResponse {
  /** List of available models */
  models: ProcessedModel[];
  /** Whether this response was served from cache */
  cached: boolean;
  /** When this data was last updated */
  timestamp: string;
}

/**
 * Model rating data from the leaderboard API
 * @interface
 * @description Contains rating information for a model from the leaderboard,
 * including ELO score, wins, losses, and ranking.
 */
export interface ModelRating {
  /** Unique identifier of the model */
  modelId: string;
  /** Global ELO score */
  globalScore: number;
  /** Number of matches played */
  matchesPlayed: number;
  /** Number of wins */
  wins: number;
  /** Number of losses */
  losses: number;
  /** Win percentage (0-100) */
  winRate: number;
  /** Leaderboard position */
  rank: number;
  /** Date of last activity */
  lastActive?: string;
}
