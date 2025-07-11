/**
 * @file UsersTable Component Tests
 * @description Tests for the UsersTable component including interests column
 */

import { render, screen } from "@testing-library/react";

import { UsersTable } from "@/components/users/UsersTable";
import { UserSummary } from "@/types/components";

// Mock the ClickableTagsDisplay component
jest.mock("@/components/ui/clickable-tag", () => ({
  ClickableTagsDisplay: ({ tags }: { tags: string[] }) => (
    <div data-testid="clickable-tags-display">
      {tags.map((tag, index) => (
        <span key={index} className="tag">
          {tag}
        </span>
      ))}
    </div>
  ),
}));

describe("UsersTable Component", () => {
  const mockUsers: UserSummary[] = [
    {
      id: "user1",
      displayName: "John Doe",
      avatarUrl: null,
      evaluationsCreated: 5,
      topTags: ["reasoning", "coding", "writing"],
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "user2",
      displayName: "Jane Smith",
      avatarUrl: "https://example.com/avatar.jpg",
      evaluationsCreated: 3,
      topTags: ["creativity"],
      createdAt: "2024-01-15T00:00:00Z",
    },
    {
      id: "user3",
      displayName: "Bob Johnson",
      avatarUrl: null,
      evaluationsCreated: 0,
      topTags: [],
      createdAt: "2024-02-01T00:00:00Z",
    },
  ];

  it("should render the interests column header", () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText("Interests")).toBeInTheDocument();
  });

  it("should display users with their interests", () => {
    render(<UsersTable users={mockUsers} />);

    // Check that the first user's interests are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // evaluations count

    // Check that ClickableTagsDisplay is rendered for users with tags
    const tagDisplays = screen.getAllByTestId("clickable-tags-display");
    expect(tagDisplays).toHaveLength(2); // Only for users with tags
  });

  it("should show 'No interests' for users without tags", () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText("No interests")).toBeInTheDocument();
  });

  it("should display formatted join dates", () => {
    render(<UsersTable users={mockUsers} />);

    // Check that dates are displayed - format should be "MMM dd, yyyy"
    // We look for any date pattern rather than specific dates to avoid timezone issues
    const datePattern = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;

    // Get all elements in the "Joined" column (4th column)
    const dateCells = screen.getAllByRole("cell").filter((_cell, index) => (index + 1) % 4 === 0);

    // Verify we have 3 date cells and they match the expected format
    expect(dateCells).toHaveLength(3);
    dateCells.forEach((cell) => {
      expect(cell.textContent).toMatch(datePattern);
    });
  });

  it("should handle empty users array", () => {
    render(<UsersTable users={[]} />);

    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("should render correct table structure", () => {
    render(<UsersTable users={mockUsers} />);

    // Check headers
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Evaluations")).toBeInTheDocument();
    expect(screen.getByText("Interests")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();

    // Check that table rows are rendered
    const tableRows = screen.getAllByRole("row");
    expect(tableRows).toHaveLength(4); // 1 header + 3 data rows
  });

  it("should render user links correctly", () => {
    render(<UsersTable users={mockUsers} />);

    const userLinks = screen.getAllByRole("link");
    expect(userLinks[0]).toHaveAttribute("href", "/user/user1");
    expect(userLinks[1]).toHaveAttribute("href", "/user/user2");
    expect(userLinks[2]).toHaveAttribute("href", "/user/user3");
  });

  it("should handle users with different avatar types", () => {
    const usersWithDifferentAvatars: UserSummary[] = [
      {
        id: "user1",
        displayName: "User with URL",
        avatarUrl: "https://example.com/avatar.jpg",
        evaluationsCreated: 1,
        topTags: ["test"],
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "user2",
        displayName: "User with SVG",
        avatarUrl: "<svg>test</svg>",
        evaluationsCreated: 2,
        topTags: ["test"],
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "user3",
        displayName: "User No Avatar",
        avatarUrl: null,
        evaluationsCreated: 3,
        topTags: ["test"],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    render(<UsersTable users={usersWithDifferentAvatars} />);

    expect(screen.getByText("User with URL")).toBeInTheDocument();
    expect(screen.getByText("User with SVG")).toBeInTheDocument();
    expect(screen.getByText("User No Avatar")).toBeInTheDocument();
  });

  it("should pass correct props to ClickableTagsDisplay", () => {
    const userWithTags = mockUsers[0];
    if (!userWithTags) {
      throw new Error("Test setup error: expected user with tags");
    }

    render(<UsersTable users={[userWithTags]} />);

    const tagDisplay = screen.getByTestId("clickable-tags-display");
    expect(tagDisplay).toBeInTheDocument();

    // Check that the tags are rendered correctly
    expect(screen.getByText("reasoning")).toBeInTheDocument();
    expect(screen.getByText("coding")).toBeInTheDocument();
    expect(screen.getByText("writing")).toBeInTheDocument();
  });
});
