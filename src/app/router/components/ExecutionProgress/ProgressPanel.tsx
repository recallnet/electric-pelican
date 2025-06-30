import type { ExecutionProgress as ExecutionProgressType } from "@/types/router-ui";

import { formatTime } from "../../utils/time-formatting";
import { AnimatedProgressBar } from "../AnimatedProgressBar";

interface ProgressPanelProps {
  title: string;
  progress?: ExecutionProgressType;
  colorScheme: "blue" | "green";
}

export function ProgressPanel({ title, progress, colorScheme }: ProgressPanelProps) {
  const colorClasses = {
    blue: {
      badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
    },
    green: {
      badge: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
    },
  };

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
        <div className="space-y-3">
          <AnimatedProgressBar
            progress={progress.progressPercentage}
            status={progress.status}
            showLabel={false}
          />

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <span className="font-mono">{Math.round(progress.progressPercentage)}%</span>
            </div>

            {progress.status === "running" && (
              <>
                {progress.currentStep && progress.totalSteps && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Step:</span>
                    <span>
                      {progress.currentStep}/{progress.totalSteps}
                    </span>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {progress.stepDescription}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className={`px-2 py-1 rounded ${colorClasses[colorScheme].badge}`}>
                    🤖 {progress.modelId}
                  </span>
                  {progress.estimatedTimeRemaining > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">
                      ⏱️ {formatTime(progress.estimatedTimeRemaining)} remaining
                    </span>
                  )}
                </div>
              </>
            )}

            {progress.errorMessage && (
              <div className="text-red-600 dark:text-red-400 text-xs mt-2">
                {progress.errorMessage}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-600 text-sm">Waiting to start...</div>
      )}
    </div>
  );
}
