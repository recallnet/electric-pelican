// @ts-nocheck

import { POST as executeRoute } from "@/app/api/tournament/[id]/execute/route";
import { NextResponse } from "next/server";

import { ModelResponse } from "@/types/tournament";

// Mock all required tournament-db functions
const mockResolveTournamentId = jest.fn();
const mockGetCompleteTournamentData = jest.fn();
const mockGetTournamentBracket = jest.fn();
const mockSaveTournamentBracket = jest.fn();
const mockGetCurrentTournamentRunId = jest.fn();
const mockUpdateTournamentBracket = jest.fn();
const mockUpdateTournamentWithResponses = jest.fn();
const mockMarkTournamentRunCompleted = jest.fn();

jest.mock("@/lib/tournament-db", () => ({
  resolveTournamentId: (...args: any[]) => mockResolveTournamentId(...args),
  getCompleteTournamentData: (...args: any[]) => mockGetCompleteTournamentData(...args),
  getTournamentBracket: (...args: any[]) => mockGetTournamentBracket(...args),
  saveTournamentBracket: (...args: any[]) => mockSaveTournamentBracket(...args),
  getCurrentTournamentRunId: (...args: any[]) => mockGetCurrentTournamentRunId(...args),
  updateTournamentBracket: (...args: any[]) => mockUpdateTournamentBracket(...args),
  updateTournamentWithResponses: (...args: any[]) => mockUpdateTournamentWithResponses(...args),
  markTournamentRunCompleted: (...args: any[]) => mockMarkTournamentRunCompleted(...args),
}));

// Mock bracket creation
const mockCreateTournamentBracket = jest.fn();

jest.mock("@/lib/bracket", () => ({
  createTournamentBracket: (...args: any[]) => mockCreateTournamentBracket(...args),
}));

// Mock streaming tournament execution
const mockExecuteModelsWithStreamingJudging = jest.fn();

jest.mock("@/lib/streaming-tournament", () => ({
  executeModelsWithStreamingJudging: (...args: any[]) =>
    mockExecuteModelsWithStreamingJudging(...args),
}));

function createMockRequest(body: any) {
  return {
    json: async () => body,
  } as any;
}

describe("POST /api/tournament/:id/execute", () => {
  const tournamentId = "exec-test-123";
  const ctx = {
    params: async () => ({ id: tournamentId }),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mocks
    mockResolveTournamentId.mockResolvedValue(tournamentId);
    mockGetCompleteTournamentData.mockResolvedValue({
      tournament: {
        id: tournamentId,
        prompt: "Write a friendly greeting",
        judgePrompt: "Which response is more friendly?",
        models: JSON.stringify(["model-a", "model-b"]),
        judgeModel: "judge-model",
      },
    });

    // Mock existing bracket
    mockGetTournamentBracket.mockResolvedValue({
      id: tournamentId,
      matches: [],
      status: "in_progress",
      totalRounds: 1,
    });

    // Mock tournament run ID
    mockGetCurrentTournamentRunId.mockResolvedValue("run-123");

    // Mock successful operations
    mockSaveTournamentBracket.mockResolvedValue();
    mockUpdateTournamentBracket.mockResolvedValue();
    mockUpdateTournamentWithResponses.mockResolvedValue();
    mockMarkTournamentRunCompleted.mockResolvedValue();
  });

  it("returns 200 and progress for valid payload", async () => {
    const mockResponses: Record<string, ModelResponse> = {
      "model-a": { response: "Hello", status: "success", timestamp: 1 },
      "model-b": { response: "Hi", status: "success", timestamp: 1 },
    };

    const mockBracket = {
      id: tournamentId,
      matches: [
        { id: "match-1", modelA: "model-a", modelB: "model-b", winner: "model-a", round: 1 },
      ],
      status: "completed",
      totalRounds: 1,
    };

    mockExecuteModelsWithStreamingJudging.mockResolvedValue({
      responses: mockResponses,
      finalBracket: mockBracket,
      allMatches: mockBracket.matches,
    });

    const reqBody = {
      challengePrompt: "Say hi",
      models: ["model-a", "model-b"],
      judgeModel: "judge-x",
    };

    const res = (await executeRoute(createMockRequest(reqBody), ctx)) as Response;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress).toBe(100);
    expect(data.responses).toEqual(mockResponses);
    expect(mockUpdateTournamentWithResponses).toHaveBeenCalledWith(tournamentId, mockResponses);
    expect(mockUpdateTournamentBracket).toHaveBeenCalledWith(mockBracket);
  });

  it("returns 400 for validation errors (missing prompt)", async () => {
    // Override to create a validation error (missing prompt)
    mockGetCompleteTournamentData.mockResolvedValue({
      tournament: {
        id: tournamentId,
        // No prompt field
        judgePrompt: "Which response is more friendly?",
        models: JSON.stringify(["model-a", "model-b"]),
        judgeModel: "judge-model",
      },
    });

    const reqBody = {
      challengePrompt: "", // Empty prompt
      models: ["model-a"],
      judgeModel: "judge-x",
    };
    const res = (await executeRoute(createMockRequest(reqBody), ctx)) as Response;
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("returns 404 when tournament not found", async () => {
    // Tournament not found
    mockResolveTournamentId.mockResolvedValue(null);

    const reqBody = {
      challengePrompt: "Say hi",
      models: ["model-a"],
      judgeModel: "judge-x",
    };
    const res = (await executeRoute(createMockRequest(reqBody), ctx)) as Response;
    expect(res.status).toBe(404);
  });
});
