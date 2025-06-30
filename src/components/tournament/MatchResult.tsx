"use client";

import React, { useState } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type MatchResultProps } from "@/types/components";

/**
 * MatchResult component displays individual tournament match results
 * with Electric Pelican design system styling.
 */
export function MatchResult({ match, modelNames = {}, className = "" }: MatchResultProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isCompleted = match.winner !== null;
  const isPending = !isCompleted && match.modelA && match.modelB;

  // Get display names for models
  const modelAName = match.modelA ? modelNames[match.modelA] || match.modelA : "TBD";
  const modelBName = match.modelB ? modelNames[match.modelB] || match.modelB : "TBD";

  // Winner highlighting
  const modelAIsWinner = match.winner === match.modelA;
  const modelBIsWinner = match.winner === match.modelB;

  // Status styling
  const getStatusColor = () => {
    if (isCompleted) return "text-brand-green";
    if (isPending) return "text-brand-yellow";
    return "text-brand-gray-03";
  };

  const getStatusText = () => {
    if (isCompleted) return "✓ Complete";
    if (isPending) return "⧗ In Progress";
    return "⋯ Waiting";
  };

  const getBorderColor = () => {
    if (isCompleted) return "border-brand-green/30";
    if (isPending) return "border-brand-yellow/30";
    return "border-brand-gray-02";
  };

  return (
    <GlassPanel className={`p-3 ${getBorderColor()} ${className}`}>
      {/* Match Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-brand-gray-03">
          R{match.round} • M{match.position}
        </div>
        <div className={`text-xs ${getStatusColor()}`}>{getStatusText()}</div>
      </div>

      {/* Model A */}
      <div
        className={`
          flex items-center justify-between p-2 mb-1 rounded-md transition-all
          ${modelAIsWinner ? "bg-brand-green/10 border border-brand-green/30" : "bg-brand-gray-01"}
        `}
      >
        <span
          className={`text-xs truncate flex-1 ${modelAIsWinner ? "text-brand-green font-medium" : "text-brand-black"}`}
        >
          {modelAName}
        </span>
        {modelAIsWinner && <span className="text-brand-green text-xs ml-1">🏆</span>}
      </div>

      {/* VS Divider */}
      <div className="text-center text-xs text-brand-gray-03 my-1">VS</div>

      {/* Model B */}
      <div
        className={`
          flex items-center justify-between p-2 mb-2 rounded-md transition-all
          ${modelBIsWinner ? "bg-brand-green/10 border border-brand-green/30" : "bg-brand-gray-01"}
        `}
      >
        <span
          className={`text-xs truncate flex-1 ${modelBIsWinner ? "text-brand-green font-medium" : "text-brand-black"}`}
        >
          {modelBName}
        </span>
        {modelBIsWinner && <span className="text-brand-green text-xs ml-1">🏆</span>}
      </div>

      {/* Details Button (if judge explanation exists) */}
      {match.judgeExplanation && (
        <div className="mt-2 border-t border-brand-gray-01 pt-2">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-xs text-brand-gray-03 hover:text-brand-blue transition-colors cursor-pointer"
          >
            {showDetails ? "▼" : "▶"} Judge Explanation
          </button>

          {showDetails && (
            <div className="mt-2 p-2 bg-brand-gray-01 rounded-md">
              <div className="text-xs text-brand-gray-04 leading-relaxed">
                {match.judgeExplanation}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
