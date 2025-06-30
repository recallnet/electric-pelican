"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ExecutionComparison } from "@/types/router";
import type { CompletionResult, IntermediateResult } from "@/types/router-ui";

interface ExecutionResultsDisplayProps {
  singleResult?: CompletionResult;
  workflowResult?: CompletionResult;
  intermediateResults: IntermediateResult[];
  comparison?: ExecutionComparison;
  _readOnly?: boolean;
}

export default function ExecutionResultsDisplay({
  singleResult,
  workflowResult,
  intermediateResults,
  comparison,
  _readOnly = false,
}: ExecutionResultsDisplayProps) {
  const [showRawData, setShowRawData] = useState(false);
  const hasResults = singleResult || workflowResult;

  if (!hasResults) {
    return (
      <GlassPanel className="p-6">
        <div className="text-center text-gray-600">
          <p>No execution results available for this router result.</p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-sm mt-2 text-yellow-600">
              💡 This might indicate missing data in our capture process
            </p>
          )}
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results comparison header */}
      {comparison && (
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Execution Comparison</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {Math.abs(comparison.timeDifference)}ms{" "}
                {comparison.timeDifference > 0 ? "faster" : "slower"}
              </span>
              {process.env.NODE_ENV === "development" && (
                <Button variant="ghost" size="sm" onClick={() => setShowRawData(!showRawData)}>
                  {showRawData ? "Hide" : "Show"} Raw Data
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{comparison.reasoning}</p>

          {/* Development raw data view */}
          {showRawData && process.env.NODE_ENV === "development" && (
            <details className="mt-3">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Raw Comparison Data
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                {JSON.stringify(comparison, null, 2)}
              </pre>
            </details>
          )}
        </GlassPanel>
      )}

      {/* Results grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Single model result */}
        {singleResult && (
          <ResultCard title="Single Model Approach" result={singleResult} readOnly={_readOnly} />
        )}

        {/* Workflow result */}
        {workflowResult && (
          <ResultCard
            title="Workflow Approach"
            result={workflowResult}
            intermediateResults={intermediateResults.filter((r) => r.executionMode === "workflow")}
            readOnly={_readOnly}
          />
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  title: string;
  result: CompletionResult;
  intermediateResults?: IntermediateResult[];
  readOnly?: boolean;
}

function ResultCard({ title, result, intermediateResults, readOnly: _readOnly }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassPanel className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>⚡ {result.totalExecutionTime}ms</span>
            <span>🪙 {result.totalTokensUsed} tokens</span>
            <span>💰 ${result.totalCost.toFixed(4)}</span>
          </div>
        </div>

        {/* Model usage summary */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-800">Models Used</h5>
          <div className="flex flex-wrap gap-2">
            {result.modelUsage.map((usage, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {usage.modelName} ({usage.stepsExecuted} step{usage.stepsExecuted !== 1 ? "s" : ""})
              </Badge>
            ))}
          </div>
        </div>

        {/* Intermediate results for workflow */}
        {intermediateResults && intermediateResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-800">Step Results</h5>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Collapse" : "Expand"}
              </Button>
            </div>
            <div className={`space-y-2 ${expanded ? "" : "max-h-40"} overflow-y-auto`}>
              {intermediateResults.map((intermediate, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1">
                    Step {index + 1}: {intermediate.stepId}
                  </div>
                  <div className="text-gray-600 truncate">
                    {expanded ? intermediate.result : intermediate.result.substring(0, 100) + "..."}
                  </div>
                  <div className="flex gap-2 mt-1 text-gray-500">
                    <span>⚡ {intermediate.executionTime}ms</span>
                    <span>🪙 {intermediate.tokensUsed}</span>
                    <span>💰 ${intermediate.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final result */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-800">Final Result</h5>
          <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-60 overflow-y-auto">
            {result.finalResult}
          </div>
        </div>

        {/* Development metadata */}
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs">
            <summary className="text-gray-600 cursor-pointer">Development Data</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </GlassPanel>
  );
}
