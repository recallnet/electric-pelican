"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { type SortButtonProps } from "@/types/components";

/**
 * Sortable table header button with visual indicators for sort direction.
 * Follows accessibility best practices for interactive table headers.
 */
export function SortButton({ label, sortKey, currentSort, currentOrder, onSort }: SortButtonProps) {
  const isActive = currentSort === sortKey;
  const isAscending = currentOrder === "asc";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 hover:text-brand-blue transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-md px-1 py-1"
      aria-label={`Sort by ${label} ${isActive ? (isAscending ? "descending" : "ascending") : ""}`}
      aria-pressed={isActive}
    >
      <span>{label}</span>
      <div className="flex flex-col">
        <ChevronUpIcon
          className={`w-3 h-3 transition-colors ${
            isActive && isAscending ? "text-brand-blue" : "text-brand-gray-03"
          }`}
        />
        <ChevronDownIcon
          className={`w-3 h-3 -mt-1 transition-colors ${
            isActive && !isAscending ? "text-brand-blue" : "text-brand-gray-03"
          }`}
        />
      </div>
    </button>
  );
}
