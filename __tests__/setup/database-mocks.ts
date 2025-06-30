/**
 * @file Database Mock Utilities
 * @description Comprehensive database mocking utilities for Jest tests
 */

/**
 * Standardized database mocking for tests with lazy imports
 */

export const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
};

export const mockSchema = {
  modelTagScores: {
    modelId: "modelId",
    tagId: "tagId",
    eloScore: "eloScore",
    matchesPlayed: "matchesPlayed",
    wins: "wins",
    losses: "losses",
    updatedAt: "updatedAt",
  },
  modelScores: {
    modelId: "modelId",
    globalScore: "globalScore",
    matchesPlayed: "matchesPlayed",
    wins: "wins",
    losses: "losses",
    updatedAt: "updatedAt",
  },
  matchResults: {
    tournamentRunId: "tournamentRunId",
    roundNumber: "roundNumber",
    winnerModelId: "winnerModelId",
    loserModelId: "loserModelId",
    winnerScoreBefore: "winnerScoreBefore",
    loserScoreBefore: "loserScoreBefore",
    winnerScoreAfter: "winnerScoreAfter",
    loserScoreAfter: "loserScoreAfter",
    resultType: "resultType",
    createdAt: "createdAt",
  },
  users: {
    id: "id",
    displayName: "displayName",
    avatarUrl: "avatarUrl",
    createdAt: "createdAt",
  },
  tournaments: {
    id: "id",
    createdBy: "createdBy",
    tags: "tags",
  },
  models: {
    id: "id",
    name: "name",
    description: "description",
    provider: "provider",
    tokens_served: "tokens_served",
    is_new: "is_new",
    capabilities: "capabilities",
    input_modalities: "input_modalities",
    output_modalities: "output_modalities",
    context_length: "context_length",
    created: "created",
    is_available: "is_available",
    failure_count: "failure_count",
    unavailable_reason: "unavailable_reason",
    elo_score: "elo_score",
    matches_played: "matches_played",
    wins: "wins",
    losses: "losses",
  },
};

/**
 * Setup database mocks - note this just provides the exports
 * The actual jest.mock() calls need to be in each test file
 */
export function setupDatabaseMocks() {
  // Export the mock objects for use in test files
  // Each test file should call the specific jest.mock() with the correct path
  return {
    mockDb,
    mockSchema,
  };
}

/**
 * Reset all database mocks to default state
 */
export function resetDatabaseMocks() {
  Object.values(mockDb).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
      if (mockFn.mockReturnThis) {
        mockFn.mockReturnThis();
      }
    }
  });
}

/**
 * Configure mock database to return specific data
 */
export function configureMockDatabase(config: {
  selectResult?: any[];
  countResult?: number;
  errorOnQuery?: boolean;
}) {
  const { selectResult = [], countResult = 0, errorOnQuery = false } = config;

  if (errorOnQuery) {
    mockDb.select.mockRejectedValue(new Error("Database connection failed"));
    mockDb.limit.mockRejectedValue(new Error("Database connection failed"));
    return;
  }

  // Configure select chain to return the provided result
  mockDb.limit.mockResolvedValue(selectResult);

  // Configure count queries
  if (countResult !== undefined) {
    mockDb.select.mockImplementation(() => {
      const mockChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(selectResult),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      };

      // Handle count queries specifically
      if (selectResult.length === 1 && "count" in selectResult[0]) {
        mockChain.limit.mockResolvedValue([{ count: countResult }]);
      }

      return mockChain;
    });
  }
}

/**
 * Creates the jest.mock calls for database imports
 * Call this in test files to mock database imports
 */
export function createDatabaseMocks() {
  // These should be called in the test files themselves
  const mockCalls = [
    'jest.mock("../../../db", () => ({ db: mockDb }));',
    'jest.mock("../../../db/index", () => ({ db: mockDb }));',
    'jest.mock("../../../db/schema", () => mockSchema);',
    'jest.mock("../../db", () => ({ db: mockDb }));',
    'jest.mock("../../db/index", () => ({ db: mockDb }));',
    'jest.mock("../../db/schema", () => mockSchema);',
    'jest.mock("../../../../db", () => ({ db: mockDb }));',
    'jest.mock("../../../../db/index", () => ({ db: mockDb }));',
    'jest.mock("../../../../db/schema", () => mockSchema);',
  ];

  return mockCalls.join("\n");
}

