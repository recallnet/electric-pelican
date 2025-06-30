import { generateJudgePrompt } from "@/lib/judge-prompt";
import { callOpenRouter } from "@/lib/openrouter-client";

// Mock the OpenRouter client
jest.mock("@/lib/openrouter-client");
const mockCallOpenRouter = callOpenRouter as jest.MockedFunction<typeof callOpenRouter>;

describe("generateJudgePrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates judge prompt successfully", async () => {
    const mockResponse = {
      id: "test-completion-id",
      object: "chat.completion",
      created: Date.now(),
      model: "anthropic/claude-3-sonnet",
      choices: [
        {
          message: {
            content:
              "Evaluate responses based on accuracy and clarity. Declare winner as Answer A or B.",
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
    };

    mockCallOpenRouter.mockResolvedValue(mockResponse);

    const result = await generateJudgePrompt("Translate this text to Spanish");

    expect(result).toBe(
      "Evaluate responses based on accuracy and clarity. Declare winner as Answer A or B.",
    );
    expect(mockCallOpenRouter).toHaveBeenCalledWith({
      model: "anthropic/claude-3-sonnet",
      messages: [
        {
          role: "user",
          content: expect.stringContaining("Translate this text to Spanish"),
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
  });

  it("throws error for empty challenge prompt", async () => {
    await expect(generateJudgePrompt("")).rejects.toThrow("Challenge prompt cannot be empty");
    await expect(generateJudgePrompt("   ")).rejects.toThrow("Challenge prompt cannot be empty");
  });

  it("throws error when OpenRouter returns empty response", async () => {
    mockCallOpenRouter.mockResolvedValue({
      id: "test-empty-id",
      object: "chat.completion",
      created: Date.now(),
      model: "anthropic/claude-3-sonnet",
      choices: [
        {
          message: { content: "", role: "assistant" },
          index: 0,
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 },
    });

    await expect(generateJudgePrompt("Some prompt")).rejects.toThrow(
      "OpenRouter returned empty response",
    );
  });

  it("throws error when OpenRouter call fails", async () => {
    mockCallOpenRouter.mockRejectedValue(new Error("API error"));

    await expect(generateJudgePrompt("Some prompt")).rejects.toThrow("API error");
  });
});
