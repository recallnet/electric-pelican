import { POST } from "@/app/api/challenge-generator/route";
import { NextRequest } from "next/server";

// Mock the capability analytics functions
jest.mock("@/lib/capability-analytics", () => ({
  getLeastMeasuredCapabilities: jest.fn(),
  getUnmeasuredCapabilities: jest.fn(),
}));

// Mock the tag taxonomy functions
jest.mock("@/lib/tag-taxonomy", () => ({
  getTagInfo: jest.fn(),
}));

import {
  getLeastMeasuredCapabilities,
  getUnmeasuredCapabilities,
} from "@/lib/capability-analytics";
import { getTagInfo } from "@/lib/tag-taxonomy";

const mockGetLeastMeasuredCapabilities = getLeastMeasuredCapabilities as jest.MockedFunction<
  typeof getLeastMeasuredCapabilities
>;
const mockGetUnmeasuredCapabilities = getUnmeasuredCapabilities as jest.MockedFunction<
  typeof getUnmeasuredCapabilities
>;
const mockGetTagInfo = getTagInfo as jest.MockedFunction<typeof getTagInfo>;

// Mock OpenRouter API
const mockOpenRouterResponse = {
  choices: [
    {
      message: {
        content:
          "Design a sustainable city of the future that addresses climate change, incorporates renewable energy, and promotes social equity. Include specific technologies and urban planning strategies.",
      },
    },
  ],
};

// Mock fetch globally
global.fetch = jest.fn();

describe("/api/challenge-generator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";

    // Setup default mocks for capability analytics
    mockGetLeastMeasuredCapabilities.mockResolvedValue([
      {
        tagId: "scene-understanding",
        tagName: "Scene Understanding",
        tagDescription: "Understanding visual scenes and spatial relationships",
        avgMatchesPerModel: 2,
        totalModels: 5,
        totalMatches: 10,
      },
      {
        tagId: "creative-writing",
        tagName: "Creative Writing",
        tagDescription: "Generating creative and artistic written content",
        avgMatchesPerModel: 1,
        totalModels: 3,
        totalMatches: 3,
      },
      {
        tagId: "algorithm-implementation",
        tagName: "Algorithm Implementation",
        tagDescription: "Writing code to solve algorithmic problems",
        avgMatchesPerModel: 0,
        totalModels: 2,
        totalMatches: 0,
      },
    ]);

    mockGetUnmeasuredCapabilities.mockResolvedValue([]);

    mockGetTagInfo.mockImplementation((tagId: string) => ({
      id: tagId,
      name: tagId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Description for ${tagId}`,
      level: 3,
      parentId: "parent-id",
    }));
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it("should generate a creative challenge successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOpenRouterResponse,
    });

    const request = new NextRequest("http://localhost:3000/api/challenge-generator", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      challenge:
        "Design a sustainable city of the future that addresses climate change, incorporates renewable energy, and promotes social equity. Include specific technologies and urban planning strategies.",
      targetedCapabilities: expect.arrayContaining([
        expect.objectContaining({
          tagId: expect.any(String),
          tagName: expect.any(String),
          avgMatches: expect.any(Number),
        }),
      ]),
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining("anthropic/claude-3.5-haiku"),
      }),
    );

    // Verify database functions were called
    expect(mockGetLeastMeasuredCapabilities).toHaveBeenCalledWith(3);
    expect(mockGetUnmeasuredCapabilities).toHaveBeenCalled();
  });

  it("should handle OpenRouter API errors", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const request = new NextRequest("http://localhost:3000/api/challenge-generator", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("should handle empty responses", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "",
            },
          },
        ],
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/challenge-generator", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("should handle missing API key", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const request = new NextRequest("http://localhost:3000/api/challenge-generator", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("should prioritize unmeasured capabilities when available", async () => {
    // Mock unmeasured capabilities being available
    mockGetUnmeasuredCapabilities.mockResolvedValue([
      "unmeasured-capability-1",
      "unmeasured-capability-2",
      "unmeasured-capability-3",
    ]);

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOpenRouterResponse,
    });

    const request = new NextRequest("http://localhost:3000/api/challenge-generator", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.targetedCapabilities).toHaveLength(3);
    expect(data.targetedCapabilities[0].avgMatches).toBe(0); // Unmeasured capabilities have 0 matches
  });
});