/**
 * Creates a comprehensive query builder mock with full method chaining support
 *
 * @param finalResult - The result to return from terminal operations
 * @returns Complete mock query builder with all Drizzle ORM methods
 */
export const createFullQueryBuilderMock = (finalResult: any[] = []) => {
  const createChainableMock = (result = finalResult): any => ({
    // Query builder methods that return chainable objects
    select: jest.fn(() => createChainableMock(result)),
    from: jest.fn(() => createChainableMock(result)),
    where: jest.fn(() => createChainableMock(result)),
    orderBy: jest.fn(() => createChainableMock(result)),
    limit: jest.fn(() => createChainableMock(result)),
    offset: jest.fn(() => createChainableMock(result)),
    leftJoin: jest.fn(() => createChainableMock(result)),
    innerJoin: jest.fn(() => createChainableMock(result)),
    rightJoin: jest.fn(() => createChainableMock(result)),
    fullJoin: jest.fn(() => createChainableMock(result)),
    groupBy: jest.fn(() => createChainableMock(result)),
    having: jest.fn(() => createChainableMock(result)),
    distinct: jest.fn(() => createChainableMock(result)),

    // Insert/Update/Delete specific methods
    values: jest.fn(() => createChainableMock(result)),
    onConflictDoNothing: jest.fn(() => createChainableMock(result)),
    onConflictDoUpdate: jest.fn(() => createChainableMock(result)),
    set: jest.fn(() => createChainableMock(result)),
    into: jest.fn(() => createChainableMock(result)),
    returning: jest.fn(() => createChainableMock(result)),

    // Terminal methods that return promises/results
    execute: jest.fn(() => Promise.resolve(result)),
    then: jest.fn((onResolve) => Promise.resolve(result).then(onResolve)),
    catch: jest.fn((onReject) => Promise.resolve(result).catch(onReject)),
    finally: jest.fn((onFinally) => Promise.resolve(result).finally(onFinally)),

    // Make it thenable for await support
    [Symbol.toStringTag]: "Promise",
  });

  return createChainableMock();
};

/**
 * Creates a comprehensive database mock with all query operations
 *
 * @param options - Configuration options for the mock
 * @returns Complete database mock object
 */
export const createComprehensiveDbMock = (
  options: {
    selectResults?: any[];
    insertResults?: any[];
    updateResults?: any[];
    deleteResults?: any[];
  } = {},
) => {
  const {
    selectResults = [],
    insertResults = [{ id: "mock-insert-id" }],
    updateResults = [{ id: "mock-update-id" }],
    deleteResults = [{ id: "mock-delete-id" }],
  } = options;

  return {
    db: {
      select: jest.fn(() => createFullQueryBuilderMock(selectResults)),
      insert: jest.fn(() => createFullQueryBuilderMock(insertResults)),
      update: jest.fn(() => createFullQueryBuilderMock(updateResults)),
      delete: jest.fn(() => createFullQueryBuilderMock(deleteResults)),
      execute: jest.fn(() => Promise.resolve([])),
      transaction: jest.fn((callback) => {
        const mockDb = createFullQueryBuilderMock();
        return callback(mockDb);
      }),
      $with: jest.fn(() => createFullQueryBuilderMock()),
    },
    schema: {
      // Common schema tables
      users: {
        id: "users.id",
        displayName: "users.displayName",
        avatarUrl: "users.avatarUrl",
        provider: "users.provider",
        providerUsername: "users.providerUsername",
        createdAt: "users.createdAt",
        updatedAt: "users.updatedAt",
      },
      tournaments: {
        id: "tournaments.id",
        title: "tournaments.title",
        description: "tournaments.description",
        createdAt: "tournaments.createdAt",
        updatedAt: "tournaments.updatedAt",
      },
      modelTagScores: {
        id: "model_tag_scores.id",
        modelId: "model_tag_scores.model_id",
        tagId: "model_tag_scores.tag_id",
        eloScore: "model_tag_scores.elo_score",
        matchesPlayed: "model_tag_scores.matches_played",
        wins: "model_tag_scores.wins",
        losses: "model_tag_scores.losses",
        createdAt: "model_tag_scores.created_at",
        updatedAt: "model_tag_scores.updated_at",
      },
      modelScores: {
        id: "model_scores.id",
        modelId: "model_scores.model_id",
        eloScore: "model_scores.elo_score",
        matchesPlayed: "model_scores.matches_played",
        wins: "model_scores.wins",
        losses: "model_scores.losses",
        createdAt: "model_scores.created_at",
        updatedAt: "model_scores.updated_at",
      },
    },
  };
};

