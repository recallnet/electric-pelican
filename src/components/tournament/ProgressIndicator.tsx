"use client";

import React from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type ProgressIndicatorProps } from "@/types/components";

/**
 * ProgressIndicator component displays tournament progress with
 * Electric Pelican design system styling.
 */
export function ProgressIndicator({
  phase,
  progress,
  currentRound,
  totalRounds,
  winner,
  className = "",
}: ProgressIndicatorProps) {
  // Phase display information
  const phaseInfo = {
    setup: { label: "Setting Up", color: "text-brand-gray-03", icon: "⚙️" },
    executing_models: { label: "Running Models", color: "text-brand-blue", icon: "🚀" },
    judging: { label: "Judging Matches", color: "text-brand-yellow", icon: "⚖️" },
    completed: { label: "Complete", color: "text-brand-green", icon: "🏆" },
    failed: { label: "Failed", color: "text-brand-red", icon: "❌" },
  };

  const currentPhase = phaseInfo[phase];
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Progress bar color based on phase
  const progressBarColor = {
    setup: "bg-brand-gray-03",
    executing_models: "bg-brand-blue",
    judging: "bg-brand-yellow",
    completed: "bg-brand-green",
    failed: "bg-brand-red",
  }[phase];

  return (
    <GlassPanel className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={currentPhase.label}>
            {currentPhase.icon}
          </span>
          <h3 className={`text-headline ${currentPhase.color}`}>{currentPhase.label}</h3>
        </div>
        <div className="text-right">
          <div className="text-label text-brand-gray-03">Progress</div>
          <div className={`text-headline font-bold ${currentPhase.color}`}>{clampedProgress}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          className="w-full bg-brand-gray-01 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tournament progress: ${clampedProgress}%`}
        >
          <div
            className={`h-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Status Information */}
      <div className="flex items-center justify-between">
        <div className="text-body text-brand-gray-04">
          {phase === "completed" && winner ? (
            <span className="text-brand-green font-semibold">🏆 Winner: {winner}</span>
          ) : phase === "failed" ? (
            <span className="text-brand-red">Tournament failed</span>
          ) : (
            <>
              Round <span className="text-brand-black font-semibold">{currentRound}</span> of{" "}
              <span className="text-brand-black font-semibold">{totalRounds}</span>
            </>
          )}
        </div>

        {/* Live indicator for active phases */}
        {(phase === "executing_models" || phase === "judging") && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
            <span className="text-label text-brand-green">LIVE</span>
          </div>
        )}
      </div>

      {/* Phase-specific details */}
      {phase === "executing_models" && (
        <div className="mt-3 text-label text-brand-blue">
          Running AI models to generate responses...
        </div>
      )}

      {phase === "judging" && (
        <div className="mt-3 text-label text-brand-yellow">
          Evaluating responses and determining winners...
        </div>
      )}
    </GlassPanel>
  );
}
