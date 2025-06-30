import { callOpenRouter } from "@/lib/openrouter-client";

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve({
      choices: [
        {
          message: { content: "Hello", role: "assistant" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    }),
}) as unknown as typeof fetch;

describe("callOpenRouter", () => {
  const ORIGINAL_KEY = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = ORIGINAL_KEY;
    (global.fetch as jest.Mock).mockClear();
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    process.env.OPENROUTER_API_KEY = "";
    await expect(
      callOpenRouter({ model: "mock", messages: [{ role: "user", content: "Hi" }] }),
    ).rejects.toThrow("OPENROUTER_API_KEY environment variable not set");
  });

  it("calls fetch with correct headers when key is present", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    await callOpenRouter({ model: "mock", messages: [{ role: "user", content: "Hi" }] });

    expect(global.fetch).toHaveBeenCalled();
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("openrouter.ai/api/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-key");
  });
});