/**
 * Creates hierarchical ELO specific mock data
 *
 * @returns Mock data for hierarchical ELO operations
 */
export const createHierarchicalEloMocks = () => ({
  // Mock model tag scores
  modelTagScores: [
    {
      id: "score-1",
      modelId: "test-model",
      tagId: "scene-understanding",
      eloScore: 1200,
      matchesPlayed: 5,
      wins: 3,
      losses: 2,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
    },
    {
      id: "score-2",
      modelId: "test-model",
      tagId: "logical-reasoning",
      eloScore: 1250,
      matchesPlayed: 8,
      wins: 6,
      losses: 2,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-03"),
    },
  ],

  // Mock hierarchical scores for leaderboards
  hierarchicalScores: [
    {
      modelId: "test-model",
      tagId: "scene-understanding",
      score: 1250,
      rank: 1,
      totalModels: 10,
      winRate: 0.6,
    },
    {
      modelId: "another-model",
      tagId: "scene-understanding",
      score: 1180,
      rank: 2,
      totalModels: 10,
      winRate: 0.4,
    },
  ],

  // Mock ELO update results
  eloUpdates: [
    {
      modelId: "test-model",
      oldScore: 1200,
      newScore: 1216,
      change: 16,
    },
    {
      modelId: "opponent-model",
      oldScore: 1200,
      newScore: 1184,
      change: -16,
    },
  ],

  // Mock hierarchical update results
  hierarchicalUpdates: [
    {
      modelId: "test-model",
      tagUpdates: [
        {
          tagId: "scene-understanding",
          oldScore: 1200,
          newScore: 1216,
          change: 16,
        },
        {
          tagId: "visual-processing",
          oldScore: 1180,
          newScore: 1196,
          change: 16,
        },
      ],
    },
  ],
});

/**
 * Creates a simple database mock for basic operations
 * Used when you just need basic query mocking without complex chains
 */
export const createSimpleDbMock = () => {
  const mockQueryBuilder = {
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
  };

  return {
    db: {
      select: jest.fn(() => mockQueryBuilder),
      insert: jest.fn(() => mockQueryBuilder),
      update: jest.fn(() => mockQueryBuilder),
      delete: jest.fn(() => mockQueryBuilder),
    },
    schema: {
      users: { id: "users.id" },
      tournaments: { id: "tournaments.id" },
      modelTagScores: { id: "model_tag_scores.id" },
    },
  };
};

/**
 * Standard database mock factory for most test cases
 * This is the recommended mock to use for new tests
 */
export const createStandardDbMock = () => createComprehensiveDbMock();

/**
 * Mock Drizzle ORM functions that are commonly used
 */
export const createDrizzleOrmMocks = () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  not: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn(),
  inArray: jest.fn(),
  notInArray: jest.fn(),
  exists: jest.fn(),
  notExists: jest.fn(),
  between: jest.fn(),
  notBetween: jest.fn(),
  like: jest.fn(),
  notLike: jest.fn(),
  ilike: jest.fn(),
  notIlike: jest.fn(),
  sql: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  count: jest.fn(),
  countDistinct: jest.fn(),
  avg: jest.fn(),
  sum: jest.fn(),
  min: jest.fn(),
  max: jest.fn(),
});

/**
 * Creates a mock for API client functions
 */
export const createApiClientMock = () => ({
  fetch: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
});

// Legacy exports for backward compatibility
export const createStandardDbMockLegacy = createSimpleDbMock;
export const createFullDbMock = createComprehensiveDbMock;

/**
 * Sets up database mocks for dynamic imports used in API routes
 */
export const setupDynamicDbMocks = () => {
  const standardMock = createStandardDbMock();

  // Mock the dynamic import paths used in API routes
  jest.doMock("@/db", () => standardMock);
  jest.doMock("../../../../../db", () => standardMock);
  jest.doMock("../../../../db", () => standardMock);
  jest.doMock("../../../../../../db", () => standardMock);

  // Also mock the index file
  jest.doMock("@/db/index", () => standardMock);
  jest.doMock("../../../../../db/index", () => standardMock);

  return standardMock;
};
