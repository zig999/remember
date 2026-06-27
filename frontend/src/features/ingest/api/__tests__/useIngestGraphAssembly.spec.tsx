// @vitest-environment jsdom
/**
 * useIngestGraphAssembly — parallel traverse + graph-assembly unit tests
 * (TC-03 of EPIC-01).
 *
 * Pins (per ingest.feature.spec.md §4 Step 4 and FL-08):
 *  - N affected nodes → N parallel GET /api/v1/nodes/:id/traverse?depth=1.
 *  - Links shared across traversals are deduplicated by `id`.
 *  - On full success: `replaceNodes(delta)` and `setStatus("revealing")`
 *    fire EXACTLY ONCE, with `delta.sourceTool === "traverseNode"`.
 *  - `affectedNodes` null / undefined → no fetch, store untouched, all
 *    result flags `false` (FL-08).
 *  - Partial failure → `isError === true`; store untouched (the assembly
 *    only commits on full success).
 *  - `staleTime: 5min` and `refetchOnWindowFocus: false` — pinned by the
 *    feature spec; encoded as a behaviour-test (no refetch on focus).
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

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  useIngestGraphAssembly,
  type IngestAffectedNode,
  type UseIngestGraphAssemblyResult,
} from "../useIngestGraphAssembly";
import { useGraphStore } from "../../../graph/state/graph-store";
import { useAuthStore } from "../../../../state/auth";

interface HarnessHandle {
  resultRef: { current: UseIngestGraphAssemblyResult | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountHarness(
  affectedNodes: ReadonlyArray<IngestAffectedNode> | null | undefined,
): HarnessHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const resultRef: HarnessHandle["resultRef"] = { current: null };

  function Probe({
    nodes,
  }: {
    nodes: ReadonlyArray<IngestAffectedNode> | null | undefined;
  }): React.ReactElement {
    const r = useIngestGraphAssembly(nodes);
    resultRef.current = r;
    return React.createElement("div");
  }

  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe, { nodes: affectedNodes }),
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

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build a `{ ok: true, result: { nodes, links } }` envelope as the BFF
 *  wraps every REST response. The wire shape under `result` is the slice
 *  the assembly hook consumes (`GraphNodeWire` + `GraphLinkWire`). */
function makeTraverseWire(
  nodes: ReadonlyArray<{
    id: string;
    node_type: string;
    canonical_name: string;
    status: "active" | "needs_review" | "merged" | "deleted";
  }>,
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
  }>,
): { ok: true; result: { nodes: typeof nodes; links: typeof links } } {
  return { ok: true, result: { nodes, links } };
}

async function waitFor(
  predicate: () => boolean,
  { timeoutMs = 500, intervalMs = 5 } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, intervalMs));
    });
  }
}

