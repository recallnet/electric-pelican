"use client";

import { Check, CheckCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";

import { RichContentRenderer } from "@/components/tournament/RichContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntermediateResult } from "@/types/router-ui";

import { formatTime } from "../utils/time-formatting";

export interface IntermediateResultsProps {
  results: IntermediateResult[];
}

export function IntermediateResults({ results }: IntermediateResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="intermediate-results">
      <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
        📝 Intermediate Results
      </h4>

      <div className="space-y-3">
        {results.map((result, index) => (
          <IntermediateResultCard key={`${result.stepId}-${index}`} result={result} />
        ))}
      </div>
    </div>
  );
}

interface IntermediateResultCardProps {
  result: IntermediateResult;
}

function IntermediateResultCard({ result }: IntermediateResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const stepName = result.stepId
    .replace("step-", "Step ")
    .replace(/([A-Z])/g, " $1")
    .trim();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {stepName} Complete
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Badge variant="outline" className="text-xs">
            🤖 {result.modelId}
          </Badge>
          <span>⏱️ {formatTime(result.executionTime)}</span>
          <span>⚡ {result.tokensUsed} tokens</span>
          {result.cost > 0 && <span>💰 ${result.cost.toFixed(4)}</span>}
        </div>
      </div>

      {/* Result Preview */}
      <div className="result-content">
        {isExpanded ? (
          <RichContentRenderer content={result.result} className="text-sm" maxHeight="max-h-96" />
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
            {result.result}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                Expand
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={isCopied}
            className="text-xs"
          >
            {isCopied ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </>
            )}
          </Button>

          {/* Mode Badge */}
          <Badge
            variant={result.executionMode === "workflow" ? "default" : "secondary"}
            className="text-xs ml-auto"
          >
            {result.executionMode === "workflow" ? "🔄 Workflow" : "🤖 Single"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
