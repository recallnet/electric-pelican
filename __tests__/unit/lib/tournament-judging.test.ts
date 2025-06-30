import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  judgeMatchup,
  judgeCurrentRound,
  runTournamentJudging,
  getTournamentWinner,
  parseWinner,
} from "@/lib/tournament-judging";
import { TournamentBracket } from "@/types/tournament";
import * as openRouterClient from "@/lib/openrouter-client";

// Mock the OpenRouter client
jest.mock("@/lib/openrouter-client");
const mockCallOpenRouter = jest.mocked(openRouterClient.callOpenRouter);

// Mock console to avoid noise in tests
const originalConsole = console;
beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  jest.clearAllMocks();
});

describe("parseWinner", () => {
  it("should parse WINNER: A correctly", () => {
    expect(parseWinner("After careful analysis, WINNER: A")).toBe("A");
  });

  it("should parse WINNER: B correctly", () => {
    expect(parseWinner("Based on the criteria, WINNER: B")).toBe("B");
  });

  it("should handle case insensitive parsing", () => {
    expect(parseWinner("winner: a")).toBe("A");
    expect(parseWinner("WINNER: b")).toBe("B");
  });

  it("should handle extra whitespace", () => {
    expect(parseWinner("WINNER:   A")).toBe("A");
    expect(parseWinner("WINNER:\tB")).toBe("B");
  });

  it("should return null for invalid format", () => {
    expect(parseWinner("No winner declared")).toBeNull();
    expect(parseWinner("WINNER: C")).toBeNull();
    expect(parseWinner("")).toBeNull();
  });
});

