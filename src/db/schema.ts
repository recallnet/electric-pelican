/**
 * @file Database schema definitions.
 * @description Defines the database schema using Drizzle ORM, including tables,
 * indexes, and constraints for the application's data model. This schema is designed
 * to support both SQLite (development) and PostgreSQL (production) databases.
 *
 * Key features:
 * - Type-safe schema definitions using Drizzle ORM
 * - Full-text search capabilities
 * - Efficient indexing for common queries
 * - JSON storage for flexible data structures
 */

import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { sql } from "@/db";

/**
 * Raw SQL schema definition.
 * @description Contains the raw SQL commands for creating tables and indexes.
 * Used for initial database setup and migrations. These commands are PostgreSQL
 * compatible and include advanced features like full-text search and JSON storage.
 *
 * @example
 * ```sql
 * -- Example usage of the models table
 * SELECT * FROM models
 * WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('english', 'gpt');
 * ```
 */
export const schema = sql`
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  tokens_served INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  capabilities TEXT[], -- PostgreSQL array
  input_modalities TEXT[], -- Array of input modalities
  output_modalities TEXT[], -- Array of output modalities
  context_length INTEGER DEFAULT 0,
  created INTEGER NOT NULL, -- Unix timestamp in seconds
  last_updated INTEGER NOT NULL, -- When we last updated this record
  raw_data JSONB -- Store the complete raw response for future fields
);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_models_text_search ON models
USING gin(to_tsvector('english', name || ' ' || description || ' ' || provider || ' ' || id));

-- Index for provider searches
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);

-- Index for last_updated to help with cleanup
CREATE INDEX IF NOT EXISTS idx_models_last_updated ON models(last_updated);
`;

/**
 * Models table definition.
 * @description Stores all available models from OpenRouter, updated periodically via cron.
 * Includes model metadata, capabilities, and usage statistics. This table is the central
 * registry of all AI models available for tournaments.
 *
 * Key features:
 * - Unique model identification via OpenRouter IDs
 * - Rich metadata including capabilities and modalities
 * - Usage tracking with token counts
 * - Full-text search on model names and descriptions
 * - Efficient provider-based filtering
 *
 * @example
 * ```ts
 * // Example query using Drizzle ORM
 * const topModels = await db
 *   .select()
 *   .from(models)
 *   .where(eq(models.provider, 'openai'))
 *   .orderBy(desc(models.tokens_served))
 *   .limit(10);
 * ```
 */
export const models = sqliteTable(
  "models",
  {
    /**
     * OpenRouter model ID (e.g., "x-ai/grok-3-beta")
     * @example "openai/gpt-4", "anthropic/claude-2"
     */
    id: text("id").primaryKey(),

    /**
     * Human-readable model name
     * @example "GPT-4", "Claude 2", "Grok-3"
     */
    name: text("name").notNull(),

    /**
     * Model description from the provider
     * @example "GPT-4 is a large multimodal model that can solve difficult problems with greater accuracy"
     */
    description: text("description"),

    /**
     * Provider name extracted from ID
     * @example "openai", "anthropic", "x-ai"
     */
    provider: text("provider").notNull(),

    /**
     * Total tokens processed by this model
     * Used for tracking model usage and popularity
     */
    tokens_served: integer("tokens_served").default(0),

    /**
     * Whether this is a newly added model
     * Used for highlighting new models in the UI
     */
    is_new: integer("is_new", { mode: "boolean" }).default(false),

    /**
     * Array of model capabilities
     * @example ["text", "images", "code"]
     */
    capabilities: text("capabilities", { mode: "json" }).notNull(),

    /**
     * Array of supported input types
     * @example ["text", "image"]
     */
    input_modalities: text("input_modalities", { mode: "json" }).notNull(),

    /**
     * Array of supported output types
     * @example ["text", "json"]
     */
    output_modalities: text("output_modalities", { mode: "json" }).notNull(),

    /**
     * Maximum context length in tokens
     * @example 8192, 32768, 128000
     */
    context_length: integer("context_length").default(0),

    /**
     * Creation timestamp
     * When the model was first added to our system
     */
    created: integer("created", { mode: "timestamp" }).notNull(),

    /**
     * Last update timestamp
     * When we last refreshed the model's metadata
     */
    last_updated: integer("last_updated", { mode: "timestamp" }).notNull(),

    /**
     * Complete raw response from OpenRouter
     * Stored for future field expansion and debugging
     */
    raw_data: text("raw_data", { mode: "json" }),
  },
  (table) => ({
    /**
     * Index for filtering by provider
     * Optimizes queries that filter models by provider
     */
    providerIdx: index("idx_models_provider").on(table.provider),

    /**
     * Full-text search index on key fields
     * Enables efficient text search across model metadata
     */
    searchIdx: index("idx_models_search").on(
      table.name,
      table.description,
      table.provider,
      table.id,
    ),
  }),
);
