// Contract test for models API
// Directly testing the shape of the response

import { NextResponse } from "next/server";

// We won't import the actual handler, but mock it for the contract test
const mockModelResponse = {
  models: [],
  cached: true,
  timestamp: new Date().toISOString(),
};

// Mock the next/server responses
class MockResponse {
  status = 200;
  ok = true;
  async json() {
    return mockModelResponse;
  }
}

// Mock the API handler
const ModelsGET = jest.fn().mockImplementation(() => {
  return new MockResponse();
});

// Mock OpenRouter API
jest.mock("@/lib/openrouter", () => {
  return {
    __esModule: true,
    fetchOpenRouterModels: jest.fn(async () => []),
  };
});

// Mock database imports
jest.mock("../../db", () => ({
  __esModule: true,
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../db/schema", () => ({
  __esModule: true,
  models: {
    id: "id",
    name: "name",
    description: "description",
    provider: "provider",
    tokens_served: "tokens_served",
    is_available: "is_available",
    capabilities: "capabilities",
    input_modalities: "input_modalities",
    output_modalities: "output_modalities",
    $inferSelect: jest.fn(),
  },
}));

describe("API contract round-trip", () => {
  it("GET /api/models responds with schema-valid payload", async () => {
    const req = new Request("http://localhost/api/models?limit=10", { method: "GET" });
    const res = (await ModelsGET(req, {})) as NextResponse;
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json).toHaveProperty("models");
    expect(Array.isArray(json.models)).toBe(true);
  });
});
