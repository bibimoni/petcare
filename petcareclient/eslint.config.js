import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import prettier from "eslint-plugin-prettier";

export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/dist/**", "public/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      ...tseslint.configs.recommended,
    ],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier,
      perfectionist,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      // for eslint-plugin-react to auto detect react version
      react: {
        version: "detect",
      },
    },
    rules: {
      // set of custom rules
      ...reactHooks.configs.recommended.rules,
      "no-console": "off",
      "react/button-has-type": "error",
      "react/react-in-jsx-scope": ["off"],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Prettier rules
      "prettier/prettier": "error",

      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],

      "perfectionist/sort-exports": [
        "error",
        {
          type: "natural",
          type: "line-length",
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "natural",
          type: "line-length",
        },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        {
          order: "asc",
          type: "line-length",
        },
      ],
      "perfectionist/sort-interfaces": [
        "error",
        {
          order: "asc",
          type: "line-length",
          partitionByNewLine: true,
        },
      ],
      "perfectionist/sort-object-types": [
        "error",
        {
          order: "asc",
          type: "line-length",
          partitionByNewLine: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "import/no-unresolved": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": "off",
    },
  },
]);
