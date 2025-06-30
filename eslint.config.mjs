import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "@typescript-eslint/recommended"
  ),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React specific rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // General JavaScript rules
      "no-console": "warn",
      "no-debugger": "error",
      "no-alert": "warn",
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-expressions": "warn",

      // Import/Export rules
      "import/no-unresolved": "off", // Handled by TypeScript
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "warn",

      // Accessibility rules
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",

      // Performance rules
      "prefer-template": "warn",
      "object-shorthand": "warn",

      // Code quality rules
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-duplicate-imports": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "warn",

      // Disable problematic rules for this project
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];

export default eslintConfig;
