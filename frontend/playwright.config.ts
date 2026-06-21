/**
 * Playwright configuration — TC-FE-12.
 *
 * Why this exists:
 *  - TC-FE-12 requires Playwright E2E tests for the one-by-one reveal
 *    sequence (AC-F.14), the reduced-motion variant (AC-F.16), and the
 *    unidirectionality invariant (AC-U.1 / U.3). These contracts span
 *    real-browser behavior (`prefers-reduced-motion`, `data-id` stamps
 *    appearing over time as React Flow lays out, click-through that
 *    doesn't kick off chat mutations) — jsdom cannot represent them.
 *
 * Why `playwright` (not `@playwright/test` separately):
 *  - The project pins `playwright@1.61` as a devDep (frontend memo
 *    "Playwright real-stack verification"); `playwright/test` is the
 *    test-runner entrypoint shipped with the same package. Adding
 *    `@playwright/test` would create a dependency duplication.
 *
 * Why we host the SPA via Vite preview, not the live dev server:
 *  - The owner's `npm run dev` may be running on :5173 (memos confirm
 *    they actively browse the live SPA). Stomping that port would
 *    interrupt their session. We point `webServer` at `npm run preview`
 *    on a different port and let Playwright manage its lifecycle.
 *
 * What the tests rely on the SPA exposing:
 *  - A `chat?conversation=<uuid>` route reachable behind the auth guard.
 *    The guard accepts an unsigned JWT injected into sessionStorage —
 *    same trick documented in the "Playwright real-stack verification"
 *    memo (the SPA only decodes the token; the BFF would reject it, but
 *    we mock the BFF anyway).
 *  - The `useGraphStore` and `useSendMessage` paths described in the
 *    plan §7.3 — graph_delta frame → addNodes → reveal animation.
 *
 * Spec references:
 *  - TC-FE-12 validation criteria (AC-F.14, AC-F.16, AC-U.3).
 *  - temp/chat-graphspace-plan.md §11 UC-CG-{01,11,09}, §13.
 */
import { defineConfig, devices } from "playwright/test";

// Default port for the preview server — distinct from the dev `:5173` so a
// Playwright run does not collide with the owner's active dev session.
const PREVIEW_PORT = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4173);
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

export default defineConfig({
  // E2E specs co-located with the feature they test. Per the TC constraint:
  // "live in the e2e/ directory if it exists, else in features/graph/__tests__/".
  // We pick `e2e/` to keep them out of the Vitest discovery pattern — Vitest
  // matches `src/**/*.spec.ts` (vitest.config.ts default).
  testDir: "./e2e",
  testMatch: /.*\.e2e\.spec\.ts/,

  // Hard upper bound — these tests animate over ~1s; 30s is generous.
  timeout: 30_000,
  // Force-fail the suite if a test exceeds its expect timeout once.
  expect: { timeout: 5_000 },

  // No parallelism: the tests share a preview server (single port).
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // `npm run preview` serves the production `dist/` over a static
    // server; faster + closer to real than `npm run dev`. The `--port`
    // override keeps the port deterministic.
    command: `npm run preview -- --host 127.0.0.1 --port ${PREVIEW_PORT}`,
    url: BASE_URL,
    // Build artifact must exist — the runner does NOT auto-build. CI
    // should call `npm run build` before `npx playwright test`.
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
