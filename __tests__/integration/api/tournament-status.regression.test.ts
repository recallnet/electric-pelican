// @ts-nocheck

import { GET as statusRoute } from "@/app/api/tournament/[id]/status/route";
import { TournamentBracket } from "@/types/tournament";

const mockTournamentExists = jest.fn();
const mockGetTournamentBracket = jest.fn();
const mockGetTournamentForStatus = jest.fn();
jest.mock("@/lib/tournament-db", () => ({
  tournamentExists: (...args: any[]) => mockTournamentExists(...args),
  getTournamentBracket: (...args: any[]) => mockGetTournamentBracket(...args),
  getTournamentForStatus: (...args: any[]) => mockGetTournamentForStatus(...args),
}));

jest.mock("@/lib/tournament-judging", () => ({
  getTournamentWinner: jest.fn().mockReturnValue("model-a"),
}));

function buildBracket(partial?: Partial<TournamentBracket>): TournamentBracket {
  return {
    tournamentId: "t1",
    bracketSize: 4,
    totalRounds: 2,
    currentRound: 1,
    status: "running",
    matches: [
      { id: "m1", round: 1, position: 1, modelA: "model-a", modelB: "model-b", winner: null },
      { id: "m2", round: 1, position: 2, modelA: "model-c", modelB: "model-d", winner: null },
      { id: "m3", round: 2, position: 1, modelA: null, modelB: null, winner: null },
    ],
    ...partial,
  };
}

describe("GET /api/tournament/:id/status", () => {
  const params = { id: "t1" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns tournament status when found", async () => {
    mockTournamentExists.mockResolvedValue(true);
    const bracket = buildBracket();
    mockGetTournamentBracket.mockResolvedValue(bracket);
    mockGetTournamentForStatus.mockResolvedValue({
      id: "t1",
      title: "Test Tournament",
      prompt: "Test prompt",
      judgePrompt: "Test judge prompt",
      models: ["model-a", "model-b", "model-c", "model-d"],
      judgeModel: "judge-model",
      createdAt: new Date(),
      createdBy: "test-user",
      tags: ["test"],
    });

    const response = (await statusRoute({} as any, { params })) as Response;
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.tournament.id).toBe("t1");
    expect(data.tournament.phase).toBe("judging");
  });

  it("returns 404 when tournament missing", async () => {
    mockTournamentExists.mockResolvedValue(false);

    const res = (await statusRoute({} as any, { params })) as Response;
    expect(res.status).toBe(404);
  });
});
