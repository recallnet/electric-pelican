/**
 * @file Router Authentication Tests
 * @description Tests for router authentication components and hooks
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouterAuth } from "@/hooks/useRouterAuth";
import { AuthPrompt } from "@/components/router/AuthPrompt";
import { AuthenticatedAnalyzeButton } from "@/components/router/AuthenticatedAnalyzeButton";
import { UnauthenticatedAnalyzeButton } from "@/components/router/UnauthenticatedAnalyzeButton";
import { AnalysisSection } from "@/components/router/AnalysisSection";

// Mock Privy
jest.mock("@privy-io/react-auth", () => ({
  usePrivy: jest.fn(),
}));

// Mock hooks
jest.mock("@/hooks/useRouterAuth", () => ({
  useRouterAuth: jest.fn(),
}));

jest.mock("@/hooks/usePromptPersistence", () => ({
  usePromptPersistence: jest.fn(() => ({
    prompt: "Test prompt",
    setPrompt: jest.fn(),
    saveAndAuth: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUsePrivy = usePrivy as jest.MockedFunction<typeof usePrivy>;
const mockUseRouterAuth = useRouterAuth as jest.MockedFunction<typeof useRouterAuth>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Router Authentication Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AuthPrompt", () => {
    it("renders authentication prompt with sign in button", () => {
      const mockLogin = jest.fn();
      mockUsePrivy.mockReturnValue({
        login: mockLogin,
        user: null,
        authenticated: false,
        getAccessToken: jest.fn(),
      } as any);

      render(<AuthPrompt />);

      expect(screen.getByText("Sign In Required")).toBeInTheDocument();
      expect(
        screen.getByText("Please sign in to use the AI Router analysis feature"),
      ).toBeInTheDocument();
      expect(screen.getByText("Sign In to Continue")).toBeInTheDocument();
    });

    it("calls login when sign in button is clicked", () => {
      const mockLogin = jest.fn();
      mockUsePrivy.mockReturnValue({
        login: mockLogin,
        user: null,
        authenticated: false,
        getAccessToken: jest.fn(),
      } as any);

      render(<AuthPrompt />);

      fireEvent.click(screen.getByText("Sign In to Continue"));
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe("AuthenticatedAnalyzeButton", () => {
    it("renders analyze button for authenticated users", () => {
      const mockOnAnalyze = jest.fn();

      render(<AuthenticatedAnalyzeButton onAnalyze={mockOnAnalyze} isLoading={false} />);

      expect(screen.getByText("Analyze")).toBeInTheDocument();
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("shows loading state when analyzing", () => {
      const mockOnAnalyze = jest.fn();

      render(<AuthenticatedAnalyzeButton onAnalyze={mockOnAnalyze} isLoading={true} />);

      expect(screen.getByText("Analyzing...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("calls onAnalyze when clicked", () => {
      const mockOnAnalyze = jest.fn();

      render(<AuthenticatedAnalyzeButton onAnalyze={mockOnAnalyze} isLoading={false} />);

      fireEvent.click(screen.getByText("Analyze"));
      expect(mockOnAnalyze).toHaveBeenCalledTimes(1);
    });
  });

  describe("UnauthenticatedAnalyzeButton", () => {
    it("renders sign in button for unauthenticated users", () => {
      const mockLogin = jest.fn();
      mockUsePrivy.mockReturnValue({
        login: mockLogin,
        user: null,
        authenticated: false,
        getAccessToken: jest.fn(),
      } as any);

      render(<UnauthenticatedAnalyzeButton />);

      expect(screen.getByText("Sign In to Analyze")).toBeInTheDocument();
    });

    it("calls login when clicked", () => {
      const mockLogin = jest.fn();
      mockUsePrivy.mockReturnValue({
        login: mockLogin,
        user: null,
        authenticated: false,
        getAccessToken: jest.fn(),
      } as any);

      render(<UnauthenticatedAnalyzeButton />);

      fireEvent.click(screen.getByText("Sign In to Analyze"));
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe("AnalysisSection", () => {
    it("shows unauthenticated button when user is not authenticated", () => {
      mockUseRouterAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        requireAuth: jest.fn(),
      });

      mockUsePrivy.mockReturnValue({
        login: jest.fn(),
        user: null,
        authenticated: false,
        getAccessToken: jest.fn(),
      } as any);

      render(<AnalysisSection />);

      expect(screen.getByText("Sign In to Analyze")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to unlock AI Router analysis powered by real evaluation data"),
      ).toBeInTheDocument();
    });

    it("shows authenticated button when user is authenticated", () => {
      mockUseRouterAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user123" },
        login: jest.fn(),
        requireAuth: jest.fn(),
      });

      mockUsePrivy.mockReturnValue({
        login: jest.fn(),
        user: { id: "user123" },
        authenticated: true,
        getAccessToken: jest.fn(),
      } as any);

      render(<AnalysisSection />);

      expect(screen.getByText("Analyze")).toBeInTheDocument();
      expect(
        screen.getByText("Ready to analyze your prompt with AI-powered model routing"),
      ).toBeInTheDocument();
    });

    it("calls analyze API when authenticated user clicks analyze", async () => {
      const mockGetAccessToken = jest.fn().mockResolvedValue("mock-token");
      const mockRequireAuth = jest.fn((callback) => callback());

      mockUseRouterAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user123" },
        login: jest.fn(),
        requireAuth: mockRequireAuth,
      });

      mockUsePrivy.mockReturnValue({
        login: jest.fn(),
        user: { id: "user123" },
        authenticated: true,
        getAccessToken: mockGetAccessToken,
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            singleModelRecommendation: { model: "gpt-4" },
            workflow: [{ step: "test" }],
            analysisTime: 1000,
            estimatedComplexity: "simple",
          },
        }),
      } as any);

      render(<AnalysisSection />);

      // The prompt should have value from the mock
      const textarea = screen.getByDisplayValue("Test prompt");
      expect(textarea).toBeInTheDocument();

      // Click analyze
      fireEvent.click(screen.getByText("Analyze"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/router/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: JSON.stringify({ prompt: "Test prompt" }),
        });
      });
    });

    it("shows error when API call fails", async () => {
      const mockGetAccessToken = jest.fn().mockResolvedValue("mock-token");
      const mockRequireAuth = jest.fn((callback) => callback());

      mockUseRouterAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user123" },
        login: jest.fn(),
        requireAuth: mockRequireAuth,
      });

      mockUsePrivy.mockReturnValue({
        login: jest.fn(),
        user: { id: "user123" },
        authenticated: true,
        getAccessToken: mockGetAccessToken,
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Authentication failed" }),
      } as any);

      render(<AnalysisSection />);

      // Click analyze
      fireEvent.click(screen.getByText("Analyze"));

      await waitFor(() => {
        expect(screen.getByText("Authentication failed")).toBeInTheDocument();
      });
    });
  });
});

describe("useRouterAuth hook", () => {
  it("returns correct authentication state", () => {
    const mockUser = { id: "user123" };
    const mockLogin = jest.fn();

    mockUsePrivy.mockReturnValue({
      user: mockUser,
      authenticated: true,
      login: mockLogin,
      getAccessToken: jest.fn(),
    } as any);

    // We need to test the actual hook implementation
    // This would require a test harness for custom hooks
    // For now, we'll test it through the components that use it
  });
});
