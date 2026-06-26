// @vitest-environment jsdom
/**
 * useProvenance — TanStack Query hook unit tests (dev_tc_001 Phase C).
 *
 * Pins:
 *  - URL = GET /api/v1/provenance/{kind}/:id where kind ∈ {links, attributes,
 *    fragments} (spec §9).
 *  - Query key = graphNodeKeys.provenance(kind, id).
 *  - Lazy gate — fetch only fires when `enabled === true`. Critical: a
 *    regression that pre-fetches on mount defeats the purpose of the lazy
 *    "Ver origem completa" disclosure (spec §1 Phase C).
 *  - Transform produces the camelCase ProvenanceResponseView.
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

import { useProvenance } from "../useProvenance";
import { graphNodeKeys } from "../keys";
import { useAuthStore } from "../../../../state/auth";
import type { ProvenanceKind, ProvenanceResponseView } from "../provenance.types";

interface HarnessHandle {
  queryRef: { current: UseQueryResult<ProvenanceResponseView> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountHarness(
  kind: ProvenanceKind,
  id: string,
  enabled: boolean,
): HarnessHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryRef: HarnessHandle["queryRef"] = { current: null };

  function Probe(): React.ReactElement {
    const q = useProvenance(kind, id, enabled);
    queryRef.current = q;
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

const WIRE_OK = {
  ok: true,
  result: {
    fragments: [
      {
        id: "frag-1",
        text: "Texto do fragmento.",
        confidence: 0.91,
        status: "accepted",
        chunks: [
          {
            id: "chunk-1",
            chunk_index: 0,
            offset_start: 0,
            offset_end: 100,
            excerpt: "...trecho...",
            locator: {},
            raw_information: {
              id: "raw-1",
              source_type: "ata",
              received_at: "2026-06-11T18:30:00Z",
              metadata: { title: "Ata 1" },
            },
          },
        ],
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

describe("useProvenance — lazy gate (the contract that justifies Phase C)", () => {
  it("does NOT fetch when enabled=false (disclosure closed)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountHarness("links", "link-1", false);
    try {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(h.queryRef.current?.fetchStatus).toBe("idle");
    } finally {
      unmountHarness(h);
    }
  });

  it("fires the fetch only after enabled flips to true", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(makeJsonResponse(WIRE_OK)),
    );
    const h = mountHarness("links", "link-1", true);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      expect(h.queryRef.current?.data?.fragments).toHaveLength(1);
    } finally {
      unmountHarness(h);
    }
  });

  it("does NOT fetch when id is empty even if enabled is true", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const h = mountHarness("links", "", true);
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

describe("useProvenance — URL shape per kind", () => {
  for (const kind of ["links", "attributes", "fragments"] as const) {
    it(`hits GET /api/v1/provenance/${kind}/:id`, async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementationOnce(() =>
          Promise.resolve(makeJsonResponse(WIRE_OK)),
        );
      const h = mountHarness(kind, "id-1", true);
      try {
        await act(async () => {
          for (let i = 0; i < 20; i += 1) {
            if (h.queryRef.current?.isSuccess) break;
            await new Promise((r) => setTimeout(r, 5));
          }
        });
        const callArg = String(fetchSpy.mock.calls[0]?.[0]);
        expect(callArg).toBe(`https://bff.test/api/v1/provenance/${kind}/id-1`);
      } finally {
        unmountHarness(h);
      }
    });
  }
});

describe("useProvenance — query key + transform", () => {
  it("uses graphNodeKeys.provenance(kind, id)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(makeJsonResponse(WIRE_OK)),
    );
    const h = mountHarness("links", "link-1", true);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      const cached = h.queryClient.getQueryData(
        graphNodeKeys.provenance("links", "link-1"),
      );
      expect(cached).toBeDefined();
    } finally {
      unmountHarness(h);
    }
  });

  it("transforms the wire payload into the surface shape", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(makeJsonResponse(WIRE_OK)),
    );
    const h = mountHarness("attributes", "attr-1", true);
    try {
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          if (h.queryRef.current?.isSuccess) break;
          await new Promise((r) => setTimeout(r, 5));
        }
      });
      const data = h.queryRef.current?.data;
      expect(data?.fragments[0]!.id).toBe("frag-1");
      expect(data?.fragments[0]!.chunks[0]!.offsetRangeLabel).toBe(
        "chars 0–100",
      );
      expect(data?.fragments[0]!.chunks[0]!.rawInformation.title).toBe("Ata 1");
    } finally {
      unmountHarness(h);
    }
  });
});
