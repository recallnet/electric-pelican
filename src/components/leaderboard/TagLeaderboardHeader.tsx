"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getTagLineage } from "@/lib/tag-taxonomy";
import { cn } from "@/lib/utils";

interface TagLeaderboardHeaderProps {
  tag?: {
    id: string;
    name: string;
    description?: string;
    lineage?: Array<{ id: string; name: string }>;
  };
  stats?: {
    totalModels: number;
    averageElo: number;
    totalMatches: number;
    topModel?: {
      modelId: string;
      eloScore: number;
    };
  };
  isLoading: boolean;
}

/**
 * Header component for tag-specific leaderboard pages.
 * Shows tag information, breadcrumb navigation, and key statistics.
 */
export function TagLeaderboardHeader({ tag, stats, isLoading }: TagLeaderboardHeaderProps) {
  // Get tag information from taxonomy if not provided by API
  const tagInfo = tag || null;
  const lineage = tag?.lineage || (tag?.id ? getTagLineage(tag.id) : []);

  if (isLoading) {
    return (
      <div className="text-center space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center justify-center space-x-2">
          <div className="h-4 bg-brand-gray-02 rounded w-20 animate-pulse"></div>
          <ChevronRight className="w-4 h-4 text-brand-gray-03" />
          <div className="h-4 bg-brand-gray-02 rounded w-24 animate-pulse"></div>
        </div>

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-brand-gray-02 rounded w-64 mx-auto animate-pulse"></div>
          <div className="h-4 bg-brand-gray-02 rounded w-96 mx-auto animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="flex justify-center space-x-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-brand-gray-02 rounded w-12 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-brand-gray-02 rounded w-16 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-center space-x-2 text-label">
        <Link
          href="/leaderboard"
          className="text-brand-blue hover:text-brand-blue-dark transition-colors flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Global Leaderboard</span>
        </Link>

        {lineage.length > 0 && (
          <>
            <ChevronRight className="w-4 h-4 text-brand-gray-03" />
            <div className="flex items-center space-x-2">
              {lineage.map((ancestor, index) => (
                <div key={ancestor.id} className="flex items-center space-x-2">
                  {index > 0 && <ChevronRight className="w-3 h-3 text-brand-gray-03" />}
                  <Link
                    href={`/leaderboard/capability/${ancestor.id}`}
                    className={cn(
                      "hover:text-brand-blue transition-colors",
                      index === lineage.length - 1
                        ? "text-brand-black font-medium"
                        : "text-brand-gray-04",
                    )}
                  >
                    {ancestor.name}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tag Information */}
      <div className="space-y-3">
        <h1 className="text-display text-brand-black">
          {tagInfo?.name || tag?.name || "Capability"} Leaderboard
        </h1>
        {(tagInfo?.description || tag?.description) && (
          <p className="text-body text-brand-gray-04 max-w-2xl mx-auto">
            {tagInfo?.description || tag?.description}
          </p>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="flex justify-center space-x-8 text-center">
          <div>
            <div className="text-headline text-brand-black font-semibold">
              {stats.totalModels.toLocaleString()}
            </div>
            <div className="text-label text-brand-gray-04">Models</div>
          </div>

          <div>
            <div className="text-headline text-brand-black font-semibold">
              {Math.round(stats.averageElo).toLocaleString()}
            </div>
            <div className="text-label text-brand-gray-04">Avg ELO</div>
          </div>

          <div>
            <div className="text-headline text-brand-black font-semibold">
              {stats.totalMatches.toLocaleString()}
            </div>
            <div className="text-label text-brand-gray-04">Total Matches</div>
          </div>

          {stats.topModel && (
            <div>
              <div className="text-headline text-brand-black font-semibold">
                {stats.topModel.eloScore.toLocaleString()}
              </div>
              <div className="text-label text-brand-gray-04">Top Score</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
