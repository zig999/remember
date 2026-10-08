import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useNodeListing, useNodeTypes } from "../listing.hooks";
import {
  answers,
  compareFailures,
  failsWith,
  jsonResponse,
  textResponse,
  unmountAll,
} from "./support";

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("failed read", () => {
  it.each([
    {
      name: "the node listing refused with a readable code at 422",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      responder: answers(() =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "VALIDATION_INVALID_FORMAT",
              message: "Request payload failed validation.",
              details: { fields: [{ path: "name_prefix", message: "too long" }] },
            },
          },
          422,
        ),
      ),
    },
    {
      name: "the node types refused with a readable code at 422",
      path: "/api/v1/node-types",
      useRead: () => useNodeTypes(),
      responder: answers(() =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "VALIDATION_INVALID_FORMAT",
              message: "Request payload failed validation.",
              details: { fields: [{ path: "limit", message: "unknown" }] },
            },
          },
          422,
        ),
      ),
    },
    {
      name: "the node listing refused with a readable code at 500",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      responder: answers(() =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "SYSTEM_INTERNAL_ERROR",
              message: "Internal server error.",
              details: { cause: "trace-1" },
            },
          },
          500,
        ),
      ),
    },
    {
      name: "the node listing answered below 500 with a body that is not JSON",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      responder: answers(() => textResponse("Not Found", 404)),
    },
    {
      name: "the node listing answered 200 with ok false and a readable code",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      responder: answers(() =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "BUSINESS_NODE_DELETED",
              message: "KnowledgeNode is marked as deleted",
              details: { node_id: "n-1" },
            },
          },
          200,
        ),
      ),
    },
    {
      name: "the node listing that gets no answer",
      path: "/api/v1/nodes",
      useRead: () => useNodeListing({}),
      responder: failsWith(new TypeError("Failed to fetch")),
    },
  ])("fails with the status, code, message and details the http function gives for $name", async ({ path, responder, useRead }) => {
    const { viaRead, viaHttp } = await compareFailures(path, responder, useRead);
    expect(viaRead).toEqual(viaHttp);
  });
});
