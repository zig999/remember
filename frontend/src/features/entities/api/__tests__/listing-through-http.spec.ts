import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

vi.mock("../../../../lib/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../lib/http")>();
  return { ...actual, http: vi.fn(actual.http) };
});

import { http } from "../../../../lib/http";
import { useNodeListing, useNodeTypes } from "../listing.hooks";
import {
  answers,
  jsonResponse,
  mountQuery,
  settled,
  stubFetch,
  unmountAll,
} from "./support";

beforeEach(() => {
  vi.mocked(http).mockClear();
});

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("read", () => {
  it.each([
    {
      name: "the node types read",
      path: "/api/v1/node-types",
      useRead: () => useNodeTypes(),
      wire: { total: 0, items: [] },
    },
    {
      name: "the node listing read",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      wire: { total: 0, limit: 20, offset: 0, items: [] },
    },
  ])("is made through the http function and uses no other fetch for $name", async ({ path, useRead, wire }) => {
    const requests = stubFetch(
      answers(() => jsonResponse({ ok: true, result: wire })),
    );
    await settled(mountQuery(useRead));
    expect({
      httpPaths: vi.mocked(http).mock.calls.map(([target]) => target),
      fetchedPaths: requests.map((request) => request.url.pathname),
    }).toEqual({ httpPaths: [path], fetchedPaths: [path] });
  });
});
