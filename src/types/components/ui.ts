/**
 * @file General UI component type definitions
 * @description Types for common UI components like pagination, content rendering, and tags
 */

import React from "react";

/** Props for pagination components */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Props for components that display rich content */
export interface RichContentProps {
  content: string;
  className?: string;
}

/** Props for rich content renderer */
export interface RichContentRendererProps {
  content: string;
  className?: string;
  maxHeight?: string;
}

/** Props for markdown renderer */
export interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string;
}

/** Props for tag cloud */
export interface TagCloudProps {
  /** Array of all tags from tournaments */
  allTags: string[];
  /** Optional className for styling */
  className?: string;
}

/** Tag with count and display properties */
export interface TagWithCount {
  /** Tag text */
  tag: string;
  /** Number of occurrences */
  count: number;
  /** Display size based on frequency */
  size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  /** Display opacity based on frequency */
  opacity: number;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
