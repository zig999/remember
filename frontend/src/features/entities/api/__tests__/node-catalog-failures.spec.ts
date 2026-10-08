import { afterEach, describe, expect, it, vi } from "vitest";
import type { UseQueryResult } from "@tanstack/react-query";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useAttributeKeys } from "../catalog.hooks";
import { useNodeRead } from "../node.hooks";
import {
  answers,
  compareFailures,
  failsWith,
  jsonResponse,
  textResponse,
  unmountAll,
  type Responder,
} from "./support";

interface FailureCase {
  readonly name: string;
  readonly path: string;
  readonly useRead: () => UseQueryResult<unknown>;
  readonly responder: Responder;
}

const CASES: FailureCase[] = [
  {
    name: "the node read refused as deleted at 410",
    path: "/api/v1/nodes/n-1",
    useRead: () => useNodeRead("n-1"),
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
        410,
      ),
    ),
  },
  {
    name: "the attribute-key read refused with a readable code at 422",
    path: "/api/v1/attribute-keys?node_type=Nada",
    useRead: () => useAttributeKeys("Nada"),
    responder: answers(() =>
      jsonResponse(
        {
          ok: false,
          error: {
            code: "BUSINESS_UNKNOWN_NODE_TYPE",
            message: "Unknown node type",
            details: { node_type: "Nada" },
          },
        },
        422,
      ),
    ),
  },
  {
    name: "the node read refused with a readable code at 500",
    path: "/api/v1/nodes/n-1",
    useRead: () => useNodeRead("n-1"),
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
    name: "the attribute-key read answered below 500 with a body that is not JSON",
    path: "/api/v1/attribute-keys?node_type=Project",
    useRead: () => useAttributeKeys("Project"),
    responder: answers(() => textResponse("Not Found", 404)),
  },
  {
    name: "the node read that gets no answer",
    path: "/api/v1/nodes/n-1",
    useRead: () => useNodeRead("n-1"),
    responder: failsWith(new TypeError("Failed to fetch")),
  },
];

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("failed read", () => {
  it.each(CASES)(
    "fails with the status, code, message and details the http function gives for $name",
    async ({ path, responder, useRead }) => {
      const { viaRead, viaHttp } = await compareFailures(
        path,
        responder,
        useRead,
      );
      expect(viaRead).toEqual(viaHttp);
    },
  );
});
