"use client";

/**
 * @file ModelSelectionPanel - Single model recommendation display
 * @description Shows the single best model recommendation with ELO scores and reasoning
 */

import { GlassPanel } from "@/components/ui/glass-panel";
import type { ModelSelectionPanelProps } from "@/types/router-ui";

/**
 * Single model recommendation panel component
 */
export default function ModelSelectionPanel({
  recommendation,
  isOptimizing,
  selectionError,
  readOnly = false,
}: ModelSelectionPanelProps & { readOnly?: boolean }) {
  // Read-only mode - simplified display without GlassPanel
  if (readOnly && recommendation) {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="space-y-2">
          <h4 className="font-medium">{recommendation.modelName}</h4>
          <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
          <div className="text-xs text-gray-500">
            ELO: {Math.round(recommendation.eloScore)} | {recommendation.provider}
          </div>
        </div>
      </div>
    );
  }

  // Normal interactive mode
  return (
    <GlassPanel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">🎯 Single Model Recommendation</h3>
          <p className="text-gray-600">Best overall model for your prompt based on ELO scores</p>
        </div>

        {/* Loading State */}
        {isOptimizing && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-3 text-gray-600">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>Finding best model...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {selectionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">⚠️ Model selection failed: {selectionError}</p>
          </div>
        )}

        {/* Model Recommendation */}
        {recommendation && !isOptimizing && (
          <div className="space-y-4">
            {/* Model Card */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg font-medium">
                      {recommendation.provider?.charAt(0).toUpperCase() || "M"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{recommendation.modelName}</h4>
                    {recommendation.provider && (
                      <p className="text-sm text-gray-600">{recommendation.provider}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(recommendation.eloScore)}
                  </div>
                  <div className="text-sm text-gray-500">ELO Score</div>
                </div>
              </div>
            </div>

            {/* Selection Reasoning */}
            {recommendation.reasoning && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">Why this model was selected:</h5>
                <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!recommendation && !isOptimizing && !selectionError && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p>Enter a prompt above to get model recommendations</p>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
