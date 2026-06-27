// @vitest-environment jsdom
/**
 * useIngestGraphAssembly — parallel traverse + graph-assembly unit tests
 * (TC-03 of EPIC-01, revision r1).
 *
 * Restored after `fdbf767` (TC-02/TC-05 reconcile) deleted the original file.
 * The hook's signature changed from a positional `(nodes)` argument to an
 * options object `{ affectedNodes, enabled }`, and the return shape changed
 * to `{ isAssembling, hasError, settledCount, totalCount }`. These tests
 * target the CURRENT signature.
 *
 * Pins (per ingest.feature.spec.md §4 Step 4 and FL-08):
 *  - N affected nodes (`enabled: true`) → N parallel
 *    `GET /api/v1/nodes/:id/traverse?depth=1&direction=both`.
 *  - Links shared across traversals are deduplicated by `id`.
 *  - On full success: `replaceNodes(delta)` and `setStatus("revealing")`
 *    fire with `delta.sourceTool === "ingest_assembly"`.
 *  - `affectedNodes` null / undefined / [] WITH `enabled: false` → no
 *    fetch, store untouched, `isAssembling === false`, `hasError === false`
 *    (FL-08 no-op contract).
 *  - Partial failure → `hasError === true`; store NOT updated with the
 *    half-baked delta (the assembly only commits on full success).
 *
 * Anti-spy guardrail: per memory `graph-non-cumulative-and-zustand-spyon`,
 * we do NOT `vi.spyOn` the Zustand store actions — `set()` leaks the spy
 * across tests via the shared singleton. Instead, we assert against store
 * STATE (Map identity / sizes / status) which is the durable signal.
 */
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock lib/env BEFORE importing the SUT (vi.mock is hoisted).
vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  useIngestGraphAssembly,
  type UseIngestGraphAssemblyOptions,
  type UseIngestGraphAssemblyResult,
} from "../useIngestGraphAssembly";
import type { AffectedNode } from "../_transforms";
import { useGraphStore } from "../../../graph/state/graph-store";
import { useAuthStore } from "../../../../state/auth";

/* ---------- helpers ---------- */

interface HarnessHandle {
  resultRef: { current: UseIngestGraphAssemblyResult | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountHarness(options: UseIngestGraphAssemblyOptions): HarnessHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const resultRef: HarnessHandle["resultRef"] = { current: null };

  function Probe(props: {
    options: UseIngestGraphAssemblyOptions;
  }): React.ReactElement {
    const r = useIngestGraphAssembly(props.options);
    resultRef.current = r;
    return React.createElement("div");
  }

  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe, { options }),
      ),
    );
  });
  return { resultRef, queryClient, container, root };
}

function unmountHarness(h: HarnessHandle): void {
  act(() => {
    h.root.unmount();
  });
  h.container.remove();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build the `{ ok: true, result: { nodes, links } }` envelope as the BFF
 *  wraps every successful traverse response — `lib/http.ts` unwraps it. */
interface TraverseWireBody {
  nodes: ReadonlyArray<{
    id: string;
    node_type: string;
    canonical_name: string;
    status: "active" | "needs_review" | "merged" | "deleted";
  }>;
  links: ReadonlyArray<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    link_type: string;
    link_type_label?: string;
    is_temporal: boolean;
    is_in_effect?: boolean;
    status?: string;
    flags?: ReadonlyArray<"uncertain" | "disputed" | "low_confidence">;
  }>;
}

function envelopedTraverse(body: TraverseWireBody): {
  ok: true;
  result: TraverseWireBody;
} {
  return { ok: true, result: body };
}

async function waitFor(
  predicate: () => boolean,
  { timeoutMs = 2000, intervalMs = 5 } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, intervalMs));
    });
  }
}

const NODE_A: AffectedNode = {
  id: "node-A",
  canonicalName: "Rodrigo",
  nodeType: "person",
};
const NODE_B: AffectedNode = {
  id: "node-B",
  canonicalName: "Apollo",
  nodeType: "project",
};

/** Wire projection of an affected node for the `nodes[]` of a traverse body. */
function wireOf(n: AffectedNode): {
  id: string;
  node_type: string;
  canonical_name: string;
  status: "active";
} {
  return {
    id: n.id,
    node_type: n.nodeType,
    canonical_name: n.canonicalName,
    status: "active",
  };
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, claims: null });
  // Reset the graph store between tests so assertions about `replaceNodes`
  // are not contaminated by prior runs.
  useGraphStore.getState().clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * 1) Parallel fetch                                                   *
 * ------------------------------------------------------------------ */

