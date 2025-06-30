"use client";

import React from "react";

import { cn } from "@/lib/utils";

export interface WizardProgressProps {
  current: 1 | 2 | 3;
}

const steps = [
  { id: 1, label: "Prompt" },
  { id: 2, label: "Models" },
  { id: 3, label: "Confirm" },
];

export function WizardProgress({ current }: WizardProgressProps) {
  return (
    <nav aria-label="Wizard progress" className="mb-6">
      <ol role="list" className="flex items-center justify-center gap-4 text-label font-mono">
        {steps.map((s, idx) => {
          const isActive = s.id === current;
          return (
            <li key={s.id} className="flex items-center gap-1" role="listitem">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "px-2 py-1 rounded border",
                  isActive
                    ? "bg-brand-blue text-brand-white"
                    : "bg-brand-gray-01 text-brand-blue border-brand-blue/30",
                )}
              >
                {s.id} / 3 {s.label}
              </span>
              {idx < steps.length - 1 && <span className="text-brand-blue">→</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
