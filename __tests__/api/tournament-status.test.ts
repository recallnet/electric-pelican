/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tournament/[id]/status/route";
import {
  tournamentExists,
  getTournamentBracket,
  getTournamentForStatus,
} from "@/lib/tournament-db";
import { getTournamentWinner } from "@/lib/tournament-judging";
import { TournamentBracket } from "@/types/tournament";

// Mock dependencies
jest.mock("@/lib/tournament-db");
jest.mock("@/lib/tournament-judging");

const mockTournamentExists = tournamentExists as jest.MockedFunction<typeof tournamentExists>;
const mockGetTournamentBracket = getTournamentBracket as jest.MockedFunction<
  typeof getTournamentBracket
>;
const mockGetTournamentForStatus = getTournamentForStatus as jest.MockedFunction<
  typeof getTournamentForStatus
>;
const mockGetTournamentWinner = getTournamentWinner as jest.MockedFunction<
  typeof getTournamentWinner
>;

describe("/api/tournament/[id]/status", () => {
  const tournamentId = "test-tournament-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockTournamentExists.mockResolvedValue(true);

    // Set up default mock implementation for getTournamentForStatus
    mockGetTournamentForStatus.mockResolvedValue({
      id: tournamentId,
      title: "Test Tournament",
      prompt: "Test challenge prompt",
      judgePrompt: "Test judge prompt",
      models: ["model-a", "model-b", "model-c", "model-d"],
      judgeModel: "test-judge",
      createdAt: new Date(),
      createdBy: "test-user",
      tagIds: [],
    });
  });

  describe("GET", () => {
    it("returns tournament status successfully", async () => {
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        currentRound: 1,
        status: "running",
        matches: [
          {
            id: "match1",
            round: 1,
            position: 1,
            modelA: "model-a",
            modelB: "model-b",
            winner: "model-a",
            judgeExplanation: "Model A won because...",
          },
          {
            id: "match2",
            round: 1,
            position: 2,
            modelA: "model-c",
            modelB: "model-d",
            winner: null,
          },
        ],
        modelResponses: {
          "model-a": { response: "Response A", status: "success", timestamp: Date.now() },
          "model-b": { response: "Response B", status: "success", timestamp: Date.now() },
        },
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tournament).toBeDefined();
      expect(data.tournament.id).toBe(tournamentId);
      expect(data.tournament.phase).toBe("judging");
      expect(data.tournament.bracketSize).toBe(4);
      expect(data.tournament.totalRounds).toBe(2);
      expect(data.tournament.currentRound).toBe(1);
      expect(data.tournament.matches).toHaveLength(2);
      expect(data.tournament.modelResponses).toBeDefined();
    });

    it("calculates progress correctly for judging phase", async () => {
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        currentRound: 1,
        status: "running",
        matches: [
          {
            id: "match1",
            round: 1,
            position: 1,
            modelA: "model-a",
            modelB: "model-b",
            winner: "model-a",
          },
          {
            id: "match2",
            round: 1,
            position: 2,
            modelA: "model-c",
            modelB: "model-d",
            winner: null,
          },
        ],
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(data.tournament.progress).toBeGreaterThan(20); // Base progress for judging
      expect(data.tournament.progress).toBeLessThan(90); // Not completed yet
    });

    it("returns completed tournament with winner", async () => {
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        currentRound: 2,
        status: "completed",
        matches: [
          {
            id: "match1",
            round: 1,
            position: 1,
            modelA: "model-a",
            modelB: "model-b",
            winner: "model-a",
          },
          {
            id: "match2",
            round: 1,
            position: 2,
            modelA: "model-c",
            modelB: "model-d",
            winner: "model-c",
          },
          {
            id: "final",
            round: 2,
            position: 1,
            modelA: "model-a",
            modelB: "model-c",
            winner: "model-a",
          },
        ],
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue("model-a");

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(data.tournament.phase).toBe("completed");
      expect(data.tournament.progress).toBe(100);
      expect(data.tournament.winner).toBe("model-a");
    });

    it("returns setup phase for created tournament", async () => {
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 8,
        totalRounds: 3,
        currentRound: 1,
        status: "created",
        matches: [],
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(data.tournament.phase).toBe("setup");
      expect(data.tournament.progress).toBe(0);
      expect(data.tournament.bracketSize).toBe(8);
      expect(data.tournament.totalRounds).toBe(3);
    });

    it("returns executing_models phase for models_executed status", async () => {
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        currentRound: 1,
        status: "models_executed",
        matches: [],
        modelResponses: {
          "model-a": { response: "Response A", status: "success", timestamp: Date.now() },
        },
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(data.tournament.phase).toBe("executing_models");
      expect(data.tournament.progress).toBe(10);
    });

    it("returns 404 for non-existent tournament", async () => {
      mockTournamentExists.mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Tournament not found");
    });

    it("returns 404 when bracket not found", async () => {
      mockTournamentExists.mockResolvedValue(true);
      mockGetTournamentBracket.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Tournament bracket not found");
    });

    it("handles database errors gracefully", async () => {
      mockTournamentExists.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
    });

    it("calculates progress correctly for different bracket sizes", async () => {
      // Test 16-model tournament
      const mockBracket: TournamentBracket = {
        tournamentId,
        bracketSize: 16,
        totalRounds: 4,
        currentRound: 2,
        status: "running",
        matches: Array.from({ length: 15 }, (_, i) => ({
          id: `match${i + 1}`,
          round: Math.ceil((i + 1) / Math.pow(2, 4 - Math.ceil(Math.log2(i + 2)))),
          position: i + 1,
          modelA: `model-${i * 2}`,
          modelB: `model-${i * 2 + 1}`,
          winner: i < 8 ? `model-${i * 2}` : null, // First round complete
        })),
      };

      mockGetTournamentBracket.mockResolvedValue(mockBracket);
      mockGetTournamentWinner.mockReturnValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/status`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(data.tournament.bracketSize).toBe(16);
      expect(data.tournament.totalRounds).toBe(4);
      expect(data.tournament.currentRound).toBe(2);
      expect(data.tournament.progress).toBeGreaterThan(20);
      expect(data.tournament.progress).toBeLessThanOrEqual(100); // Adjusted for current progress calculation
    });
  });
});
