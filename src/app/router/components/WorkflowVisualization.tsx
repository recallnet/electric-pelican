"use client";

/**
 * @file WorkflowVisualization - Visual display of workflow steps and model assignments
 * @description Shows workflow breakdown with step cards and model selection reasoning
 */

import type { WorkflowVisualizationProps } from "@/types/router-ui";

import WorkflowStepCard from "./WorkflowStepCard";

/**
 * Visual workflow breakdown component
 */
export default function WorkflowVisualization({
  workflow,
  isOptimizing,
  selectedStep,
  onStepSelect,
  selectionError,
  readOnly = false,
}: WorkflowVisualizationProps & { readOnly?: boolean }) {
  // Calculate totals
  const totalTokens = workflow.reduce((sum, step) => sum + step.estimatedTokens, 0);
  const uniqueModels = new Set(workflow.map((step) => step.selectedModel?.modelId)).size;

  // Disable interactions when readOnly is true
  const handleStepSelect = readOnly ? () => {} : onStepSelect;

  return (
    <div className={`workflow-visualization ${readOnly ? "read-only" : ""}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">📊 Workflow Breakdown</h4>
          {workflow.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>{workflow.length} steps</span>
              <span>⚡ {totalTokens.toLocaleString()} tokens</span>
              <span>🤖 {uniqueModels} models</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isOptimizing && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-3 text-gray-600">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>Optimizing model selection...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {selectionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">⚠️ Model selection failed: {selectionError}</p>
          </div>
        )}

        {/* Workflow Steps */}
        {workflow.length > 0 && !isOptimizing && (
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                stepNumber={index + 1}
                isSelected={selectedStep === step.id}
                onClick={() => handleStepSelect(step.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {workflow.length === 0 && !isOptimizing && !selectionError && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p>Enter a prompt above to see the workflow breakdown</p>
          </div>
        )}

        {/* Workflow Connections */}
        {workflow.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Execution Flow</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {workflow.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Step {index + 1}
                  </span>
                  {index < workflow.length - 1 && <span className="mx-2 text-gray-400">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
