"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { WizardProgress } from "@/components/tournament/WizardProgress";
import { ElectricButton } from "@/components/ui/electric-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useWizard } from "@/contexts/TournamentWizardContext";
import { useWizardNavHotkeys } from "@/hooks/useWizardNavHotkeys";
import { typedApi } from "@/lib/api-client";

export default function EvaluationSetupPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  useWizardNavHotkeys();

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const [loading, setLoading] = useState(false);

  const { authenticated, login, getAccessToken } = usePrivy();

  // Keep flag to retry start after login completes
  const pendingAfterLogin = useRef(false);

  const ready =
    state.prompt && state.models.length === (state.bracketSize ?? 8) && state.bracketSize;

  async function createEvaluation() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const promptTrimmed = (state.prompt ?? "").trim();
      if (!promptTrimmed) {
        toast.error("Prompt required", {
          description: "Please enter a challenge prompt before starting.",
        });
        setLoading(false);
        return;
      }

      const judgeTrimmed = (state.judgePrompt ?? "").trim();
      if (!judgeTrimmed) {
        toast.error("Judge prompt required", {
          description: "Please enter a judge prompt before starting.",
        });
        setLoading(false);
        return;
      }

      const bracketSize = state.bracketSize ?? 8;
      if (state.models.length !== bracketSize) {
        toast.error("Model count mismatch", {
          description: `Please select exactly ${bracketSize} models for your bracket.`,
        });
        setLoading(false);
        return;
      }

      const data = await typedApi(
        "POST /api/tournament",
        {},
        {
          prompt: promptTrimmed,
          models: state.models,
          bracketSize: bracketSize as 4 | 8 | 16,
          judgeModel: state.judgeModel ?? state.models[0] ?? "",
          judgePrompt: judgeTrimmed,
        },
        headers ? { headers } : {},
      );

      if (!data.success || !data.id) {
        throw new Error(data.error || "Failed to create evaluation");
      }

      const evaluationId = data.id;

      // 1. Create bracket
      await typedApi(
        "POST /api/tournament/:id/bracket",
        { id: evaluationId },
        {
          models: state.models,
          judgeModel: state.judgeModel ?? state.models[0] ?? "",
        },
      );

      // 2. Verify bracket was created before redirecting
      let bracketReady = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!bracketReady && attempts < maxAttempts) {
        try {
          const statusCheck = await typedApi("GET /api/tournament/:id/status", {
            id: evaluationId,
          });
          if (statusCheck.success && statusCheck.tournament) {
            bracketReady = true;
            break;
          }
        } catch (err) {
          console.log(`Bracket verification attempt ${attempts + 1} failed:`, err);
        }

        attempts++;
        if (!bracketReady && attempts < maxAttempts) {
          // Wait 200ms before next attempt
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      if (!bracketReady) {
        throw new Error("Failed to verify evaluation bracket creation");
      }

      // 3. Kick off execution and judging (best-effort)
      // Start execution in background (don't await - let user watch progress live)
      (async () => {
        try {
          // Execute models (streaming system handles both execution and judging)
          const executeResult = await typedApi(
            "POST /api/tournament/:id/execute",
            { id: evaluationId },
            {
              challengePrompt: promptTrimmed,
              models: state.models,
              judgeModel: state.judgeModel ?? state.models[0] ?? "",
            },
          );

          // Check if streaming execution already completed everything
          if (executeResult.streamingEnabled && executeResult.completed) {
            console.log(`[setup] Streaming execution completed evaluation ${evaluationId}`);
            return; // No need to call judge endpoint
          }

          // Fallback: If not using streaming or not completed, call judge endpoint
          console.log(`[setup] Calling judge endpoint for evaluation ${evaluationId}`);
          await typedApi(
            "POST /api/tournament/:id/judge",
            { id: evaluationId },
            {
              challengePrompt: promptTrimmed,
              judgePrompt:
                "Compare the two responses and determine which better fulfills the challenge. Consider creativity, accuracy, completeness, and adherence to the requirements.",
              judgeModel: state.judgeModel ?? state.models[0] ?? "",
            },
          );
        } catch (err) {
          console.error("Evaluation execution/judging error:", err);
          // Also show user-friendly error
          if (err instanceof Error) {
            console.error("Error details:", err.message, err.stack);
          }
        }
      })();

      router.push(`/eval/${evaluationId}`);
      setTimeout(() => dispatch({ type: "RESET" }), 500);
    } catch (err) {
      toast.error("Error", { description: err instanceof Error ? err.message : "Unknown" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!ready || loading) return;

    if (!authenticated) {
      // Persist state to sessionStorage so it survives page reload during login
      try {
        sessionStorage.setItem("pendingTournamentState", JSON.stringify(state));
        sessionStorage.setItem("pendingAutoStart", "1");
      } catch (err) {
        console.error("Failed to save state to sessionStorage:", err);
      }

      pendingAfterLogin.current = true;
      login();
      return;
    }

    await createEvaluation();
  }

  // Watch for auth change to auto-start if user just logged in
  useEffect(() => {
    if (authenticated) {
      const shouldAuto = sessionStorage.getItem("pendingAutoStart");
      if (shouldAuto) {
        sessionStorage.removeItem("pendingAutoStart");
        pendingAfterLogin.current = true; // ensure flag
      }
    }

    if (authenticated && pendingAfterLogin.current) {
      pendingAfterLogin.current = false;
      createEvaluation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8 items-center justify-center focus:outline-none"
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow">
        <WizardProgress current={3} />
        <GlassPanel className="p-8 mt-8">
          <h1 className="text-display text-brand-black mb-4">Confirm Evaluation</h1>
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-brand-blue">Prompt</h2>
              <p className="whitespace-pre-wrap bg-brand-gray-01 p-4 rounded border border-brand-gray-02">
                {state.prompt ?? "—"}
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-brand-blue">
                Contestant Models ({state.bracketSize})
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                {state.models.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>

            {state.judgeModel && (
              <div>
                <h2 className="font-semibold text-brand-blue">Judge Model</h2>
                <p>{state.judgeModel}</p>
              </div>
            )}
          </div>

          <ElectricButton
            size="lg"
            className="w-full mt-8"
            disabled={!ready || loading}
            onClick={handleStart}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Starting...
              </>
            ) : (
              "Start Evaluation"
            )}
          </ElectricButton>
        </GlassPanel>
      </div>
    </div>
  );
}
