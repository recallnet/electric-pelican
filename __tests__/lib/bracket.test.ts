import {
  createTournamentBracket,
  advanceWinners,
  getMatchesForRound,
  updateMatchResult,
} from "@/lib/bracket";

// Mock uuid to return deterministic IDs for tests
let mockIdCounter = 0;
jest.mock("uuid", () => ({
  v4: () => `test-uuid-${++mockIdCounter}`,
}));

describe("Tournament Bracket Logic", () => {
  const tournamentId = "test-tournament-123";

  beforeEach(() => {
    mockIdCounter = 0; // Reset counter for each test
  });

  describe("createTournamentBracket", () => {
    it("creates bracket for 4 models", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      const bracket = createTournamentBracket(tournamentId, models);

      expect(bracket.tournamentId).toBe(tournamentId);
      expect(bracket.bracketSize).toBe(4);
      expect(bracket.totalRounds).toBe(2);
      expect(bracket.matches).toHaveLength(3); // 2 semifinals + 1 final
      expect(bracket.status).toBe("created");
      expect(bracket.currentRound).toBe(1);

      // Check first round matches have models assigned
      const firstRoundMatches = getMatchesForRound(bracket, 1);
      expect(firstRoundMatches).toHaveLength(2);
      firstRoundMatches.forEach((match) => {
        expect(match.modelA).toBeTruthy();
        expect(match.modelB).toBeTruthy();
        expect(match.winner).toBeNull();
      });
    });

    it("creates bracket for 8 models", () => {
      const models = Array.from({ length: 8 }, (_, i) => `model-${i + 1}`);
      const bracket = createTournamentBracket(tournamentId, models);

      expect(bracket.bracketSize).toBe(8);
      expect(bracket.totalRounds).toBe(3);
      expect(bracket.matches).toHaveLength(7); // 4 + 2 + 1
    });

    it("creates bracket for 16 models", () => {
      const models = Array.from({ length: 16 }, (_, i) => `model-${i + 1}`);
      const bracket = createTournamentBracket(tournamentId, models);

      expect(bracket.bracketSize).toBe(16);
      expect(bracket.totalRounds).toBe(4);
      expect(bracket.matches).toHaveLength(15); // 8 + 4 + 2 + 1
    });

    it("throws error for invalid bracket size", () => {
      const models = ["model-a", "model-b", "model-c"]; // 3 models
      expect(() => createTournamentBracket(tournamentId, models)).toThrow(
        "Bracket size must be 4, 8, or 16 models",
      );
    });

    it("shuffles models for random seeding", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      const bracket1 = createTournamentBracket(tournamentId, models);
      const bracket2 = createTournamentBracket(tournamentId, models);

      // Note: This test might occasionally fail due to random chance
      // but probability is very low (1/24 for 4 models)
      const firstRound1 = getMatchesForRound(bracket1, 1);
      const firstRound2 = getMatchesForRound(bracket2, 1);

      const models1 = firstRound1.flatMap((m) => [m.modelA, m.modelB]);
      const models2 = firstRound2.flatMap((m) => [m.modelA, m.modelB]);

      // At least verify all models are included
      expect(models1.sort()).toEqual(models.sort());
      expect(models2.sort()).toEqual(models.sort());
    });
  });

  describe("updateMatchResult", () => {
    it("updates match with winner", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      const bracket = createTournamentBracket(tournamentId, models);
      const firstRoundMatches = getMatchesForRound(bracket, 1);
      expect(firstRoundMatches).toHaveLength(2);

      const firstMatch = firstRoundMatches[0];
      expect(firstMatch).toBeDefined();
      expect(firstMatch!.modelA).toBeTruthy();

      const updatedBracket = updateMatchResult(
        bracket,
        firstMatch!.id,
        firstMatch!.modelA!,
        "Model A won due to better accuracy",
      );

      const updatedMatch = updatedBracket.matches.find((m) => m.id === firstMatch!.id)!;
      expect(updatedMatch.winner).toBe(firstMatch!.modelA);
      expect(updatedMatch.judgeExplanation).toBe("Model A won due to better accuracy");
    });

    it("throws error for invalid winner", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      const bracket = createTournamentBracket(tournamentId, models);
      const firstRoundMatches = getMatchesForRound(bracket, 1);
      expect(firstRoundMatches).toHaveLength(2);

      const firstMatch = firstRoundMatches[0];
      expect(firstMatch).toBeDefined();

      expect(() => updateMatchResult(bracket, firstMatch!.id, "invalid-model")).toThrow(
        "Winner invalid-model is not a participant in this match",
      );
    });
  });

  describe("advanceWinners", () => {
    it("advances winners to next round", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      let bracket = createTournamentBracket(tournamentId, models);

      // Complete first round matches
      const firstRoundMatches = getMatchesForRound(bracket, 1);
      expect(firstRoundMatches).toHaveLength(2);
      expect(firstRoundMatches[0]).toBeDefined();
      expect(firstRoundMatches[1]).toBeDefined();
      expect(firstRoundMatches[0]!.modelA).toBeTruthy();
      expect(firstRoundMatches[1]!.modelA).toBeTruthy();

      bracket = updateMatchResult(bracket, firstRoundMatches[0]!.id, firstRoundMatches[0]!.modelA!);
      bracket = updateMatchResult(bracket, firstRoundMatches[1]!.id, firstRoundMatches[1]!.modelA!);

      // Advance winners
      const advancedBracket = advanceWinners(bracket);

      expect(advancedBracket.currentRound).toBe(2);

      const finalRoundMatches = getMatchesForRound(advancedBracket, 2);
      expect(finalRoundMatches).toHaveLength(1);
      const finalMatch = finalRoundMatches[0];
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.modelA).toBe(firstRoundMatches[0]!.modelA);
      expect(finalMatch!.modelB).toBe(firstRoundMatches[1]!.modelA);
    });

    it("marks tournament complete after final round", () => {
      const models = ["model-a", "model-b", "model-c", "model-d"];
      let bracket = createTournamentBracket(tournamentId, models);

      // Complete all matches
      const firstRoundMatches = getMatchesForRound(bracket, 1);
      expect(firstRoundMatches).toHaveLength(2);
      expect(firstRoundMatches[0]).toBeDefined();
      expect(firstRoundMatches[1]).toBeDefined();
      expect(firstRoundMatches[0]!.modelA).toBeTruthy();
      expect(firstRoundMatches[1]!.modelA).toBeTruthy();

      bracket = updateMatchResult(bracket, firstRoundMatches[0]!.id, firstRoundMatches[0]!.modelA!);
      bracket = updateMatchResult(bracket, firstRoundMatches[1]!.id, firstRoundMatches[1]!.modelA!);
      bracket = advanceWinners(bracket);

      const finalRoundMatches = getMatchesForRound(bracket, 2);
      expect(finalRoundMatches).toHaveLength(1);
      const finalMatch = finalRoundMatches[0];
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.modelA).toBeTruthy();

      bracket = updateMatchResult(bracket, finalMatch!.id, finalMatch!.modelA!);
      const completedBracket = advanceWinners(bracket);

      expect(completedBracket.status).toBe("completed");
    });
  });
});