describe("judgeMatchup", () => {
  const mockResponse = {
    id: "test-response-id",
    object: "chat.completion",
    created: Date.now(),
    model: "test-judge-model",
    choices: [
      {
        message: {
          content: "Model A provides a better response. WINNER: A",
          role: "assistant",
        },
        index: 0,
        finish_reason: "stop",
      },
    ],
  };

  beforeEach(() => {
    mockCallOpenRouter.mockResolvedValue(mockResponse);
  });

  it("should successfully judge a matchup on first attempt", async () => {
    const result = await judgeMatchup(
      "Test challenge",
      "Compare responses",
      "test-judge-model",
      "model-a",
      "model-b",
      "Response A",
      "Response B",
    );

    expect(result.winner).toBe("model-a");
    expect(result.explanation).toBe("Model A provides a better response. WINNER: A");
    expect(mockCallOpenRouter).toHaveBeenCalledTimes(1);
  });

  it("should retry on empty response and succeed on second attempt", async () => {
    // First call returns empty, second succeeds
    mockCallOpenRouter
      .mockResolvedValueOnce({
        id: "test-empty-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [{ message: { content: "", role: "assistant" }, index: 0, finish_reason: "stop" }],
      })
      .mockResolvedValueOnce(mockResponse);

    const result = await judgeMatchup(
      "Test challenge",
      "Compare responses",
      "test-judge-model",
      "model-a",
      "model-b",
      "Response A",
      "Response B",
    );

    expect(result.winner).toBe("model-a");
    expect(mockCallOpenRouter).toHaveBeenCalledTimes(2);
  });

  it("should fail after 3 empty responses", async () => {
    mockCallOpenRouter.mockResolvedValue({
      id: "test-empty-id",
      object: "chat.completion",
      created: Date.now(),
      model: "test-judge-model",
      choices: [{ message: { content: "", role: "assistant" }, index: 0, finish_reason: "stop" }],
    });

    await expect(
      judgeMatchup(
        "Test challenge",
        "Compare responses",
        "test-judge-model",
        "model-a",
        "model-b",
        "Response A",
        "Response B",
      ),
    ).rejects.toThrow("Empty response from judge model");

    expect(mockCallOpenRouter).toHaveBeenCalledTimes(3);
  });

  it("should use fallback parsing when WINNER format is missing", async () => {
    mockCallOpenRouter.mockResolvedValue({
      id: "test-fallback-id",
      object: "chat.completion",
      created: Date.now(),
      model: "test-judge-model",
      choices: [
        {
          message: {
            content: "model-a is clearly superior in this comparison",
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
    });

    const result = await judgeMatchup(
      "Test challenge",
      "Compare responses",
      "test-judge-model",
      "model-a",
      "model-b",
      "Response A",
      "Response B",
    );

    expect(result.winner).toBe("model-a");
    expect(result.explanation).toContain("[Winner determined by fallback analysis]");
  });

  it("should use random fallback when no clear winner can be determined", async () => {
    mockCallOpenRouter.mockResolvedValue({
      id: "test-random-id",
      object: "chat.completion",
      created: Date.now(),
      model: "test-judge-model",
      choices: [
        {
          message: {
            content: "Both responses have merit",
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
    });

    const result = await judgeMatchup(
      "Test challenge",
      "Compare responses",
      "test-judge-model",
      "model-a",
      "model-b",
      "Response A",
      "Response B",
    );

    expect(["model-a", "model-b"]).toContain(result.winner);
    expect(result.explanation).toContain("[Winner determined randomly due to parsing failure]");
  });
});

describe("judgeCurrentRound", () => {
  const createMockBracket = (): TournamentBracket => ({
    tournamentId: "test-tournament",
    bracketSize: 4,
    totalRounds: 2,
    currentRound: 1,
    status: "models_executed",
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        modelA: "model-a",
        modelB: "model-b",
        winner: null,
      },
      {
        id: "match-2",
        round: 1,
        position: 2,
        modelA: "model-c",
        modelB: "model-d",
        winner: null,
      },
      {
        id: "match-3",
        round: 2,
        position: 1,
        modelA: null,
        modelB: null,
        winner: null,
      },
    ],
    modelResponses: {
      "model-a": { response: "Response A", status: "success", timestamp: Date.now() },
      "model-b": { response: "Response B", status: "success", timestamp: Date.now() },
      "model-c": { response: "Response C", status: "success", timestamp: Date.now() },
      "model-d": { response: "Response D", status: "success", timestamp: Date.now() },
    },
  });

  beforeEach(() => {
    mockCallOpenRouter
      .mockResolvedValueOnce({
        id: "test-round-1-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [
          {
            message: { content: "Model A wins. WINNER: A", role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "test-round-2-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [
          {
            message: { content: "Model C wins. WINNER: A", role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      });
  });

  it("should judge all matches in current round", async () => {
    const bracket = createMockBracket();

    const result = await judgeCurrentRound(
      bracket,
      "Test challenge",
      "Compare responses",
      "test-judge-model",
    );

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]!.winner).toBe("model-a");
    expect(result.matches[1]!.winner).toBe("model-c");

    // Check that bracket is updated
    const match1 = result.updatedBracket.matches.find((m) => m.id === "match-1");
    const match2 = result.updatedBracket.matches.find((m) => m.id === "match-2");

    expect(match1?.winner).toBe("model-a");
    expect(match2?.winner).toBe("model-c");
  });

  it("should handle model failures with forfeit", async () => {
    const bracket = createMockBracket();
    // Make model-b fail
    bracket.modelResponses!["model-b"] = {
      response: "",
      status: "failed",
      error: "Model failed",
      timestamp: Date.now(),
    };

    const result = await judgeCurrentRound(
      bracket,
      "Test challenge",
      "Compare responses",
      "test-judge-model",
    );

    // First match should be won by forfeit (model-a wins because model-b failed)
    expect(result.matches[0]!.winner).toBe("model-a");
    expect(result.matches[0]!.judgeExplanation).toContain("wins by forfeit");

    // Second match should be judged normally
    expect(result.matches[1]!.winner).toBe("model-c");
  });

  it("should throw error when no matches are ready", async () => {
    const bracket = createMockBracket();
    // Mark all matches as already having winners
    bracket.matches.forEach((match) => {
      if (match.round === 1) {
        match.winner = "some-model";
      }
    });

    await expect(
      judgeCurrentRound(bracket, "Test challenge", "Compare responses", "test-judge-model"),
    ).rejects.toThrow("No matches ready for judging in current round");
  });

  it("should throw error when models haven't been executed", async () => {
    const bracket = createMockBracket();
    delete bracket.modelResponses;

    await expect(
      judgeCurrentRound(bracket, "Test challenge", "Compare responses", "test-judge-model"),
    ).rejects.toThrow("Tournament models have not been executed yet");
  });
});

describe("runTournamentJudging", () => {
  const createCompleteBracket = (): TournamentBracket => ({
    tournamentId: "test-tournament",
    bracketSize: 4,
    totalRounds: 2,
    currentRound: 1,
    status: "models_executed",
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        modelA: "model-a",
        modelB: "model-b",
        winner: null,
      },
      {
        id: "match-2",
        round: 1,
        position: 2,
        modelA: "model-c",
        modelB: "model-d",
        winner: null,
      },
      {
        id: "match-3",
        round: 2,
        position: 1,
        modelA: null,
        modelB: null,
        winner: null,
      },
    ],
    modelResponses: {
      "model-a": { response: "Response A", status: "success", timestamp: Date.now() },
      "model-b": { response: "Response B", status: "success", timestamp: Date.now() },
      "model-c": { response: "Response C", status: "success", timestamp: Date.now() },
      "model-d": { response: "Response D", status: "success", timestamp: Date.now() },
    },
  });

  beforeEach(() => {
    // Mock responses for complete tournament
    mockCallOpenRouter
      // Round 1, Match 1: model-a wins
      .mockResolvedValueOnce({
        id: "test-match-1-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [
          {
            message: { content: "Model A is better. WINNER: A", role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      })
      // Round 1, Match 2: model-c wins
      .mockResolvedValueOnce({
        id: "test-match-2-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [
          {
            message: { content: "Model C is better. WINNER: A", role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      })
      // Round 2, Final: model-a wins
      .mockResolvedValueOnce({
        id: "test-final-id",
        object: "chat.completion",
        created: Date.now(),
        model: "test-judge-model",
        choices: [
          {
            message: { content: "Model A is the champion. WINNER: A", role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      });
  });

  it("should complete entire tournament judging", async () => {
    const bracket = createCompleteBracket();

    const result = await runTournamentJudging(
      bracket,
      "Test challenge",
      "Compare responses",
      "test-judge-model",
    );

    expect(result.finalBracket.status).toBe("completed");
    expect(result.allMatches).toHaveLength(3); // 2 in round 1, 1 in round 2

    // Verify final winner
    const winner = getTournamentWinner(result.finalBracket);
    expect(winner).toBe("model-a");
  });

  it("should advance winners correctly between rounds", async () => {
    const bracket = createCompleteBracket();

    const result = await runTournamentJudging(
      bracket,
      "Test challenge",
      "Compare responses",
      "test-judge-model",
    );

    // Check that round 2 match has the correct participants
    const finalMatch = result.finalBracket.matches.find((m) => m.round === 2);
    expect(finalMatch?.modelA).toBe("model-a");
    expect(finalMatch?.modelB).toBe("model-c");
    expect(finalMatch?.winner).toBe("model-a");
  });
});

describe("getTournamentWinner", () => {
  it("should return winner from completed tournament", () => {
    const bracket: TournamentBracket = {
      tournamentId: "test",
      bracketSize: 4,
      totalRounds: 2,
      currentRound: 2,
      status: "completed",
      matches: [
        {
          id: "final",
          round: 2,
          position: 1,
          modelA: "model-a",
          modelB: "model-b",
          winner: "model-a",
        },
      ],
    };

    expect(getTournamentWinner(bracket)).toBe("model-a");
  });

  it("should return null for incomplete tournament", () => {
    const bracket: TournamentBracket = {
      tournamentId: "test",
      bracketSize: 4,
      totalRounds: 2,
      currentRound: 1,
      status: "running",
      matches: [],
    };

    expect(getTournamentWinner(bracket)).toBeNull();
  });

  it("should return null when no final match winner", () => {
    const bracket: TournamentBracket = {
      tournamentId: "test",
      bracketSize: 4,
      totalRounds: 2,
      currentRound: 2,
      status: "completed",
      matches: [
        {
          id: "final",
          round: 2,
          position: 1,
          modelA: "model-a",
          modelB: "model-b",
          winner: null,
        },
      ],
    };

    expect(getTournamentWinner(bracket)).toBeNull();
  });
});
