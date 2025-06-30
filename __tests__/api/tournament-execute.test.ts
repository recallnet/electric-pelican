/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/tournament/[id]/execute/route";
import { executeModelsWithStreamingJudging } from "@/lib/streaming-tournament";
import {
  updateTournamentWithResponses,
  getCompleteTournamentData,
  resolveTournamentId,
  getTournamentBracket,
  saveTournamentBracket as _saveTournamentBracket,
  getCurrentTournamentRunId,
  updateTournamentBracket,
  markTournamentRunCompleted as _markTournamentRunCompleted,
} from "@/lib/tournament-db";

// Mock dependencies
jest.mock("@/lib/streaming-tournament");
jest.mock("@/lib/tournament-db");
jest.mock("@/lib/bracket");

const mockExecuteModelsWithStreamingJudging =
  executeModelsWithStreamingJudging as jest.MockedFunction<
    typeof executeModelsWithStreamingJudging
  >;
const mockUpdateTournamentWithResponses = updateTournamentWithResponses as jest.MockedFunction<
  typeof updateTournamentWithResponses
>;
const mockGetCompleteTournamentData = getCompleteTournamentData as jest.MockedFunction<
  typeof getCompleteTournamentData
>;
const mockResolveTournamentId = resolveTournamentId as jest.MockedFunction<
  typeof resolveTournamentId
>;
const mockGetTournamentBracket = getTournamentBracket as jest.MockedFunction<
  typeof getTournamentBracket
>;
const mockUpdateTournamentBracket = updateTournamentBracket as jest.MockedFunction<
  typeof updateTournamentBracket
>;
const mockGetCurrentTournamentRunId = getCurrentTournamentRunId as jest.MockedFunction<
  typeof getCurrentTournamentRunId
>;

describe("/api/tournament/[id]/execute", () => {
  const tournamentId = "test-tournament-123";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock tournament ID resolution
    mockResolveTournamentId.mockResolvedValue(tournamentId);

    // Mock complete tournament data
    (mockGetCompleteTournamentData as any).mockResolvedValue({
      tournament: {
        id: "test-tournament-id",
        slug: "test-tournament",
        title: "Test Tournament",
        prompt: "Write a haiku about cats",
        judgePrompt: "Judge which response is better",
        models: JSON.stringify(["model-a", "model-b"]),
        judgeModel: "judge-model",
        tags: null,
        tagIds: [],
        bracketSize: 4,
        createdBy: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
        forkCount: 0,
        version: 1,
        originalId: null,
        authorName: "test-user",
        authorId: "user-123",
        upvoteCount: 0,
        hasUpvoted: false,
      },
    });

    // Mock bracket-related functions
    mockGetTournamentBracket.mockResolvedValue({
      tournamentId: tournamentId,
      matches: [],
      status: "models_executed",
      totalRounds: 2,
      bracketSize: 4,
      currentRound: 1,
    });
    mockUpdateTournamentBracket.mockResolvedValue();
    mockGetCurrentTournamentRunId.mockResolvedValue("run-123");

    // Mock response update
    mockUpdateTournamentWithResponses.mockResolvedValue();
  });

  describe("POST", () => {
    it("executes models successfully", async () => {
      const mockResponses = {
        "model-a": { response: "Response A", status: "success" as const, timestamp: Date.now() },
        "model-b": { response: "Response B", status: "success" as const, timestamp: Date.now() },
      };

      const mockBracket = {
        tournamentId: tournamentId,
        matches: [
          {
            id: "match-1",
            modelA: "model-a",
            modelB: "model-b",
            winner: "model-a",
            round: 1,
            position: 1,
          },
        ],
        status: "completed" as const,
        totalRounds: 1,
        bracketSize: 4,
        currentRound: 1,
      };

      mockExecuteModelsWithStreamingJudging.mockResolvedValue({
        responses: mockResponses,
        finalBracket: mockBracket,
        allMatches: [
          {
            matchId: "match-1",

            modelA: "model-a",
            modelB: "model-b",
            winner: "model-a",
            judgeExplanation: "Model A wins",
          },
        ],
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/execute`,
        {
          method: "POST",
          body: JSON.stringify({
            challengePrompt: "Write a haiku about cats",
            models: ["model-a", "model-b"],
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress).toBe(100);
      expect(data.responses).toEqual(mockResponses);
      expect(mockUpdateTournamentWithResponses).toHaveBeenCalledWith(tournamentId, mockResponses);
      expect(mockUpdateTournamentBracket).toHaveBeenCalledWith(mockBracket);
    });

    it("returns 400 for missing challenge prompt", async () => {
      // Override the mock to return empty tournament data to trigger validation
      (mockGetCompleteTournamentData as any).mockResolvedValue({
        tournament: {
          id: "test-tournament-id",
          slug: "test-tournament",
          title: "Test Tournament",
          // No prompt field - this will cause validation failure
          judgePrompt: "Judge which response is better",
          models: JSON.stringify(["model-a", "model-b"]),
          judgeModel: "judge-model",
          tags: null,
          tagIds: [],
          bracketSize: 4,
          createdBy: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          forkCount: 0,
          version: 1,
          originalId: null,
          authorName: "test-user",
          authorId: "user-123",
          upvoteCount: 0,
          hasUpvoted: false,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/execute`,
        {
          method: "POST",
          body: JSON.stringify({
            models: ["model-a"],
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("challengePrompt is required");
    });

    it("returns 400 for empty models array", async () => {
      // Mock tournament with empty models array
      (mockGetCompleteTournamentData as any).mockResolvedValue({
        tournament: {
          id: "test-tournament-id",
          slug: "test-tournament",
          title: "Test Tournament",
          prompt: "Test prompt",
          judgePrompt: "Judge which response is better",
          models: JSON.stringify([]), // Empty array
          judgeModel: "judge-model",
          tags: null,
          tagIds: [],
          bracketSize: 4,
          createdBy: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          forkCount: 0,
          version: 1,
          originalId: null,
          authorName: "test-user",
          authorId: "user-123",
          upvoteCount: 0,
          hasUpvoted: false,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/execute`,
        {
          method: "POST",
          body: JSON.stringify({
            challengePrompt: "Test prompt",
            models: [],
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("models array is required and must not be empty");
    });

    it("returns 404 for non-existent tournament", async () => {
      // Mock tournament not found
      mockResolveTournamentId.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/execute`,
        {
          method: "POST",
          body: JSON.stringify({
            challengePrompt: "Test prompt",
            models: ["model-a"],
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

    it("returns 500 when model execution fails", async () => {
      // Execution fails with error
      mockExecuteModelsWithStreamingJudging.mockRejectedValue(new Error("Execution failed"));

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/execute`,
        {
          method: "POST",
          body: JSON.stringify({
            challengePrompt: "Test prompt",
            models: ["model-a"],
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Execution failed");
    });
  });
});
