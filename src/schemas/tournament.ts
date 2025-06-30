import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  privyId: z.string(),
  email: z.string().email().nullish(),
  name: z.string().nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const TournamentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  prompt: z.string(),
  judgePrompt: z.string(),
  models: z.array(z.string()),
  judgeModel: z.string(),
  bracketSize: z
    .number()
    .int()
    .refine((v) => [4, 8, 16].includes(v)),
  createdBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  parentId: z.string().nullish(),
  forkCount: z.number().int().default(0),
  version: z.number().int().default(1),
  originalId: z.string().nullish(),
});

export const TournamentRunSchema = z.object({
  id: z.string(),
  tournamentId: z.string(),
  version: z.number().int().default(1),
  status: z.enum(["running", "models_executed", "completed", "failed"]),
  bracketData: z.string(),
  winnerModel: z.string().nullish(),
  startedAt: z.number(),
  completedAt: z.number().nullish(),
});

export const ForkSchema = z.object({
  id: z.string(),
  parentTournamentId: z.string(),
  childTournamentId: z.string(),
  createdAt: z.number(),
});

// DTO types moved to @/types/schemas.ts
