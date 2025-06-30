/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce type organization rules",
      category: "Type Organization",
      recommended: true,
    },
    schema: [],
    messages: {
      moveToTypesDir:
        "Type definitions should be in src/types/ directory unless they are component props or test types or api types",
    },
  },

  create(context) {
    /**
     * Check if the file is allowed to have type definitions
     * @param {string} filename - The file path
     * @param {string} typeName - The name of the type/interface
     * @returns {boolean} Whether the file is allowed to have type definitions
     */
    function isAllowedTypeLocation(filename, typeName) {
      // Allow component prop types in component files
      if (filename.includes("/components/") && typeName.endsWith("Props")) {
        return true;
      }

      // Allow test-specific types in test files
      if (filename.includes("/__tests__/") || filename.includes(".test.")) {
        return true;
      }

      // Allow types in src/types/ directory
      if (filename.includes("/src/types/")) {
        return true;
      }

      // Allow types in src/types/ directory
      if (filename.includes("/src/contracts/")) {
        return true;
      }
      // Allow types in src/types/ directory
      if (filename.includes("/src/env.d.ts")) {
        return true;
      }

      return false;
    }

    return {
      TSInterfaceDeclaration(node) {
        const filename = context.filename;

        if (!isAllowedTypeLocation(filename, node.id.name)) {
          context.report({
            node,
            messageId: "moveToTypesDir",
          });
        }
      },

      TSTypeAliasDeclaration(node) {
        const filename = context.filename;

        if (!isAllowedTypeLocation(filename, node.id.name)) {
          context.report({
            node,
            messageId: "moveToTypesDir",
          });
        }
      },
    };
  },
};