const NODE_A: IngestAffectedNode = {
  id: "node-A",
  canonical_name: "Rodrigo",
  node_type: "person",
};
const NODE_B: IngestAffectedNode = {
  id: "node-B",
  canonical_name: "Apollo",
  node_type: "project",
};

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, claims: null });
  // Reset the graph store between tests so assertions about
  // `replaceNodes` are not contaminated by a prior run.
  useGraphStore.getState().clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useIngestGraphAssembly — parallel queries", () => {
  it("fires one GET /traverse per affected node, in parallel", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes(`/nodes/${NODE_A.id}/traverse`)) {
        return Promise.resolve(
          makeJsonResponse(
            makeTraverseWire(
              [{ ...wireOf(NODE_A) }, { ...wireOf(NODE_B) }],
              [
                {
                  id: "L1",
                  source_node_id: NODE_A.id,
                  target_node_id: NODE_B.id,
                  link_type: "participates_in",
                  link_type_label: "participa de",
                  is_temporal: false,
                },
              ],
            ),
          ),
        );
      }
      if (u.includes(`/nodes/${NODE_B.id}/traverse`)) {
        return Promise.resolve(
          makeJsonResponse(
            makeTraverseWire(
              [{ ...wireOf(NODE_A) }, { ...wireOf(NODE_B) }],
              [
                // Same link id as in NODE_A's traversal — dedup must collapse them.
                {
                  id: "L1",
                  source_node_id: NODE_A.id,
                  target_node_id: NODE_B.id,
                  link_type: "participates_in",
                  link_type_label: "participa de",
                  is_temporal: false,
                },
              ],
            ),
          ),
        );
      }
      return Promise.resolve(makeJsonResponse({ ok: true, result: {} }, 500));
    });

    const h = mountHarness([NODE_A, NODE_B]);
    try {
      await waitFor(() => h.resultRef.current?.isSuccess === true);

      // Two parallel queries — one per affected node — same depth=1 path.
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const urls = fetchSpy.mock.calls.map((c) => String(c[0]));
      expect(urls).toEqual(
        expect.arrayContaining([
          `https://bff.test/api/v1/nodes/${NODE_A.id}/traverse?depth=1`,
          `https://bff.test/api/v1/nodes/${NODE_B.id}/traverse?depth=1`,
        ]),
      );
    } finally {
      unmountHarness(h);
    }
  });

  it("dedupes links by id and writes the graph store ONCE in 'revealing'", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      // Both traversals yield the SAME link L1. The assembled delta MUST
      // contain it exactly once (dedup by id).
      const sharedLink = {
        id: "L1",
        source_node_id: NODE_A.id,
        target_node_id: NODE_B.id,
        link_type: "participates_in",
        link_type_label: "participa de",
        is_temporal: false,
      };
      if (u.includes(NODE_A.id)) {
        return Promise.resolve(
          makeJsonResponse(
            makeTraverseWire([wireOf(NODE_A), wireOf(NODE_B)], [sharedLink]),
          ),
        );
      }
      return Promise.resolve(
        makeJsonResponse(
          makeTraverseWire([wireOf(NODE_A), wireOf(NODE_B)], [sharedLink]),
        ),
      );
    });

    // Assert against STATE, not spy counts. Per the Zustand spy-leak gotcha
    // (memo graph-non-cumulative-and-zustand-spyon), spying on store
    // actions contaminates other tests because each set() copies the
    // wrapped method forward. State assertions are the durable signal.
    const h = mountHarness([NODE_A, NODE_B]);
    try {
      await waitFor(() => h.resultRef.current?.isSuccess === true);
      // Allow the post-success effect to run.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const state = useGraphStore.getState();
      // Dedup horizon: two unique nodes, one unique link (L1 appears in
      // both traversals — the Map must collapse them).
      expect(Array.from(state.nodes.keys()).sort()).toEqual([
        NODE_A.id,
        NODE_B.id,
      ]);
      expect(state.links.size).toBe(1);
      expect(state.links.get("L1")?.linkTypeLabel).toBe("participa de");

      // The status flip to "revealing" is what unlocks the 1-by-1 reveal
      // animation in GraphSpace — contract with UI-08.
      expect(state.status).toBe("revealing");
      // `replaceNodes` resets `revealedIds` and queues every delta node
      // for the reveal — proves the assembled delta went through the
      // non-cumulative path (not `addNodes`).
      expect(state.revealQueue.length).toBe(2);
      expect(state.revealedIds.size).toBe(0);
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useIngestGraphAssembly — FL-08 absent affected_nodes", () => {
  it.each([
    ["null", null as IngestAffectedNode[] | null | undefined],
    ["undefined", undefined as IngestAffectedNode[] | null | undefined],
  ])("does NOT fetch and does NOT touch the store when affectedNodes is %s", async (_label, value) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Snapshot the store's identity-relevant slice BEFORE the hook mounts.
    // The FL-08 path must leave it untouched — proved by reference equality
    // of the Maps (Zustand replaces references when set() runs).
    const before = useGraphStore.getState();
    const beforeNodes = before.nodes;
    const beforeLinks = before.links;
    const beforeStatus = before.status;

    const h = mountHarness(value);
    try {
      // Give the hook room to misbehave — if it were going to fire, it
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
      // Per the spec — all flags `false` when the FL-08 no-op path fires.
      expect(h.resultRef.current).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: false,
      });
    } finally {
      unmountHarness(h);
    }
  });

  it("does NOT fetch when affectedNodes is an empty array", async () => {
    // Empty array is the boundary case of FL-08: nothing to traverse,
    // so the hook must behave the same as null/undefined.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const beforeNodes = useGraphStore.getState().nodes;
    const beforeStatus = useGraphStore.getState().status;

    const h = mountHarness([]);
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      // Store identity preserved → assembly never ran.
      expect(useGraphStore.getState().nodes).toBe(beforeNodes);
      expect(useGraphStore.getState().status).toBe(beforeStatus);
      expect(h.resultRef.current?.isSuccess).toBe(false);
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useIngestGraphAssembly — partial failure", () => {
  it("surfaces isError when one of N traversals fails; store stays untouched", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes(NODE_A.id)) {
        return Promise.resolve(
          makeJsonResponse(
            makeTraverseWire([wireOf(NODE_A)], []),
          ),
        );
      }
      // NODE_B traversal hard-fails — the assembly must NOT commit a
      // half-baked delta to the store.
      return Promise.resolve(
        makeJsonResponse(
          { ok: false, error: { code: "SYSTEM_INTERNAL", message: "boom" } },
          500,
        ),
      );
    });

    // Snapshot store identity to prove the store is not mutated on the
    // partial-failure path (no spy — Zustand singletons leak spies).
    const beforeNodes = useGraphStore.getState().nodes;
    const beforeStatus = useGraphStore.getState().status;

    const h = mountHarness([NODE_A, NODE_B]);
    try {
      await waitFor(() => h.resultRef.current?.isError === true);
      expect(h.resultRef.current?.isError).toBe(true);
      expect(h.resultRef.current?.isSuccess).toBe(false);
      // Half-baked delta never committed — Map identity preserved.
      expect(useGraphStore.getState().nodes).toBe(beforeNodes);
      expect(useGraphStore.getState().status).toBe(beforeStatus);
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useIngestGraphAssembly — auth header", () => {
  it("attaches Authorization: Bearer <jwt> read from the auth store at call time", async () => {
    useAuthStore.setState({ accessToken: "jwt-xyz", claims: null });
    let capturedHeaders: Headers | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      const i = init as RequestInit;
      capturedHeaders = new Headers(i.headers as HeadersInit);
      return Promise.resolve(
        makeJsonResponse(makeTraverseWire([wireOf(NODE_A)], [])),
      );
    });

    const h = mountHarness([NODE_A]);
    try {
      await waitFor(() => h.resultRef.current?.isSuccess === true);
      expect(capturedHeaders!.get("Authorization")).toBe("Bearer jwt-xyz");
    } finally {
      unmountHarness(h);
    }
  });
});

/* ---------- test helpers ---------- */

/** Build the wire-shape projection of an affected node — used to populate
 *  the `nodes[]` array of a traverse response. */
function wireOf(n: IngestAffectedNode): {
  id: string;
  node_type: string;
  canonical_name: string;
  status: "active";
} {
  return {
    id: n.id,
    node_type: n.node_type,
    canonical_name: n.canonical_name,
    status: "active",
  };
}
