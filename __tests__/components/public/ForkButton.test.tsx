import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ForkButton } from "@/components/public/ForkButton";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock("@privy-io/react-auth");
jest.mock("sonner");
jest.mock("next/navigation");

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  typedApi: jest.fn(),
}));

describe("ForkButton", () => {
  const mockTournament = {
    tournamentId: "test-id",
    slug: "test-slug",
    createdBy: "user-123",
  };

  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default Privy mock
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: false,
      user: null,
      login: jest.fn(),
    });
  });

  it("should be accessible", async () => {
    const { container } = render(<ForkButton {...mockTournament} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should render button even when user is the tournament owner", () => {
    // Note: The owner check is commented out in the component
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: mockTournament.createdBy },
      login: jest.fn(),
    });

    render(<ForkButton {...mockTournament} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should trigger login for unauthenticated users", () => {
    const mockLogin = jest.fn();
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: false,
      user: null,
      login: mockLogin,
    });

    render(<ForkButton {...mockTournament} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockLogin).toHaveBeenCalled();
  });

  it("should show dialog for authenticated users", () => {
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: "different-user" },
      login: jest.fn(),
    });

    render(<ForkButton {...mockTournament} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should handle successful fork", async () => {
    const { typedApi } = require("@/lib/api-client");

    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: "different-user" },
      login: jest.fn(),
    });

    typedApi.mockResolvedValueOnce({
      newTournamentId: "new-id",
      originalTournamentId: mockTournament.tournamentId,
      forkedBy: "different-user",
      forkType: "fork",
    });

    render(<ForkButton {...mockTournament} />);

    // Open dialog and click fork
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Fork"));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/eval/new-id/edit");
      expect(toast.success).toHaveBeenCalledWith("Evaluation forked!", {
        description: "You can now modify the forked evaluation.",
      });
    });
  });

  it("should handle fork error", async () => {
    const { typedApi } = require("@/lib/api-client");

    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: "different-user" },
      login: jest.fn(),
    });

    const error = new Error("API Error");
    typedApi.mockRejectedValueOnce(error);

    render(<ForkButton {...mockTournament} />);

    // Open dialog and click fork
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Fork"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Fork failed", {
        description: "API Error",
      });
    });
  });

  it("should disable buttons during fork operation", async () => {
    const { typedApi } = require("@/lib/api-client");

    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: "different-user" },
      login: jest.fn(),
    });

    // Mock a delayed response
    typedApi.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<ForkButton {...mockTournament} />);

    // Open dialog and click fork
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Fork"));

    // Verify buttons are disabled during operation
    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("...")).toBeDisabled();
  });

  it("should handle keyboard navigation", () => {
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      user: { id: "different-user" },
      login: jest.fn(),
    });

    render(<ForkButton {...mockTournament} />);

    // Open dialog with keyboard
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });

    // Dialog should be opened
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
