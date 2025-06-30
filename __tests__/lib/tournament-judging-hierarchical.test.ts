/**
 * @jest-environment node
 */

import { TournamentBracket } from "@/types/tournament";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { createEloUpdateMocks } from "../setup/tournament-mocks";

// Mock the ELO functions with correct import paths
const mockUpdateHierarchicalEloScores = jest.fn();
const mockUpdateEloScores = jest.fn();

jest.mock("@/lib/elo", () => ({
  updateEloScores: mockUpdateEloScores,
  updateHierarchicalEloScores: mockUpdateHierarchicalEloScores,
}));

// Mock the OpenRouter client
jest.mock("@/lib/openrouter-client", () => ({
  callOpenRouter: jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Model A provides a better response. WINNER: A",
        },
      },
    ],
  }),
}));

// Mock model failure tracker
jest.mock("@/lib/model-failure-tracker", () => ({
  trackModelFailure: jest.fn(),
  trackModelSuccess: jest.fn(),
}));

import { runTournamentJudging, judgeCurrentRound } from "@/lib/tournament-judging";

function createTestBracket(models: string[]): TournamentBracket {
  const bracketSize = models.length;
  const totalRounds = Math.log2(bracketSize);

  const bracket: TournamentBracket = {
    tournamentId: "test-tournament",
    bracketSize,
    totalRounds,
    currentRound: 1,
    status: "models_executed",
    matches: [],
    modelResponses: {},
  };

  // Create all matches for all rounds
  let currentModels = [...models];
  let matchId = 1;

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = currentModels.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      bracket.matches.push({
        id: `match-${matchId++}`,
        round,
        position: i + 1,
        modelA: round === 1 ? currentModels[i * 2]! : null,
        modelB: round === 1 ? currentModels[i * 2 + 1]! : null,
        winner: null,
      });
    }

    // For subsequent rounds, models will be determined by winners
    currentModels = new Array(matchesInRound).fill(null);
  }

  // Add model responses for all initial models
  models.forEach((model) => {
    bracket.modelResponses![model] = {
      status: "success",
      response: `Test response from ${model}`,
      timestamp: Date.now(),
    };
  });

  return bracket;
}

