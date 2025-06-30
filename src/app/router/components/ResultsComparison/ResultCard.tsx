/**
 * @file Result card component
 * @description Individual result display with metrics and actions
 */

import { Check, Copy, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";

import { RichContentRenderer } from "@/components/tournament/RichContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompletionResult } from "@/types/router-ui";

import { MetricsDisplay } from "./MetricsDisplay";
import { StarRating } from "./StarRating";

interface ResultCardProps {
  title: string;
  result: CompletionResult;
  onRate?: ((rating: number) => void) | undefined;
  isFaster?: boolean;
  isCheaper?: boolean;
}

export function ResultCard({ title, result, onRate, isFaster, isCheaper }: ResultCardProps) {
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
          <RichContentRenderer
            content={result.finalResult}
            className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border"
            maxHeight="max-h-44"
          />
        </ScrollArea>
      </div>

      {/* Metrics */}
      <MetricsDisplay result={result} />

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
        <StarRating onRate={onRate} />
      </div>
    </div>
  );
}
