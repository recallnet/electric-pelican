import React from "react";
import "@testing-library/jest-dom";

// Create mock functions first
const mockLogin = jest.fn();
const mockLogout = jest.fn();

// Mock Privy BEFORE importing component to avoid loading ESM deps
jest.mock("@privy-io/react-auth", () => {
  return {
    usePrivy: jest.fn(() => ({
      ready: true,
      authenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
    })),
  };
});

// Ensure env flag so controls render
process.env.NEXT_PUBLIC_PRIVY_APP_ID = "test";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { usePrivy } from "@privy-io/react-auth";

expect.extend(toHaveNoViolations);

describe("SiteHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
    });
  });

  it("renders login button when unauthenticated", () => {
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
    });

    render(<SiteHeader />);
    const loginBtn = screen.getByRole("button", { name: /log in/i });
    expect(loginBtn).toBeInTheDocument();
    fireEvent.click(loginBtn);
    expect(mockLogin).toHaveBeenCalled();
  });

  it("renders user info and logout when authenticated", () => {
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: true,
      login: jest.fn(),
      logout: mockLogout,
      user: { email: { address: "test@example.com" }, picture: null },
    });

    render(<SiteHeader />);

    // User display name should be hidden on mobile (default test viewport)
    const displayName = screen.getByText("test");
    expect(displayName).toHaveClass("hidden", "sm:inline");

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
  });

  describe("Mobile Menu", () => {
    it("renders mobile menu button", () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveTextContent("Menu");
    });

    it("opens mobile menu when menu button is clicked", async () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });

      // Menu should be closed initially (has opacity-0 and pointer-events-none)
      const mobileMenuContainer = screen.getByTestId("mobile-menu-container");
      expect(mobileMenuContainer).toHaveClass("opacity-0", "pointer-events-none");

      // Click menu button to open
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-100", "translate-y-0");
        expect(mobileMenuContainer).not.toHaveClass("opacity-0", "pointer-events-none");
      });
    });

    it("closes mobile menu when menu button is clicked again", async () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });
      const mobileMenuContainer = screen.getByTestId("mobile-menu-container");

      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-100");
      });

      // Close menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-0", "pointer-events-none");
      });
    });

    it("contains all navigation links in mobile menu", async () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });

      // Open menu
      fireEvent.click(menuButton);

      await waitFor(() => {
        const mobileNav = screen.getByRole("navigation", { name: /main navigation/i });
        expect(mobileNav).toBeInTheDocument();

        // Check for mobile-specific navigation links
        const leaderboardLinks = screen.getAllByRole("link", { name: /leaderboard/i });
        const usersLinks = screen.getAllByRole("link", { name: /users/i });
        const capabilitiesLinks = screen.getAllByRole("link", { name: /capabilities/i });

        // Should have both desktop (hidden) and mobile versions
        expect(leaderboardLinks).toHaveLength(2);
        expect(usersLinks).toHaveLength(2);
        expect(capabilitiesLinks).toHaveLength(2);
      });
    });

    it("closes mobile menu when a navigation link is clicked", async () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });
      const mobileMenuContainer = screen.getByTestId("mobile-menu-container");

      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-100");
      });

      // Click a navigation link in the mobile menu
      const mobileNav = screen.getByRole("navigation", { name: /main navigation/i });
      const leaderboardLink = mobileNav.querySelector('a[href="/leaderboard"]');
      expect(leaderboardLink).toBeInTheDocument();

      fireEvent.click(leaderboardLink!);

      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-0", "pointer-events-none");
      });
    });

    it("closes mobile menu when escape key is pressed", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });
      const mobileMenuContainer = screen.getByTestId("mobile-menu-container");

      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-100");
      });

      // Press escape key
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mobileMenuContainer).toHaveClass("opacity-0", "pointer-events-none");
      });
    });

    it("has proper ARIA attributes", async () => {
      render(<SiteHeader />);
      const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });

      // Initially closed
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
      expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");

      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  it("shows desktop navigation on larger screens", () => {
    render(<SiteHeader />);

    // Desktop navigation should be present but hidden on mobile
    const allNavs = screen.getAllByRole("navigation");
    const desktopNav = allNavs.find((nav) => nav.classList.contains("hidden"));
    expect(desktopNav).toHaveClass("hidden", "sm:flex");
  });

  it("has no accessibility violations", async () => {
    (usePrivy as jest.Mock).mockReturnValue({
      ready: true,
      authenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
    });

    const { container } = render(<SiteHeader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with mobile menu open", async () => {
    const { container } = render(<SiteHeader />);
    const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });

    // Open mobile menu
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeVisible();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
