import DOMPurify from "dompurify";
import parse from "html-react-parser";

import { ContentBlock } from "@/types/content";

/**
 * Configuration for DOMPurify to allow safe SVG and HTML elements
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
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
    "div",
    "p",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    // Added more SVG tags that might be needed
    "linearGradient",
    "radialGradient",
    "stop",
    "filter",
    "feGaussianBlur",
    "feOffset",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "title",
    "desc",
  ],
  ALLOWED_ATTR: [
    "viewBox",
    "width",
    "height",
    "cx",
    "cy",
    "r",
    "x",
    "y",
    "d",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "transform",
    "rx",
    "ry",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "class",
    "id",
    "xmlns",
    "style",
    "font-size",
    "font-family",
    "text-anchor",
    "dominant-baseline",
    "fill-opacity",
    "stroke-opacity",
    "opacity",
    "offset",
    "stop-color",
    "stop-opacity",
    "gradient-transform",
    "patternTransform",
    "gradientUnits",
    "patternUnits",
  ],
  ADD_TAGS: ["svg", "path", "circle", "rect"],
  ADD_ATTR: ["viewBox", "xmlns", "d"],
  USE_PROFILES: { svg: true, svgFilters: true, html: true },
};

// Browser compatibility check for DOMPurify
const isServer = typeof window === "undefined";

// Initialize DOMPurify with SVG support on client side
if (!isServer && DOMPurify.isSupported) {
  DOMPurify.addHook("afterSanitizeAttributes", function (node) {
    // Set all elements owning target to target=_blank
    if ("target" in node) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

/**
 * Extract and sanitize code blocks from model response
 * Detects ```xml, ```svg, and ```html blocks and converts them to renderable React elements
 */
export function parseModelResponse(content: string): ContentBlock[] {
  // Handle undefined or null content
  if (!content || typeof content !== "string") {
    return [
      {
        type: "text",
        content: "No content available",
      },
    ];
  }

  // Improved regex pattern to better handle code blocks with or without language identifiers
  // and with varying whitespace patterns
  const codeBlockRegex = /```([a-z0-9]+)?\s*\n?([\s\S]*?)\n?```/g;
  const blocks: ContentBlock[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({
          type: "text",
          content: textContent,
        });
      }
    }

    const language = match[1]?.toLowerCase();
    const codeContent = match[2];

    if (["xml", "svg", "html"].includes(language || "")) {
      try {
        // Direct rendering approach - make it a standalone HTML snippet with SVG
        let sanitized = codeContent || "";
        let parsedContent;

        // Client-side SVG handling
        if (!isServer) {
          try {
            // For SVG content, wrap in div to ensure proper rendering
            const contentToSanitize =
              language === "svg"
                ? `<div class="svg-container">${codeContent || ""}</div>`
                : codeContent || "";

            // Apply DOMPurify with SVG-specific config
            sanitized = DOMPurify.sanitize(contentToSanitize, DOMPURIFY_CONFIG);
            console.debug("Content sanitized successfully");

            // Parse the sanitized content into React elements
            parsedContent = parse(sanitized);
          } catch (sanitizeError) {
            console.error("DOMPurify sanitization failed:", sanitizeError);
            // Prepare fallback content
            const fallbackContent = `<div class="svg-error-fallback" style="border: 1px dashed red; padding: 10px; color: red;">
              <p>Error rendering SVG/HTML content</p>
            </div>`;
            parsedContent = parse(fallbackContent);
          }
        } else {
          // Server-side placeholder (will be hydrated on client)
          parsedContent = "[Visual content will render after page load]";
        }

        blocks.push({
          type: "visual",
          content: parsedContent,
          language: language || undefined,
          rawContent: codeContent || undefined,
        });
      } catch (error) {
        console.warn("Failed to parse visual content, falling back to code block:", error);
        // Log more details about the failed content for debugging
        console.debug("Failed content:", {
          language,
          contentLength: codeContent?.length || 0,
          contentPreview: codeContent?.substring(0, 100),
        });

        // Fallback to code block if parsing fails
        blocks.push({
          type: "code",
          content: codeContent || "",
          language: language || undefined,
          rawContent: codeContent || undefined,
        });
      }
    } else {
      blocks.push({
        type: "code",
        content: codeContent || "",
        language: language || undefined,
        rawContent: codeContent || undefined,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      blocks.push({
        type: "text",
        content: remainingContent,
      });
    }
  }

  return blocks;
}

/**
 * Check if content contains visual blocks (SVG, HTML, XML)
 */
export function hasVisualContent(content: string): boolean {
  if (!content) return false;

  // Even more robust regex to catch all variations of visual code blocks
  // Tests for ```html, ```svg, or ```xml with any whitespace pattern
  const visualBlockRegex = /```\s*(html|svg|xml)\s*[\r\n]+([\s\S]*?)[\r\n]+```/gi;

  // Explicitly search for SVG tags as a backup check
  const svgTagRegex = /<\s*svg[\s>]/i;

  const hasCodeBlock = visualBlockRegex.test(content);
  const hasSvgTag = svgTagRegex.test(content);
  const result = hasCodeBlock || hasSvgTag;

  // Debug message to help troubleshoot visual content detection
  if (typeof window !== "undefined") {
    console.debug("Visual content detection:", {
      hasVisual: result,
      hasCodeBlock,
      hasSvgTag,
      contentLength: content?.length || 0,
    });
  }

  return result;
}
