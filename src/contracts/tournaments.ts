/**
 * @file Tournament-related API contracts.
 * @description API contracts for tournament endpoints including creation, execution, judging, and results.
 */

import { z } from "zod";

import { tournamentBracketSchema, tournamentSchema } from "@/types/schemas";
import {
  ExecuteModelsRequest,
  ExecuteModelsResponse,
  JudgeTournamentResponse,
  TournamentStatusResponse,
} from "@/types/tournament";

/**
 * Tournament-related API contracts.
 * @const
 */
export const tournamentContracts = {
  // POST /api/tournament
  "POST /api/tournament": {
    method: "POST" as const,
    path: "/api/tournament" as const,
    request: {
      body: z.object({
        prompt: z.string(),
        models: z.array(z.string().min(2)),
        bracketSize: z.union([z.literal(4), z.literal(8), z.literal(16)]),
        judgeModel: z.string(),
        judgePrompt: z.string().optional(),
        title: z.string().optional(),
      }),
    },
    response: z.object({
      success: z.boolean(),
      id: z.string(),
      error: z.string().optional(),
    }),
  },

  // POST /api/tournament/:id/execute
  "POST /api/tournament/:id/execute": {
    method: "POST" as const,
    path: "/api/tournament/:id/execute" as const,
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({
        challengePrompt: z.string(),
        models: z.array(z.string().min(1)),
        judgeModel: z.string(),
      }) satisfies z.ZodType<ExecuteModelsRequest>,
    },
    response: z.object({
      success: z.boolean(),
      progress: z.number(),
      responses: z
        .record(z.string(), z.custom<import("@/types/tournament").ModelResponse>())
        .optional(),
      error: z.string().optional(),
    }) as z.ZodType<ExecuteModelsResponse>,
  },

  // POST /api/tournament/:id/bracket
  "POST /api/tournament/:id/bracket": {
    method: "POST" as const,
    path: "/api/tournament/:id/bracket" as const,
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({
        models: z.array(z.string()),
        judgeModel: z.string(),
      }),
    },
    response: z.object({
      success: z.boolean(),
      bracket: tournamentBracketSchema.optional(),
      error: z.string().optional(),
    }),
  },

  // GET /api/tournament/:id/status
  "GET /api/tournament/:id/status": {
    method: "GET" as const,
    path: "/api/tournament/:id/status" as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    response: z.custom<TournamentStatusResponse>(),
  },

  // POST /api/tournament/:id/judge
  "POST /api/tournament/:id/judge": {
    method: "POST" as const,
    path: "/api/tournament/:id/judge" as const,
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({
        judgePrompt: z.string(),
        currentRound: z.number().optional(),
        challengePrompt: z.string().optional(),
        judgeModel: z.string().optional(),
      }),
    },
    response: z.custom<JudgeTournamentResponse>(),
  },

  // GET /api/tournament/:id/results
  "GET /api/tournament/:id/results": {
    method: "GET" as const,
    path: "/api/tournament/:id/results" as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    response: z.object({
      success: z.boolean(),
      data: z.object({
        tournament: tournamentSchema,
        run: z
          .object({
            id: z.string(),
            status: z.string(),
            winnerModel: z.string().nullable(),
            startedAt: z.string(),
            completedAt: z.string().nullable(),
          })
          .nullable(),
        bracket: tournamentBracketSchema.nullable(),
      }),
      error: z.string().optional(),
    }),
  },

  // POST /api/tournament/:id/fork
  "POST /api/tournament/:id/fork": {
    method: "POST" as const,
    path: "/api/tournament/:id/fork" as const,
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({}).optional(),
    },
    response: z.object({
      newTournamentId: z.string(),
      originalTournamentId: z.string(),
      forkedBy: z.string(),
      forkType: z.enum(["fork", "version"]),
    }),
  },

  // POST /api/tournament/:id/upvote
  "POST /api/tournament/:id/upvote": {
    method: "POST" as const,
    path: "/api/tournament/:id/upvote" as const,
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({}).optional(),
    },
    response: z.object({
      success: z.boolean(),
      upvoteCount: z.number(),
      hasUpvoted: z.boolean(),
      error: z.string().optional(),
    }),
  },

  // Slug variants (aliases)
  "POST /api/tournament/:slug/bracket": {
    method: "POST" as const,
    path: "/api/tournament/:slug/bracket" as const,
    request: {
      params: z.object({ slug: z.string() }),
      body: z.object({ models: z.array(z.string()), judgeModel: z.string() }),
    },
    response: z.object({
      success: z.boolean(),
      bracket: z.any().optional(),
      error: z.string().optional(),
    }),
  },

  "GET /api/tournament/:slug/status": {
    method: "GET" as const,
    path: "/api/tournament/:slug/status" as const,
    request: { params: z.object({ slug: z.string() }) },
    response: z.custom<TournamentStatusResponse>(),
  },

  "POST /api/tournament/:slug/judge": {
    method: "POST" as const,
    path: "/api/tournament/:slug/judge" as const,
    request: {
      params: z.object({ slug: z.string() }),
      body: z.object({
        judgePrompt: z.string(),
        currentRound: z.number().optional(),
        challengePrompt: z.string().optional(),
        judgeModel: z.string().optional(),
      }),
    },
    response: z.custom<JudgeTournamentResponse>(),
  },

  "POST /api/tournament/:slug/fork": {
    method: "POST" as const,
    path: "/api/tournament/:slug/fork" as const,
    request: {
      params: z.object({ slug: z.string() }),
      body: z.object({}).optional(),
    },
    response: z.object({
      newTournamentId: z.string(),
      originalTournamentId: z.string(),
      forkedBy: z.string(),
      forkType: z.enum(["fork", "version"]),
    }),
  },

  // POST /api/judge-prompt
  "POST /api/judge-prompt": {
    method: "POST" as const,
    path: "/api/judge-prompt" as const,
    request: {
      body: z.object({ challengePrompt: z.string() }),
    },
    response: z.object({
      success: z.boolean(),
      judgePrompt: z.string(),
      error: z.string().optional(),
    }),
  },
} as const;
