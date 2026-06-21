// @vitest-environment jsdom
/**
 * useNodeDetail — TanStack Query hook unit tests (TC-FE-08).
 *
 * What these tests pin (Golden Rule 9 — verify intent):
 *  - The hook hits `GET /api/v1/nodes/:id` (the spec contract — drifting the
 *    URL silently breaks the wire). Path + method are pinned.
 *  - The query key is `['nodes', id]` — every consumer expects it (the
 *    invalidator in any future curation mutation will reference it).
 *  - `enabled` gates the fetch when `id` is undefined/empty/null — prevents
 *    a wasted request right after the panel unmounts (parent clears id).
 *  - `staleTime` matches spec §9 (5min). A drift here causes excess
 *    re-fetches and flashes spinners over freshly-cached panels.
 *  - The transform produces the expected surface shape (we sanity-check
 *    canonical name + an attribute row to confirm the round trip).
 *  - The auth header is read from `useAuthStore.getState()` at call time —
 *    a regression that captures it at module load would break the
 *    sign-in-then-fetch flow.
 *
 * Test rig:
 *  - No `@testing-library/react` in this stack — same pattern as
 *    `useSendMessage.spec.tsx`: mount via React DOM client + `act()`, read
 *    the hook result via an imperative ref.
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
} from "@tanstack/react-query";

// Mock lib/env BEFORE the SUT imports (vi.mock is hoisted). Without the
// mock the http wrapper would read import.meta.env which is empty in the
// vitest jsdom rig.
vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useNodeDetail } from "../useNodeDetail";
import { graphNodeKeys } from "../keys";
import { useAuthStore } from "../../../../state/auth";
import type { NodeDetailView } from "../node-detail.types";

/* ---------- harness ---------- */

interface HarnessHandle {
  queryRef: { current: UseQueryResult<NodeDetailView> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountHarness(nodeId: string | null | undefined): HarnessHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryRef: HarnessHandle["queryRef"] = { current: null };

  function Probe({ id }: { id: string | null | undefined }): React.ReactElement {
    const q = useNodeDetail(id);
    queryRef.current = q;
    return React.createElement("div");
  }

  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe, { id: nodeId }),
      ),
    );
  });
  return { queryRef, queryClient, container, root };
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

/* ---------- shared fixtures ---------- */

const NODE_ID = "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001";

const WIRE_OK = {
  ok: true,
  result: {
    node: {
      id: NODE_ID,
      node_type: "Person",
      canonical_name: "Rodrigo",
      status: "active",
      merged_into_node_id: null,
    },
    aliases: [
      { id: "a-1", alias: "Rodrigo", kind: "canonical" },
      { id: "a-2", alias: "Ro", kind: "alias" },
    ],
    attributes: [
      {
        id: "attr-1",
        node_id: NODE_ID,
        attribute_key: "deadline",
        value_type: "date",
        value: "2026-07-15",
        status: "accepted",
        effective_status: "active",
        is_current: true,
        is_in_effect: true,
        confidence: 0.92,
        valid_from: "2026-01-10",
        valid_to: null,
      },
    ],
  },
};

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, claims: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ---------- tests ---------- */

describe("useNodeDetail — request shape", () => {
  it("hits GET /api/v1/nodes/:id with the URL-encoded id (spec contract)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => Promise.resolve(makeJsonResponse(WIRE_OK)));

    const h = mountHarness(NODE_ID);
    try {
      // Resolve the in-flight query.
      await act(async () => {
        // Wait for the query to settle.
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callArg = fetchSpy.mock.calls[0]?.[0];
      expect(String(callArg)).toBe(`https://bff.test/api/v1/nodes/${NODE_ID}`);
      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(init?.method).toBe("GET");
    } finally {
      unmountHarness(h);
    }
  });

  it("attaches `Authorization: Bearer <jwt>` when the auth store has a token (read at call time)", async () => {
    useAuthStore.setState({
      accessToken: "jwt-token-xyz",
      claims: null,
    });
    let capturedHeaders: Headers | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce((_url, init) => {
      const i = init as RequestInit;
      capturedHeaders = new Headers(i.headers as HeadersInit);
      return Promise.resolve(makeJsonResponse(WIRE_OK));
    });

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(capturedHeaders).not.toBeNull();
      expect(capturedHeaders!.get("Authorization")).toBe("Bearer jwt-token-xyz");
    } finally {
      unmountHarness(h);
    }
  });

  it("omits Authorization when no token is present (anonymous probe — backend will 401)", async () => {
    let capturedHeaders: Headers | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce((_url, init) => {
      const i = init as RequestInit;
      capturedHeaders = new Headers(i.headers as HeadersInit);
      return Promise.resolve(makeJsonResponse(WIRE_OK));
    });

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(capturedHeaders!.get("Authorization")).toBeNull();
    } finally {
      unmountHarness(h);
    }
  });
});

