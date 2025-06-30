"use client";

import { Check, Clock, Copy, DollarSign, Star, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompletionResult } from "@/types/router-ui";

import { formatTime } from "../utils/time-formatting";

interface ResultCardProps {
  title: string;
  result: CompletionResult;
  onRate?: (rating: number) => void;
  isFaster?: boolean;
  isCheaper?: boolean;
}

export function ResultCard({ title, result, onRate, isFaster, isCheaper }: ResultCardProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.finalResult);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    onRate?.(rating);
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</h4>

        <div className="flex items-center space-x-2">
          {isFaster && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Faster
            </Badge>
          )}
          {isCheaper && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <DollarSign className="h-3 w-3 mr-1" />
              Cheaper
            </Badge>
          )}
        </div>
      </div>

      {/* Result Content */}
      <div className="result-content mb-4">
        <ScrollArea className="h-48 w-full">
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-900/50 rounded border">
            {result.finalResult}
          </div>
        </ScrollArea>
      </div>

      {/* Metrics */}
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

      {/* Actions */}
      <div className="flex items-center justify-between">
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
              Copy Result
            </>
          )}
        </Button>

        {/* Rating */}
        {onRate && (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Rate:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`text-sm transition-colors ${
                  star <= userRating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                }`}
              >
                <Star className="h-4 w-4" fill={star <= userRating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
