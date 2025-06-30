import { POST as ExecutePOST } from "@/app/api/tournament/[id]/execute/route";
import { NextRequest } from "next/server";

// Mock NextResponse.json to return a mock response with a json method
jest.mock("next/server", () => {
  const mockResponseData = {
    success: true,
    progress: 100,
    responses: { m1: { text: "Response 1" }, m2: { text: "Response 2" } },
    streamingEnabled: true,
    totalMatches: 2,
    finalStatus: "completed",
    completed: true,
  };

  return {
    ...jest.requireActual("next/server"),
    NextResponse: {
      json: jest.fn(() => ({
        json: async () => mockResponseData,
      })),
    },
    NextRequest: jest.requireActual("next/server").NextRequest,
  };
});

// Mock the streaming tournament module
jest.mock("@/lib/streaming-tournament", () => ({
  executeModelsWithStreamingJudging: jest.fn(async () => ({
    responses: { m1: { text: "Response 1" }, m2: { text: "Response 2" } },
    finalBracket: {
      status: "completed",
      matches: [
        { round: 1, winner: "m1" },
        { round: 2, winner: "m1" },
      ],
      totalRounds: 2,
    },
    allMatches: [{ id: "match1" }, { id: "match2" }],
  })),
}));

// Mock tournament-db functions
jest.mock("@/lib/tournament-db", () => ({
  resolveTournamentId: jest.fn(async () => "resolved-id-123"),
  getCompleteTournamentData: jest.fn(async () => ({
    tournament: {
      id: "resolved-id-123",
      prompt: "Test tournament prompt",
      models: JSON.stringify(["m1", "m2"]),
      judgeModel: "judge-model",
    },
  })),
  getTournamentBracket: jest.fn(async () => ({
    tournamentId: "resolved-id-123",
    bracketSize: 4,
    totalRounds: 2,
    currentRound: 1,
    status: "created",
    matches: [],
  })),
  updateTournamentWithResponses: jest.fn(async () => {}),
  updateTournamentBracket: jest.fn(async () => {}),
  getCurrentTournamentRunId: jest.fn(async () => "run-123"),
  markTournamentRunCompleted: jest.fn(async () => {}),
  saveTournamentBracket: jest.fn(async () => {}),
}));

// Mock bracket creation
jest.mock("@/lib/bracket", () => ({
  createTournamentBracket: jest.fn((id, models) => ({
    tournamentId: id,
    bracketSize: models.length,
    totalRounds: Math.ceil(Math.log2(models.length)),
    currentRound: 1,
    status: "created",
    matches: [],
  })),
}));

describe("API contract round-trip – execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/tournament/:id/execute returns valid payload", async () => {
    // Create request with necessary params
    const req = new NextRequest("http://localhost/api/tournament/demo-123/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengePrompt: "Test challenge prompt",
        models: ["m1", "m2"],
        judgeModel: "judge-model",
      }),
    });

    // Call the API route handler with a promise that resolves to params
    const res = await ExecutePOST(req, {
      params: Promise.resolve({ id: "demo-123" }),
    });

    // Get the data using the mocked json method
    const data = await res.json();

    // Verify the response properties
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("progress");
    expect(data).toHaveProperty("responses");
    expect(data).toHaveProperty("streamingEnabled", true);
    expect(data).toHaveProperty("completed", true);
  });
});