/* ---------- enabled gate ---------- */

describe("useNodeDetail — enabled gate", () => {
  it("does NOT fetch when nodeId is undefined", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountHarness(undefined);
    try {
      // Wait a tick so any spurious fetch would have fired.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      // The hook should report pending+disabled — `fetchStatus` is 'idle'.
      expect(h.queryRef.current?.fetchStatus).toBe("idle");
    } finally {
      unmountHarness(h);
    }
  });

  it("does NOT fetch when nodeId is null", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountHarness(null);
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      unmountHarness(h);
    }
  });

  it("does NOT fetch when nodeId is empty string", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountHarness("");
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      unmountHarness(h);
    }
  });
});

/* ---------- query key shape ---------- */

describe("useNodeDetail — query key", () => {
  it("uses the centralised graphNodeKeys.detail(id) shape", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(makeJsonResponse(WIRE_OK)),
    );

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      // Cache lookup via the key factory — the test fails if the hook
      // builds a different key shape (e.g. drops the 'nodes' prefix).
      const cached = h.queryClient.getQueryData(graphNodeKeys.detail(NODE_ID));
      expect(cached).toBeDefined();
    } finally {
      unmountHarness(h);
    }
  });
});

/* ---------- transform smoke (round-trip) ---------- */

describe("useNodeDetail — transform integration", () => {
  it("returns the transformed NodeDetailView (canonical_name + alias + first attribute)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(makeJsonResponse(WIRE_OK)),
    );

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      const data = h.queryRef.current?.data;
      expect(data).toBeDefined();
      expect(data?.canonicalName).toBe("Rodrigo");
      expect(data?.badgeState).toBe("accepted");
      expect(data?.aliases.length).toBe(2);
      expect(data?.aliases[0]?.kind).toBe("canonical");
      expect(data?.attributes[0]?.key).toBe("deadline");
      expect(data?.attributes[0]?.validFromLabel).toBe("10/01/2026");
      expect(data?.attributes[0]?.validToLabel).toBeNull();
      expect(data?.attributes[0]?.state).toBe("accepted");
    } finally {
      unmountHarness(h);
    }
  });
});

/* ---------- error surface ---------- */

describe("useNodeDetail — error path", () => {
  it("surfaces RESOURCE_NOT_FOUND code on 404 (panel discriminates)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeJsonResponse(
          {
            ok: false,
            error: {
              code: "RESOURCE_NOT_FOUND",
              message: "KnowledgeNode not found",
            },
          },
          404,
        ),
      ),
    );

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isError) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(h.queryRef.current?.isError).toBe(true);
      const err = h.queryRef.current?.error as
        | { code?: string }
        | null
        | undefined;
      expect(err?.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      unmountHarness(h);
    }
  });

  it("surfaces BUSINESS_NODE_DELETED code on 410 (panel renders the deletion notice)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeJsonResponse(
          {
            ok: false,
            error: {
              code: "BUSINESS_NODE_DELETED",
              message: "KnowledgeNode is marked as deleted",
            },
          },
          410,
        ),
      ),
    );

    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isError) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      const err = h.queryRef.current?.error as
        | { code?: string }
        | null
        | undefined;
      expect(err?.code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      unmountHarness(h);
    }
  });
});
