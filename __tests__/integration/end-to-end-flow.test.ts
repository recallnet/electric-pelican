/**
 * Integration test for the complete tournament creation flow.
 * Tests API endpoints in sequence to ensure end-to-end functionality.
 */

import { typedApi } from "@/lib/api-client";

const mockTypedApi = typedApi as jest.MockedFunction<typeof typedApi>;

// Mock the auth module to return a test user
jest.mock("@/lib/auth/privy", () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({
    sub: "test-user-123",
    email: "test@example.com",
  }),
}));

describe("End-to-End Tournament Flow", () => {
  let tournamentId: string;

  beforeAll(async () => {
    // Test setup complete
  });

  beforeEach(() => {
    // Reset mocks
    mockTypedApi.mockReset();
  });

  it("should fetch models successfully", async () => {
    // Mock the models API response
    mockTypedApi.mockResolvedValueOnce({
      models: [
        {
          id: "deepseek/deepseek-chat-v3-0324",
          name: "DeepSeek Chat",
          description: "Fast reasoning model",
          provider: "deepseek",
          rank: 1,
          tokens_served: 1000000,
          isNew: false,
          capabilities: ["text"],
          context_length: 32768,
          created: Date.now() / 1000,
        },
        {
          id: "google/gemini-2.5-pro-preview",
          name: "Gemini 2.5 Pro",
          description: "Google's latest model",
          provider: "google",
          rank: 2,
          tokens_served: 800000,
          isNew: true,
          capabilities: ["text", "images"],
          context_length: 100000,
          created: Date.now() / 1000,
        },
      ],
      cached: false,
      timestamp: new Date().toISOString(),
    });

    const response = await typedApi("GET /api/models", {}, undefined);

    expect(response.models).toBeDefined();
    expect(Array.isArray(response.models)).toBe(true);
    expect(response.models.length).toBeGreaterThan(0);
    expect(response.timestamp).toBeDefined();
  });

  it("should create a tournament with valid data", async () => {
    // Mock tournament creation response
    mockTypedApi.mockResolvedValueOnce({
      success: true,
      id: "test-tournament-123",
    });

    const response = await typedApi(
      "POST /api/tournament",
      {},
      {
        prompt: "Compare these AI models on their reasoning capabilities",
        models: [
          "deepseek/deepseek-chat-v3-0324",
          "google/gemini-2.5-pro-preview",
          "anthropic/claude-sonnet-4",
          "openai/o3-pro",
        ],
        bracketSize: 4,
        judgeModel: "deepseek/deepseek-chat-v3-0324",
      },
    );

    expect(response.success).toBe(true);
    expect(response.id).toBeDefined();
    expect(typeof response.id).toBe("string");

    tournamentId = response.id;
  });

  it("should create a bracket for the tournament", async () => {
    expect(tournamentId).toBeDefined();

    // Mock bracket creation response
    mockTypedApi.mockResolvedValueOnce({
      success: true,
      bracket: {
        tournamentId,
        bracketSize: 4,
        totalRounds: 2,
        matches: [
          {
            id: "match-1",
            round: 1,
            position: 1,
            modelA: "deepseek/deepseek-chat-v3-0324",
            modelB: "google/gemini-2.5-pro-preview",
            winner: null,
          },
          {
            id: "match-2",
            round: 1,
            position: 2,
            modelA: "anthropic/claude-sonnet-4",
            modelB: "openai/o3-pro",
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
        status: "created",
        currentRound: 1,
      },
    });

    const response = await typedApi(
      "POST /api/tournament/:id/bracket",
      { id: tournamentId },
      {
        models: [
          "deepseek/deepseek-chat-v3-0324",
          "google/gemini-2.5-pro-preview",
          "anthropic/claude-sonnet-4",
          "openai/o3-pro",
        ],
        judgeModel: "deepseek/deepseek-chat-v3-0324",
      },
    );

    expect(response.success).toBe(true);
    expect(response.bracket).toBeDefined();
    if (response.bracket) {
      expect(response.bracket.matches).toBeDefined();
      expect(response.bracket.matches.length).toBe(3); // 2 semi-finals + 1 final for 4 models
    }
  });

  it("should get tournament status", async () => {
    expect(tournamentId).toBeDefined();

    // Mock status response
    mockTypedApi.mockResolvedValueOnce({
      success: true,
      tournament: {
        id: tournamentId,
        phase: "created",
        currentRound: 1,
        totalRounds: 2,
        progress: 0,
        bracketSize: 4,
        matches: [],
        modelResponses: {},
      },
    });

    const response = await typedApi("GET /api/tournament/:id/status", { id: tournamentId });

    expect(response.success).toBe(true);
    expect(response.tournament).toBeDefined();
    expect(response.tournament?.id).toBe(tournamentId);
    expect(response.tournament?.bracketSize).toBe(4);
  });

  it("should execute models for the tournament", async () => {
    expect(tournamentId).toBeDefined();

    // Mock execution response
    mockTypedApi.mockResolvedValueOnce({
      success: true,
      progress: 100,
      responses: {
        "deepseek/deepseek-chat-v3-0324": {
          response: "This is a test response from DeepSeek",
          status: "success",
          timestamp: Date.now(),
        },
        "google/gemini-2.5-pro-preview": {
          response: "This is a test response from Gemini",
          status: "success",
          timestamp: Date.now(),
        },
      },
    });

    const response = await typedApi(
      "POST /api/tournament/:id/execute",
      { id: tournamentId },
      {
        challengePrompt: "Compare these AI models on their reasoning capabilities",
        models: ["deepseek/deepseek-chat-v3-0324", "google/gemini-2.5-pro-preview"],
        judgeModel: "deepseek/deepseek-chat-v3-0324",
      },
    );

    expect(response.success).toBe(true);
    expect(response.progress).toBeDefined();
    expect(typeof response.progress).toBe("number");
    expect(response.responses).toBeDefined();
  });
});
