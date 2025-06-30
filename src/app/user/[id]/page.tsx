"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardTable } from "@/components/tournament/DashboardTable";
import { GlassPanel } from "@/components/ui/glass-panel";
import { TagCloud } from "@/components/ui/tag-cloud";
import { UserTournamentsResponse } from "@/types/app";

/**
 * User profile page showing all evaluations created by a specific user
 */
export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [data, setData] = useState<UserTournamentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/${userId}/tournaments`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user profile");
          }
          return;
        }

        const result: UserTournamentsResponse = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching user tournaments:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTournaments();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-white p-4">
        <div className="max-w-6xl mx-auto">
          <GlassPanel>
            <div className="text-center py-8">
              <div className="text-brand-gray-03">Loading user profile...</div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-brand-white p-4">
        <div className="max-w-6xl mx-auto">
          <GlassPanel>
            <div className="text-center py-8">
              <div className="text-brand-red text-lg font-medium mb-2">
                {error || "User not found"}
              </div>
              <div className="text-brand-gray-03">
                The user you&apos;re looking for doesn&apos;t exist or has no evaluations.
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  const { user, tournaments } = data;
  const initials = user.displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Extract all tags from tournaments for the tag cloud
  const allTags = tournaments.flatMap((tournament) => tournament.tagIds || []);

  return (
    <div className="min-h-screen bg-brand-white">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* User Profile Header */}
        <GlassPanel>
          <div className="flex items-center gap-4 p-6">
            {/* User Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-gray-01 flex-shrink-0 border-2 border-brand-gray-02">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.parentElement?.querySelector(
                      ".initials-fallback",
                    ) as HTMLElement;
                    if (fallback) {
                      fallback.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className={`initials-fallback w-full h-full flex items-center justify-center text-lg font-bold text-brand-gray-04 bg-brand-gray-01 ${user.avatarUrl ? "hidden" : "flex"}`}
                style={{ display: user.avatarUrl ? "none" : "flex" }}
              >
                {initials}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <h1 className="text-headline text-brand-black mb-1">{user.displayName}</h1>
              <div className="text-brand-gray-03 text-sm">
                {tournaments.length} evaluation{tournaments.length !== 1 ? "s" : ""} created
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Tag Cloud Section */}
        {allTags.length > 0 && (
          <GlassPanel>
            <div className="text-center mb-4">
              <h2 className="text-headline text-brand-black mb-2">Areas of Focus</h2>
              <p className="text-brand-gray-04 text-sm">
                Topics explored in {user.displayName}&apos;s evaluations
              </p>
            </div>
            <TagCloud allTags={allTags} />
          </GlassPanel>
        )}

        {/* Evaluations Section */}
        <div>
          <h2 className="text-headline text-brand-black mb-4">Evaluations by {user.displayName}</h2>

          {tournaments.length > 0 ? (
            <DashboardTable tournaments={tournaments} />
          ) : (
            <GlassPanel>
              <div className="text-center py-8">
                <div className="text-brand-gray-03">
                  {user.displayName} hasn&apos;t created any evaluations yet.
                </div>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
