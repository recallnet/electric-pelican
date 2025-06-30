"use client";

import { useEffect, useState } from "react";

import type {
  CompletionResult,
  ExecutionProgress as ExecutionProgressType,
  IntermediateResult,
} from "@/types/router-ui";

import { IntermediateResults } from "./IntermediateResults";
import { ResultsComparison } from "./ResultsComparison";

export interface ExecutionProgressProps {
  executionId: string;
  singleProgress?: ExecutionProgressType | undefined;
  workflowProgress?: ExecutionProgressType | undefined;
  intermediateResults: IntermediateResult[];
  singleResult?: CompletionResult | undefined;
  workflowResult?: CompletionResult | undefined;
  isExecuting: boolean;
  isConnected: boolean;
  onCancel: () => void;
  onRateResult?: ((mode: "single" | "workflow", rating: number) => void) | undefined;
}

export function ExecutionProgress({
  executionId,
  singleProgress,
  workflowProgress,
  intermediateResults,
  singleResult,
  workflowResult,
  isExecuting,
  isConnected,
  onCancel,
}: ExecutionProgressProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [resultSaved, setResultSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const showComparison = Boolean(singleResult || workflowResult) && !isExecuting;
  const isExecutionComplete = !isExecuting && Boolean(singleResult || workflowResult);

  // Save result when execution completes
  useEffect(() => {
    if (isExecutionComplete && executionId && !resultSaved && !saving && !saveError) {
      console.log("[ExecutionProgress] Attempting to save result for:", executionId);
      saveExecutionResult(executionId);
    }
  }, [isExecutionComplete, executionId, resultSaved, saving, saveError]);

  // Update URL when result is saved without causing page refresh
  useEffect(() => {
    if (shareUrl && resultSaved && !redirecting) {
      setRedirecting(true);
      // Update the URL to the shareable result without page refresh
      setTimeout(() => {
        window.history.replaceState(null, "", shareUrl);
        setRedirecting(false);
      }, 2000);
    }
  }, [shareUrl, resultSaved, redirecting]);

  const saveExecutionResult = async (executionId: string) => {
    setSaving(true);
    setSaveError(null);
    console.log("[ExecutionProgress] Starting save for execution:", executionId);

    try {
      const response = await fetch("/api/router/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId }),
      });

      console.log("[ExecutionProgress] Save response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[ExecutionProgress] Save response data:", data);

        if (data.success) {
          setShareUrl(data.data.shareUrl);
          setResultSaved(true);
          console.log("🎉 Result saved for sharing:", data.data);
        } else {
          throw new Error(data.message || data.error || "Save failed");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("[ExecutionProgress] Failed to save execution result:", error);
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="execution-progress space-y-6">
      <ConnectionStatus isConnected={isConnected} isExecuting={isExecuting} />
      <ProgressHeader isExecuting={isExecuting} onCancel={onCancel} />
      <ProgressPanels
        {...(singleProgress !== undefined && { singleProgress })}
        {...(workflowProgress !== undefined && { workflowProgress })}
      />
      {intermediateResults.length > 0 && <IntermediateResults results={intermediateResults} />}
      {showComparison && (
        <ResultsComparison
          {...(singleResult && { singleResult })}
          {...(workflowResult && { workflowResult })}
          showComparison={true}
        />
      )}
    </div>
  );
}

// Sub-components extracted for better organization
function ConnectionStatus({
  isConnected,
  isExecuting,
}: {
  isConnected: boolean;
  isExecuting: boolean;
}) {
  if (isConnected || !isExecuting) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Reconnecting to progress stream...</span>
      </div>
    </div>
  );
}

function ProgressHeader({ isExecuting, onCancel }: { isExecuting: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Execution Progress</h3>
      {isExecuting && (
        <button
          onClick={onCancel}
          className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-200 hover:border-red-300 rounded"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function ProgressPanels({
  singleProgress,
  workflowProgress,
}: {
  singleProgress?: ExecutionProgressType | undefined;
  workflowProgress?: ExecutionProgressType | undefined;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ProgressPanel
        title="Workflow Mode"
        {...(workflowProgress !== undefined && { progress: workflowProgress })}
      />
      <ProgressPanel
        title="Single Model Mode"
        {...(singleProgress !== undefined && { progress: singleProgress })}
      />
    </div>
  );
}

function ProgressPanel({
  title,
  progress,
}: {
  title: string;
  progress?: ExecutionProgressType | undefined;
}) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        {progress?.status === "completed" && (
          <div className="text-green-600 dark:text-green-400 text-sm">✅ Complete</div>
        )}
        {progress?.status === "failed" && (
          <div className="text-red-600 dark:text-red-400 text-sm">❌ Failed</div>
        )}
      </div>
      {progress ? (
        <div className="text-sm">
          <div className="mb-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>
          <div>Progress: {Math.round(progress.progressPercentage)}%</div>
          {progress.stepDescription && (
            <div className="text-gray-500 mt-1">{progress.stepDescription}</div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-sm">Waiting to start...</div>
      )}
    </div>
  );
}
