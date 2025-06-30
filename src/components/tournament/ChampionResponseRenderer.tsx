/**
 * @file Champion response renderer component.
 * @description Displays champion response content with SVG visualization support.
 */

import { useEffect, useState } from "react";

import { type ChampionResponseRendererProps } from "@/types/app";

/**
 * Component for rendering champion response content.
 * @param props - Component props
 * @returns JSX element
 */
export function ChampionResponseRenderer({
  content,
  className = "",
}: ChampionResponseRendererProps) {
  const [viewMode, setViewMode] = useState<"raw" | "rendered">("raw");
  const [showSVG, setShowSVG] = useState(false);

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
      console.debug("Detected XML format SVG in champion response");

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
        console.debug(`Found ${match[1]} code block with pattern in champion response`);
        return match[2].trim();
      }
    }

    // Try for direct SVG tags as fallback
    const svgTagMatch = /<svg[\s\S]*?<\/svg>/i.exec(content);
    if (svgTagMatch) {
      console.debug("Found direct SVG tag in champion response");
      return svgTagMatch[0];
    }

    // Special handling for truncated SVGs (common in large responses)
    if (content.includes("<svg") && !content.includes("</svg>")) {
      console.debug("Found partial SVG content in champion response");
      const svgStart = content.indexOf("<svg");
      if (svgStart >= 0) {
        // Extract from SVG opening tag and add a closing tag
        return content.substring(svgStart) + "</svg>";
      }
    }

    return null;
  };

  /**
   * Function to detect if content has SVG.
   * @param content - Content to check
   * @returns Boolean indicating if content has visual elements
   */

  // Extract SVG content if present
  const svgContent = content ? extractSVG(content) : null;
  const hasSVG = Boolean(svgContent);

  // Auto-switch to rendered mode if SVG is detected
  useEffect(() => {
    if (hasSVG) {
      setViewMode("rendered");
      setShowSVG(true);
    }
  }, [hasSVG]);

  return (
    <div className={className}>
      {hasSVG && (
        <div className="mb-2 flex justify-between items-center">
          <span className="text-blue-500 text-xs">📊 Contains visualization</span>
          <button
            onClick={() => setViewMode(viewMode === "raw" ? "rendered" : "raw")}
            className="text-blue-500 hover:text-blue-700 text-xs px-2 py-0.5 rounded transition-colors"
          >
            {viewMode === "raw" ? "🎨 Show SVG" : "📝 Show Raw"}
          </button>
        </div>
      )}

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
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-128 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}
