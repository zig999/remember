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
    // TC-FE-12: Playwright E2E tests live in `e2e/` and use the
    // `playwright/test` runner — they must NOT be discovered by Vitest
    // (which would try to execute them in jsdom and fail).
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      "e2e/**",
      "**/*.e2e.spec.{ts,tsx}",
    ],
  },
});
