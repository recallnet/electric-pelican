"use client";

import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ElectricButton } from "@/components/ui/electric-button";
import { useUserProfile } from "@/hooks/useUserProfile";

/**
 * Savant site header with glassmorphism design.
 * Sticky, responsive, and accessible – includes a visually hidden
 * "Skip to main content" link that becomes visible on keyboard focus.
 * Features mobile hamburger menu for navigation on small screens.
 */
export function SiteHeader() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update user profile data automatically when user logs in
  useUserProfile();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (!user) return "User";

    // Priority: GitHub name > Google name > email username > generic fallback
    if (user.github?.name) return user.github.name;
    if (user.github?.username) return user.github.username;
    if (user.google?.name) return user.google.name;
    if (user.email?.address) {
      return user.email.address.split("@")[0].replace(/[._]/g, " ");
    }
    return "User";
  };

  // Get avatar URL with fallbacks
  const getAvatarUrl = () => {
    if (!user) return null;

    // Priority: GitHub avatar > user.picture > null (will use generated avatar from backend)
    if (user.github?.username) {
      return `https://github.com/${user.github.username}.png`;
    }
    if (user.picture) {
      return user.picture;
    }
    return null;
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Skip link for screen readers & keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-blue text-brand-white py-1 px-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Savant glassmorphic header */}
      <header className="glassmorphism-25 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Branding */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-display text-brand-black hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md"
              >
                Pelican
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="sm:hidden p-2 text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md"
                onClick={handleMobileMenuToggle}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label="Toggle navigation menu"
              >
                <span className="text-label font-medium">Menu</span>
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Dashboard
                </Link>
                <Link
                  href="/leaderboard"
                  className="text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/capabilities"
                  className="text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Capabilities
                </Link>
                <Link
                  href="/users"
                  className="text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Users
                </Link>
                <Link
                  href="/router"
                  className="text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Router
                </Link>
              </nav>
            </div>

            {/* Auth controls */}
            {
              process.env.NEXT_PUBLIC_PRIVY_APP_ID ? (
                ready ? (
                  authenticated ? (
                    <div className="flex items-center gap-3">
                      {getAvatarUrl() ? (
                        <Image
                          src={getAvatarUrl()!}
                          alt={`${getDisplayName()} avatar`}
                          width={32}
                          height={32}
                          className="rounded-full border-2 border-brand-blue"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-brand-blue bg-brand-blue/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-brand-blue">
                            {getDisplayName().charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span
                        className="hidden sm:inline text-label text-brand-gray-04"
                        aria-label="User display name"
                      >
                        {getDisplayName()}
                      </span>
                      <ElectricButton
                        size="sm"
                        variant="outline"
                        onClick={logout}
                        aria-label="Log out"
                        responsive={false}
                      >
                        Log out
                      </ElectricButton>
                    </div>
                  ) : (
                    <ElectricButton
                      size="sm"
                      onClick={login}
                      aria-label="Log in"
                      responsive={false}
                    >
                      Log in
                    </ElectricButton>
                  )
                ) : (
                  /* Not ready – show placeholder to prevent layout shift */
                  <div className="w-16 h-8" />
                )
              ) : null /* Graceful fallback if Privy app id missing */
            }
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div
          ref={menuRef}
          data-testid="mobile-menu-container"
          className={`absolute top-full left-0 right-0 z-50 sm:hidden transition-all duration-200 ${
            isMobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/30 rounded-lg m-4 shadow-lg">
            <nav
              id="mobile-navigation"
              role="navigation"
              aria-label="Main navigation"
              className="p-4 space-y-3"
            >
              <Link
                href="/dashboard"
                onClick={handleMobileMenuLinkClick}
                className="block w-full text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md py-2 px-2"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                onClick={handleMobileMenuLinkClick}
                className="block w-full text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md py-2 px-2"
              >
                Leaderboard
              </Link>
              <Link
                href="/capabilities"
                onClick={handleMobileMenuLinkClick}
                className="block w-full text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md py-2 px-2"
              >
                Capabilities
              </Link>
              <Link
                href="/users"
                onClick={handleMobileMenuLinkClick}
                className="block w-full text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md py-2 px-2"
              >
                Users
              </Link>
              <Link
                href="/router"
                onClick={handleMobileMenuLinkClick}
                className="block w-full text-body text-brand-gray-04 hover:text-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md py-2 px-2"
              >
                Router
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