describe("useIngestGraphAssembly — parallel queries", () => {
  it("fires one GET /traverse per affected node, in parallel", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes(`/nodes/${NODE_A.id}/traverse`)) {
        return Promise.resolve(
          jsonResponse(
            envelopedTraverse({
              nodes: [wireOf(NODE_A), wireOf(NODE_B)],
              links: [
                {
                  id: "L1",
                  source_node_id: NODE_A.id,
                  target_node_id: NODE_B.id,
                  link_type: "participates_in",
                  link_type_label: "participa de",
                  is_temporal: false,
                },
              ],
            }),
          ),
        );
      }
      if (u.includes(`/nodes/${NODE_B.id}/traverse`)) {
        return Promise.resolve(
          jsonResponse(
            envelopedTraverse({
              nodes: [wireOf(NODE_A), wireOf(NODE_B)],
              links: [
                {
                  id: "L1",
                  source_node_id: NODE_A.id,
                  target_node_id: NODE_B.id,
                  link_type: "participates_in",
                  link_type_label: "participa de",
                  is_temporal: false,
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        jsonResponse({ ok: false, error: { code: "TEST_UNKNOWN_URL" } }, 500),
      );
    });

    const h = mountHarness({
      affectedNodes: [NODE_A, NODE_B],
      enabled: true,
    });
    try {
      // Wait until both queries have settled — the hook's `settledCount`
      // === totalCount is the public signal of "all done".
      await waitFor(
        () => h.resultRef.current?.settledCount === 2,
      );

      // Two parallel queries — one per affected node — same depth=1&direction=both path.
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const urls = fetchSpy.mock.calls.map((c) => String(c[0])).sort();
      expect(urls).toEqual([
        `https://bff.test/api/v1/nodes/${NODE_A.id}/traverse?depth=1&direction=both`,
        `https://bff.test/api/v1/nodes/${NODE_B.id}/traverse?depth=1&direction=both`,
      ]);
      expect(h.resultRef.current?.totalCount).toBe(2);
    } finally {
      unmountHarness(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2) Link dedup + replaceNodes + setStatus("revealing")              *
 * ------------------------------------------------------------------ */

describe("useIngestGraphAssembly — dedup + commit", () => {
  /** Shared setup helper — both tests in this block exercise the same
   *  successful 2-traversal path, but assert on different aspects of the
   *  resulting store mutation. Co-locating the mock keeps the two
   *  scenarios from drifting apart. */
  function mockSharedSuccess(): void {
    const sharedLink = {
      id: "L1",
      source_node_id: NODE_A.id,
      target_node_id: NODE_B.id,
      link_type: "participates_in",
      link_type_label: "participa de",
      is_temporal: false,
    };
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes(NODE_A.id) || u.includes(NODE_B.id)) {
        return Promise.resolve(
          jsonResponse(
            envelopedTraverse({
              nodes: [wireOf(NODE_A), wireOf(NODE_B)],
              links: [sharedLink],
            }),
          ),
        );
      }
      return Promise.resolve(
        jsonResponse({ ok: false, error: { code: "TEST_UNKNOWN_URL" } }, 500),
      );
    });
  }

  it("dedupes shared link across 2 traversals (Map collapses by id)", async () => {
    mockSharedSuccess();

    const h = mountHarness({
      affectedNodes: [NODE_A, NODE_B],
      enabled: true,
    });
    try {
      await waitFor(
        () => h.resultRef.current?.settledCount === 2,
      );
      // Allow the post-success effect to run.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const state = useGraphStore.getState();
      // Dedup horizon: two unique nodes, one unique link (L1 appears in
      // both traversals — the Map must collapse them to one entry).
      expect(Array.from(state.nodes.keys()).sort()).toEqual([
        NODE_A.id,
        NODE_B.id,
      ]);
      expect(state.links.size).toBe(1);
      expect(state.links.get("L1")?.linkTypeLabel).toBe("participa de");

      // `replaceNodes` resets `revealedIds` and queues every delta node for
      // the 1-by-1 reveal animation — proves the assembled delta went through
      // the non-cumulative path (not `addNodes`).
      expect(state.revealQueue.length).toBe(2);
      expect(state.revealedIds.size).toBe(0);
    } finally {
      unmountHarness(h);
    }
  });

  it("calls setStatus('revealing') after all traverses resolve", async () => {
    mockSharedSuccess();

    const h = mountHarness({
      affectedNodes: [NODE_A, NODE_B],
      enabled: true,
    });
    try {
      // Status starts at the store's initial value ("empty"). The effect
      // only flips it to "revealing" once successCount === totalCount.
      expect(useGraphStore.getState().status).toBe("empty");

      await waitFor(
        () => h.resultRef.current?.settledCount === 2,
      );
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // Contract with UI-08: the assembly commits the delta and signals
      // the GraphSpace to begin the 1-by-1 reveal animation.
      expect(useGraphStore.getState().status).toBe("revealing");
    } finally {
      unmountHarness(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 3) FL-08 — affectedNodes null / undefined / [] (enabled: false)    *
 * ------------------------------------------------------------------ */

describe("useIngestGraphAssembly — FL-08 absent affected_nodes", () => {
  it("affectedNodes: null + enabled: false → no fetch, store untouched, flags false", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // Capture store identity BEFORE mount — FL-08 must leave the Maps
    // reference-equal (no `set()` call ran on the singleton).
    const before = useGraphStore.getState();
    const beforeNodes = before.nodes;
    const beforeLinks = before.links;
    const beforeStatus = before.status;

    const h = mountHarness({ affectedNodes: null, enabled: false });
    try {
      // Give the hook room to misbehave — if it were going to fire it
      // would have by now.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      const after = useGraphStore.getState();
      // Identity-equal Maps + unchanged status → no write occurred.
      expect(after.nodes).toBe(beforeNodes);
      expect(after.links).toBe(beforeLinks);
      expect(after.status).toBe(beforeStatus);
      expect(h.resultRef.current?.isAssembling).toBe(false);
      expect(h.resultRef.current?.hasError).toBe(false);
      expect(h.resultRef.current?.totalCount).toBe(0);
    } finally {
      unmountHarness(h);
    }
  });

  it("affectedNodes: undefined-equivalent (null) — same FL-08 no-op", async () => {
    // The hook's typed signature accepts `ReadonlyArray<AffectedNode> | null`
    // — `undefined` cannot be passed at the type level. The hook's runtime
    // guard `(affectedNodes ?? [])` collapses null AND undefined onto the
    // same branch, so passing `null` exercises both code paths.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const beforeNodes = useGraphStore.getState().nodes;
    const beforeStatus = useGraphStore.getState().status;

    const h = mountHarness({ affectedNodes: null, enabled: false });
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      // Identity-equal Map → store untouched.
      expect(useGraphStore.getState().nodes).toBe(beforeNodes);
      expect(useGraphStore.getState().status).toBe(beforeStatus);
      expect(h.resultRef.current?.isAssembling).toBe(false);
      expect(h.resultRef.current?.hasError).toBe(false);
    } finally {
      unmountHarness(h);
    }
  });

  it("affectedNodes: [] + enabled: false → no fetch, store untouched", async () => {
    // Empty array is the boundary case of FL-08: nothing to traverse.
    // With `enabled: false`, the hook must early-return out of its effect
    // and leave the store entirely alone (no clear, no setStatus).
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const beforeNodes = useGraphStore.getState().nodes;
    const beforeStatus = useGraphStore.getState().status;

    const h = mountHarness({ affectedNodes: [], enabled: false });
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      // Store identity preserved → assembly effect never wrote.
      expect(useGraphStore.getState().nodes).toBe(beforeNodes);
      expect(useGraphStore.getState().status).toBe(beforeStatus);
      expect(h.resultRef.current?.isAssembling).toBe(false);
      expect(h.resultRef.current?.hasError).toBe(false);
      expect(h.resultRef.current?.totalCount).toBe(0);
      expect(h.resultRef.current?.settledCount).toBe(0);
    } finally {
      unmountHarness(h);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 4) Partial failure                                                  *
 * ------------------------------------------------------------------ */

describe("useIngestGraphAssembly — partial failure", () => {
  it("surfaces hasError when one of N traversals fails; store NOT updated", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes(NODE_A.id)) {
        return Promise.resolve(
          jsonResponse(
            envelopedTraverse({
              nodes: [wireOf(NODE_A)],
              links: [],
            }),
          ),
        );
      }
      // NODE_B traversal hard-fails — the assembly must NOT commit a
      // half-baked delta (the effect gates on successCount === totalCount).
      return Promise.resolve(
        jsonResponse(
          { ok: false, error: { code: "SYSTEM_INTERNAL", message: "boom" } },
          500,
        ),
      );
    });

    // Snapshot store identity to prove the store is not mutated on the
    // partial-failure path — Map identity preserved.
    const beforeNodes = useGraphStore.getState().nodes;
    const beforeStatus = useGraphStore.getState().status;

    const h = mountHarness({
      affectedNodes: [NODE_A, NODE_B],
      enabled: true,
    });
    try {
      await waitFor(() => h.resultRef.current?.hasError === true);
      expect(h.resultRef.current?.hasError).toBe(true);
      // Half-baked delta never committed — Map identity preserved.
      expect(useGraphStore.getState().nodes).toBe(beforeNodes);
      expect(useGraphStore.getState().status).toBe(beforeStatus);
    } finally {
      unmountHarness(h);
    }
  });
});
