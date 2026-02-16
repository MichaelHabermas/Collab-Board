const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [
      "node_modules/",
      "**/dist/",
      "**/coverage/",
      "apps/client/scripts/",
      "apps/client/e2e/",
      "*.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/client/src/**/*.{ts,tsx}"],
    ...react.configs.flat.recommended,
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: "readonly", document: "readonly" },
    },
    plugins: { "react-hooks": reactHooks },
    settings: { react: { version: "19.0" } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      curly: ["error", "all"],
    },
  },
  {
    files: ["apps/server/src/**/*.ts", "packages/*/src/**/*.ts"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      curly: ["error", "all"],
    },
  },
  prettierConfig,
];
