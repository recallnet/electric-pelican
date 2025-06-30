"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Suspense, useEffect, useState } from "react";

import { DashboardTable } from "@/components/tournament/DashboardTable";
import { TournamentSummary } from "@/types/app";
import { TournamentListResponse } from "@/types/app";

// Using imported TournamentListResponse type

function DashboardContent() {
  const [myTournaments, setMyTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/tournament/list?page=1&owner=true");

        if (!response.ok) {
          throw new Error(`Failed to fetch tournaments: ${response.status}`);
        }

        const data: TournamentListResponse = await response.json();
        setMyTournaments(data.tournaments);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tournaments");
        setMyTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return <div>Loading tournaments...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* My Evaluations Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Evaluations</h2>
        {myTournaments.length > 0 ? (
          <DashboardTable tournaments={myTournaments} />
        ) : (
          <div className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
            You haven't created any evaluations yet.{" "}
            <a href="/challenge" className="text-brand-blue hover:underline">
              Create your first evaluation
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user, authenticated } = usePrivy();

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Let&apos;s see what&apos;s happening in the world of AI model evaluations.
        </p>

        <Suspense fallback={<div>Loading tournaments...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
