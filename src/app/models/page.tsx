"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { ModelSelectionForm } from "@/components/models";
import { WizardProgress } from "@/components/tournament/WizardProgress";
import { DEFAULT_JUDGE_MODEL } from "@/config/defaults";
import { useWizard } from "@/contexts/TournamentWizardContext";
import { useWizardNavHotkeys } from "@/hooks/useWizardNavHotkeys";

/**
 * Demo page for model selection UI.
 * Shows the complete model selection form with all features.
 */
export default function ModelsPage() {
  const { dispatch } = useWizard();
  const router = useRouter();
  useWizardNavHotkeys();

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8" ref={containerRef}>
      <WizardProgress current={1} />

      <ModelSelectionForm
        defaultBracketSize={4}
        defaultJudge={DEFAULT_JUDGE_MODEL}
        onSelectionComplete={({ bracketSize, contestants, judge }) => {
          dispatch({
            type: "SET_MODELS",
            models: contestants,
            bracketSize: bracketSize,
          });
          dispatch({
            type: "SET_JUDGE",
            judgeModel: judge,
          });
          // Only navigate if the user explicitly confirms or completes the selection
          // For now, we'll disable automatic navigation to prevent unintended redirects
          router.push("/eval/setup");
        }}
      />
    </div>
  );
}
