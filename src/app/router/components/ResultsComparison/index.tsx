/**
 * @file Results comparison main component
 * @description Orchestrates comparison display of single and workflow results
 */

"use client";

import type { CompletionResult } from "@/types/router-ui";

import { compareExecutions } from "../../utils/progress-calculations";
import { ComparisonInsights } from "./ComparisonInsights";
import { ResultCard } from "./ResultCard";

export interface ResultsComparisonProps {
  singleResult?: CompletionResult;
  workflowResult?: CompletionResult;
  showComparison: boolean;
  onRateResult?: (mode: "single" | "workflow", rating: number) => void;
}

export function ResultsComparison({
  singleResult,
  workflowResult,
  showComparison,
  onRateResult,
}: ResultsComparisonProps) {
  if (!showComparison || (!singleResult && !workflowResult)) {
    return null;
  }

  const comparison = compareExecutions(
    singleResult
      ? {
          tokensUsed: singleResult.totalTokensUsed,
          cost: singleResult.totalCost,
          duration: singleResult.totalExecutionTime,
        }
      : undefined,
    workflowResult
      ? {
          tokensUsed: workflowResult.totalTokensUsed,
          cost: workflowResult.totalCost,
          duration: workflowResult.totalExecutionTime,
        }
      : undefined,
  );

  return (
    <div className="results-comparison">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        📊 Results Comparison
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Result */}
        {workflowResult && (
          <ResultCard
            title="🔄 Workflow Result"
            result={workflowResult}
            onRate={onRateResult ? (rating) => onRateResult("workflow", rating) : undefined}
            isFaster={comparison.fasterMode === "workflow"}
            isCheaper={comparison.cheaperMode === "workflow"}
          />
        )}

        {/* Single Model Result */}
        {singleResult && (
          <ResultCard
            title="🤖 Single Model Result"
            result={singleResult}
            onRate={onRateResult ? (rating) => onRateResult("single", rating) : undefined}
            isFaster={comparison.fasterMode === "single"}
            isCheaper={comparison.cheaperMode === "single"}
          />
        )}
      </div>

      {/* Comparison Insights */}
      {singleResult && workflowResult && <ComparisonInsights comparison={comparison} />}
    </div>
  );
}
