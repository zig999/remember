import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // BUG-01 fix (TC-01-r1): scaffold/config TCs may legitimately have zero test files.
    // Without this flag, `vitest run` exits code 1 on an empty test suite, breaking CI.
    passWithNoTests: true,
  },
});
