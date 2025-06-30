/**
 * @file Metrics display component
 * @description Shows execution metrics (time, tokens, steps, cost)
 */

import { Clock, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CompletionResult } from "@/types/router-ui";

import { formatTime } from "../../utils/time-formatting";

interface MetricsDisplayProps {
  result: CompletionResult;
}

export function MetricsDisplay({ result }: MetricsDisplayProps) {
  return (
    <>
      {/* Metrics Grid */}
      <div className="metrics-grid grid grid-cols-3 gap-3 mb-4">
        <div className="metric text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</div>
          <div className="flex items-center justify-center text-sm font-medium">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(result.totalExecutionTime)}
          </div>
        </div>

        <div className="metric text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tokens</div>
          <div className="flex items-center justify-center text-sm font-medium">
            <Zap className="h-3 w-3 mr-1" />
            {result.totalTokensUsed.toLocaleString()}
          </div>
        </div>

        <div className="metric text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Steps</div>
          <div className="flex items-center justify-center text-sm font-medium">
            📝 {result.stepsCompleted}
          </div>
        </div>
      </div>

      {/* Cost */}
      {result.totalCost > 0 && (
        <div className="text-center mb-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost</div>
          <div className="text-sm font-medium">${result.totalCost.toFixed(4)}</div>
        </div>
      )}

      {/* Model Usage */}
      {result.modelUsage.length > 0 && (
        <div className="model-usage mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Models Used:</div>
          <div className="flex flex-wrap gap-1">
            {result.modelUsage.map((usage, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                🤖 {usage.modelId}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
