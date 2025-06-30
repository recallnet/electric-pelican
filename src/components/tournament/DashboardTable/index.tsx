/**
 * @file Main DashboardTable component
 * @description Main orchestration component with desktop table and mobile cards
 */

"use client";

import { format } from "date-fns";
import Link from "next/link";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type DashboardTableProps } from "@/types/components";

import { AuthorDisplay } from "./AuthorDisplay";
import { ModelsDisplay } from "./ModelsDisplay";
import { TagsDisplay } from "./TagsDisplay";
import { TournamentCard } from "./TournamentCard";

export function DashboardTable({ tournaments }: DashboardTableProps) {
  if (tournaments.length === 0) {
    return <p className="text-brand-gray-03 italic">No evaluations found.</p>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block" data-testid="desktop-table">
        <GlassPanel>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-gray-02">
                  <th className="text-left py-3 px-2 text-xs font-medium text-brand-black uppercase tracking-wide w-8">
                    <span className="sr-only">Avatar</span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Evaluation
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Models
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Tags
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Created
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                    Author
                  </th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-brand-gray-01 hover:bg-brand-gray-01/50"
                  >
                    <td className="py-3 px-2">
                      <AuthorDisplay
                        authorName={t.authorName}
                        authorAvatarUrl={t.authorAvatarUrl}
                        createdBy={t.createdBy}
                      />
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <Link
                        href={`/eval/${t.id}`}
                        className="text-brand-blue hover:text-brand-blue/80 transition-colors text-sm font-medium block"
                      >
                        <div className="truncate">
                          {t.title.length > 40 ? `${t.title.slice(0, 40)}...` : t.title}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-32">
                      <ModelsDisplay models={t.models || []} />
                    </td>
                    <td className="py-3 px-4 min-w-32">
                      <TagsDisplay tagIds={t.tagIds} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-medium capitalize px-2 py-1 rounded-md ${
                          t.status === "completed"
                            ? "bg-brand-green/10 text-brand-green"
                            : "bg-brand-yellow/10 text-brand-yellow"
                        }`}
                      >
                        {t.status === "in-progress" ? "Running" : "Completed"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-brand-gray-04">
                        {format(new Date(t.createdAt), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/user/${t.createdBy}`}
                        className="text-xs text-brand-gray-04 truncate max-w-24 hover:text-brand-blue transition-colors block"
                      >
                        {t.authorName}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3" data-testid="mobile-cards">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </>
  );
}
