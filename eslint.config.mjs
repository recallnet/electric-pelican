import { fileURLToPath } from "url";

import eslint from "@eslint/js";
import * as tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Import our custom rules
import typeOrganization from "./eslint-rules/type-organization.js";
import fileSizeLimit from "./eslint-rules/file-size-limit.js";

// Create a custom plugin for our rules
const rawRules = {
  "type-organization": typeOrganization,
  "file-size-limit": fileSizeLimit,
};

const customPlugin = {
  ...rawRules, // legacy-style (optional but harmless)
  rules: rawRules, // legacy ESLint resolution
  default: {
    rules: rawRules, // required for Flat Config
  },
};

export default [
  // Base ESLint config
  eslint.configs.recommended,

  // TypeScript config
  ...tseslint.configs.recommended,

  // Ignore patterns
  {
    ignores: ["node_modules/*", ".next/*", "dist/*", "coverage/*", "*.config.js", "*.config.mjs"],
  },

  // TypeScript files
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "simple-import-sort": simpleImportSort,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
      "@next/next": nextPlugin,
      custom: customPlugin,
    },
    rules: {
      // Import sorting
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // React hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Unused imports
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Custom rules
      "custom/type-organization": "error",
      "custom/file-size-limit": "error",

      // TypeScript specific
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": "off", // handled by unused-imports

      // Next.js rules
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
    },
  },

  // Prettier config (must be last)
  eslintConfigPrettier,
];
