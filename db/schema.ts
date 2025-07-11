export const runtime = "nodejs";

import {
  pgTable,
  text,
  integer,
  index,
  timestamp,
  boolean,
  jsonb,
  varchar,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users table stores basic user data synchronized via Privy authentication.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Privy User ID – primary key
  privyId: text("privy_id").notNull().unique(), // Privy's internal user ID
  email: text("email"), // Nullable – email may be absent for wallet-only users
  name: text("name"), // Display name pulled from Privy profile
  // Enhanced profile data fields
  displayName: text("display_name"), // Processed display name (GitHub name, Google name, or derived from email)
  avatarUrl: text("avatar_url"), // Avatar URL (GitHub direct, or generated for others)
  provider: text("provider"), // 'email', 'google', 'github'
  providerUsername: text("provider_username"), // email username, github username, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Admins table stores admin users by email address.
 */
export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Models table stores all available models from OpenRouter.
 * Updated periodically via a cron job.
 */
export const models = pgTable(
  "models",
  {
    id: text("id").primaryKey(), // OpenRouter model ID (e.g., "x-ai/grok-3-beta")
    name: text("name").notNull(),
    description: text("description"),
    provider: text("provider").notNull(), // Extracted from ID (e.g., "x-ai")
    tokens_served: integer("tokens_served").default(0),
    is_new: boolean("is_new").default(false),
    capabilities: jsonb("capabilities").notNull(), // string[]
    input_modalities: jsonb("input_modalities").notNull(), // string[]
    output_modalities: jsonb("output_modalities").notNull(), // string[]
    context_length: integer("context_length").default(0),
    created: timestamp("created").notNull(),
    last_updated: timestamp("last_updated").notNull(),
    raw_data: jsonb("raw_data"), // Store complete raw response

    // Availability tracking fields for reactive failure handling
    is_available: boolean("is_available").default(true).notNull(),
    failure_count: integer("failure_count").default(0).notNull(),
    last_failure_at: timestamp("last_failure_at"),
    unavailable_reason: text("unavailable_reason"),
    marked_unavailable_at: timestamp("marked_unavailable_at"),

    // ELO scoring fields (migrated from modelScores table)
    eloScore: integer("elo_score").notNull().default(1200),
    matchesPlayed: integer("matches_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
  },
  (table) => ({
    providerIdx: index("idx_models_provider").on(table.provider),
    // Create a search index on name, description, provider, and id
    searchIdx: index("idx_models_search").on(
      table.name,
      table.description,
      table.provider,
      table.id,
    ),
    // Index for filtering available models efficiently
    availableIdx: index("idx_models_available").on(table.is_available),
    // Index for failure tracking queries
    failuresIdx: index("idx_models_failures").on(table.failure_count, table.last_failure_at),
    // Index for ELO scores
    eloIdx: index("idx_models_elo").on(table.eloScore),
  }),
);

/**
 * Tournaments table defines the configuration for a prompt tournament.
 */
export const tournaments: any = pgTable("tournaments", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(), // SEO-friendly identifier
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  judgePrompt: text("judge_prompt").notNull(),
  models: jsonb("models").notNull(), // string[] – OpenRouter model IDs
  judgeModel: text("judge_model").notNull(),
  // Legacy: metadata tags describing the prompt challenges, stored as JSON string array
  tags: jsonb("tags"), // string[] | null - LEGACY free-text tags
  // NEW: Hierarchical capability tags stored as leaf IDs
  tagIds: jsonb("tag_ids"), // HierarchicalTagId[] | null - structured capability tags
  bracketSize: integer("bracket_size").notNull(), // 4, 8 or 16
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  parentId: text("parent_id").references(() => tournaments.id), // For forks/versioning
  forkCount: integer("fork_count").default(0),
  version: integer("version").default(1),
  originalId: text("original_id").references(() => tournaments.id),
});

/**
 * TournamentRuns table stores execution results for each run of a tournament.
 */
export const tournamentRuns = pgTable("tournament_runs", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .references(() => tournaments.id)
    .notNull(),
  version: integer("version").default(1),
  status: varchar("status", { length: 20 }).default("running"),
  bracketData: jsonb("bracket_data").notNull(), // Serialized bracket info
  winnerModel: text("winner_model"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  // New: retry tracking for background jobs
  retryCount: integer("retry_count").default(0),
  failureReason: text("failure_reason"),
});

/**
 * Forks table maps parent-child relationships between tournaments.
 */
export const forks = pgTable("forks", {
  id: text("id").primaryKey(),
  parentTournamentId: text("parent_tournament_id")
    .references(() => tournaments.id)
    .notNull(),
  childTournamentId: text("child_tournament_id")
    .references(() => tournaments.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Tournament upvotes table tracks user likes for tournaments.
 * Each user can only upvote a tournament once.
 */
export const tournamentUpvotes = pgTable("tournament_upvotes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  tournamentId: text("tournament_id")
    .references(() => tournaments.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Model scores table tracks ELO ratings for AI models.
 * Each model has a global ELO score that updates after head-to-head matches.
 *
 * @deprecated This table is being phased out in favor of ELO fields directly on the models table.
 * Kept for backward compatibility during migration.
 */
export const modelScores = pgTable(
  "model_scores",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id").notNull().unique(), // OpenRouter model ID (e.g., "anthropic/claude-3-sonnet")
    globalScore: integer("global_score").notNull().default(1200), // ELO rating
    matchesPlayed: integer("matches_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    modelIdIdx: index("model_scores_model_id_idx").on(table.modelId),
    scoreIdx: index("model_scores_global_score_idx").on(table.globalScore),
  }),
);

/**
 * Match results table stores individual head-to-head match outcomes for ELO calculation.
 * Records the before/after ELO scores for each match to enable historical analysis.
 */
export const matchResults = pgTable(
  "match_results",
  {
    id: text("id").primaryKey(),
    tournamentRunId: text("tournament_run_id")
      .references(() => tournamentRuns.id)
      .notNull(),
    roundNumber: integer("round_number").notNull(),
    winnerModelId: text("winner_model_id").notNull(),
    loserModelId: text("loser_model_id").notNull(),
    winnerScoreBefore: integer("winner_score_before").notNull(),
    loserScoreBefore: integer("loser_score_before").notNull(),
    winnerScoreAfter: integer("winner_score_after").notNull(),
    loserScoreAfter: integer("loser_score_after").notNull(),
    resultType: varchar("result_type", { length: 20 }).default("judged").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tournamentRunIdx: index("match_results_tournament_run_idx").on(table.tournamentRunId),
    winnerModelIdx: index("match_results_winner_model_idx").on(table.winnerModelId),
    loserModelIdx: index("match_results_loser_model_idx").on(table.loserModelId),
    roundIdx: index("match_results_round_idx").on(table.roundNumber),
    resultTypeIdx: index("match_results_result_type_idx").on(table.resultType),
  }),
);

/**
 * Model tag scores table tracks hierarchical ELO ratings.
 * Each model has separate ELO scores for different capability tags.
 */
export const modelTagScores = pgTable(
  "model_tag_scores",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id").notNull(),
    tagId: text("tag_id").notNull(), // HierarchicalTagId from taxonomy
    eloScore: integer("elo_score").notNull().default(1200),
    matchesPlayed: integer("matches_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint for (model_id, tag_id) - required for onConflictDoNothing
    modelTagUnique: unique("model_tag_scores_model_id_tag_id_unique").on(
      table.modelId,
      table.tagId,
    ),
    modelIdIdx: index("model_tag_scores_model_id_idx").on(table.modelId),
    tagIdIdx: index("model_tag_scores_tag_id_idx").on(table.tagId),
    eloIdx: index("model_tag_scores_elo_idx").on(table.eloScore),
    compositeIdx: index("model_tag_scores_composite_idx").on(table.tagId, table.eloScore),
  }),
);

/**
 * Router execution results table stores complete router execution data for sharing.
 * Captures execution results with ELO scores for the specific models used.
 */
export const routerExecutionResults = pgTable(
  "router_execution_results",
  {
    id: text("id").primaryKey(),
    executionId: text("execution_id").notNull(),
    originalPrompt: text("original_prompt").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),

    // Analysis results (JSON)
    analysisResult: jsonb("analysis_result").notNull(),
    singleModelRecommendation: jsonb("single_model_recommendation").notNull(),
    optimizedWorkflow: jsonb("optimized_workflow").notNull(),

    // Execution results (JSON)
    singleResult: jsonb("single_result"),
    workflowResult: jsonb("workflow_result"),
    intermediateResults: jsonb("intermediate_results").notNull().default("[]"),

    // Comparison data (JSON)
    comparisonData: jsonb("comparison_data"),

    // Model ELO data at time of execution (JSON) - Just the models that were used
    modelEloData: jsonb("model_elo_data").notNull(),

    // Metadata
    totalExecutionTime: integer("total_execution_time").notNull(),
    routerVersion: text("router_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    // Optional user association
    userId: text("user_id").references(() => users.id),

    // Sharing and visibility
    isPublic: boolean("is_public").notNull().default(true),
    shareToken: text("share_token"),
  },
  (table) => ({
    executionIdIdx: index("router_results_execution_id_idx").on(table.executionId),
    completedAtIdx: index("router_results_completed_at_idx").on(table.completedAt),
    userIdIdx: index("router_results_user_id_idx").on(table.userId),
    shareTokenIdx: uniqueIndex("router_results_share_token_idx").on(table.shareToken),
  }),
);

// Relations
export const routerExecutionResultsRelations = relations(routerExecutionResults, ({ one }) => ({
  user: one(users, {
    fields: [routerExecutionResults.userId],
    references: [users.id],
  }),
}));
