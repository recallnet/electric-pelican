import React from "react";
import "@testing-library/jest-dom";

// Mock Privy to avoid importing ESM modules in tests
jest.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ ready: true, authenticated: false }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock the tag taxonomy functions
jest.mock("@/lib/tag-taxonomy", () => ({
  getTagInfo: jest.fn((tagId: string) => {
    const tags: Record<string, { id: string; name: string; description: string }> = {
      "creative-writing": {
        id: "creative-writing",
        name: "Creative Writing",
        description: "Producing original creative content and literature",
      },
      "code-generation": {
        id: "code-generation",
        name: "Code Generation",
        description: "Generating code for various programming tasks",
      },
      "logical-reasoning": {
        id: "logical-reasoning",
        name: "Logical Reasoning",
        description: "Systematic logical thinking and inference",
      },
    };
    return tags[tagId];
  }),
  getTagLineage: jest.fn((tagId: string) => {
    const lineages: Record<string, Array<{ id: string; name: string }>> = {
      "creative-writing": [
        { id: "communication-expression", name: "Communication & Expression" },
        { id: "written-production", name: "Written Production" },
        { id: "creative-writing", name: "Creative Writing" },
      ],
      "code-generation": [
        { id: "technical-implementation", name: "Technical Implementation" },
        { id: "code-generation", name: "Code Generation" },
      ],
      "logical-reasoning": [
        { id: "reasoning-problem-solving", name: "Reasoning & Problem-Solving" },
        { id: "logical-reasoning", name: "Logical Reasoning" },
      ],
    };
    return lineages[tagId] || [];
  }),
}));

import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { DashboardTable } from "@/components/tournament/DashboardTable";
import { TournamentSummary } from "@/types/app";

expect.extend(toHaveNoViolations);

describe("DashboardTable", () => {
  const sampleTournaments: TournamentSummary[] = [
    {
      id: "1",
      slug: "tour-1",
      title: "Sample Tournament",
      prompt: "Test prompt",
      models: ["gpt-4", "claude-3-sonnet"],
      tagIds: ["creative-writing", "code-generation"],
      createdBy: "user-123",
      authorName: "John Doe",
      authorAvatarUrl: "https://example.com/avatar.jpg",
      createdAt: new Date().toISOString(),
      status: "completed",
      upvoteCount: 5,
      hasUpvoted: false,
      forkCount: 2,
    },
    {
      id: "2",
      slug: "tour-2",
      title: "Another Tournament",
      prompt: "Another test prompt",
      models: ["gpt-3.5-turbo"],
      tagIds: ["logical-reasoning"],
      createdBy: "user-456",
      authorName: "Jane Smith",
      authorAvatarUrl: "",
      createdAt: new Date().toISOString(),
      status: "in-progress",
      upvoteCount: 3,
      hasUpvoted: false,
      forkCount: 1,
    },
  ];

  it("renders desktop table layout", () => {
    render(<DashboardTable tournaments={sampleTournaments} />);

    // Check desktop table is present
    expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-table")).toHaveClass("hidden", "sm:block");

    // Check tournament titles are rendered (should appear in both layouts)
    expect(screen.getAllByText("Sample Tournament")).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText("Another Tournament")).toHaveLength(2); // Desktop + mobile
  });

  it("renders mobile card layout", () => {
    render(<DashboardTable tournaments={sampleTournaments} />);

    // Check mobile cards are present
    expect(screen.getByTestId("mobile-cards")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-cards")).toHaveClass("sm:hidden", "space-y-3");

    // Check tournament titles are rendered in cards (should appear in both layouts)
    expect(screen.getAllByText("Sample Tournament")).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText("Another Tournament")).toHaveLength(2); // Desktop + mobile
  });

  it("shows empty state message", () => {
    render(<DashboardTable tournaments={[]} />);
    expect(screen.getByText("No evaluations found.")).toBeInTheDocument();
  });

  it("displays tournament information correctly in both layouts", () => {
    render(<DashboardTable tournaments={sampleTournaments} />);

    // Check models display (appears in both desktop and mobile)
    expect(screen.getAllByText("2 models")).toHaveLength(2);
    expect(screen.getAllByText("1 model")).toHaveLength(2);

    // Check tags display (appears in both layouts)
    expect(screen.getAllByText("Creative Writing")).toHaveLength(2);
    expect(screen.getAllByText("Code Generation")).toHaveLength(2);
    expect(screen.getAllByText("Logical Reasoning")).toHaveLength(2);

    // Check status badges (appears in both layouts)
    expect(screen.getAllByText("Completed")).toHaveLength(2);
    expect(screen.getAllByText("Running")).toHaveLength(2);

    // Check author names (appears in both layouts)
    expect(screen.getAllByText("John Doe")).toHaveLength(2);
    expect(screen.getAllByText("Jane Smith")).toHaveLength(2);
  });

  it("maintains all links in both layouts", () => {
    render(<DashboardTable tournaments={sampleTournaments} />);

    // Check tournament links (should have multiple instances)
    const tournamentLinks = screen.getAllByRole("link");
    const tournamentLinksToEval1 = tournamentLinks.filter(
      (link) => link.getAttribute("href") === "/eval/1",
    );
    expect(tournamentLinksToEval1.length).toBeGreaterThan(0);

    // Check author links (should have multiple instances)
    const authorLinksToUser123 = tournamentLinks.filter(
      (link) => link.getAttribute("href") === "/user/user-123",
    );
    expect(authorLinksToUser123.length).toBeGreaterThan(0);
  });

  it("has no accessibility violations in desktop layout", async () => {
    const { container } = render(<DashboardTable tournaments={sampleTournaments} />);
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

    const { container } = render(<DashboardTable tournaments={sampleTournaments} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
