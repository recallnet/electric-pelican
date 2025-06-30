import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ModelList } from "@/components/models/ModelList";
import { ProcessedModel } from "@/types/models";

// Mock ModelLink component
jest.mock("@/components/leaderboard/ModelLink", () => ({
  ModelLink: ({ modelId, className }: { modelId: string; className?: string }) => (
    <span className={className}>{modelId === "gpt-4" ? "GPT-4" : "Claude 3 Sonnet"}</span>
  ),
}));

// Mock SWR
jest.mock("swr", () => ({
  __esModule: true,
  default: () => ({
    data: {
      models: [
        { modelId: "gpt-4", globalScore: 1500 },
        { modelId: "claude-3-sonnet", globalScore: 1400 },
      ],
    },
    error: null,
    isLoading: false,
  }),
}));

// Mock useModelSearch hook
jest.mock("@/hooks/useModelSearch", () => ({
  useModelSearch: ({ initialModels }: { initialModels: ProcessedModel[] }) => ({
    searchQuery: "",
    setSearchQuery: jest.fn(),
    models: initialModels,
  }),
}));

expect.extend(toHaveNoViolations);

describe("ModelList", () => {
  const sampleModels: ProcessedModel[] = [
    {
      id: "gpt-4",
      name: "GPT-4",
      description: "Advanced language model",
      provider: "openai",
      rank: 1,
      tokens_served: 1000000,
      isNew: false,
      capabilities: ["text"],
      context_length: 8192,
      created: 1678896000,
      input_modalities: ["text"],
      output_modalities: ["text"],
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      description: "Constitutional AI model",
      provider: "anthropic",
      rank: 2,
      tokens_served: 800000,
      isNew: true,
      capabilities: ["text"],
      context_length: 100000,
      created: Date.now() / 1000 - 86400,
      input_modalities: ["text"],
      output_modalities: ["text"],
    },
  ];

  const defaultProps = {
    models: sampleModels,
    selectedContestants: [],
    selectedJudge: null,
    maxContestants: 4,
    onToggleContestant: jest.fn(),
    onSelectJudge: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders desktop table layout", () => {
    render(<ModelList {...defaultProps} />);

    // Check desktop table is present
    expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-table")).toHaveClass("hidden", "sm:block");

    // Check model names are rendered (should appear in both layouts)
    expect(screen.getAllByText("GPT-4")).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText("Claude 3 Sonnet")).toHaveLength(2); // Desktop + mobile
  });

  it("renders mobile card layout", () => {
    render(<ModelList {...defaultProps} />);

    // Check mobile cards are present
    expect(screen.getByTestId("mobile-cards")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-cards")).toHaveClass("sm:hidden", "space-y-3");

    // Check model names are rendered in cards (should appear in both layouts)
    expect(screen.getAllByText("GPT-4")).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText("Claude 3 Sonnet")).toHaveLength(2); // Desktop + mobile
  });

  it("displays model information correctly in both layouts", () => {
    render(<ModelList {...defaultProps} />);

    // Check providers (appears in both desktop and mobile)
    expect(screen.getAllByText("openai")).toHaveLength(2);
    expect(screen.getAllByText("anthropic")).toHaveLength(2);

    // Check context lengths (appears in both layouts)
    expect(screen.getAllByText("8,192 tokens")).toHaveLength(2);
    expect(screen.getAllByText("100,000 tokens")).toHaveLength(2);

    // Check ratings (appears in both layouts)
    expect(screen.getAllByText("1500")).toHaveLength(2);
    expect(screen.getAllByText("1400")).toHaveLength(2);

    // Check "New" badge (appears in both layouts)
    expect(screen.getAllByText("New")).toHaveLength(2);
  });

  it("maintains selection functionality in mobile cards", () => {
    const mockToggleContestant = jest.fn();
    const mockSelectJudge = jest.fn();

    render(
      <ModelList
        {...defaultProps}
        onToggleContestant={mockToggleContestant}
        onSelectJudge={mockSelectJudge}
      />,
    );

    // Find and click Add button (should have multiple instances)
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]!);
    expect(mockToggleContestant).toHaveBeenCalledWith("gpt-4");

    // Find and click Set Judge button (should have multiple instances)
    const judgeButtons = screen.getAllByRole("button", { name: "Set Judge" });
    expect(judgeButtons.length).toBeGreaterThan(0);
    fireEvent.click(judgeButtons[0]!);
    expect(mockSelectJudge).toHaveBeenCalledWith("gpt-4");
  });

  it("shows correct button states for selected models", () => {
    render(
      <ModelList
        {...defaultProps}
        selectedContestants={["gpt-4"]}
        selectedJudge="claude-3-sonnet"
      />,
    );

    // Check Remove button for selected contestant (appears in both layouts)
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);

    // Check Remove Judge button for selected judge (appears in both layouts)
    expect(screen.getAllByRole("button", { name: "Remove Judge" })).toHaveLength(2);
  });

  it("disables Add button when max contestants reached", () => {
    render(
      <ModelList
        {...defaultProps}
        selectedContestants={["gpt-4", "claude-3-sonnet", "model-3", "model-4"]}
        maxContestants={4}
      />,
    );

    // All Add buttons should be disabled or show Remove
    const addButtons = screen.queryAllByRole("button", { name: "Add" });
    addButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("renders search and filter controls", () => {
    render(<ModelList {...defaultProps} />);

    // Check search input
    expect(screen.getByPlaceholderText("Search models...")).toBeInTheDocument();

    // Check filter buttons
    expect(screen.getByRole("button", { name: /new models/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /top rated/i })).toBeInTheDocument();
  });

  it("has proper touch targets in mobile layout", () => {
    render(<ModelList {...defaultProps} />);

    // Check mobile card buttons have proper height (h-11 = 44px)
    // We need to be specific about mobile buttons since desktop buttons have h-9
    const mobileCards = screen.getByTestId("mobile-cards");
    const mobileButtons = Array.from(mobileCards.querySelectorAll("button"));

    // Ensure we have mobile buttons to test
    expect(mobileButtons.length).toBeGreaterThan(0);

    mobileButtons.forEach((button) => {
      expect(button).toHaveClass("h-11");
    });
  });

  it("has no accessibility violations in desktop layout", async () => {
    const { container } = render(<ModelList {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations in mobile layout", async () => {
    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<ModelList {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
