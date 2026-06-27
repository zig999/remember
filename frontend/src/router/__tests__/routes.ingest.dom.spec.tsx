// @vitest-environment jsdom
/**
 * /ingest route — DOM-based integration tests (dev_tc_006_r1).
 *
 * QA round 1 of TC-06 flagged that `routes.spec.tsx` only asserts route IDs:
 * it cannot tell whether `ingestRoute.component` mounts `IngestWorkspace`
 * (lazy-loaded) or the legacy `StubPage`. That bare-Node file is also pinned
 * `@vitest-environment node` for performance, so the DOM-render assertions
 * live here in a sibling file with the `jsdom` environment.
 *
 * Coverage:
 *   BUG-01 / BUG-03 — Authenticated navigation to /ingest renders the lazy
 *     `IngestWorkspace` (NOT `StubPage`). The lazy module is mocked to a
 *     sentinel so this test does not depend on the full feature graph
 *     (graph store, React Flow, ingest orchestration, query client) — it
 *     proves the route wires through `@/features/ingest/components/
 *     IngestWorkspace` because the mock for THAT import path is what
 *     renders.
 *   BUG-02 — Structural assertion that `IngestWorkspace` is wrapped in
 *     `lazy()` at module level in `routes.tsx` (regression guard against a
 *     future refactor that flattens the import and breaks code-splitting).
 *   BUG-04 — Suspense fallback renders with `role="status"`, `aria-live=
 *     "polite"`, and the exact copy "Carregando ingestão…" while the lazy
 *     chunk is in flight.
 *
 * Why mock the lazy module instead of letting it resolve to the real
 * `IngestWorkspace`:
 *  - The real workspace pulls React Flow + d3-force, the graph store, the
 *    ingest orchestration hook, and the TanStack Query client. Mounting it
 *    just to assert the route wired correctly would multiply the test's
 *    surface area and require all the jsdom shims (ResizeObserver,
 *    scrollIntoView, …) that the existing `IngestWorkspace.spec.tsx`
 *    already maintains.
 *  - The behavior under test is the ROUTE wire-up: that
 *    `ingestRoute.component` lazily loads the module at
 *    `@/features/ingest/components/IngestWorkspace` and renders its
 *    `IngestWorkspace` export inside a Suspense boundary. A sentinel mock
 *    of that exact import path proves the import is reached.
 *
 * Why the JWT must be planted BEFORE `vi.resetModules()` + dynamic import:
 *   `protectedLayoutRoute.beforeLoad` (in `routes.tsx`) reads
 *   `useAuthStore.getState().isFresh()` at navigation time. The auth store
 *   is a module singleton, so we resolve it AFTER `vi.resetModules()`
 *   inside the test body so the same instance is shared with the freshly
 *   imported route tree.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ---------- jsdom shims ---------- */

// Required by React's act() under raw jsdom (no @testing-library) — without
// this flag effects flush synchronously but `act` complains.
// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/* ---------- helpers ---------- */

/**
 * Encode a JWT with the given payload (signature segment ignored — JWKS
 * verification happens server-side per front.back.md §6). Matches the
 * helper in the sibling `routes.spec.tsx` so both files agree on token
 * shape.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj), "utf8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${enc({ alg: "EdDSA", typ: "JWT" })}.${enc(payload)}.x`;
}

/**
 * Flush any microtasks/timers that React + the lazy resolver scheduled.
 * `await Promise.resolve()` inside `act` is enough for a synchronously
 * resolved lazy module (the dynamic `import()` returns an already-resolved
 * promise when vi.mock has registered the module).
 */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

/**
 * Build a QueryClient suitable for unit tests — no retries (so a missing
 * BFF doesn't slow the test), no refetches. `AppShell` pulls live health /
 * curation / active-run status via TanStack Query; without a provider the
 * route render throws "No QueryClient set" inside AppErrorBoundary, which
 * masks the actual /ingest assertion.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
}

/* ---------- shared test fixtures ---------- */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.resetModules();
  // sonner reaches into `document` at import time (toaster stylesheet) —
  // stub the surface we consume so the route tree import does not crash.
  vi.doMock("sonner", () => ({
    Toaster: () => null,
    toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
  }));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("sonner");
  // Drop the per-test IngestWorkspace mocks (both alias and the relative
  // forms) so the next test starts from a clean registry — without this,
  // a leaked never-resolving mock would freeze BUG-01.
  vi.doUnmock("@/features/ingest/components/IngestWorkspace");
  vi.doUnmock("../../features/ingest/components/IngestWorkspace");
  vi.doUnmock("../../features/ingest/components/IngestWorkspace/index");
  vi.doUnmock("../../features/ingest/components/IngestWorkspace/IngestWorkspace");
});

/* ---------- BUG-01 + BUG-03: authenticated nav renders IngestWorkspace ---------- */