describe("Tournament Judging with Hierarchical ELO", () => {
  // const mockData = createTournamentTestData();
  const eloMocks = createEloUpdateMocks();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock return values using standardized data
    mockUpdateEloScores.mockResolvedValue(eloMocks.global);
    mockUpdateHierarchicalEloScores.mockResolvedValue(eloMocks.hierarchical);
  });

  describe("judgeCurrentRound", () => {
    it("should update hierarchical scores when tournament has tags", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      const { updatedBracket, matches } = await judgeCurrentRound(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Verify global ELO was updated
      expect(mockUpdateEloScores).toHaveBeenCalledWith({
        tournamentRunId: "test-run-id",
        roundNumber: 1,
        winnerModelId: "model-a",
        loserModelId: "model-b",
        resultType: "judged",
      });

      // Verify hierarchical ELO was updated
      expect(mockUpdateHierarchicalEloScores).toHaveBeenCalledWith({
        tournamentRunId: "test-run-id",
        roundNumber: 1,
        winnerModelId: "model-a",
        loserModelId: "model-b",
        tournamentTagIds: ["scene-understanding"],
        resultType: "judged",
      });

      expect(matches).toHaveLength(1);
      expect(matches[0]?.winner).toBe("model-a");
      expect(updatedBracket.matches[0]?.winner).toBe("model-a");
    });

    it("should only update global ELO when tournament has no tags", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);

      await judgeCurrentRound(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        undefined, // No hierarchical tags
      );

      // Verify global ELO was updated
      expect(mockUpdateEloScores).toHaveBeenCalled();

      // Verify hierarchical ELO was NOT called
      expect(mockUpdateHierarchicalEloScores).not.toHaveBeenCalled();
    });

    it("should continue tournament execution if hierarchical ELO fails", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      // Mock hierarchical ELO to throw error
      mockUpdateHierarchicalEloScores.mockRejectedValue(new Error("Database connection failed"));

      const { updatedBracket, matches } = await judgeCurrentRound(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Tournament should complete successfully despite hierarchical ELO failure
      expect(matches).toHaveLength(1);
      expect(matches[0]?.winner).toBe("model-a");
      expect(updatedBracket.matches[0]?.winner).toBe("model-a");

      // Global ELO should still be updated
      expect(mockUpdateEloScores).toHaveBeenCalled();

      // Hierarchical ELO should have been attempted
      expect(mockUpdateHierarchicalEloScores).toHaveBeenCalled();
    });

    it("should skip ELO updates for forfeit matches", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      // Mock model B failure
      bracket.modelResponses!["model-b"] = {
        status: "failed",
        response: "",
        timestamp: Date.now(),
        error: "Model failed",
      };

      await judgeCurrentRound(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Neither global nor hierarchical ELO should be updated for forfeit
      expect(mockUpdateEloScores).not.toHaveBeenCalled();
      expect(mockUpdateHierarchicalEloScores).not.toHaveBeenCalled();
    });
  });

  describe("runTournamentJudging", () => {
    it("should update hierarchical scores throughout entire tournament", async () => {
      const bracket = createTestBracket(["model-a", "model-b", "model-c", "model-d"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding", "logical-reasoning"];

      const { finalBracket, allMatches } = await runTournamentJudging(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Should have judged multiple rounds
      expect(allMatches.length).toBeGreaterThan(1);
      expect(finalBracket.status).toBe("completed");

      // Hierarchical ELO should have been called for each legitimate match
      const hierarchicalCalls = mockUpdateHierarchicalEloScores.mock.calls;
      expect(hierarchicalCalls.length).toBeGreaterThan(0);

      // Each call should include both tags
      hierarchicalCalls.forEach((call) => {
        expect(call[0].tournamentTagIds).toEqual(["scene-understanding", "logical-reasoning"]);
      });
    });

    it("should work without tournament run ID", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      const { finalBracket, allMatches } = await runTournamentJudging(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        undefined, // No tournament run ID
        tournamentTagIds,
      );

      // Tournament should complete
      expect(finalBracket.status).toBe("completed");
      expect(allMatches).toHaveLength(1);

      // No ELO updates should occur without tournament run ID
      expect(mockUpdateEloScores).not.toHaveBeenCalled();
      expect(mockUpdateHierarchicalEloScores).not.toHaveBeenCalled();
    });

    it("should handle mixed match types correctly", async () => {
      const bracket = createTestBracket(["model-a", "model-b", "model-c", "model-d"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      // Mock one model failure in first round
      bracket.modelResponses!["model-c"] = {
        status: "failed",
        response: "",
        timestamp: Date.now(),
        error: "Model failed",
      };

      const { finalBracket, allMatches } = await runTournamentJudging(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      expect(finalBracket.status).toBe("completed");

      // Should have both judged and forfeit matches
      const judgedMatches = allMatches.filter((m) => m.resultType === "judged");
      const forfeitMatches = allMatches.filter((m) => m.resultType === "forfeit");

      expect(judgedMatches.length).toBeGreaterThan(0);
      expect(forfeitMatches.length).toBeGreaterThan(0);

      // Only judged matches should trigger hierarchical ELO updates
      const hierarchicalCalls = mockUpdateHierarchicalEloScores.mock.calls;
      expect(hierarchicalCalls.length).toBe(judgedMatches.length);
    });
  });

  describe("Error Resilience", () => {
    it("should isolate global and hierarchical ELO failures", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      // Mock global ELO to succeed but hierarchical to fail
      mockUpdateHierarchicalEloScores.mockRejectedValue(new Error("Hierarchical ELO failed"));

      const { finalBracket } = await runTournamentJudging(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Tournament should complete successfully
      expect(finalBracket.status).toBe("completed");

      // Both should have been attempted
      expect(mockUpdateEloScores).toHaveBeenCalled();
      expect(mockUpdateHierarchicalEloScores).toHaveBeenCalled();
    });

    it("should continue if global ELO fails", async () => {
      const bracket = createTestBracket(["model-a", "model-b"]);
      const tournamentTagIds: HierarchicalTagId[] = ["scene-understanding"];

      // Mock global ELO to fail but not throw
      mockUpdateEloScores.mockRejectedValue(new Error("Global ELO failed"));

      const { finalBracket } = await runTournamentJudging(
        bracket,
        "Test prompt",
        "Judge prompt",
        "test-judge",
        "test-run-id",
        tournamentTagIds,
      );

      // Tournament should complete successfully
      expect(finalBracket.status).toBe("completed");

      // Both should have been attempted
      expect(mockUpdateEloScores).toHaveBeenCalled();
      expect(mockUpdateHierarchicalEloScores).toHaveBeenCalled();
    });
  });
});
