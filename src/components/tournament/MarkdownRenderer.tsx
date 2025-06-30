"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { type MarkdownRendererProps } from "@/types/components";

/**
 * Enhanced markdown renderer with SVG support and smart content detection.
 * Automatically detects and renders markdown while preserving SVG inline rendering.
 */
export function MarkdownRenderer({
  content,
  className = "",
  maxHeight = "max-h-48",
}: MarkdownRendererProps) {
  const [viewMode, setViewMode] = useState<"raw" | "rendered">("rendered");
  const [hasMarkdown, setHasMarkdown] = useState(false);
  const [hasSVG, setHasSVG] = useState(false);
  const [extractedSVG, setExtractedSVG] = useState<string | null>(null);

  // Extract SVG from code blocks
  const extractSVG = useCallback((text: string): string | null => {
    if (!text) return null;

    // Patterns for SVG code blocks - more comprehensive patterns
    const patterns = [
      /```\s*(svg|html|xml)[^\n]*\n+([\s\S]*?)\n+```/i,
      /```[\s\n]*(svg|html|xml)[\s\n]+([\s\S]*?)[\s\n]*```/i,
      /```\s*xml\s*\n([\s\S]*?)\n```/i, // XML blocks that might contain SVG
      /```\s*\n([\s\S]*?)\n```/i, // Generic code blocks that might contain SVG
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const content = match[1] || match[2];
        if (content) {
          // Check if the content contains SVG
          const svgMatch = /<svg[\s\S]*?<\/svg>/i.exec(content);
          if (svgMatch) {
            return svgMatch[0];
          }
        }
      }
    }

    // Direct SVG tags
    const svgTagMatch = /<svg[\s\S]*?<\/svg>/i.exec(text);
    if (svgTagMatch) {
      return svgTagMatch[0];
    }

    return null;
  }, []);

  // Detect if content has markdown formatting
  const detectMarkdown = useCallback((text: string): boolean => {
    if (!text) return false;

    const markdownPatterns = [
      /^#{1,6}\s+/m, // Headers
      /\*\*.*?\*\*/, // Bold
      /\*.*?\*/, // Italic
      /`.*?`/, // Inline code
      /```[\s\S]*?```/, // Code blocks
      /^\s*[-*+]\s+/m, // Lists
      /^\s*\d+\.\s+/m, // Numbered lists
      /\[.*?\]\(.*?\)/, // Links
      /!\[.*?\]\(.*?\)/, // Images
      /^\s*\|.*\|/m, // Tables
      /^\s*>\s+/m, // Blockquotes
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  }, []);

  // Detect SVG content

  useEffect(() => {
    setHasMarkdown(detectMarkdown(content));
    const svgContent = extractSVG(content);
    setHasSVG(Boolean(svgContent));
    setExtractedSVG(svgContent);
  }, [content, detectMarkdown, extractSVG]);

  // Custom component renderers for ReactMarkdown
  const components = {
    code: function Code({ className, children, ...props }: React.HTMLProps<HTMLElement>) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (language === "xml" || language === "svg" || language === "html") {
        const codeContent = String(children).replace(/\n$/, "");
        const svgMatch = /<svg[\s\S]*?<\/svg>/i.exec(codeContent);

        if (svgMatch) {
          return (
            <div className="my-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="text-green-500 text-xs mb-2">🎨 SVG Rendered</div>
                <div
                  dangerouslySetInnerHTML={{ __html: svgMatch[0] }}
                  className="flex justify-center"
                />
              </div>
            </div>
          );
        }
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // Sanitization schema that allows SVG elements
  const sanitizeSchema = {
    allowedTags: [
      "div",
      "span",
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "img",
      // SVG elements
      "svg",
      "path",
      "circle",
      "rect",
      "ellipse",
      "line",
      "text",
      "g",
      "polygon",
      "polyline",
      "defs",
      "use",
      "clipPath",
      "mask",
      "linearGradient",
      "radialGradient",
      "stop",
      "filter",
      "title",
      "desc",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      // SVG attributes
      svg: ["viewBox", "width", "height", "xmlns"],
      path: ["d", "fill", "stroke", "stroke-width"],
      circle: ["cx", "cy", "r", "fill", "stroke"],
      rect: ["x", "y", "width", "height", "fill", "stroke"],
      ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke"],
      line: ["x1", "y1", "x2", "y2", "stroke"],
      text: ["x", "y", "font-size", "font-family", "fill"],
      g: ["transform"],
      polygon: ["points", "fill", "stroke"],
      polyline: ["points", "fill", "stroke"],
      linearGradient: ["id", "x1", "y1", "x2", "y2"],
      radialGradient: ["id", "cx", "cy", "r"],
      stop: ["offset", "stop-color", "stop-opacity"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
  };

  // Show raw mode if no markdown detected or user requests it
  if (viewMode === "raw" || (!hasMarkdown && !hasSVG)) {
    return (
      <div className={className}>
        {(hasMarkdown || hasSVG) && (
          <button
            onClick={() => setViewMode("rendered")}
            className="text-blue-500 hover:text-blue-700 text-xs mb-2 bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            {hasMarkdown ? "📝 Show Markdown" : "🎨 Show Rendered"}
          </button>
        )}
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{content}</div>
      </div>
    );
  }

  // Rendered markdown mode
  return (
    <div className={`${maxHeight} overflow-y-auto ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {hasMarkdown && <span className="text-blue-500 text-xs">📝 Markdown</span>}
          {hasSVG && <span className="text-green-500 text-xs">🎨 SVG</span>}
        </div>
        <button
          onClick={() => setViewMode("raw")}
          className="text-blue-500 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          📄 Show Raw
        </button>
      </div>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Fallback SVG rendering if ReactMarkdown doesn't handle it */}
      {extractedSVG && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="text-green-500 text-xs mb-2">🎨 Extracted SVG</div>
          <div dangerouslySetInnerHTML={{ __html: extractedSVG }} className="flex justify-center" />
        </div>
      )}
    </div>
  );
}
