"use client";

import { useEffect, useState } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { UsersTable } from "@/components/users/UsersTable";
import { RouteResponse, typedApi } from "@/lib/api-client";

export default function UsersPage() {
  const [data, setData] = useState<RouteResponse<"GET /api/users/list"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await typedApi("GET /api/users/list", {});
        setData(result);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-brand-white">
      <main id="main-content" className="max-w-7xl mx-auto p-4 space-y-6">
        {loading && (
          <GlassPanel>
            <div className="text-center py-8">
              <div className="text-brand-gray-03">Loading users...</div>
            </div>
          </GlassPanel>
        )}

        {error && (
          <GlassPanel>
            <div className="text-center py-8">
              <div className="text-brand-red text-lg font-medium mb-2">{error}</div>
              <div className="text-brand-gray-03">
                There was an issue loading the user directory. Please try again later.
              </div>
            </div>
          </GlassPanel>
        )}

        {data && <UsersTable users={data.users} />}
      </main>
    </div>
  );
}
