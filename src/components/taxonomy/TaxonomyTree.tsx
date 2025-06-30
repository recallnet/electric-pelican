"use client";

import type { TaxonomyNode } from "@/types/taxonomy";

import { TaxonomyNode as TaxonomyNodeComponent } from "./TaxonomyNode";

/**
 * @file TaxonomyTree component
 * @description Interactive tree view of the capability taxonomy
 */

/**
 * TaxonomyTree component props
 */
interface TaxonomyTreeProps {
  nodes: TaxonomyNode[];
  searchTerm?: string;
  onTagClick?: (tagId: string, name: string) => void;
  isLoading?: boolean;
}

/**
 * TaxonomyTree Component
 *
 * Renders the complete hierarchical tree of AI capabilities.
 * Handles the recursive rendering of nodes and manages the tree state.
 */
export function TaxonomyTree({ nodes, searchTerm = "", onTagClick, isLoading }: TaxonomyTreeProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading taxonomy data...
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No taxonomy data available
      </div>
    );
  }

  return (
    <div className="taxonomy-tree space-y-2">
      {nodes.map((node) => (
        <TaxonomyNodeComponent
          key={node.id}
          node={node}
          level={0}
          searchTerm={searchTerm}
          {...(onTagClick && { onTagClick })}
        />
      ))}
    </div>
  );
}
