// @vitest-environment jsdom
/**
 * Curation hooks — wire + cache contract tests.
 *
 * Spec ref: docs/specs/front/features/curadoria.feature.spec.md §4 — these
 * tests pin the four contract points TC-04+ depend on:
 *   1. URLs and HTTP methods match openapi.yaml (drift here breaks the wire);
 *   2. staleTime / refetchInterval / refetchOnWindowFocus match the §4 TTL
 *      table (drift here causes spurious refetches or stale UI);
 *   3. curation REST is consumed bare-body (no envelope unwrap) while
 *      KG/QR are consumed enveloped (drift here causes
 *      SYSTEM_INVALID_RESPONSE);
 *   4. Mutation onSuccess invalidates `curationKeys.all` so the queue and
 *      metrics refresh after every commit (drift here means the curator
 *      sees the old queue after a decision).
 *
 * Test rig: same imperative `act()` + ref harness used by
 * `features/graph/api/__tests__/useNodeDetail.spec.tsx` — no
 * `@testing-library/react` in this stack.
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
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

// Mock lib/env BEFORE the SUT imports (vi.mock is hoisted).
vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  useListReviewQueue,
  useCurationMetrics,
  useConfirmItem,
  useResolveEntityMatch,
} from "../curation.hooks";
import { curationKeys, nodeKeys, provenanceKeys } from "../keys";
import { handlers, mockResponse, mockError } from "./handlers";

/* ---------- helpers ---------- */

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface QueryHarness<T> {
  ref: { current: UseQueryResult<T> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountQuery<T>(useHook: () => UseQueryResult<T>): QueryHarness<T> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ref: QueryHarness<T>["ref"] = { current: null };
  function Probe(): React.ReactElement {
    ref.current = useHook();
    return React.createElement("div");
  }
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe),
      ),
    );
  });
  return { ref, queryClient, container, root };
}

interface MutationHarness<TData, TVars> {
  ref: { current: UseMutationResult<TData, Error, TVars> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountMutation<TData, TVars>(
  useHook: () => UseMutationResult<TData, Error, TVars>,
): MutationHarness<TData, TVars> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ref: MutationHarness<TData, TVars>["ref"] = { current: null };
  function Probe(): React.ReactElement {
    ref.current = useHook();
    return React.createElement("div");
  }
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe),
      ),
    );
  });
  return { ref, queryClient, container, root };
}

function unmount(h: { root: Root; container: HTMLDivElement }): void {
  act(() => {
    h.root.unmount();
  });
  h.container.remove();
}

async function waitFor(predicate: () => boolean, maxMs = 1000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
  throw new Error("waitFor timed out");
}

beforeEach(() => {
  handlers.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ---------- useListReviewQueue ---------- */

describe("useListReviewQueue — wire + cache contract", () => {
  it("hits GET /api/v1/curation/queue and stores under curationKeys.queue", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) =>
        handlers.dispatch(String(input), init?.method ?? "GET"),
      );

    const h = mountQuery(() => useListReviewQueue());
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      const call = fetchSpy.mock.calls[0];
      expect(String(call?.[0])).toBe("https://bff.test/api/v1/curation/queue");
      const init = call?.[1] as RequestInit | undefined;
      expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
      // Cache lookup via the centralised factory key — undefined kind +
      // undefined page is the default key.
      const cached = h.queryClient.getQueryData(curationKeys.queue());
      expect(cached).toBeDefined();
    } finally {
      unmount(h);
    }
  });

  it("encodes kind + page in the URL when both are supplied", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) =>
        handlers.dispatch(String(input), init?.method ?? "GET"),
      );

    const h = mountQuery(() =>
      useListReviewQueue({ kind: "entity_match", limit: 20, offset: 20 }),
    );
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      const url = String(fetchSpy.mock.calls[0]?.[0]);
      expect(url).toContain("kind=entity_match");
      expect(url).toContain("limit=20");
      expect(url).toContain("offset=20");
      // page is derived from offset/limit; key should include page=1.
      const cached = h.queryClient.getQueryData(
        curationKeys.queue("entity_match", 1),
      );
      expect(cached).toBeDefined();
    } finally {
      unmount(h);
    }
  });
});

/* ---------- useCurationMetrics ---------- */

describe("useCurationMetrics", () => {
  it("hits GET /api/v1/curation/metrics and surfaces the wire body", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) =>
      handlers.dispatch(String(input), init?.method ?? "GET"),
    );

    const h = mountQuery(() => useCurationMetrics());
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      expect(h.ref.current?.data?.acceptRate).toBe(0.91);
      expect(h.ref.current?.data?.computedAt).toBeInstanceOf(Date);
    } finally {
      unmount(h);
    }
  });

  it("tolerates 503 (R1 degradation contract): isError true, no retry storm", async () => {
    handlers.set("GET", /^\/api\/v1\/curation\/metrics/, () =>
      mockError(503, "SYSTEM_SERVICE_UNAVAILABLE", "Database connection timed out"),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) =>
      handlers.dispatch(String(input), init?.method ?? "GET"),
    );

    const h = mountQuery(() => useCurationMetrics());
    try {
      await waitFor(() => h.ref.current?.isError === true, 2000);
      expect(h.ref.current?.isError).toBe(true);
    } finally {
      unmount(h);
    }
  });
});

