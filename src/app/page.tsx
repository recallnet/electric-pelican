"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardTable } from "@/components/tournament/DashboardTable";
import { PromptChallengeForm } from "@/components/tournament/PromptChallengeForm";
import { GlassPanel } from "@/components/ui/glass-panel";
import { DEFAULT_PROMPT } from "@/config/defaults";
import { useWizard } from "@/contexts/TournamentWizardContext";
import { TournamentListResponse, TournamentSummary } from "@/types/app";

export default function Home() {
  const { dispatch } = useWizard();
  const router = useRouter();
  const [publicTournaments, setPublicTournaments] = useState<TournamentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch public tournaments for the homepage
  useEffect(() => {
    async function fetchPublicTournaments() {
      try {
        setIsLoading(true);
        // Fetch first page of tournaments (API has hardcoded limit of 20)
        const res = await fetch("/api/tournament/list?page=1");
        const data = (await res.json()) as TournamentListResponse;

        // Check if the response has tournaments array (in case of API error)
        if (!data.tournaments || !Array.isArray(data.tournaments)) {
          console.error("API response missing tournaments array:", data);
          setPublicTournaments([]);
          return;
        }

        let allTournaments = [...data.tournaments];

        // If we have more pages and less than 50 tournaments, fetch the second page
        if (data.hasMore && allTournaments.length < 50) {
          try {
            const res2 = await fetch("/api/tournament/list?page=2");
            const data2 = (await res2.json()) as TournamentListResponse;

            // Check if the response has tournaments array (in case of API error)
            if (data2.tournaments && Array.isArray(data2.tournaments)) {
              allTournaments = [...allTournaments, ...data2.tournaments];

              // Limit to maximum 50 tournaments
              if (allTournaments.length > 50) {
                allTournaments = allTournaments.slice(0, 50);
              }
            } else {
              console.error("Second page API response missing tournaments array:", data2);
            }
          } catch (error) {
            console.error("Error fetching additional tournaments:", error);
          }
        }

        setPublicTournaments(allTournaments);
      } catch (error) {
        console.error("Error fetching public tournaments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicTournaments();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Prompt Form CTA - now at the very top */}
      <div className="flex flex-col items-center gap-6 mb-8 w-full">
        <GlassPanel className="w-full max-w-2xl p-6">
          <PromptChallengeForm
            initialPrompt={DEFAULT_PROMPT}
            onSubmit={(data) => {
              dispatch({ type: "SET_PROMPT", prompt: data.prompt });
              dispatch({ type: "SET_JUDGE_PROMPT", judgePrompt: data.judgePrompt });
              router.push("/models");
            }}
          />
        </GlassPanel>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <p className="text-xl text-brand-gray-04 mb-6">
          Curate intelligence, crown winners, route by expert taste.
        </p>
      </div>

      {/* Public Evaluations Section */}
      <div className="w-full max-w-6xl mx-auto mb-16">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
            <p className="mt-4 text-brand-gray-04">Loading evaluations...</p>
          </div>
        ) : publicTournaments.length > 0 ? (
          <DashboardTable tournaments={publicTournaments} />
        ) : (
          <GlassPanel>
            <div className="text-gray-500 italic p-6 text-center">
              No public evaluations available yet.
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
