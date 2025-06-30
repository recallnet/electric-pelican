"use client";

import Link from "next/link";
import { useState } from "react";

import { ElectricButton } from "@/components/ui/electric-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { type EvaluationHistoryProps } from "@/types/components";

/**
 * Evaluation history section showing all tournaments the model participated in.
 * Displays results, opponents, and links to full tournament details.
 */
export function EvaluationHistory({ evaluationHistory, isLoading }: EvaluationHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Format model name for display
  const formatModelName = (modelId: string): string => {
    const parts = modelId.split("/");
    const modelName = parts[parts.length - 1] || modelId;

    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get result badge styling
  const getResultBadge = (result: "win" | "loss" | "ongoing") => {
    switch (result) {
      case "win":
        return "px-2 py-1 bg-brand-green text-white rounded-md text-label font-semibold";
      case "loss":
        return "px-2 py-1 bg-brand-red text-white rounded-md text-label font-semibold";
      case "ongoing":
        return "px-2 py-1 bg-brand-yellow text-white rounded-md text-label font-semibold";
      default:
        return "px-2 py-1 bg-brand-gray-02 text-brand-gray-04 rounded-md text-label font-semibold";
    }
  };

  const getResultText = (result: "win" | "loss" | "ongoing") => {
    switch (result) {
      case "win":
        return "Won";
      case "loss":
        return "Lost";
      case "ongoing":
        return "Ongoing";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-headline text-brand-black mb-4">Evaluation History</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-start p-4 bg-brand-gray-01/20 rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-gray-02 rounded w-3/4"></div>
                  <div className="h-3 bg-brand-gray-02 rounded w-1/2"></div>
                  <div className="h-3 bg-brand-gray-02 rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-brand-gray-02 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (!evaluationHistory || evaluationHistory.evaluations.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-headline text-brand-black mb-4">Evaluation History</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-gray-01 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-gray-03"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-body text-brand-gray-04 mb-2">No evaluations found</p>
          <p className="text-label text-brand-gray-03">
            This model hasn&apos;t participated in any evaluations yet
          </p>
        </div>
      </GlassPanel>
    );
  }

  const { evaluations, pagination } = evaluationHistory;

  return (
    <GlassPanel className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-headline text-brand-black">Evaluation History</h2>
        <div className="text-label text-brand-gray-03">{pagination.total} total evaluations</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-gray-02">
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Evaluation
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Opponent
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Result
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Created
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                {/* Actions column */}
              </th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => (
              <tr
                key={evaluation.tournamentId}
                className="border-b border-brand-gray-01 hover:bg-brand-gray-01/50"
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-brand-black">{evaluation.title}</div>
                    <div className="text-sm text-brand-gray-04 line-clamp-1">
                      {evaluation.prompt}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-brand-gray-03">
                  {evaluation.opponent ? (
                    <span>vs {formatModelName(evaluation.opponent)}</span>
                  ) : (
                    <span className="text-brand-gray-03 italic">Multiple</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className={getResultBadge(evaluation.result)}>
                    {getResultText(evaluation.result)}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-brand-gray-03">
                  {formatDate(evaluation.createdAt)}
                </td>
                <td className="py-4 px-4 text-right">
                  <Link href={`/eval/${evaluation.tournamentId}`}>
                    <ElectricButton size="sm" variant="outline">
                      View
                    </ElectricButton>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-white/20">
          <ElectricButton
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </ElectricButton>

          <span className="text-label text-brand-gray-03 px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <ElectricButton
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
          >
            Next
          </ElectricButton>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-body font-semibold text-brand-green">
              {evaluations.filter((e) => e.result === "win").length}
            </div>
            <div className="text-label text-brand-gray-03 uppercase">Wins</div>
          </div>
          <div>
            <div className="text-body font-semibold text-brand-red">
              {evaluations.filter((e) => e.result === "loss").length}
            </div>
            <div className="text-label text-brand-gray-03 uppercase">Losses</div>
          </div>
          <div>
            <div className="text-body font-semibold text-brand-yellow">
              {evaluations.filter((e) => e.result === "ongoing").length}
            </div>
            <div className="text-label text-brand-gray-03 uppercase">Ongoing</div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
