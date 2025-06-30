/**
 * @file Tags display component
 * @description Component for rendering tags list as clickable links to tag leaderboards
 */

import { ClickableTagsDisplay } from "@/components/ui/clickable-tag";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Render tags list as clickable links to tag leaderboards
 * Now with support for hierarchical tags and lineage tooltips
 */
export function TagsDisplay({
  tags = [],
  tagIds = [],
}: {
  tags?: string[];
  tagIds?: HierarchicalTagId[];
}) {
  // No tags available (neither legacy nor hierarchical)
  if ((!tags || tags.length === 0) && (!tagIds || tagIds.length === 0)) {
    return <span className="text-brand-gray-03 text-xs">No tags</span>;
  }

  return (
    <ClickableTagsDisplay
      tags={tagIds || []}
      legacyTags={tags || []}
      size="xs"
      variant="secondary"
      showTooltip={true}
      maxTags={5}
    />
  );
}
