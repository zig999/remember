import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useAuthStore } from "../../../../state/auth";
import { useNodeListing, useNodeTypes } from "../listing.hooks";
import type { NodeListingNarrowing } from "../../types";
import {
  answers,
  jsonResponse,
  mountQuery,
  settled,
  stubFetch,
  unmountAll,
} from "./support";

const NODE_TYPES_WIRE = {
  total: 2,
  items: [
    { id: "t-1", name: "Project", description: "Um projeto", version: 3 },
    { id: "t-2", name: "Person", description: "Uma pessoa", version: 1 },
  ],
};

const ACTIVE_NODE_WIRE = {
  id: "n-1",
  node_type: "Project",
  canonical_name: "Projeto Apollo",
  status: "active",
  merged_into_node_id: null,
};

const MERGED_NODE_WIRE = {
  id: "n-2",
  node_type: "Person",
  canonical_name: "Maria Oliveira",
  status: "merged",
  merged_into_node_id: "n-1",
};

const LISTING_WIRE = {
  total: 57,
  limit: 20,
  offset: 0,
  items: [ACTIVE_NODE_WIRE, MERGED_NODE_WIRE],
};

function accepted(result: unknown) {
  return answers(() => jsonResponse({ ok: true, result }));
}

function itemsOf(data: unknown): readonly object[] {
  if (Array.isArray(data)) return data as readonly object[];
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items: unknown }).items;
    if (Array.isArray(items)) return items as readonly object[];
  }
  throw new Error("the read returned no list of items");
}

async function parametersSentFor(
  narrowing: NodeListingNarrowing,
): Promise<ReadonlyArray<readonly [string, string]>> {
  const requests = stubFetch(accepted(LISTING_WIRE));
  const mounted = mountQuery(() => useNodeListing(narrowing));
  await settled(mounted);
  unmountAll();
  if (requests.length !== 1) {
    throw new Error(`expected one request, saw ${String(requests.length)}`);
  }
  const sent = requests[0];
  if (sent === undefined) throw new Error("no request was sent");
  return [...sent.url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
}

beforeEach(() => {
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("node types read", () => {
  it("requests the node types as GET /api/v1/node-types with no parameter", async () => {
    const requests = stubFetch(accepted(NODE_TYPES_WIRE));
    await settled(mountQuery(() => useNodeTypes()));
    expect(
      requests.map(({ method, url }) => ({
        method,
        pathname: url.pathname,
        search: url.search,
      })),
    ).toEqual([{ method: "GET", pathname: "/api/v1/node-types", search: "" }]);
  });

  it("returns each node type with its identity, name, description and version", async () => {
    stubFetch(accepted(NODE_TYPES_WIRE));
    const state = await settled(mountQuery(() => useNodeTypes()));
    expect(itemsOf(state.data).map((item) => Object.values(item))).toEqual(
      NODE_TYPES_WIRE.items.map((wire) =>
        expect.arrayContaining(Object.values(wire)),
      ),
    );
  });
});

describe("node listing read", () => {
  it("requests the nodes as GET /api/v1/nodes", async () => {
    const requests = stubFetch(accepted(LISTING_WIRE));
    await settled(mountQuery(() => useNodeListing({})));
    expect(
      requests.map(({ method, url }) => ({ method, pathname: url.pathname })),
    ).toEqual([{ method: "GET", pathname: "/api/v1/nodes" }]);
  });

  it("returns each node with its identity, node-type name, canonical name, status and merge target or null", async () => {
    stubFetch(accepted(LISTING_WIRE));
    const state = await settled(mountQuery(() => useNodeListing({})));
    expect(itemsOf(state.data).map((item) => Object.values(item))).toEqual(
      LISTING_WIRE.items.map((wire) =>
        expect.arrayContaining(Object.values(wire)),
      ),
    );
  });

  it("reads an entry's merged_into_node_id member as the identity the listed node was merged into", async () => {
    stubFetch(accepted({ ...LISTING_WIRE, items: [MERGED_NODE_WIRE] }));
    const state = await settled(mountQuery(() => useNodeListing({})));
    expect(itemsOf(state.data)).toMatchObject([
      { id: "n-2", mergedInto: "n-1" },
    ]);
  });

  it("reads an entry whose merged_into_node_id member is null as a node merged into none", async () => {
    stubFetch(accepted({ ...LISTING_WIRE, items: [ACTIVE_NODE_WIRE] }));
    const state = await settled(mountQuery(() => useNodeListing({})));
    expect(itemsOf(state.data)).toMatchObject([
      { id: "n-1", mergedInto: null },
    ]);
  });

  it("returns the total the knowledge base reports, not the size of the page", async () => {
    stubFetch(accepted(LISTING_WIRE));
    const state = await settled(mountQuery(() => useNodeListing({})));
    expect((state.data as { total: unknown }).total).toBe(57);
  });

  it("carries each narrowing given under its parameter and leaves out each not given", async () => {
    const sent = {
      both: await parametersSentFor({
        namePrefix: "Ação & Co",
        nodeType: "Project",
      }),
      prefixOnly: await parametersSentFor({ namePrefix: "Apo" }),
      typeOnly: await parametersSentFor({ nodeType: "Project" }),
      neither: await parametersSentFor({}),
    };
    expect(sent).toEqual({
      both: [
        ["name_prefix", "Ação & Co"],
        ["node_type", "Project"],
      ],
      prefixOnly: [["name_prefix", "Apo"]],
      typeOnly: [["node_type", "Project"]],
      neither: [],
    });
  });

  it("treats an empty name prefix or an empty node type as a narrowing not given", async () => {
    const sent = {
      emptyPrefix: await parametersSentFor({
        namePrefix: "",
        nodeType: "Project",
      }),
      emptyType: await parametersSentFor({ namePrefix: "Apo", nodeType: "" }),
    };
    expect(sent).toEqual({
      emptyPrefix: [["node_type", "Project"]],
      emptyType: [["name_prefix", "Apo"]],
    });
  });
});

describe("owner's token", () => {
  it.each([
    {
      name: "the node types read",
      useRead: () => useNodeTypes(),
      wire: NODE_TYPES_WIRE,
    },
    {
      name: "the node listing read",
      useRead: () => useNodeListing({}),
      wire: LISTING_WIRE,
    },
  ])("is sent as Bearer <token> in the Authorization header by $name", async ({ useRead, wire }) => {
    useAuthStore.getState().setToken("access.token.1");
    const requests = stubFetch(accepted(wire));
    await settled(mountQuery(useRead));
    expect(requests.map((request) => request.authorization)).toEqual([
      "Bearer access.token.1",
    ]);
  });
});
