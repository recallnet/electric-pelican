/**
 * @file Tournament card component
 * @description Mobile card component for tournament display
 */

import { format } from "date-fns";
import Link from "next/link";

import { GlassPanel } from "@/components/ui/glass-panel";
import { TournamentSummary } from "@/types/app";

import { AuthorDisplay } from "./AuthorDisplay";
import { ModelsDisplay } from "./ModelsDisplay";
import { TagsDisplay } from "./TagsDisplay";

/**
 * Mobile card component for tournament display
 */
export function TournamentCard({ tournament }: { tournament: TournamentSummary }) {
  return (
    <GlassPanel intensity="light" className="p-4">
      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          href={`/eval/${tournament.id}`}
          className="flex-1 min-w-0 text-brand-blue hover:text-brand-blue/80 transition-colors"
        >
          <h3 className="font-medium text-sm line-clamp-2">{tournament.title}</h3>
        </Link>
        <span
          className={`text-xs font-medium capitalize px-2 py-1 rounded-md whitespace-nowrap ${
            tournament.status === "completed"
              ? "bg-brand-green/10 text-brand-green"
              : "bg-brand-yellow/10 text-brand-yellow"
          }`}
        >
          {tournament.status === "in-progress" ? "Running" : "Completed"}
        </span>
      </div>

      {/* Content: Models + Tags */}
      <div className="space-y-3 mb-3">
        <ModelsDisplay models={tournament.models || []} />
        <TagsDisplay tagIds={tournament.tagIds} />
      </div>

      {/* Footer: Author + Date */}
      <div className="flex items-center justify-between text-xs text-brand-gray-04">
        <div className="flex items-center gap-2">
          <AuthorDisplay
            authorName={tournament.authorName}
            authorAvatarUrl={tournament.authorAvatarUrl}
            createdBy={tournament.createdBy}
          />
          <Link
            href={`/user/${tournament.createdBy}`}
            className="hover:text-brand-blue transition-colors truncate"
          >
            {tournament.authorName}
          </Link>
        </div>
        <span className="whitespace-nowrap">
          {format(new Date(tournament.createdAt), "MMM d, yyyy")}
        </span>
      </div>
    </GlassPanel>
  );
}
