import { render, screen } from "@testing-library/react";
import { ClickableTag, ClickableTagsDisplay } from "@/components/ui/clickable-tag";

// Mock the tag taxonomy functions
jest.mock("@/lib/tag-taxonomy", () => ({
  getTagInfo: jest.fn((tagId: string) => {
    if (tagId === "scene-understanding") {
      return {
        id: "scene-understanding",
        name: "Scene Understanding",
        description: "Comprehending complex visual scenes and their components",
        parentId: "visual-processing",
      };
    }
    return undefined;
  }),
  getTagLineage: jest.fn((tagId: string) => {
    if (tagId === "scene-understanding") {
      return [
        { id: "perception-understanding", name: "Perception & Understanding" },
        { id: "visual-processing", name: "Visual Processing" },
        { id: "scene-understanding", name: "Scene Understanding" },
      ];
    }
    return [];
  }),
}));

describe("ClickableTag", () => {
  it("renders hierarchical tag as clickable element", () => {
    render(
      <ClickableTag
        tagId="scene-understanding"
        name="Scene Understanding"
        size="sm"
        variant="secondary"
      />,
    );

    // Component renders as a div, not a link
    const tagElement = screen.getByText("Scene Understanding");
    expect(tagElement).toBeInTheDocument();

    // The div container should have cursor-pointer styling
    const container = tagElement.closest("div");
    expect(container).toHaveClass("cursor-pointer");
  });

  it("renders legacy tag as clickable element", () => {
    render(
      <ClickableTag
        tagId="legacy-tag"
        name="Legacy Tag"
        displayName="Legacy Tag"
        size="sm"
        variant="secondary"
      />,
    );

    // Component renders as a div, not a link
    const tagElement = screen.getByText("Legacy Tag");
    expect(tagElement).toBeInTheDocument();

    // The div container should have cursor-pointer styling
    const container = tagElement.closest("div");
    expect(container).toHaveClass("cursor-pointer");
  });

  it("applies correct size classes", () => {
    const { rerender } = render(
      <ClickableTag tagId="test-tag" name="Test Tag" size="xs" variant="secondary" />,
    );

    // The size classes are applied to the container div, not the text span
    const textElement = screen.getByText("Test Tag");
    const container = textElement.closest("div");
    expect(container).toHaveClass("text-xs", "px-1.5", "py-0.5");

    rerender(<ClickableTag tagId="test-tag" name="Test Tag" size="lg" variant="secondary" />);

    const newTextElement = screen.getByText("Test Tag");
    const newContainer = newTextElement.closest("div");
    expect(newContainer).toHaveClass("text-base", "px-4", "py-2");
  });
});

describe("ClickableTagsDisplay", () => {
  it("renders multiple tags correctly", () => {
    render(
      <ClickableTagsDisplay
        tags={["scene-understanding"]}
        legacyTags={["legacy-tag-1", "legacy-tag-2"]}
        size="sm"
        variant="secondary"
      />,
    );

    // Check hierarchical tag - should render with proper display name
    expect(screen.getByText("Scene Understanding")).toBeInTheDocument();

    // Check legacy tags - should render with tag IDs as display names
    expect(screen.getByText("legacy-tag-1")).toBeInTheDocument();
    expect(screen.getByText("legacy-tag-2")).toBeInTheDocument();

    // All tags should have cursor-pointer styling - need to find the specific tag containers
    const hierarchicalSpan = screen.getByText("Scene Understanding");
    const hierarchicalContainer = hierarchicalSpan.parentElement; // Get the direct parent div
    expect(hierarchicalContainer).toHaveClass("cursor-pointer");

    const legacySpan1 = screen.getByText("legacy-tag-1");
    const legacyContainer1 = legacySpan1.parentElement; // Get the direct parent div
    expect(legacyContainer1).toHaveClass("cursor-pointer");
  });

  it("limits tags when maxTags is specified", () => {
    render(
      <ClickableTagsDisplay
        tags={["tag1", "tag2"]}
        legacyTags={["legacy1", "legacy2", "legacy3"]}
        maxTags={3}
        size="sm"
        variant="secondary"
      />,
    );

    // Should show first 3 tags plus "+2 more" indicator
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("handles empty tags gracefully", () => {
    const { container } = render(
      <ClickableTagsDisplay tags={[]} legacyTags={[]} size="sm" variant="secondary" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