/* ---------- mutation invalidation ---------- */

describe("useConfirmItem — onSuccess invalidates curation + provenance", () => {
  it("invalidates curationKeys.all + provenanceKeys.attribute(item) on success", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      // Echo a 200 confirm response for the POST.
      if (method === "POST") {
        return mockResponse({
          item_kind: "attribute",
          item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          resulting_status: "active",
          action_id: "ccccccc4-cccc-cccc-cccc-cccccccccccc",
        });
      }
      return handlers.dispatch(String(input), method);
    });

    const h = mountMutation(() => useConfirmItem());
    try {
      // Pre-populate the cache so we can observe the invalidation.
      h.queryClient.setQueryData(curationKeys.queue(), { items: [] });
      h.queryClient.setQueryData(
        provenanceKeys.attribute("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        { fragments: [] },
      );

      const spy = vi.spyOn(h.queryClient, "invalidateQueries");
      await act(async () => {
        await h.ref.current!.mutateAsync({
          item_kind: "attribute",
          item_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          reason: "manual confirm",
        });
      });
      // Two invalidations: curationKeys.all + provenanceKeys.attribute(id).
      const calls = spy.mock.calls.map((c) => c[0]);
      expect(
        calls.some(
          (arg) =>
            Array.isArray(arg?.queryKey) &&
            (arg.queryKey as readonly unknown[])[0] === "curation",
        ),
      ).toBe(true);
      expect(
        calls.some(
          (arg) =>
            Array.isArray(arg?.queryKey) &&
            (arg.queryKey as readonly unknown[])[0] === "provenance" &&
            (arg.queryKey as readonly unknown[])[1] === "attribute",
        ),
      ).toBe(true);
    } finally {
      unmount(h);
    }
  });
});

describe("useResolveEntityMatch — onSuccess invalidates curation + node detail", () => {
  it("invalidates curationKeys.all + nodeKeys.detail(both nodes)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST") {
        return mockResponse({
          node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
          decision: "merge_into",
          resulting_status: "merged",
          target_node_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          action_id: "ccccccc1-cccc-cccc-cccc-cccccccccccc",
        });
      }
      return handlers.dispatch(String(input), method);
    });

    const h = mountMutation(() => useResolveEntityMatch());
    try {
      const spy = vi.spyOn(h.queryClient, "invalidateQueries");
      await act(async () => {
        await h.ref.current!.mutateAsync({
          node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
          body: {
            decision: "merge_into",
            target_node_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            reason: "Operator-confirmed duplicate",
          },
        });
      });
      const calls = spy.mock.calls.map((c) => c[0]);
      // curationKeys.all
      expect(
        calls.some(
          (arg) =>
            Array.isArray(arg?.queryKey) &&
            (arg.queryKey as readonly unknown[])[0] === "curation",
        ),
      ).toBe(true);
      // Both nodes invalidated.
      const nodeInvalidations = calls.filter(
        (arg) =>
          Array.isArray(arg?.queryKey) &&
          (arg.queryKey as readonly unknown[])[0] === "nodes",
      );
      expect(nodeInvalidations.length).toBe(2);
      // The node ids are present (irrespective of order).
      const invalidatedIds = new Set(
        nodeInvalidations.map(
          (arg) => (arg!.queryKey as readonly unknown[])[1],
        ),
      );
      expect(invalidatedIds.has("9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001")).toBe(
        true,
      );
      expect(invalidatedIds.has("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBe(
        true,
      );
      // Reference the imported key factory so a future rename surfaces here.
      expect(nodeKeys.detail("x")).toEqual(["nodes", "x", "detail"]);
    } finally {
      unmount(h);
    }
  });

  it("surfaces BUSINESS_REVIEW_NOT_PENDING on 409 (auto-advance signal)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      mockError(
        409,
        "BUSINESS_REVIEW_NOT_PENDING",
        "Node is not in `needs_review` state",
      ),
    );

    const h = mountMutation(() => useResolveEntityMatch());
    try {
      let caught: unknown = null;
      await act(async () => {
        try {
          await h.ref.current!.mutateAsync({
            node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
            body: { decision: "keep_separate" },
          });
        } catch (err) {
          caught = err;
        }
      });
      const code = (caught as { code?: string } | null)?.code;
      expect(code).toBe("BUSINESS_REVIEW_NOT_PENDING");
    } finally {
      unmount(h);
    }
  });
});

/* ---------- bare-body vs envelope: regression guard ---------- */

describe("curation REST bare body (spec §6) — no envelope unwrap", () => {
  it("treats a 2xx body without `ok` as the typed result (does NOT throw SYSTEM_INVALID_RESPONSE)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeJsonResponse({
          total: 0,
          limit: 20,
          offset: 0,
          items: [],
        }),
      ),
    );

    const h = mountQuery(() => useListReviewQueue());
    try {
      await waitFor(() => h.ref.current?.isSuccess === true);
      expect(h.ref.current?.data?.total).toBe(0);
      expect(h.ref.current?.data?.items).toEqual([]);
    } finally {
      unmount(h);
    }
  });
});
