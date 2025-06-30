"use client";

/**
 * @file WorkflowStepCard - Individual workflow step display card
 * @description Shows step details, model assignment, and selection reasoning
 */

import { getTagInfo } from "@/lib/tag-taxonomy";
import type { WorkflowStepCardProps } from "@/types/router-ui";

import CapabilityBadge from "./CapabilityBadge";

/**
 * Individual workflow step card component
 */
export default function WorkflowStepCard({
  step,
  stepNumber,
  isSelected,
  onClick,
  readOnly = false,
}: WorkflowStepCardProps & { readOnly?: boolean }) {
  // Get the primary capability from the step
  const primaryCapability = step.primaryCapability;
  const primaryCapabilityInfo = primaryCapability ? getTagInfo(primaryCapability) : null;

  // Handle click only if not in readOnly mode
  const handleClick = readOnly ? undefined : onClick;

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 border rounded-lg transition-all duration-200
        ${readOnly ? "cursor-default" : "cursor-pointer"}
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : `border-gray-200 bg-gray-50 ${!readOnly ? "hover:border-gray-300 hover:bg-gray-100" : ""}`
        }
      `}
    >
      <div className="space-y-3">
        {/* Step Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {stepNumber}
              </span>
              <h4 className="font-medium text-gray-900">{step.description}</h4>
            </div>
          </div>

          <div className="text-right text-sm text-gray-500 ml-4">
            <div>~{step.estimatedTokens.toLocaleString()} tokens</div>
          </div>
        </div>

        {/* Required Capabilities */}
        {step.requiredCapabilities && step.requiredCapabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {step.requiredCapabilities.map((capability) => (
              <CapabilityBadge key={capability} capability={capability} />
            ))}
          </div>
        )}

        {/* Selected Model */}
        {step.selectedModel && (
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">
                  {step.selectedModel.provider?.charAt(0).toUpperCase() || "M"}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{step.selectedModel.modelName}</div>
                {step.selectedModel.provider && (
                  <div className="text-sm text-gray-500">{step.selectedModel.provider}</div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {Math.round(step.selectedModel.eloScore || 0)}
              </div>
              <div className="text-xs text-gray-500">ELO</div>
            </div>
          </div>
        )}

        {/* Selection Reasoning */}
        {step.selectedModel?.reasoning && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
            <strong>Why this model:</strong> {step.selectedModel.reasoning}
          </div>
        )}

        {/* Dependencies */}
        {step.dependencies && step.dependencies.length > 0 && (
          <div className="text-xs text-gray-500">
            <strong>Depends on:</strong> {step.dependencies.join(", ")}
          </div>
        )}

        {/* Primary Capability Tag - Bottom Right */}
        {primaryCapabilityInfo && (
          <div className="flex justify-end">
            <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md border border-blue-200">
              <span className="mr-1">🏷️</span>
              {primaryCapabilityInfo.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
