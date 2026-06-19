// ESLint flat config — front.back.md §1 + BR-05, BR-06
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import storybook from "eslint-plugin-storybook";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "storybook-static/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      import: importPlugin,
      storybook,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // BR-05: no fetch/axios directly in components
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "Use a TanStack Query hook in features/<x>/api/ — front.md §4.5",
            },
          ],
        },
      ],
      // BR-06: cross-feature imports forbidden
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features/graph",
              from: "./src/features",
              except: ["./graph"],
              message: "Cross-feature import forbidden — front.md §6.1",
            },
            {
              target: "./src/features/search",
              from: "./src/features",
              except: ["./search"],
              message: "Cross-feature import forbidden — front.md §6.1",
            },
            {
              target: "./src/features/ingest",
              from: "./src/features",
              except: ["./ingest"],
              message: "Cross-feature import forbidden — front.md §6.1",
            },
            {
              target: "./src/features/curation",
              from: "./src/features",
              except: ["./curation"],
              message: "Cross-feature import forbidden — front.md §6.1",
            },
            {
              target: "./src/features/history",
              from: "./src/features",
              except: ["./history"],
              message: "Cross-feature import forbidden — front.md §6.1",
            },
          ],
        },
      ],
    },
  },
];
