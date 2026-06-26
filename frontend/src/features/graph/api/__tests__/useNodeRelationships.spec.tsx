// @vitest-environment jsdom
/**
 * useNodeRelationships — TanStack Query hook unit tests (dev_tc_001 Phase B).
 *
 * Pins:
 *  - URL = GET /api/v1/nodes/:id/traverse?depth=1&direction=both (spec §9).
 *  - Query key = graphNodeKeys.relationships(id) — invalidator hook depends.
 *  - Enabled gate skips fetch on null/undefined/empty id.
 *  - Auth header read at call time (no module-load capture).
 *  - Transform produces the expected surface shape.
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

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useNodeRelationships } from "../useNodeRelationships";
import { graphNodeKeys } from "../keys";
import { useAuthStore } from "../../../../state/auth";
import type { TraversalResultView } from "../traversal.types";

interface HarnessHandle {
  queryRef: { current: UseQueryResult<TraversalResultView> | null };
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
    const q = useNodeRelationships(id);
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

const NODE_ID = "node-A";

const WIRE_OK = {
  ok: true,
  result: {
    starting_node_id: NODE_ID,
    nodes: [
      {
        id: NODE_ID,
        node_type: "Person",
        canonical_name: "Rodrigo",
        status: "active",
      },
      {
        id: "node-B",
        node_type: "Project",
        canonical_name: "Apollo",
        status: "active",
      },
    ],
    links: [
      {
        id: "L1",
        source_node_id: NODE_ID,
        target_node_id: "node-B",
        link_type: "participates_in",
        link_inverse_name: "has_participant",
        status: "active",
        effective_status: "active",
        is_current: true,
        is_in_effect: true,
        confidence: 0.92,
        valid_from: null,
        valid_to: null,
        hop: 1,
        score: 0.5,
        provenance: [],
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

describe("useNodeRelationships — request shape", () => {
  it("hits GET /api/v1/nodes/:id/traverse?depth=1&direction=both", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => Promise.resolve(makeJsonResponse(WIRE_OK)));
    const h = mountHarness(NODE_ID);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callArg = fetchSpy.mock.calls[0]?.[0];
      expect(String(callArg)).toBe(
        `https://bff.test/api/v1/nodes/${NODE_ID}/traverse?depth=1&direction=both`,
      );
      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(init?.method).toBe("GET");
    } finally {
      unmountHarness(h);
    }
  });

  it("transforms the wire payload into the camelCase surface shape", async () => {
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
      expect(data?.startingNodeId).toBe(NODE_ID);
      expect(data?.links).toHaveLength(1);
      expect(data?.links[0]!.direction).toBe("outgoing");
      expect(data?.links[0]!.directionArrow).toBe("→");
      expect(data?.links[0]!.neighborName).toBe("Apollo");
    } finally {
      unmountHarness(h);
    }
  });

  it("attaches Authorization header read from the auth store at call time", async () => {
    useAuthStore.setState({
      accessToken: "jwt-xyz",
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
      expect(capturedHeaders!.get("Authorization")).toBe("Bearer jwt-xyz");
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useNodeRelationships — enabled gate", () => {
  it("does NOT fetch when nodeId is undefined / null / empty", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const id of [undefined, null, ""] as const) {
      const h = mountHarness(id);
      try {
        await act(async () => {
          await new Promise((r) => setTimeout(r, 5));
        });
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        unmountHarness(h);
      }
    }
  });
});

describe("useNodeRelationships — query key", () => {
  it("uses graphNodeKeys.relationships(id)", async () => {
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
      const cached = h.queryClient.getQueryData(
        graphNodeKeys.relationships(NODE_ID),
      );
      expect(cached).toBeDefined();
    } finally {
      unmountHarness(h);
    }
  });
});
