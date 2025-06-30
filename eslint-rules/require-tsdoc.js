/**
 * ESLint rule to enforce TSDoc documentation on exported functions, classes, and types
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require TSDoc comments for all exported declarations",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: "object",
        properties: {
          requireExamples: { type: "boolean" },
          requireParams: { type: "boolean" },
          requireReturns: { type: "boolean" },
          minCoverage: { type: "number", minimum: 0, maximum: 100 },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const requireExamples = options.requireExamples !== false;
    const requireParams = options.requireParams !== false;
    const requireReturns = options.requireReturns !== false;
    const minCoverage = options.minCoverage || 95;

    const sourceCode = context.getSourceCode();
    const exportedDeclarations = [];
    const documentedDeclarations = [];

    /**
     * Checks if a node has a TSDoc comment
     */
    function hasTSDocComment(node) {
      const comments = sourceCode.getCommentsBefore(node);
      return comments.some((comment) => comment.type === "Block" && comment.value.startsWith("*"));
    }

    /**
     * Gets the TSDoc comment for a node
     */
    function getTSDocComment(node) {
      const comments = sourceCode.getCommentsBefore(node);
      const tsdocComment = comments.find(
        (comment) => comment.type === "Block" && comment.value.startsWith("*"),
      );
      return tsdocComment ? tsdocComment.value : null;
    }

    /**
     * Validates TSDoc comment content
     */
    function validateTSDocContent(node, comment, declarationType) {
      const violations = [];

      if (requireExamples && !comment.includes("@example")) {
        violations.push("Missing @example block for complex " + declarationType);
      }

      if (requireParams && declarationType === "function") {
        // Check for function parameters
        const hasParams = node.params && node.params.length > 0;
        if (hasParams && !comment.includes("@param")) {
          violations.push("Missing @param documentation for function parameters");
        }
      }

      if (requireReturns && declarationType === "function") {
        // Check for return type
        const hasReturnType =
          node.returnType ||
          (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement");
        if (hasReturnType && !comment.includes("@returns")) {
          violations.push("Missing @returns documentation for function return value");
        }
      }

      return violations;
    }

    /**
     * Reports documentation violations
     */
    function reportViolations(node, violations, name, type) {
      for (const violation of violations) {
        context.report({
          node,
          message: `{{type}} "{{name}}": {{violation}}`,
          data: {
            type: type.charAt(0).toUpperCase() + type.slice(1),
            name,
            violation,
          },
        });
      }
    }

    return {
      // Export declarations
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          exportedDeclarations.push({
            node: node.declaration,
            type: node.declaration.type,
            name: node.declaration.id?.name || "anonymous",
          });
        }
      },

      ExportDefaultDeclaration(node) {
        exportedDeclarations.push({
          node: node.declaration,
          type: node.declaration.type,
          name: node.declaration.id?.name || "default",
        });
      },

      // Variable exports (export const)
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator"(node) {
        exportedDeclarations.push({
          node,
          type: "VariableDeclarator",
          name: node.id.name,
        });
      },

      "Program:exit"() {
        for (const { node, type, name } of exportedDeclarations) {
          const hasDoc = hasTSDocComment(node);
          const violations = [];

          if (!hasDoc) {
            violations.push("Missing TSDoc comment");
          } else {
            documentedDeclarations.push({ node, type, name });
            const comment = getTSDocComment(node);
            const contentViolations = validateTSDocContent(
              node,
              comment,
              type.toLowerCase().includes("function") ? "function" : "declaration",
            );
            violations.push(...contentViolations);
          }

          if (violations.length > 0) {
            reportViolations(node, violations, name, type);
          }
        }

        // Check overall coverage
        const coverage =
          exportedDeclarations.length > 0
            ? (documentedDeclarations.length / exportedDeclarations.length) * 100
            : 100;

        if (coverage < minCoverage && exportedDeclarations.length > 0) {
          context.report({
            node: context.getSourceCode().ast,
            message: `Documentation coverage too low: {{coverage}}% (minimum: {{min}}%). Document {{missing}} more exports.`,
            data: {
              coverage: coverage.toFixed(1),
              min: minCoverage,
              missing: exportedDeclarations.length - documentedDeclarations.length,
            },
          });
        }
      },
    };
  },
};
