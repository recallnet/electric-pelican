/**
 * @file Tests for CapabilitiesTreeView component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CapabilitiesTreeView } from "@/components/capabilities/CapabilitiesTreeView";
import type { TaxonomyNode } from "@/types/taxonomy";

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, "open", { value: mockOpen });

// Mock data
const mockNodes: TaxonomyNode[] = [
  {
    id: "reasoning",
    name: "Reasoning",
    description: "Complex reasoning capabilities",
    level: 1,
    leadingModel: {
      modelId: "gpt-4",
      modelName: "GPT-4",
      provider: "OpenAI",
      eloScore: 1847,
      rank: 1,
    },
    stats: {
      totalMatches: 1200,
      totalModels: 15,
      averageElo: 1600,
    },
    children: [
      {
        id: "math",
        name: "Mathematical Reasoning",
        description: "Advanced mathematical problem solving",
        level: 2,
        leadingModel: {
          modelId: "gpt-4-turbo",
          modelName: "GPT-4 Turbo",
          provider: "OpenAI",
          eloScore: 1823,
          rank: 2,
        },
        stats: {
          totalMatches: 800,
          totalModels: 12,
          averageElo: 1550,
        },
        children: [
          {
            id: "algebra",
            name: "Algebraic Problem Solving",
            description: "Linear and nonlinear algebra",
            level: 3,
            leadingModel: {
              modelId: "claude-3-sonnet",
              modelName: "Claude 3 Sonnet",
              provider: "Anthropic",
              eloScore: 1756,
              rank: 3,
            },
            stats: {
              totalMatches: 400,
              totalModels: 10,
              averageElo: 1500,
            },
            children: [],
          },
        ],
      },
      {
        id: "logic",
        name: "Logical Reasoning",
        description: "Formal logic and deduction",
        level: 2,
        leadingModel: {
          modelId: "gemini-1.5-pro",
          modelName: "Gemini 1.5 Pro",
          provider: "Google",
          eloScore: 1689,
          rank: 4,
        },
        stats: {
          totalMatches: 600,
          totalModels: 8,
          averageElo: 1520,
        },
        children: [],
      },
    ],
  },
];

describe("CapabilitiesTreeView", () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it("renders loading state correctly", () => {
    render(<CapabilitiesTreeView nodes={[]} isLoading={true} />);

    expect(screen.getByText("Loading capabilities...")).toBeInTheDocument();
    // Check that spinner div exists with animation class
    const spinnerDiv = document.querySelector(".animate-spin");
    expect(spinnerDiv).toBeInTheDocument();
  });

  it("renders empty state when no nodes provided", () => {
    render(<CapabilitiesTreeView nodes={[]} />);

    expect(screen.getByText("No capability data available")).toBeInTheDocument();
    expect(screen.getByText("🌳")).toBeInTheDocument();
  });

  it("renders search input correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    const searchInput = screen.getByPlaceholderText("Search capabilities...");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "text");
    expect(searchInput).toHaveAttribute("aria-label", "Search capabilities");
  });

  it("renders desktop table structure correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check desktop table is present (hidden class is for responsive behavior)
    const desktopTable = document.querySelector(".hidden.sm\\:block table");
    expect(desktopTable).toBeInTheDocument();

    // Check table headers (these appear only in desktop table)
    expect(screen.getByText("Capability")).toBeInTheDocument();
    expect(screen.getByText("Stats")).toBeInTheDocument();

    // "Leading Model" and "ELO Score" appear in both table header and mobile cards, so we need to check for at least one
    expect(screen.getAllByText("Leading Model").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ELO Score").length).toBeGreaterThan(0);
  });

  it("renders mobile card structure correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check mobile cards container is present
    const mobileCards = document.querySelector(".sm\\:hidden.space-y-3");
    expect(mobileCards).toBeInTheDocument();

    // Check that cards are rendered for each flattened node
    // We have 4 nodes total (1 root + 3 descendants)
    const cards = document.querySelectorAll(".sm\\:hidden.space-y-3 > div");
    expect(cards.length).toBe(4);
  });

  it("displays hierarchy correctly with proper indentation and prefixes", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check that all capability names are rendered (appear in both desktop and mobile)
    expect(screen.getAllByText("Reasoning")).toHaveLength(2);
    expect(screen.getAllByText("Mathematical Reasoning")).toHaveLength(2);
    expect(screen.getAllByText("Algebraic Problem Solving")).toHaveLength(2);
    expect(screen.getAllByText("Logical Reasoning")).toHaveLength(2);

    // Check hierarchy prefixes are present (rendered as spans with specific styling)
    const hierarchyPrefixes = document.querySelectorAll(".text-brand-gray-04.font-normal.mr-1");
    expect(hierarchyPrefixes.length).toBeGreaterThan(0); // Should have hierarchy prefix spans for nested items

    // Check that color indicators are present for hierarchy levels
    const blueIndicators = document.querySelectorAll(".bg-brand-blue");
    const greenIndicators = document.querySelectorAll(".bg-brand-green");
    const yellowIndicators = document.querySelectorAll(".bg-brand-yellow");

    expect(blueIndicators.length).toBeGreaterThan(0); // L1 indicators
    expect(greenIndicators.length).toBeGreaterThan(0); // L2 indicators
    expect(yellowIndicators.length).toBeGreaterThan(0); // L3 indicators
  });

  it("displays model information correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check model names (now appear in both desktop and mobile)
    expect(screen.getAllByText("GPT-4")).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText("GPT-4 Turbo")).toHaveLength(2);
    expect(screen.getAllByText("Claude 3 Sonnet")).toHaveLength(2);
    expect(screen.getAllByText("Gemini 1.5 Pro")).toHaveLength(2);

    // Check providers
    expect(screen.getAllByText("OpenAI")).toHaveLength(4); // GPT-4 and GPT-4 Turbo, each in desktop + mobile
    expect(screen.getAllByText("Anthropic")).toHaveLength(2);
    expect(screen.getAllByText("Google")).toHaveLength(2);

    // Check ELO scores are formatted
    expect(screen.getAllByText("1847")).toHaveLength(2);
    expect(screen.getAllByText("1823")).toHaveLength(2);
    expect(screen.getAllByText("1756")).toHaveLength(2);
    expect(screen.getAllByText("1689")).toHaveLength(2);

    // Check ranks
    expect(screen.getAllByText("#1")).toHaveLength(2);
    expect(screen.getAllByText("#2")).toHaveLength(2);
    expect(screen.getAllByText("#3")).toHaveLength(2);
    expect(screen.getAllByText("#4")).toHaveLength(2);
  });

  it("displays stats information correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check match counts - desktop has "1.2k" separately, mobile has "1.2k matches"
    expect(screen.getByText("1.2k")).toBeInTheDocument(); // Desktop only
    expect(screen.getByText("1.2k matches")).toBeInTheDocument(); // Mobile only
    expect(screen.getByText("800")).toBeInTheDocument(); // Desktop only
    expect(screen.getByText("800 matches")).toBeInTheDocument(); // Mobile only
    expect(screen.getByText("400")).toBeInTheDocument(); // Desktop only
    expect(screen.getByText("400 matches")).toBeInTheDocument(); // Mobile only
    expect(screen.getByText("600")).toBeInTheDocument(); // Desktop only
    expect(screen.getByText("600 matches")).toBeInTheDocument(); // Mobile only

    // Check model counts (both desktop and mobile show "X models")
    expect(screen.getAllByText("15 models")).toHaveLength(2);
    expect(screen.getAllByText("12 models")).toHaveLength(2);
    expect(screen.getAllByText("10 models")).toHaveLength(2);
    expect(screen.getAllByText("8 models")).toHaveLength(2);
  });

  it("handles search functionality correctly", async () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    const searchInput = screen.getByPlaceholderText("Search capabilities...");

    // Search for "math"
    fireEvent.change(searchInput, { target: { value: "math" } });

    await waitFor(() => {
      // Should find "Mathematical Reasoning" (appears in both desktop and mobile)
      expect(screen.getAllByText("Mathematical Reasoning")).toHaveLength(2);
      // Should not find "Logical Reasoning" (filtered out)
      expect(screen.queryByText("Logical Reasoning")).not.toBeInTheDocument();
    });

    // Clear search
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);

    await waitFor(() => {
      // Should show all capabilities again
      expect(screen.getAllByText("Logical Reasoning")).toHaveLength(2);
    });
  });

  it("handles model link clicks correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Click on a model name (get the first one)
    const modelButtons = screen.getAllByText("GPT-4");
    expect(modelButtons.length).toBeGreaterThan(0);
    fireEvent.click(modelButtons[0]!);

    expect(mockOpen).toHaveBeenCalledWith("/models/gpt-4", "_blank");
  });

  it("handles row click callbacks correctly", () => {
    const mockNodeClick = jest.fn();
    render(<CapabilitiesTreeView nodes={mockNodes} onNodeClick={mockNodeClick} />);

    // Click on a table row (desktop) - get the first instance
    const reasoningElements = screen.getAllByText("Reasoning");
    expect(reasoningElements.length).toBeGreaterThan(0);
    const reasoningRow = reasoningElements[0]!.closest("tr");
    if (reasoningRow) {
      fireEvent.click(reasoningRow);
    }

    expect(mockNodeClick).toHaveBeenCalledWith({
      attributes: { id: "reasoning" },
      name: "Reasoning",
    });
  });

  it("shows results summary correctly", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Should show total count (4 flattened nodes)
    expect(screen.getByText("Showing 4 of 4 capabilities")).toBeInTheDocument();
  });

  it("handles large match counts with proper formatting", () => {
    const nodeWithLargeMatches: TaxonomyNode[] = [
      {
        id: "reasoning",
        name: "Reasoning",
        description: "Complex reasoning capabilities",
        level: 1,
        leadingModel: {
          modelId: "gpt-4",
          modelName: "GPT-4",
          provider: "OpenAI",
          eloScore: 1847,
          rank: 1,
        },
        stats: {
          totalMatches: 2500,
          totalModels: 20,
          averageElo: 1700,
        },
        children: [],
      },
    ];

    render(<CapabilitiesTreeView nodes={nodeWithLargeMatches} />);

    // Should format large numbers with 'k' suffix (desktop and mobile)
    expect(screen.getByText("2.5k")).toBeInTheDocument(); // Desktop only
    expect(screen.getByText("2.5k matches")).toBeInTheDocument(); // Mobile only
  });

  it("renders with proper accessibility attributes", () => {
    render(<CapabilitiesTreeView nodes={mockNodes} />);

    // Check search input has proper attributes
    const searchInput = screen.getByPlaceholderText("Search capabilities...");
    expect(searchInput).toHaveAttribute("type", "text");
    expect(searchInput).toHaveAttribute("aria-label", "Search capabilities");

    // Check that interactive elements are properly structured
    const modelButtons = screen.getAllByText("GPT-4");
    expect(modelButtons.length).toBeGreaterThan(0);
    modelButtons.forEach((button) => {
      expect(button).toHaveAttribute("title");
    });
  });
});
