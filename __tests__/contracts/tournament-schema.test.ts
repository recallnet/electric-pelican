// @ts-nocheck

import { TournamentSchema, TournamentRunSchema } from "@/schemas/tournament";
import { createTournamentBracket } from "@/lib/bracket";
import { toDB } from "@/lib/serialize";

describe("Zod schemas round-trip", () => {
  it("TournamentRunSchema parses bracket JSON string", () => {
    const bracket = createTournamentBracket("t1", ["m1", "m2", "m3", "m4"]);
    const runObj = {
      id: "run1",
      tournamentId: "t1",
      version: 1,
      status: "running",
      bracketData: toDB(bracket),
      winnerModel: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    expect(() => TournamentRunSchema.parse(runObj)).not.toThrow();
  });

  it("rejects invalid bracketSize", () => {
    const bad = {
      id: "t",
      slug: "slug",
      title: "title",
      prompt: "p",
      judgePrompt: "jp",
      models: ["a", "b", "c"],
      judgeModel: "j",
      bracketSize: 5, // invalid
      createdBy: "u1",
      createdAt: 0,
      updatedAt: 0,
      parentId: null,
      forkCount: 0,
      version: 1,
      originalId: null,
    };
    expect(() => TournamentSchema.parse(bad)).toThrow();
  });
});
