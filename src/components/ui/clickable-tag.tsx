"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTagInfo, getTagLineage } from "@/lib/tag-taxonomy";
import { cn } from "@/lib/utils";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Check if a tag ID represents a hierarchical tag.
 * Hierarchical tags have entries in the taxonomy, legacy tags do not.
 */
function isHierarchicalTagId(tagId: string): boolean {
  return getTagInfo(tagId) !== undefined;
}

/**
 * @file ClickableTag component
 * @description Interactive tag component with hierarchical ELO display
 */

/**
 * Props for ClickableTag component
 */
export interface ClickableTagProps {
  /** The tag ID */
  tagId: HierarchicalTagId;

  /** Display name for the tag */
  name: string;

  /** Alternative display name prop (for backward compatibility) */
  displayName?: string;

  /** ELO score for this tag */
  elo?: number;

  /** Whether this tag is selected */
  selected?: boolean;

  /** Click handler */
  onClick?: (tagId: HierarchicalTagId) => void;

  /** Visual variant */

  /** Alternative variant prop (for backward compatibility) */
  variant?: "default" | "outline" | "secondary" | "destructive";

  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg";

  /** Show ELO score */
  showElo?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * ClickableTag component
 */
export function ClickableTag({
  tagId,
  name,
  displayName,
  elo,
  selected = false,
  onClick,

  size = "md",
  showElo = true,
  className,
}: ClickableTagProps) {
  const [_, setIsHovered] = useState(false);

  // Use displayName if provided, otherwise use name
  const tagDisplayName = displayName || name;

  const handleClick = () => {
    onClick?.(tagId);
  };

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const baseClasses = cn(
    "inline-flex items-center space-x-2 rounded-full border transition-all duration-200",
    "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
    "cursor-pointer",
    sizeClasses[size],
    selected && "ring-2 ring-blue-500 ring-offset-1",
    className,
  );

  const getTagClasses = () => {
    if (selected) {
      return cn(baseClasses, "bg-blue-600 border-blue-600 text-white hover:bg-blue-700");
    }

    return cn(
      baseClasses,
      "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
      "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
    );
  };

  const formatElo = (score: number): string => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const getEloColor = (score: number): string => {
    if (score >= 1600) return "text-green-600 dark:text-green-400";
    if (score >= 1400) return "text-blue-600 dark:text-blue-400";
    if (score >= 1200) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  if (onClick) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={getTagClasses()}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="font-medium">{tagDisplayName}</span>

        {showElo && elo && (
          <Badge
            variant="outline"
            className={cn(
              "ml-2 px-1.5 py-0.5 text-xs font-mono",
              getEloColor(elo),
              selected && "border-white/30 text-white",
            )}
          >
            {formatElo(elo)}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div
      className={getTagClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="font-medium">{tagDisplayName}</span>

      {showElo && elo && (
        <Badge
          variant="outline"
          className={cn(
            "ml-2 px-1.5 py-0.5 text-xs font-mono",
            getEloColor(elo),
            selected && "border-white/30 text-white",
          )}
        >
          {formatElo(elo)}
        </Badge>
      )}
    </div>
  );
}

interface ClickableTagsDisplayProps {
  tags: string[];
  legacyTags?: string[];
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "secondary" | "outline" | "destructive";
  showTooltip?: boolean;
  className?: string;
  maxTags?: number;
}

/**
 * Display multiple clickable tags with optional legacy tag support.
 * Handles both hierarchical tagIds and legacy tag strings.
 */
export function ClickableTagsDisplay({
  tags,
  legacyTags = [],
  size = "sm",
  className,
  maxTags,
}: ClickableTagsDisplayProps) {
  // Combine hierarchical and legacy tags, but properly validate hierarchical status
  const allTags = [
    ...tags.map((tagId) => ({
      tagId,
      isHierarchical: isHierarchicalTagId(tagId), // Actually check if it's hierarchical
    })),
    ...legacyTags.map((tag) => ({ tagId: tag, isHierarchical: false })),
  ];

  // Limit tags if maxTags is specified
  const displayTags = maxTags ? allTags.slice(0, maxTags) : allTags;
  const remainingCount = maxTags && allTags.length > maxTags ? allTags.length - maxTags : 0;

  if (displayTags.length === 0) {
    return null;
  }

  // Handle tag click to navigate to leaderboard
  const handleTagClick = (tagId: string, isHierarchical: boolean) => {
    const url = getTagLeaderboardUrl(tagId, isHierarchical);
    window.location.href = url;
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displayTags.map(({ tagId, isHierarchical }, index) => {
        // Get the display name for the tag
        const tagInfo = isHierarchical ? getTagInfo(tagId) : null;
        const displayName = tagInfo?.name || tagId;

        return (
          <ClickableTag
            key={`${tagId}-${index}`}
            tagId={tagId}
            name={displayName}
            size={size}
            onClick={() => handleTagClick(tagId, isHierarchical)}
          />
        );
      })}

      {remainingCount > 0 && (
        <span
          className={cn(
            "inline-block px-2 py-1 bg-brand-gray-01/50 text-brand-gray-03 rounded border border-brand-gray-02",
            "cursor-default",
            size === "xs" && "text-xs px-1.5 py-0.5",
            size === "sm" && "text-sm px-2 py-1",
            size === "md" && "text-base px-3 py-1.5",
            size === "lg" && "text-lg px-4 py-2",
          )}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

/**
 * Helper function to get the appropriate leaderboard URL for a tag.
 * Handles both hierarchical and legacy tags.
 */
export function getTagLeaderboardUrl(tagId: string, isHierarchical: boolean = true): string {
  if (isHierarchical && isHierarchicalTagId(tagId)) {
    return `/leaderboard/capability/${tagId}`;
  }

  // Fallback for legacy tags - search in global leaderboard
  return `/leaderboard?search=${encodeURIComponent(tagId)}`;
}

/**
 * Helper function to get display data for a tag.
 * Returns structured information for rendering.
 */
export function getTagDisplayData(tagId: string, legacyTag?: string) {
  if (isHierarchicalTagId(tagId)) {
    const tag = getTagInfo(tagId);
    const lineage = getTagLineage(tagId);

    return {
      displayName: tag?.name || tagId,
      isHierarchical: true,
      lineage: lineage.map((t: any) => t.name).join(" > "),
      url: `/leaderboard/capability/${tagId}`,
      description: tag?.description,
    };
  }

  return {
    displayName: legacyTag || tagId,
    isHierarchical: false,
    lineage: undefined,
    url: `/leaderboard?search=${encodeURIComponent(legacyTag || tagId)}`,
    description: undefined,
  };
}
