"use client";

import { useState } from "react";

import type { BracketMatch, Tournament } from "@/types/tournament";

import { ResponseSection } from "./ResponseSection";

interface MatchDetailsModalProps {
  /** The selected match to display details for, or null if modal is closed */
  selectedMatch: BracketMatch | null;
  /** Tournament data containing responses and prompts */
  tournament: Tournament;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * MatchDetailsModal displays detailed information about a specific tournament match
 * including model responses, judge evaluation, and challenge prompts.
 *
 * @param selectedMatch - The match to display details for
 * @param tournament - Tournament data containing responses and prompts
 * @param onClose - Callback to close the modal
 */
export function MatchDetailsModal({ selectedMatch, tournament, onClose }: MatchDetailsModalProps) {
  const [showJudgeEval, setShowJudgeEval] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  if (!selectedMatch) return null;

  const challengePrompt = tournament.prompt ?? "";

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-e3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Match Details</h2>
              <p className="text-sm text-gray-600">
                Round {selectedMatch.round} • Position {selectedMatch.position}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Match Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-900 font-medium mb-1">{selectedMatch.modelA}</div>
                <div
                  className={`text-xl mb-1 ${selectedMatch.winner === selectedMatch.modelA ? "text-green-600" : "text-gray-400"}`}
                >
                  {selectedMatch.winner === selectedMatch.modelA ? "🏆" : ""}
                </div>
              </div>
              <div className="text-center flex items-center justify-center">
                <span className="text-sm text-gray-500">VS</span>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-900 font-medium mb-1">{selectedMatch.modelB}</div>
                <div
                  className={`text-xl mb-1 ${selectedMatch.winner === selectedMatch.modelB ? "text-green-600" : "text-gray-400"}`}
                >
                  {selectedMatch.winner === selectedMatch.modelB ? "🏆" : ""}
                </div>
              </div>
            </div>

            {selectedMatch.winner ? (
              <div className="text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-semibold text-green-700">
                  🎉 Winner: {selectedMatch.winner}
                </div>
              </div>
            ) : (
              <div className="text-center mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm font-semibold text-yellow-700">⏳ Match not yet played</div>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <div
              className="flex items-center justify-between cursor-pointer p-3"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <h3 className="text-base font-semibold text-gray-900">Challenge Prompt</h3>
              <div className={`transition-transform ${showPrompt ? "rotate-180" : ""}`}>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {showPrompt && (
              <div className="px-3 pb-3">
                <p className="text-sm text-gray-900 italic">&ldquo;{challengePrompt}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <div className="p-3">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Model Responses</h3>
            </div>

            {selectedMatch.modelA && (
              <ResponseSection
                modelName={selectedMatch.modelA}
                response={
                  tournament.modelResponses?.[selectedMatch.modelA]?.response ||
                  "Response not available"
                }
                isWinner={selectedMatch.winner === selectedMatch.modelA}
              />
            )}

            {selectedMatch.modelB && (
              <ResponseSection
                modelName={selectedMatch.modelB}
                response={
                  tournament.modelResponses?.[selectedMatch.modelB]?.response ||
                  "Response not available"
                }
                isWinner={selectedMatch.winner === selectedMatch.modelB}
              />
            )}
          </div>

          <div className="border-b border-gray-200">
            <div
              className="flex items-center justify-between cursor-pointer p-3"
              onClick={() => setShowJudgeEval(!showJudgeEval)}
            >
              <h3 className="text-base font-semibold text-gray-900">🧑‍⚖️ Judge&apos;s Evaluation</h3>
              <div className={`transition-transform ${showJudgeEval ? "rotate-180" : ""}`}>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {showJudgeEval && (
              <div className="px-3 pb-3">
                <div className="text-xs text-gray-600 mb-2">Judge&apos;s Reasoning:</div>
                <p className="text-xs text-gray-900 leading-relaxed mb-2">
                  {selectedMatch.judgeExplanation || "Judge explanation not available"}
                </p>
                <div className="text-xs text-gray-600">
                  Judged by: AI Judge • Evaluation completed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
