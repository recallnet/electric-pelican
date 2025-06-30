import { ReactNode } from "react";

/**
 * Represents a block of content from a model response
 */
export interface ContentBlock {
  /** Type of content block */
  type: "text" | "visual" | "code";

  /** Content of the block - string for text/code, React elements for visual */
  content: string | ReactNode;

  /** Programming language for code blocks */
  language?: string | undefined;

  /** Original content for fallback */
  rawContent?: string | undefined;
}
