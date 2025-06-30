"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { PromptChallengeForm } from "@/components/tournament";
import { WizardProgress } from "@/components/tournament/WizardProgress";
import { useWizard } from "@/contexts/TournamentWizardContext";
import { useWizardNavHotkeys } from "@/hooks/useWizardNavHotkeys";

/**
 * Demo page for prompt challenge configuration.
 * Shows the complete prompt input form with validation.
 */
export default function ChallengePage() {
  const { dispatch } = useWizard();
  const router = useRouter();
  useWizardNavHotkeys();

  // focus container on mount for accessibility & focus trap root
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <main
      ref={containerRef}
      tabIndex={-1}
      role="main"
      className="min-h-screen bg-gray-50 py-8 focus:outline-none"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <WizardProgress current={1} />
        <PromptChallengeForm
          initialPrompt="Generate an SVG of a pelican riding a bicycle"
          onSubmit={(data) => {
            dispatch({ type: "SET_PROMPT", prompt: data.prompt });
            dispatch({ type: "SET_JUDGE_PROMPT", judgePrompt: data.judgePrompt });
            router.push("/models");
          }}
        />
      </div>
    </main>
  );
}
