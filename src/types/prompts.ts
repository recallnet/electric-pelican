/**
 * Types related to prompt handling and metadata
 */

import type { HierarchicalTagId } from "./taxonomy";

/**
 * Chat request structure for prompt-based operations
 */
export type ChatRequest = {
  /** Model identifier to use for generation */
  model: string;

  /** Array of messages in the conversation */
  messages: { role: "user" | "system" | "assistant"; content: string }[];

  /** Response format specification */
  response_format: unknown;
};

/**
 * Response shape for prompt metadata generation
 */
export interface PromptMetadata {
  /** A short 3–6 word title summarizing the prompt */
  title: string;

  /** Exactly five short tags describing challenges posed by the prompt */
  tags: string[];
}

/**
 * Enhanced metadata structure with hierarchical tags
 */
export interface EnhancedPromptMetadata extends PromptMetadata {
  /** Validated hierarchical tag IDs */
  tagIds?: HierarchicalTagId[];
}
