/**
 * @file Tournament mock data utilities
 * @description Standardized mock data for tournament testing
 */

export const createTournamentTestData = () => ({
  // Tournament structure
  tournament: {
    id: "test-tournament-123",
    name: "Test Tournament",
    status: "active",
    currentRound: 1,
    totalRounds: 3,
    participants: [
      {
        id: "openai/gpt-4",
        name: "GPT-4",
        currentElo: 1400,
        hierarchicalScores: {
          reasoning: 1450,
          creativity: 1380,
          "code-generation": 1420,
        },
      },
      {
        id: "anthropic/claude-3-sonnet",
        name: "Claude 3 Sonnet",
        currentElo: 1350,
        hierarchicalScores: {
          reasoning: 1380,
          creativity: 1420,
          "code-generation": 1320,
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Matchup data
  matchup: {
    id: "matchup-123",
    tournamentId: "test-tournament-123",
    round: 1,
    modelA: "openai/gpt-4",
    modelB: "anthropic/claude-3-sonnet",
    prompt: "Write a creative story about AI",
    responseA: "GPT-4 creative response...",
    responseB: "Claude creative response...",
    judgeResponse: {
      winner: "modelA",
      reasoning: "GPT-4 provided more creative and engaging content",
      scores: {
        creativity: { modelA: 8, modelB: 7 },
        coherence: { modelA: 9, modelB: 8 },
        originality: { modelA: 8, modelB: 7 },
      },
    },
    tags: ["creativity", "storytelling"],
    status: "judged",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Judge response format
  judgeResponse: {
    winner: "modelA",
    reasoning: "Model A provided superior response quality",
    confidence: 0.85,
    categories: {
      "technical-accuracy": { modelA: 8, modelB: 6 },
      clarity: { modelA: 9, modelB: 7 },
      completeness: { modelA: 8, modelB: 7 },
    },
  },

  // ELO update data
  eloUpdates: {
    global: {
      "openai/gpt-4": { before: 1400, after: 1415, change: +15 },
      "anthropic/claude-3-sonnet": { before: 1350, after: 1335, change: -15 },
    },
    hierarchical: {
      creativity: {
        "openai/gpt-4": { before: 1450, after: 1468, change: +18 },
        "anthropic/claude-3-sonnet": { before: 1420, after: 1402, change: -18 },
      },
    },
  },

  // Tournament progress data
  tournamentProgress: {
    completed: {
      id: "test-tournament-complete",
      status: "completed",
      currentRound: 3,
      totalRounds: 3,
      progress: 100,
    },
    inProgress: {
      id: "test-tournament-progress",
      status: "judging",
      currentRound: 2,
      totalRounds: 3,
      progress: 50, // Midway through
    },
    justStarted: {
      id: "test-tournament-started",
      status: "judging",
      currentRound: 1,
      totalRounds: 3,
      progress: 25, // Early in tournament
    },
  },

  // Streaming events for tournament execution
  streamingEvents: [
    {
      type: "tournament_started",
      timestamp: Date.now(),
      data: { tournamentId: "test-tournament-123", totalRounds: 3 },
    },
    {
      type: "round_started",
      timestamp: Date.now() + 1000,
      data: { round: 1, matchCount: 2 },
    },
    {
      type: "match_completed",
      timestamp: Date.now() + 2000,
      data: { matchId: "match-1", winner: "model-a", loser: "model-b" },
    },
    {
      type: "round_completed",
      timestamp: Date.now() + 3000,
      data: { round: 1, advancingModels: ["model-a", "model-c"] },
    },
    {
      type: "tournament_completed",
      timestamp: Date.now() + 5000,
      data: { champion: "model-a", totalMatches: 3 },
    },
  ],

  // Mock bracket structure
  createMockBracket: (models: string[]) => {
    const bracketSize = models.length;
    const totalRounds = Math.log2(bracketSize);
    const matches = [];
    let matchId = 1;

    // Create all matches for all rounds
    let currentModels = [...models];

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = currentModels.length / 2;

      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          id: `match-${matchId++}`,
          round,
          position: i + 1,
          modelA: round === 1 ? currentModels[i * 2] : null,
          modelB: round === 1 ? currentModels[i * 2 + 1] : null,
          winner: null,
        });
      }

      // For subsequent rounds, models will be determined by winners
      currentModels = new Array(matchesInRound).fill(null);
    }

    return {
      tournamentId: "test-tournament-123",
      bracketSize,
      totalRounds,
      currentRound: 1,
      status: "models_executed" as const,
      matches,
      modelResponses: Object.fromEntries(
        models.map((model) => [
          model,
          {
            status: "success" as const,
            response: `Test response from ${model}`,
            timestamp: Date.now(),
          },
        ]),
      ),
    };
  },
});

/**
 * Creates standardized ELO update mocks for testing
 */
export const createEloUpdateMocks = () => ({
  global: [
    { modelId: "model-a", oldScore: 1200, newScore: 1216, change: 16 },
    { modelId: "model-b", oldScore: 1200, newScore: 1184, change: -16 },
  ],
  hierarchical: [
    {
      modelId: "model-a",
      tagUpdates: [
        {
          modelId: "model-a",
          tagId: "scene-understanding",
          oldScore: 1200,
          newScore: 1216,
          change: 16,
        },
      ],
      globalUpdate: { oldScore: 1200, newScore: 1216, change: 16 },
    },
    {
      modelId: "model-b",
      tagUpdates: [
        {
          modelId: "model-b",
          tagId: "scene-understanding",
          oldScore: 1200,
          newScore: 1184,
          change: -16,
        },
      ],
      globalUpdate: { oldScore: 1200, newScore: 1184, change: -16 },
    },
  ],
});

/**
 * Creates standardized streaming judge manager mock
 */
export const createStreamingJudgeManagerMock = () => ({
  judgeMatchup: jest.fn(),
  subscribeToUpdates: jest.fn(),
  getStatus: jest.fn(),
  startTournament: jest.fn(),
  stopTournament: jest.fn(),
});
