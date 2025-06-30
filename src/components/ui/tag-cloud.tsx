"use client";

import { useMemo } from "react";

import { type TagCloudProps, type TagWithCount } from "@/types/components";

/**
 * Tag cloud component that displays tags with varying sizes based on frequency
 */
export function TagCloud({ allTags, className = "" }: TagCloudProps) {
  const tagData = useMemo(() => {
    if (!allTags || allTags.length === 0) return [];

    // Count tag frequencies
    const tagCounts = new Map<string, number>();
    allTags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    // Convert to array and sort by frequency
    const tagArray = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    if (tagArray.length === 0) return [];

    // Calculate size and opacity based on frequency
    const maxCount = tagArray[0]?.count ?? 0;
    const minCount = Math.min(...tagArray.map((t) => t.count));

    return tagArray.map(({ tag, count }): TagWithCount => {
      // Normalize count to 0-1 scale
      const normalizedCount =
        maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);

      // Assign size based on normalized count
      let size: TagWithCount["size"];
      if (normalizedCount >= 0.8) size = "2xl";
      else if (normalizedCount >= 0.6) size = "xl";
      else if (normalizedCount >= 0.4) size = "lg";
      else if (normalizedCount >= 0.2) size = "base";
      else if (normalizedCount >= 0.1) size = "sm";
      else size = "xs";

      // Calculate opacity (70% to 100%)
      const opacity = 0.7 + normalizedCount * 0.3;

      return { tag, count, size, opacity };
    });
  }, [allTags]);

  if (tagData.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-brand-gray-03 text-sm">No tags found</div>
      </div>
    );
  }

  const getSizeClasses = (size: TagWithCount["size"]) => {
    switch (size) {
      case "xs":
        return "text-xs px-2 py-1";
      case "sm":
        return "text-sm px-2 py-1";
      case "base":
        return "text-base px-3 py-1";
      case "lg":
        return "text-lg px-3 py-2";
      case "xl":
        return "text-xl px-4 py-2";
      case "2xl":
        return "text-2xl px-4 py-2";
      default:
        return "text-base px-3 py-1";
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2 p-6">
        {tagData.map(({ tag, count, size, opacity }) => (
          <span
            key={tag}
            className={`
              inline-block
              ${getSizeClasses(size)}
              bg-brand-blue/10
              text-brand-blue
              rounded
              border
              border-brand-blue/20
              hover:bg-brand-blue/20
              hover:scale-105
              transition-all
              duration-200
              cursor-default
              font-medium
            `}
            style={{ opacity }}
            title={`${tag} (used ${count} time${count !== 1 ? "s" : ""})`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
