"use client";

import DOMPurify from "dompurify";
import React, { useEffect, useState } from "react";

import { type RichContentRendererProps } from "@/types/components/ui";

/**
 * Rich content renderer that can display text, code blocks, and rendered SVG/HTML content
 * Supports toggling between raw text view and rendered view
 * Uses direct DOM methods for SVG rendering to ensure compatibility
 */
export function RichContentRenderer({
  content,
  className = "",
  maxHeight = "max-h-48",
}: RichContentRendererProps) {
  const [viewMode, setViewMode] = useState<"raw" | "rendered">("rendered");
  const [parsedContent, setParsedContent] = useState<React.ReactNode>(null);

  // Function to detect if content has markdown or visual elements
  const detectRichContent = (text: string): boolean => {
    if (!text) return false;

    // Check for markdown headers
    const markdownHeaders = /^#{1,6}\s+.+$/m.test(text);

    // Check for SVG/HTML content in code blocks
    const svgRegex = /<\s*svg[\s>]/i;
    const codeBlockRegex = /```\s*(html|svg|xml)\s*[\r\n]+([\s\S]*?)[\r\n]+```/gi;

    // Check for any code blocks
    const hasCodeBlocks = /```[\s\S]*?```/g.test(text);

    return markdownHeaders || codeBlockRegex.test(text) || svgRegex.test(text) || hasCodeBlocks;
  };

  // Process markdown headers
  const processMarkdownHeaders = (text: string): string => {
    return text
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">$1</h3>',
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 mb-3">$1</h2>',
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-3">$1</h1>',
      );
  };

  // Extract and process content blocks
  const extractContentBlocks = (text: string) => {
    const result = [];
    const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index).trim();
        if (textContent) {
          result.push({
            type: "text",
            content: textContent,
          });
        }
      }

      const language = match[1]?.toLowerCase();
      const codeContent = match[2];

      if (["html", "svg", "xml"].includes(language || "")) {
        result.push({
          type: "visual",
          content: codeContent,
          language,
        });
      } else {
        result.push({
          type: "code",
          content: codeContent,
          language,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText) {
        result.push({
          type: "text",
          content: remainingText,
        });
      }
    }

    // If no code blocks found, treat entire content as text
    if (result.length === 0) {
      result.push({
        type: "text",
        content: text,
      });
    }

    return result;
  };

  // Process content on client-side only
  useEffect(() => {
    const hasRichContent = detectRichContent(content);

    // Set initial view mode based on content
    setViewMode(hasRichContent ? "rendered" : "raw");

    const blocks = extractContentBlocks(content);
    const processedContent = (
      <div className="space-y-4">
        {blocks.map((block, index) => {
          if (block.type === "text") {
            // Process markdown headers in text content
            const processedText = processMarkdownHeaders(block.content || "");

            return (
              <div
                key={index}
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processedText) }}
              />
            );
          }

          if (block.type === "visual") {
            // For visual content, use dangerouslySetInnerHTML with sanitized content
            let sanitizedContent = "";
            try {
              // Configure DOMPurify to allow SVG elements and attributes
              const config = {
                ADD_TAGS: [
                  "svg",
                  "path",
                  "circle",
                  "rect",
                  "ellipse",
                  "line",
                  "polyline",
                  "polygon",
                  "text",
                  "tspan",
                  "g",
                  "defs",
                  "linearGradient",
                  "radialGradient",
                  "stop",
                  "filter",
                  "feGaussianBlur",
                  "clipPath",
                  "mask",
                ],
                ADD_ATTR: [
                  "viewBox",
                  "xmlns",
                  "d",
                  "fill",
                  "stroke",
                  "stroke-width",
                  "stroke-linecap",
                  "stroke-linejoin",
                  "opacity",
                  "transform",
                  "cx",
                  "cy",
                  "r",
                  "rx",
                  "ry",
                  "x",
                  "y",
                  "width",
                  "height",
                  "x1",
                  "y1",
                  "x2",
                  "y2",
                  "points",
                  "offset",
                  "stop-color",
                  "stop-opacity",
                  "stdDeviation",
                  "filterUnits",
                  "id",
                  "class",
                ],
                USE_PROFILES: { svg: true },
              };
              // Ensure block.content is a string
              const contentToSanitize = typeof block.content === "string" ? block.content : "";
              sanitizedContent = DOMPurify.sanitize(contentToSanitize, config);
            } catch (error) {
              console.error("Error sanitizing content:", error);
              // Fallback to raw content
              return (
                <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-red-500 text-xs mb-1">Error rendering visual content</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap">{block.content}</pre>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  🎨 {block.language?.toUpperCase()} Rendered:
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
                  <div
                    className="flex justify-center"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                </div>
              </div>
            );
          }

          // Code blocks
          return (
            <div
              key={index}
              className="bg-gray-900 dark:bg-gray-950 border border-gray-700 rounded-lg p-4"
            >
              <div className="text-xs text-gray-400 mb-2 font-medium">
                💻 {block.language?.toUpperCase() || "CODE"}:
              </div>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {block.content}
              </pre>
            </div>
          );
        })}
      </div>
    );

    setParsedContent(processedContent);
  }, [content]);

  // Raw view
  if (viewMode === "raw") {
    return (
      <div className={className}>
        <button
          onClick={() => setViewMode("rendered")}
          className="text-blue-500 hover:text-blue-700 text-xs mb-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded transition-colors"
        >
          🎨 Show Rendered
        </button>
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300">
          {content}
        </div>
      </div>
    );
  }

  // Rendered view
  return (
    <div className={`${maxHeight} overflow-y-auto ${className}`}>
      <button
        onClick={() => setViewMode("raw")}
        className="text-blue-500 hover:text-blue-700 text-xs mb-3 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded transition-colors"
      >
        📝 Show Raw
      </button>
      {parsedContent}
    </div>
  );
}
