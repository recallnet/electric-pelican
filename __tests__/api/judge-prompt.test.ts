/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/judge-prompt/route";
import { generateJudgePrompt } from "@/lib/judge-prompt";

// Mock the judge prompt generation
jest.mock("@/lib/judge-prompt");
const mockGenerateJudgePrompt = generateJudgePrompt as jest.MockedFunction<
  typeof generateJudgePrompt
>;

describe("/api/judge-prompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns success response with valid input", async () => {
    mockGenerateJudgePrompt.mockResolvedValue("Generated judge instructions for evaluation.");

    const request = new NextRequest("http://localhost:3000/api/judge-prompt", {
      method: "POST",
      body: JSON.stringify({ challengePrompt: "Translate this to French" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.judgePrompt).toBe("Generated judge instructions for evaluation.");
    expect(data.error).toBeUndefined();
  });

  it("returns 400 for missing challengePrompt", async () => {
    const request = new NextRequest("http://localhost:3000/api/judge-prompt", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("challengePrompt is required and must be a string");
  });

  it("returns 500 for generation failure", async () => {
    mockGenerateJudgePrompt.mockRejectedValue(new Error("OpenRouter API error"));

    const request = new NextRequest("http://localhost:3000/api/judge-prompt", {
      method: "POST",
      body: JSON.stringify({ challengePrompt: "Some prompt" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("OpenRouter API error");
  });
});
