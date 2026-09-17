import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";

export default [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "coverage/*"],
  },
  {
    // Scoped to TS files: eslint-config-expo's flat preset only registers
    // the @typescript-eslint plugin for **/*.ts(x) — an unscoped rules
    // block referencing its rules breaks linting of plain .js/.mjs config
    // files (e.g. this file itself) with "could not find plugin
    // @typescript-eslint". `projectService` turns on type-aware linting
    // (tsconfig-driven), which no-floating-promises requires.
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Catches a whole class of "silently ignored async error" bugs that
      // are easy to write and easy to miss in review — worth being strict.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
