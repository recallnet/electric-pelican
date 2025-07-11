"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, user, login } = usePrivy();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!authenticated) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has admin access
        const response = await fetch("/api/admin/models");

        if (response.ok) {
          setIsAdmin(true);
        } else if (response.status === 403) {
          setIsAdmin(false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [authenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
          <p className="text-label text-brand-gray-03">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassPanel className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-headline text-brand-black mb-4">Admin Access Required</h2>
          <p className="text-body text-brand-gray-04 mb-6">
            You need to be logged in to access the admin panel.
          </p>
          <button
            onClick={login}
            className="w-full bg-brand-blue text-white py-2 px-4 rounded-lg hover:bg-brand-blue-dark"
          >
            Login
          </button>
        </GlassPanel>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassPanel className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-headline text-brand-red mb-4">Access Denied</h2>
          <p className="text-body text-brand-gray-04 mb-6">
            You don't have admin privileges. Admin access is restricted to authorized personnel
            only.
          </p>
          <p className="text-sm text-brand-gray-03 mb-4">
            Logged in as: {user?.email?.address || "Unknown"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-brand-gray-02 text-brand-black py-2 px-4 rounded-lg hover:bg-brand-gray-03"
          >
            Return Home
          </button>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg-light via-brand-bg to-brand-bg-dark">
      <nav className="border-b border-brand-gray-01 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-headline text-brand-black">Admin Panel</h1>
              <span className="text-sm text-brand-gray-03">{user?.email?.address}</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-brand-blue hover:text-brand-blue-dark"
            >
              Back to Site
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4">{children}</main>
    </div>
  );
}
