import { POST } from "@/app/api/challenge-generator/route";
import { NextRequest } from "next/server";

// Mock capability analytics
jest.mock("@/lib/capability-analytics");
jest.mock("@/lib/tag-taxonomy");

// Mock fetch for OpenRouter API calls
global.fetch = jest.fn();

describe("Enhanced Challenge Generator API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_SITE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_SITE_URL;
  });

  it("should include capability context in prompt when least-measured capabilities exist", async () => {
    const mockCapabilities = [
      {
        tagId: "algorithm-implementation",
        tagName: "Algorithm Implementation",
        tagDescription: "Ability to implement and optimize algorithms",
        avgMatchesPerModel: 1,
        totalModels: 5,
        totalMatches: 5,
      },
      {
        tagId: "artistic-creation",
        tagName: "Artistic Creation",
        tagDescription: "Creating visual and artistic content",
        avgMatchesPerModel: 2,
        totalModels: 3,
        totalMatches: 6,
      },
    ];

    const {
      getLeastMeasuredCapabilities,
      getUnmeasuredCapabilities,
    } = require("@/lib/capability-analytics");
    getLeastMeasuredCapabilities.mockResolvedValue(mockCapabilities);
    getUnmeasuredCapabilities.mockResolvedValue([]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                "Generated challenge focusing on algorithm implementation: Write Python code to solve the traveling salesman problem.",
            },
          },
        ],
      }),
    });

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);
    const data = await response.json();

    expect(getLeastMeasuredCapabilities).toHaveBeenCalledWith(3);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        body: expect.stringContaining("UNDER-EVALUATED capabilities"),
      }),
    );

    expect(data.challenge).toContain("traveling salesman problem");
    expect(data.targetedCapabilities).toHaveLength(2);
    expect(data.targetedCapabilities[0].tagName).toBe("Algorithm Implementation");
  });

  it("should prefer unmeasured capabilities over least-measured when available", async () => {
    const mockLeastMeasured = [
      {
        tagId: "measured-capability",
        tagName: "Measured Capability",
        tagDescription: "Has some data",
        avgMatchesPerModel: 2,
        totalModels: 3,
        totalMatches: 6,
      },
    ];
    const mockUnmeasured = [
      "unmeasured-capability-1",
      "unmeasured-capability-2",
      "unmeasured-capability-3",
    ];

    const {
      getLeastMeasuredCapabilities,
      getUnmeasuredCapabilities,
    } = require("@/lib/capability-analytics");
    const { getTagInfo } = require("@/lib/tag-taxonomy");

    getLeastMeasuredCapabilities.mockResolvedValue(mockLeastMeasured);
    getUnmeasuredCapabilities.mockResolvedValue(mockUnmeasured);
    getTagInfo.mockImplementation((tagId: string) => ({
      name: `${tagId} Name`,
      description: `${tagId} description`,
    }));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Challenge targeting unmeasured capability",
            },
          },
        ],
      }),
    });

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);
    const data = await response.json();

    // Should use unmeasured capabilities since there are 3+ available
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        body: expect.stringContaining("(0 avg matches/model)"),
      }),
    );

    expect(data.targetedCapabilities).toHaveLength(3);
    expect(data.targetedCapabilities[0].avgMatches).toBe(0);
  });

  it("should handle OpenRouter API errors gracefully", async () => {
    const {
      getLeastMeasuredCapabilities,
      getUnmeasuredCapabilities,
    } = require("@/lib/capability-analytics");
    getLeastMeasuredCapabilities.mockResolvedValue([]);
    getUnmeasuredCapabilities.mockResolvedValue([]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate challenge");
  });

  it("should handle missing OpenRouter API key", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("API configuration error");
  });

  it("should handle capability analytics errors gracefully", async () => {
    const { getLeastMeasuredCapabilities } = require("@/lib/capability-analytics");
    getLeastMeasuredCapabilities.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Internal server error");
  });

  it("should handle empty OpenRouter response", async () => {
    const {
      getLeastMeasuredCapabilities,
      getUnmeasuredCapabilities,
    } = require("@/lib/capability-analytics");
    getLeastMeasuredCapabilities.mockResolvedValue([]);
    getUnmeasuredCapabilities.mockResolvedValue([]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "POST" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Internal server error");
  });

  it("should support GET method by calling POST", async () => {
    const {
      getLeastMeasuredCapabilities,
      getUnmeasuredCapabilities,
    } = require("@/lib/capability-analytics");
    getLeastMeasuredCapabilities.mockResolvedValue([]);
    getUnmeasuredCapabilities.mockResolvedValue([]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Test challenge" } }],
      }),
    });

    const { GET } = require("@/app/api/challenge-generator/route");
    const request = new NextRequest("http://localhost/api/challenge-generator", { method: "GET" });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.challenge).toBe("Test challenge");
  });
});
