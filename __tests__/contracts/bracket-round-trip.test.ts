import { POST as BracketPOST } from "@/app/api/tournament/[id]/bracket/route";
import { NextRequest } from "next/server";

// Mock NextResponse.json to return a consistent response with a json method
jest.mock("next/server", () => {
  const mockBracketResponse = {
    success: true,
    bracket: {
      tournamentId: "t1",
      bracketSize: 4,
      totalRounds: 2,
      matches: [],
      status: "created",
      currentRound: 1,
    },
  };

  return {
    ...jest.requireActual("next/server"),
    NextResponse: {
      json: jest.fn(() => ({
        ok: true,
        json: async () => mockBracketResponse,
      })),
    },
    NextRequest: jest.requireActual("next/server").NextRequest,
  };
});

jest.mock("@/lib/bracket", () => ({
  createTournamentBracket: jest.fn((id, models) => ({
    tournamentId: id,
    bracketSize: models.length,
    totalRounds: 2,
    matches: [],
    status: "created",
    currentRound: 1,
  })),
}));

jest.mock("@/lib/tournament-db", () => ({
  resolveTournamentId: jest.fn(async () => "t1"),
  saveTournamentBracket: jest.fn(async () => "run1"),
}));

describe("API contract round-trip – bracket", () => {
  it("POST /api/tournament/:id/bracket returns success", async () => {
    // Create request body and parameters
    const body = { models: ["m1", "m2", "m3", "m4"], judgeModel: "judge" };
    const req = new NextRequest("http://localhost/api/tournament/demo-123/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Call the bracket API route handler
    const res = await BracketPOST(req, { params: Promise.resolve({ id: "demo-123" }) });

    // Verify the response properties
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.bracket).toBeDefined();
  });
});