describe("/ingest route renders the lazy IngestWorkspace (TC-06 BUG-01 + BUG-03)", () => {
  it("authenticated navigation to /ingest mounts the IngestWorkspace lazy module (not StubPage)", async () => {
    // Mock the lazy target at the EXACT import path the route uses
    // (`routes.tsx`: `import("@/features/ingest/components/IngestWorkspace")`).
    // The sentinel proves the route's lazy() reaches this module — if the
    // route ever reverted to `StubPage`, neither this mock nor its
    // sentinel would render. Vitest + Vite alias resolution can be
    // finicky: existing tests in this repo (e.g. `ChatWorkspace.spec.tsx`)
    // double-mock both the alias and the relative form — we do the same
    // so the lazy import always hits a registered mock.
    const sentinelFactory = () => ({
      IngestWorkspace: () => (
        <div data-testid="ingest-workspace-sentinel">workspace ok</div>
      ),
    });
    vi.doMock("@/features/ingest/components/IngestWorkspace", sentinelFactory);
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace",
      sentinelFactory,
    );
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace/index",
      sentinelFactory,
    );
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace/IngestWorkspace",
      sentinelFactory,
    );

    // Plant a fresh JWT BEFORE building the router so
    // `protectedLayoutRoute.beforeLoad` (which reads
    // `useAuthStore.getState().isFresh()`) lets the navigation through.
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "owner", exp }));

    const { RouterProvider, createMemoryHistory, createRouter } = await import(
      "@tanstack/react-router"
    );
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/ingest"] }),
    });

    const qc = makeQueryClient();
    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      );
    });
    // The lazy() resolver awaits the dynamic import() promise + the
    // chained `.then()`. Several flushes give React time to: (1) await
    // the mocked module promise, (2) re-suspend and commit the resolved
    // child. Five flushes is empirically enough in jsdom and cheap;
    // anything still pending after that points at a real wiring bug.
    for (let i = 0; i < 5; i++) {
      await flush();
    }

    // The sentinel from the mocked IngestWorkspace must be in the DOM —
    // this is the BUG-01 + BUG-03 assertion.
    expect(
      container.querySelector('[data-testid="ingest-workspace-sentinel"]'),
    ).not.toBeNull();

    // And the StubPage testId (`data-testid="<id>-page"`, with `id` being
    // the route key e.g. "ingest") must NOT appear. The lazy-loaded
    // IngestWorkspace replaced StubPage in TC-06 — a regression that
    // re-pointed ingestRoute at StubPage would surface here.
    expect(
      container.querySelector('[data-testid="ingest-page"]'),
    ).toBeNull();

    // And the route must not have redirected back to /sign-in.
    expect(router.state.location.pathname).toBe("/ingest");
  });
});

/* ---------- BUG-02: IngestWorkspace is loaded via lazy() ---------- */

describe("ingestRoute is wired via lazy() at module level (TC-06 BUG-02)", () => {
  it("routes.tsx wraps the IngestWorkspace import in lazy(...) — regression guard for code-splitting", () => {
    // Resolve the routes.tsx source relative to THIS test file. Reading
    // the source is the same regression-guard pattern used by
    // `useGraphReveal.spec.ts` to assert imports.
    const here = dirname(fileURLToPath(import.meta.url));
    const sourcePath = resolve(here, "..", "routes.tsx");
    const source = readFileSync(sourcePath, "utf8");

    // The declaration must wrap a dynamic import to the IngestWorkspace
    // module — `lazy(() => import("@/features/ingest/components/
    // IngestWorkspace").then(...))`. We accept any whitespace; the
    // structural constraint is "lazy() + import() of the right path".
    expect(source).toMatch(/const\s+IngestWorkspace\s*=\s*lazy\s*\(/);
    expect(source).toMatch(
      /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']@\/features\/ingest\/components\/IngestWorkspace["']\s*\)/,
    );

    // And `IngestWorkspace` must NOT be imported statically (a direct
    // `import { IngestWorkspace } from "@/features/ingest/..."` would
    // collapse code-splitting silently).
    expect(source).not.toMatch(
      /import\s*\{[^}]*\bIngestWorkspace\b[^}]*\}\s*from\s*["']@\/features\/ingest\/components\/IngestWorkspace["']/,
    );
  });
});

/* ---------- BUG-04: Suspense fallback renders during lazy load ---------- */

describe("/ingest Suspense fallback renders while the lazy chunk is in flight (TC-06 BUG-04)", () => {
  it("renders role=status / aria-live=polite / 'Carregando ingestão…' while the lazy import is pending", async () => {
    // Replace the lazy target so React.lazy's resolver awaits forever —
    // this simulates an in-flight chunk so the Suspense boundary stays
    // on the fallback for the lifetime of the assertion. The factory
    // returns a never-resolving thenable; `lazy(() => import(p).then(...))`
    // chains off that thenable and never gets to call `.then((m) => ({
    // default: m.IngestWorkspace }))`. Vitest + Vite alias resolution
    // requires mocking both the alias and the relative form (same
    // workaround as `ChatWorkspace.spec.tsx`).
    const pendingFactory = (): Promise<{
      IngestWorkspace: () => null;
    }> => new Promise(() => undefined);
    vi.doMock("@/features/ingest/components/IngestWorkspace", pendingFactory);
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace",
      pendingFactory,
    );
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace/index",
      pendingFactory,
    );
    vi.doMock(
      "../../features/ingest/components/IngestWorkspace/IngestWorkspace",
      pendingFactory,
    );

    // Plant a fresh JWT so the guard lets navigation through.
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "owner", exp }));

    const { RouterProvider, createMemoryHistory, createRouter } = await import(
      "@tanstack/react-router"
    );
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/ingest"] }),
    });

    const qc = makeQueryClient();
    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      );
    });
    // One microtask flush is enough to let the route component mount
    // (Suspense fallback paints on first render; no need to wait for the
    // lazy promise since it never resolves).
    await flush();

    // The fallback element rendered by `ingestRoute.component`'s Suspense
    // boundary — assert all three a11y/copy guarantees together so a
    // regression on any one is loud.
    const fallback = container.querySelector(
      '[role="status"][aria-live="polite"]',
    );
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toContain("Carregando ingestão…");

    // And the workspace must NOT have mounted (the lazy promise is still
    // pending — Suspense should be suspended).
    expect(
      container.querySelector('[data-testid="ingest-workspace-sentinel"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="ingest-workspace"]'),
    ).toBeNull();
  });
});
