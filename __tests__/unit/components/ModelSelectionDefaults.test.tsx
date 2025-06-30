import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModelSelectionForm } from "@/components/models/ModelSelectionForm";

// Setup mocks
jest.mock("@/lib/api-client", () => {
  return {
    typedApi: jest.fn().mockImplementation((url) => {
      if (url.includes("/api/models")) {
        return Promise.resolve({
          models: [
            {
              id: "deepseek/large",
              name: "DeepSeek Large",
              provider: "deepseek",
              capabilities: { text: true },
              context_length: 8192,
              pricing: { input: 0.0001, output: 0.0002 },
              rank: 1,
            },
            {
              id: "qwen/qwen3",
              name: "Qwen 3",
              provider: "qwen",
              capabilities: { text: true },
              context_length: 8192,
              pricing: { input: 0.0001, output: 0.0002 },
              rank: 2,
            },
            {
              id: "microsoft/phi-4",
              name: "Phi 4",
              provider: "microsoft",
              capabilities: { text: true },
              context_length: 8192,
              pricing: { input: 0.0001, output: 0.0002 },
              rank: 3,
            },
          ],
          cached: false,
        });
      }
      return Promise.resolve({});
    }),
  };
});

// Mock the useDevLogger hook
jest.mock("@/lib/dev-logger", () => ({
  useDevLogger: () => jest.fn(),
}));

// Mock the ModelSelectionForm component's dependencies
jest.mock("@/components/models/ModelList", () => ({
  ModelList: ({ models }: { models: Array<{ id: string; name: string }> }) => (
    <div data-testid="model-list">
      <div>Model List Component</div>
      {models.map((model: { id: string; name: string }) => (
        <div key={model.id} data-testid={`model-${model.id}`}>
          {model.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe("ModelSelectionForm", () => {
  // Mock Element.prototype.scrollIntoView
  beforeAll(() => {
    // Add missing DOM methods used by the component
    Element.prototype.scrollIntoView = jest.fn();
    (global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: jest.fn().mockReturnValue([]),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders with default selections without crashing", async () => {
    const { container } = render(
      <ModelSelectionForm
        defaultBracketSize={4}
        defaultJudge="deepseek/large"
        defaultContestants={["qwen/qwen3", "microsoft/phi-4"]}
      />,
    );

    // Wait for the models to load
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), {
      timeout: 3000,
    });

    // The test should pass if the component renders without crashing
    expect(container).toBeInTheDocument();
  });

  test("handles API error gracefully", async () => {
    // Override the mock with an error
    const mockApiClient = require("@/lib/api-client");
    mockApiClient.typedApi.mockRejectedValueOnce(new Error("API error"));

    render(
      <ModelSelectionForm
        defaultBracketSize={4}
        defaultJudge="deepseek/large"
        defaultContestants={["qwen/qwen3", "microsoft/phi-4"]}
      />,
    );

    // Wait for error message to appear
    expect(
      await screen.findByText(/failed to load models/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test("handles empty model response gracefully", async () => {
    // Override the mock with empty models
    const mockApiClient = require("@/lib/api-client");
    mockApiClient.typedApi.mockResolvedValueOnce({ models: [], cached: false });

    render(
      <ModelSelectionForm
        defaultBracketSize={4}
        defaultJudge="deepseek/large"
        defaultContestants={["qwen/qwen3", "microsoft/phi-4"]}
      />,
    );

    // Should still render without crashing
    await waitFor(() => expect(screen.queryByText(/loading models/i)).not.toBeInTheDocument(), {
      timeout: 3000,
    });

    // Check for the heading - component should render even with empty models
    expect(screen.getByText(/available models/i)).toBeInTheDocument();
  });
});
