"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { type ModelLinkProps } from "@/types/components";

/**
 * Model link component that provides navigation to model profile and external OpenRouter page.
 * Displays the formatted model name with links to both internal profile and external documentation.
 */
export function ModelLink({ modelId, modelName, className = "" }: ModelLinkProps) {
  // Format model name for display (e.g., "anthropic/claude-3-sonnet" -> "Claude 3 Sonnet")
  const formatModelName = (modelId: string): string => {
    const parts = modelId.split("/");
    const modelName = parts[parts.length - 1] || modelId;

    // Convert kebab-case to title case
    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Use provided modelName or derive from modelId
  const displayName = modelName || formatModelName(modelId);

  // Generate OpenRouter URL
  const openRouterUrl = `https://openrouter.ai/${modelId}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Model Profile Link */}
      <Link
        href={`/models/${modelId}`}
        className="text-brand-black hover:text-brand-blue font-medium transition-colors"
      >
        {displayName}
      </Link>

      {/* OpenRouter Link */}
      <a
        href={openRouterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-gray-03 hover:text-brand-blue transition-colors"
        aria-label={`View ${displayName} on OpenRouter`}
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
