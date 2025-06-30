/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/tournament/[id]/bracket/route";
import {
  tournamentExists,
  getTournamentBracket,
  saveTournamentBracket,
  resolveTournamentId,
} from "@/lib/tournament-db";

// Mock database operations
jest.mock("@/lib/tournament-db");
const mockTournamentExists = tournamentExists as jest.MockedFunction<typeof tournamentExists>;
const mockGetTournamentBracket = getTournamentBracket as jest.MockedFunction<
  typeof getTournamentBracket
>;
const mockSaveTournamentBracket = saveTournamentBracket as jest.MockedFunction<
  typeof saveTournamentBracket
>;
const mockResolveTournamentId = resolveTournamentId as jest.MockedFunction<
  typeof resolveTournamentId
>;

// Mock bracket creation
jest.mock("@/lib/bracket", () => ({
  createTournamentBracket: jest.fn((id, models) => ({
    tournamentId: id,
    matches: [],
    status: "created",
    totalRounds: models.length === 4 ? 2 : models.length === 8 ? 3 : 4,
    bracketSize: models.length,
    currentRound: 1,
  })),
}));

describe("/api/tournament/[id]/bracket", () => {
  const tournamentId = "test-tournament-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockTournamentExists.mockResolvedValue(true);
    mockResolveTournamentId.mockResolvedValue(tournamentId);
    mockGetTournamentBracket.mockResolvedValue(null); // No existing bracket by default
    mockSaveTournamentBracket.mockResolvedValue("run-123"); // Returns run ID
  });

  describe("POST", () => {
    it("creates bracket successfully", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/bracket`,
        {
          method: "POST",
          body: JSON.stringify({
            models: ["model-a", "model-b", "model-c", "model-d"],
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bracket).toBeDefined();
      expect(data.bracket.bracketSize).toBe(4);
      expect(data.bracket.totalRounds).toBe(2);
    });

    it("returns 400 for invalid model count", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/bracket`,
        {
          method: "POST",
          body: JSON.stringify({
            models: ["model-a", "model-b"], // Only 2 models
            judgeModel: "judge-model",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("must contain exactly 4, 8, or 16 model IDs");
    });

    it("returns 404 for non-existent tournament", async () => {
      mockResolveTournamentId.mockResolvedValue(null); // This is the key change
      mockTournamentExists.mockResolvedValue(false); // Keep this for backwards compatibility

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/bracket`,
        {
          method: "POST",
          body: JSON.stringify({
            models: ["model-a", "model-b", "model-c", "model-d"],
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
  });

  describe("GET", () => {
    it("returns 404 for non-existent tournament", async () => {
      mockResolveTournamentId.mockResolvedValue(null);
      mockTournamentExists.mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/bracket`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Tournament not found");
    });

    it("returns 404 when bracket doesn't exist", async () => {
      // Tournament exists but bracket doesn't
      mockResolveTournamentId.mockResolvedValue(tournamentId);
      mockGetTournamentBracket.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/tournament/${tournamentId}/bracket`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: tournamentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("No bracket found for this tournament");
    });
  });
});
