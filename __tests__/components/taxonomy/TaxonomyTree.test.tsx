import { render, screen } from "@testing-library/react";

import { TaxonomyTree } from "@/components/taxonomy/TaxonomyTree";
import type { TaxonomyNode } from "@/types/taxonomy";

// Mock the TaxonomyNode component
jest.mock("@/components/taxonomy/TaxonomyNode", () => ({
  TaxonomyNode: ({ node }: { node: TaxonomyNode }) => (
    <div data-testid={`node-${node.id}`}>{node.name}</div>
  ),
}));

describe("TaxonomyTree", () => {
  const mockNodes: TaxonomyNode[] = [
    {
      id: "perception-understanding",
      name: "Perception & Understanding",
      description: "Test description",
      level: 1,
      children: [],
    },
    {
      id: "communication-expression",
      name: "Communication & Expression",
      description: "Test description",
      level: 1,
      children: [],
    },
  ];

  const mockProps = {
    nodes: mockNodes,
    expandedNodes: new Set<string>(),
    onToggleNode: jest.fn(),
    isLoading: false,
  };

  it("renders taxonomy nodes correctly", () => {
    render(<TaxonomyTree {...mockProps} />);

    expect(screen.getByTestId("node-perception-understanding")).toBeInTheDocument();
    expect(screen.getByTestId("node-communication-expression")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<TaxonomyTree {...mockProps} isLoading={true} />);

    const skeletons = screen.getAllByText(/loading/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no nodes provided", () => {
    render(<TaxonomyTree {...mockProps} nodes={[]} />);

    expect(screen.getByText("No taxonomy data available")).toBeInTheDocument();
  });
});
