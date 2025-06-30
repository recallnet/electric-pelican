/**
 * ESLint rule to enforce file size limits based on file type
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce file size limits to maintain code maintainability",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: "object",
        properties: {
          maxLines: {
            type: "object",
            properties: {
              component: { type: "number", minimum: 1 },
              page: { type: "number", minimum: 1 },
              hook: { type: "number", minimum: 1 },
              utility: { type: "number", minimum: 1 },
              api: { type: "number", minimum: 1 },
              default: { type: "number", minimum: 1 },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const maxLines = {
      component: 250,
      page: 250,
      hook: 250,
      utility: 250,
      api: 250,
      default: 250,
      ...options.maxLines,
    };

    /**
     * Determines file type based on filename and path
     */
    function getFileType(filename) {
      if (filename.includes("/components/")) return "component";
      if (filename.includes("/app/") && filename.endsWith("/page.tsx")) return "page";
      if (filename.includes("/hooks/")) return "hook";
      if (filename.includes("/lib/") || filename.includes("/utils/")) return "utility";
      if (filename.includes("/api/")) return "api";
      return "default";
    }

    /**
     * Counts effective lines (excluding empty lines and comments)
     */
    function countEffectiveLines(sourceCode) {
      const lines = sourceCode.getText().split("\n");
      return lines.filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.length > 0 &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("/*") &&
          !trimmed.startsWith("*") &&
          trimmed !== "*/"
        );
      }).length;
    }

    return {
      Program(node) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileType = getFileType(filename);
        const maxAllowed = maxLines[fileType];
        const effectiveLines = countEffectiveLines(sourceCode);

        if (effectiveLines > maxAllowed) {
          context.report({
            node,
            message: `File is too large: {{actual}} effective lines (max: {{max}} for {{type}} files). Consider splitting into smaller modules.`,
            data: {
              actual: effectiveLines,
              max: maxAllowed,
              type: fileType,
            },
          });
        }
      },
    };
  },
};
