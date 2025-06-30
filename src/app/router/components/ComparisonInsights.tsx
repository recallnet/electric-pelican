"use client";

import type { CompletionResult } from "@/types/router-ui";

import { formatTime } from "../utils/time-formatting";

interface ComparisonInsightsProps {
  singleResult: CompletionResult;
  workflowResult: CompletionResult;
  comparison: {
    fasterMode: "single" | "workflow" | "tie";
    cheaperMode: "single" | "workflow" | "tie";
    timeDifference: number;
    costDifference: number;
  };
}

export function ComparisonInsights({ comparison }: ComparisonInsightsProps) {
  const timeSavings = comparison.timeDifference;
  const costSavings = comparison.costDifference;

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">💡 Execution Insights</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="insight">
          <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">⏱️ Performance</div>
          <div className="text-blue-700 dark:text-blue-300">
            {comparison.fasterMode === "tie" ? (
              "Both modes completed in similar time"
            ) : (
              <>
                {comparison.fasterMode === "single" ? "Single model" : "Workflow"} was faster by{" "}
                {formatTime(timeSavings)}
              </>
            )}
          </div>
        </div>

        <div className="insight">
          <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
            💰 Cost Efficiency
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            {comparison.cheaperMode === "tie" ? (
              "Both modes had similar costs"
            ) : (
              <>
                {comparison.cheaperMode === "single" ? "Single model" : "Workflow"} was cheaper by $
                {costSavings.toFixed(4)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
