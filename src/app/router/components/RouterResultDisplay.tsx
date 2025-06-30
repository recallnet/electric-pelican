"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { RouterExecutionResult } from "@/types/router-results";
import type { CompletionResult } from "@/types/router-ui";

import { EloSnapshotContext } from "./EloSnapshotContext";
import ModelSelectionPanel from "./ModelSelectionPanel";
// Import existing router components for reuse
import { ResultsComparison } from "./ResultsComparison";
import { ShareButton } from "./ShareButton";
import WorkflowVisualization from "./WorkflowVisualization";

interface RouterResultDisplayProps {
  result: RouterExecutionResult;
  isSharedResult: boolean;
}

export function RouterResultDisplay({ result, isSharedResult }: RouterResultDisplayProps) {
  const [_selectedStep, _setSelectedStep] = useState<string | undefined>();

  // Transform API data to CompletionResult format expected by ResultsComparison
  const transformedSingleResult = result.singleResult
    ? transformToCompletionResult(result.singleResult, "single")
    : undefined;

  const transformedWorkflowResult = result.workflowResult
    ? transformToCompletionResult(result.workflowResult, "workflow")
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header with sharing context */}
      <RouterResultHeader result={result} isSharedResult={isSharedResult} />

      {/* Original prompt display - static display with link to new analysis */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Original Prompt</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href="/router">🔍 Analyze New Prompt</Link>
          </Button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-gray-800 whitespace-pre-wrap">{result.originalPrompt}</p>
        </div>
      </GlassPanel>

      {/* Analysis results - reuse existing WorkflowVisualization */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Analysis & Model Selection</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-gray-800">Workflow Breakdown</h4>
            <WorkflowVisualization
              workflow={result.optimizedWorkflow}
              isOptimizing={false}
              onStepSelect={_setSelectedStep}
              readOnly={true}
            />
          </div>
          <div>
            <h4 className="font-medium mb-3 text-gray-800">Single Model Recommendation</h4>
            <ModelSelectionPanel
              recommendation={result.singleModelRecommendation}
              isOptimizing={false}
            />
          </div>
        </div>
      </GlassPanel>

      {/* Execution results - use the same component as streaming */}
      <ResultsComparison
        {...(transformedSingleResult && { singleResult: transformedSingleResult })}
        {...(transformedWorkflowResult && { workflowResult: transformedWorkflowResult })}
        showComparison={true}
      />

      {/* Model ELO context - new component */}
      <EloSnapshotContext modelEloData={result.modelEloData} />

      {/* Metadata footer */}
      <RouterResultFooter result={result} />

      {/* Type iteration notes (development only) */}
      {process.env.NODE_ENV === "development" && <TypeIterationNotes result={result} />}
    </div>
  );
}

/**
 * Transform raw API result to CompletionResult format expected by ResultsComparison
 */
function transformToCompletionResult(
  apiResult: any,
  executionMode: "single" | "workflow",
): CompletionResult {
  // Handle single model result
  if (executionMode === "single") {
    return {
      executionMode: "single",
      finalResult: apiResult.content || "",
      totalExecutionTime: apiResult.duration || 0,
      totalTokensUsed: apiResult.tokensUsed || 0,
      totalCost: apiResult.cost || 0,
      stepsCompleted: 1,
      modelUsage: [
        {
          modelId: apiResult.modelUsed || "unknown",
          modelName: apiResult.metadata?.modelName || "Unknown Model",
          provider: apiResult.metadata?.provider || "unknown",
          tokensUsed: apiResult.tokensUsed || 0,
          cost: apiResult.cost || 0,
          executionTime: apiResult.duration || 0,
          stepsExecuted: 1,
        },
      ],
    };
  }

  // Handle workflow result
  if (executionMode === "workflow") {
    const stepResults = apiResult.stepResults || [];
    const modelUsageMap = new Map<string, any>();

    // Aggregate model usage from step results
    stepResults.forEach((step: any) => {
      const modelId = step.modelUsed;
      if (modelUsageMap.has(modelId)) {
        const existing = modelUsageMap.get(modelId);
        existing.tokensUsed += step.tokensUsed || 0;
        existing.cost += step.cost || 0;
        existing.executionTime += step.duration || 0;
        existing.stepsExecuted += 1;
      } else {
        modelUsageMap.set(modelId, {
          modelId,
          modelName: step.modelUsed || "Unknown Model",
          provider: step.modelUsed?.split("/")[0] || "unknown",
          tokensUsed: step.tokensUsed || 0,
          cost: step.cost || 0,
          executionTime: step.duration || 0,
          stepsExecuted: 1,
        });
      }
    });

    return {
      executionMode: "workflow",
      finalResult: apiResult.content || "",
      totalExecutionTime: apiResult.duration || 0,
      totalTokensUsed: apiResult.tokensUsed || 0,
      totalCost: apiResult.cost || 0,
      stepsCompleted: stepResults.length,
      modelUsage: Array.from(modelUsageMap.values()),
    };
  }

  throw new Error(`Unsupported execution mode: ${executionMode}`);
}

interface RouterResultHeaderProps {
  result: RouterExecutionResult;
  isSharedResult: boolean;
}

function RouterResultHeader({ result, isSharedResult }: RouterResultHeaderProps) {
  const shareUrl = `/router/${result.id}`;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Router Execution Result</h1>
            {isSharedResult && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                📤 Shared Result
              </Badge>
            )}
            {result.id.startsWith("mock_") && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                🧪 Mock Data
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>🕒 Completed {format(new Date(result.completedAt), "PPpp")}</span>
            <span>⚡ {result.totalExecutionTime}ms total</span>
            <span>🔄 Router v{result.routerVersion}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton shareUrl={shareUrl} />
          <Button variant="outline" size="sm" asChild>
            <Link href="/router">🚀 Try Router</Link>
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}

interface RouterResultFooterProps {
  result: RouterExecutionResult;
}

function RouterResultFooter({ result }: RouterResultFooterProps) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Result ID: {result.id}</span>
          <span>Execution: {result.executionId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <strong className="text-blue-600">Electric Pelican</strong>
        </div>
      </div>
    </GlassPanel>
  );
}

// Development-only component for type iteration feedback
interface TypeIterationNotesProps {
  result: RouterExecutionResult;
}

function TypeIterationNotes({ result: _result }: TypeIterationNotesProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassPanel className="p-4 bg-gray-50 border-gray-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">🔍 Type Iteration Notes</h4>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide" : "Show"} Details
          </Button>
        </div>

        {expanded && (
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong>Missing Data Points to Consider:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>User ID/session information for personalization</li>
              <li>Execution environment details (browser, device, etc.)</li>
              <li>Model temperature/parameters used</li>
              <li>Step-by-step timing breakdown</li>
              <li>Error recovery attempts and details</li>
              <li>Model fallback chain information</li>
              <li>Cost breakdown by model and step</li>
              <li>Quality metrics or confidence scores</li>
            </ul>

            <div className="mt-3">
              <strong>UI Observations:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ELO snapshot display could be more prominent</li>
              <li>Intermediate results need better visual hierarchy</li>
              <li>Comparison data needs richer visualization</li>
              <li>Mobile responsiveness needs testing</li>
              <li>Loading states for large results</li>
            </ul>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
