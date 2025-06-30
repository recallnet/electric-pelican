/**
 * @file Response section component for tournament matches.
 * @description Displays individual model responses with SVG visualization support.
 */

import { useEffect, useState } from "react";

import { type ResponseSectionProps } from "@/types/app";

/**
 * Component for displaying individual model responses in tournament matches.
 * @param props - Component props
 * @returns JSX element
 */
export function ResponseSection({ modelName, response, isWinner }: ResponseSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"raw" | "rendered">("raw");
  const [showSVG, setShowSVG] = useState(false);

  /**
   * Function to detect if content has SVG.
   * @param content - Content to check
   * @returns Boolean indicating if content has visual elements
   */

  /**
   * Function to extract SVG content from markdown with improved regex patterns.
   * @param content - Content to extract SVG from
   * @returns Extracted SVG content or null
   */
  const extractSVG = (content: string) => {
    if (!content) return null;

    // Check for special case patterns we've seen in the actual data
    if (content.includes("```xml\n<svg") || content.includes("```xml\r\n<svg")) {
      // Pattern specifically for gemini's xml format with escaped newlines
      console.debug("Detected XML format SVG in", modelName);

      // Extract everything between the opening and closing XML code block tags
      const xmlBlockStart = content.indexOf("```xml");
      if (xmlBlockStart !== -1) {
        const contentAfterStart = content.substring(xmlBlockStart + 6); // 6 is length of ```xml
        const openingSvgIdx = contentAfterStart.indexOf("<svg");

        if (openingSvgIdx !== -1) {
          const svgContent = "<svg" + contentAfterStart.substring(openingSvgIdx + 4);
          // Try to find the end of the code block
          const blockEndIdx = svgContent.indexOf("```");
          if (blockEndIdx !== -1) {
            console.debug("Successfully extracted XML SVG content");
            return svgContent.substring(0, blockEndIdx).trim();
          }
        }
      }
    }

    // Standard pattern for code blocks with language tags
    const patterns = [
      /```\s*(svg|html|xml)[^\n]*\n+([\s\S]*?)\n+```/i, // Standard format
      /```[\s\n]*(svg|html|xml)[\s\n]+([\s\S]*?)[\s\n]*```/i, // Flexible whitespace
      /```(svg|html|xml)([\s\S]*?)```/i, // Minimal pattern
    ];

    // Try each pattern in order
    for (const pattern of patterns) {
      const match = pattern.exec(content);
      if (match && match[2]) {
        console.debug(`Found ${match[1]} code block with pattern in`, modelName);
        return match[2].trim();
      }
    }

    // Try for direct SVG tags as fallback
    const svgTagMatch = /<svg[\s\S]*?<\/svg>/i.exec(content);
    if (svgTagMatch) {
      console.debug("Found direct SVG tag in", modelName);
      return svgTagMatch[0];
    }

    // Special handling for truncated SVGs (common in large responses)
    if (content.includes("<svg") && !content.includes("</svg>")) {
      console.debug("Found partial SVG content in", modelName);
      const svgStart = content.indexOf("<svg");
      if (svgStart >= 0) {
        // Extract from SVG opening tag and add a closing tag
        return content.substring(svgStart) + "</svg>";
      }
    }

    return null;
  };

  // Extract SVG content if present
  const svgContent = response ? extractSVG(response) : null;
  const hasSVG = Boolean(svgContent);

  // Toggle SVG display
  useEffect(() => {
    // Show SVG content after a brief delay to handle hydration
    if (isExpanded && hasSVG) {
      const timer = setTimeout(() => {
        setShowSVG(true);
        setViewMode("rendered");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, hasSVG]);

  // For debugging
  useEffect(() => {
    if (isExpanded && response) {
      // Log detection results to help troubleshoot
      console.debug("Response contains SVG?", hasSVG);
      if (
        response.includes("```xml") ||
        response.includes("```svg") ||
        response.includes("```html")
      ) {
        console.debug("Code block detected in:", modelName);
      }
    }
  }, [isExpanded, response, hasSVG, modelName]);

  return (
    <div className={`p-3 border-b border-gray-200 ${isWinner ? "bg-green-50" : ""}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`text-xs font-medium ${isWinner ? "text-green-700" : "text-gray-900"}`}>
            {isWinner ? "🏆 " : ""}
            {modelName}
            {hasSVG && (
              <span className="ml-2 text-blue-500 text-xs">📊 Contains visualization</span>
            )}
          </div>
        </div>
        <div className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2 flex justify-between">
            <span>Response:</span>
            {hasSVG && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode(viewMode === "raw" ? "rendered" : "raw");
                }}
                className="text-blue-500 hover:text-blue-700 text-xs px-2 py-0.5 rounded transition-colors"
              >
                {viewMode === "raw" ? "🎨 Show SVG" : "📝 Show Raw"}
              </button>
            )}
          </div>

          {/* Conditional rendering based on view mode */}
          {hasSVG && viewMode === "rendered" && showSVG ? (
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-3">
              <div className="text-xs text-gray-600 mb-2 font-medium">🎨 SVG Visualization:</div>
              <div className="bg-white rounded-md p-3 border border-gray-200 overflow-auto flex justify-center">
                {/* Render with explicit styles to ensure proper SVG sizing */}
                <div
                  className="svg-container"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent || "" }}
                />
              </div>
            </div>
          ) : null}

          {/* Always show raw content in raw mode or if there's no SVG */}
          {(viewMode === "raw" || !hasSVG) && (
            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{response}</div>
          )}
        </div>
      )}
    </div>
  );
}
