/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/tournament/[id]/judge/route";
import { runTournamentJudging, getTournamentWinner } from "@/lib/tournament-judging";
import {
  getTournamentBracket,
  updateTournamentBracket,
  tournamentExists,
  getCurrentTournamentRunId,
  getTournamentForStatus,
} from "@/lib/tournament-db";

// Mock dependencies
jest.mock("@/lib/tournament-judging");
jest.mock("@/lib/tournament-db");

const mockRunTournamentJudging = runTournamentJudging as jest.MockedFunction<
  typeof runTournamentJudging
>;
const mockGetTournamentWinner = getTournamentWinner as jest.MockedFunction<
  typeof getTournamentWinner
>;
const mockGetTournamentBracket = getTournamentBracket as jest.MockedFunction<
  typeof getTournamentBracket
>;
const mockUpdateTournamentBracket = updateTournamentBracket as jest.MockedFunction<
  typeof updateTournamentBracket
>;
const mockTournamentExists = tournamentExists as jest.MockedFunction<typeof tournamentExists>;
const mockGetCurrentTournamentRunId = getCurrentTournamentRunId as jest.MockedFunction<
  typeof getCurrentTournamentRunId
>;
const mockGetTournamentForStatus = getTournamentForStatus as jest.MockedFunction<
  typeof getTournamentForStatus
>;

describe("/api/tournament/[id]/judge", () => {
  const tournamentId = "test-tournament-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockTournamentExists.mockResolvedValue(true);
    mockUpdateTournamentBracket.mockResolvedValue();
    mockGetCurrentTournamentRunId.mockResolvedValue(null); // No tournament run ID by default
    mockGetTournamentForStatus.mockResolvedValue({
      id: tournamentId,
      title: "Test Tournament",
      prompt: "Test prompt",
      judgePrompt: null,
      judgeModel: "test-judge",
      models: "[]",
      tagIds: null,
      createdAt: new Date(),
      createdBy: "test-user",
    });
  });

  describe("POST", () => {
    it("judges tournament successfully", async () => {
      const mockBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        status: "models_executed" as const,
        currentRound: 1,
        matches: [],
        modelResponses: {
          "model-a": { response: "Response A", status: "success" as const, timestamp: Date.now() },
        },
      };

      const mockFinalBracket = {
        ...mockBracket,
        status: "completed" as const,
        currentRound: 2,
      };

      const mockMatches = [
        {
          matchId: "match-1",
          modelA: "model-a",
          modelB: "model-b",
          winner: "model-a",
          judgeExplanation: "Model A provides better response. WINNER: A",
        },
      ];

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockRunTournamentJudging.mockResolvedValue({
        finalBracket: mockFinalBracket,
        allMatches: mockMatches,
      });
      mockGetTournamentWinner.mockReturnValue("model-a");

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/judge`,
        {
          method: "POST",
          body: JSON.stringify({
            judgePrompt: "Judge based on accuracy and clarity",
            challengePrompt: "Write a haiku about cats",
            judgeModel: "anthropic/claude-3-sonnet",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tournamentComplete).toBe(true);
      expect(data.winner).toBe("model-a");
      expect(data.matches).toEqual(mockMatches);
      expect(mockRunTournamentJudging).toHaveBeenCalledWith(
        mockBracket,
        "Write a haiku about cats",
        "Judge based on accuracy and clarity",
        "anthropic/claude-3-sonnet",
        undefined,
        [], // Tournament has no hierarchical tags
      );
    });

    it("returns 400 for missing judge prompt", async () => {
      const mockBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        status: "models_executed" as const,
        currentRound: 1,
        matches: [],
        modelResponses: {},
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/judge`,
        {
          method: "POST",
          body: JSON.stringify({
            challengePrompt: "Test prompt",
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("judgePrompt is required");
    });

    it("returns 400 when models not executed", async () => {
      const mockBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        status: "created" as const,
        currentRound: 1,
        matches: [],
        // No modelResponses
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/judge`,
        {
          method: "POST",
          body: JSON.stringify({
            judgePrompt: "Judge prompt",
            challengePrompt: "Test prompt",
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Tournament models have not been executed yet");
    });

    it("returns 404 for non-existent tournament", async () => {
      mockTournamentExists.mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/judge`,
        {
          method: "POST",
          body: JSON.stringify({
            judgePrompt: "Judge prompt",
            challengePrompt: "Test prompt",
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Tournament not found");
    });

    it("returns 500 when judging fails", async () => {
      const mockBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        status: "models_executed" as const,
        currentRound: 1,
        matches: [],
        modelResponses: {
          "model-a": { response: "test", status: "success" as const, timestamp: Date.now() },
        },
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockRunTournamentJudging.mockRejectedValue(new Error("Judging failed"));

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/judge`,
        {
          method: "POST",
          body: JSON.stringify({
            judgePrompt: "Judge prompt",
            challengePrompt: "Test prompt",
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Judging failed");
    });
  });
});
