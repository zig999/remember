// Unit tests for the MCP `query` toolset + the `POST /api/v1/mcp/query`
// transport.
//
// Acceptance criteria addressed (TC-02 validation.criteria):
//   (a) tools/list returns all 9 names with non-empty inputSchema JSON.
//   (b) tools/call get_node success path returns { ok: true, result: <node> }.
//   (c) tools/call with unknown tool name returns { ok: false, error: { code: ... } }.
//   (d) tools/call with invalid Zod input returns VALIDATION_INVALID_FORMAT.
// Plus the BR-23 rule 5 closed-whitelist guard (proposes are unreachable),
// the BR-25 JSON-Schema-from-Zod pinning, and a generic error-mapping path.
//
// Strategy: stub the nine service functions via `vi.mock` so the test never
// touches pg. The fake pool only needs to honour `BEGIN READ ONLY` / ROLLBACK
// — every meaningful read is intercepted at the service layer.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import { buildSnapshot, type CatalogSnapshot } from "../catalog/catalog.js";
import {
  NodeDeletedError,
  ResourceNotFoundError,
} from "../service/errors.js";
import {
  QUERY_TOOL_NAMES,
  QueryToolInputJsonSchemas,
  registerQueryToolset,
} from "./query-toolset.js";
import { registerQueryMcpTransport } from "./query-transport.js";

// ---------------------------------------------------------------------------
// vi.mock — stub every service function the toolset wraps. Each mock is set
// per-test via `mockedX.mockResolvedValueOnce(...)` or `.mockRejectedValueOnce`.
// ---------------------------------------------------------------------------

vi.mock("../service/node.service.js", () => ({
  getNodeByIdService: vi.fn(),
  listNodesService: vi.fn(),
}));
vi.mock("../service/catalog.service.js", () => ({
  listNodeTypesService: vi.fn(),
  listLinkTypesService: vi.fn(),
  listAttributeKeysService: vi.fn(),
}));
vi.mock("../service/history.service.js", () => ({
  getLinkHistoryService: vi.fn(),
  getAttributeHistoryService: vi.fn(),
  getAttributeKeyHistoryService: vi.fn(),
}));
vi.mock("../service/traversal.service.js", () => ({
  traverseNodeService: vi.fn(),
}));

import {
  getNodeByIdService,
  listNodesService,
} from "../service/node.service.js";
import {
  listAttributeKeysService,
  listLinkTypesService,
  listNodeTypesService,
} from "../service/catalog.service.js";
import {
  getAttributeHistoryService,
  getAttributeKeyHistoryService,
  getLinkHistoryService,
} from "../service/history.service.js";
import { traverseNodeService } from "../service/traversal.service.js";

const mockedGetNode = vi.mocked(getNodeByIdService);
const mockedListNodes = vi.mocked(listNodesService);
const mockedListNodeTypes = vi.mocked(listNodeTypesService);
const mockedListLinkTypes = vi.mocked(listLinkTypesService);
const mockedListAttributeKeys = vi.mocked(listAttributeKeysService);
const mockedGetLinkHistory = vi.mocked(getLinkHistoryService);
const mockedGetAttributeHistory = vi.mocked(getAttributeHistoryService);
const mockedGetAttributeKeyHistory = vi.mocked(getAttributeKeyHistoryService);
const mockedTraverse = vi.mocked(traverseNodeService);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const silentLogger = pino({ level: "silent" });

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Person",
        description: null,
        version: 1,
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "Project",
        description: null,
        version: 1,
      },
    ],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/** Minimal pg.Pool fake: every read services are mocked, so the client only
 *  needs to honour `BEGIN READ ONLY` / `ROLLBACK`. */
function buildFakePool(): import("pg").Pool {
  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim().toUpperCase();
      if (
        sql === "BEGIN READ ONLY" ||
        sql === "BEGIN" ||
        sql === "COMMIT" ||
        sql === "ROLLBACK"
      ) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
  return {
    connect: async () => client,
  } as unknown as import("pg").Pool;
}

/** Build a fresh `McpServer`, register the toolset on it, mount the transport
 *  on a bare Fastify scope (no auth — the auth path is covered upstream by
 *  the parent scope in `app.ts`). */
async function buildTransportApp() {
  const mcp = buildMcpServer(silentLogger);
  const catalog = buildCatalog();
  const pool = buildFakePool();
  registerQueryToolset({ mcp, pool, logger: silentLogger, catalog });

  const app = Fastify({ logger: false });
  await registerQueryMcpTransport(app, { pool, logger: silentLogger, mcp });
  return { app, mcp };
}

const NODE_ID = "11111111-1111-4111-8111-111111111111";
const LINK_ID = "22222222-2222-4222-8222-222222222222";
const ATTR_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// (a) tools/list — BR-25: nine names + non-empty JSON Schemas.
// ---------------------------------------------------------------------------

describe("MCP query transport — tools/list (BR-25)", () => {
  it("returns all nine tool names with non-empty inputSchema", async () => {
    // Acceptance (a) — every name from the closed enumeration is present and
    // every entry carries a JSON Schema object derived from the Zod source.
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { tools: Array<{ name: string; inputSchema: unknown }> };
      };
      const names = body.result.tools.map((t) => t.name).sort();
      expect(names).toEqual([...QUERY_TOOL_NAMES].sort());
      for (const tool of body.result.tools) {
        expect(tool.inputSchema).toBeTypeOf("object");
        expect(tool.inputSchema).not.toBeNull();
        // JSON-Schema-2020-12 derivations always carry `type` or `$ref`.
        const schema = tool.inputSchema as Record<string, unknown>;
        expect(
          schema.type !== undefined || schema.$ref !== undefined
        ).toBe(true);
      }
    } finally {
      await app.close();
    }
  });

  it("pins the same JSON Schema object exposed by the toolset module", () => {
    // BR-25 single-source guarantee: a downstream consumer importing
    // QueryToolInputJsonSchemas observes the same objects the transport
    // serves over tools/list.
    expect(Object.keys(QueryToolInputJsonSchemas).sort()).toEqual(
      [...QUERY_TOOL_NAMES].sort()
    );
    for (const name of QUERY_TOOL_NAMES) {
      const schema = QueryToolInputJsonSchemas[name] as Record<string, unknown>;
      expect(schema).toBeTypeOf("object");
      expect(schema).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) tools/call get_node — success path wraps service return value verbatim.
// ---------------------------------------------------------------------------

describe("MCP query transport — tools/call success (BR-23)", () => {
  it("get_node returns { ok: true, result: <node payload> } verbatim", async () => {
    // Acceptance (b) — the toolset's handler wraps the service result in the
    // canonical MCP envelope and never re-shapes the payload.
    const payload = {
      id: NODE_ID,
      node_type: "Person",
      canonical_name: "Alice",
      status: "active",
      aliases: [],
      attributes: [],
    };
    mockedGetNode.mockResolvedValueOnce(payload as never);

    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_node", arguments: { node_id: NODE_ID } },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result: { ok: boolean; result: unknown } };
      expect(body.result).toEqual({ ok: true, result: payload });

      // The service was called with the flattened input shape — the toolset
      // is the only place that maps MCP→service argument names.
      expect(mockedGetNode).toHaveBeenCalledTimes(1);
      const args = mockedGetNode.mock.calls[0]!;
      expect(args[1]).toMatchObject({
        nodeId: NODE_ID,
        inEffectOnly: false,
        includeUncertain: true,
      });
    } finally {
      await app.close();
    }
  });

  it("accepts the fully-qualified `query.get_node` form too", async () => {
    // Convenience: MCP clients can call either bare or qualified.
    mockedGetNode.mockResolvedValueOnce({ id: NODE_ID } as never);

    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "query.get_node",
            arguments: { node_id: NODE_ID },
          },
        },
      });
      const body = res.json() as { result: { ok: boolean } };
      expect(body.result.ok).toBe(true);
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (c) tools/call unknown tool name — closed enumeration whitelist.
// ---------------------------------------------------------------------------

describe("MCP query transport — closed whitelist (BR-23 rule 5)", () => {
  it("returns NOT_FOUND for an unknown tool name", async () => {
    // Acceptance (c) — unknown names never reach a handler.
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "totally_made_up_tool", arguments: {} },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("rejects ingest-side tool names even if registered on the same McpServer", async () => {
    // BR-23 rule 5: the query transport must refuse `propose_*` even if a
    // future bug accidentally registers one under the `query` toolset key.
    // We simulate that scenario by registering an `propose_node` tool on
    // the SAME McpServer instance and asserting the transport still refuses
    // to dispatch it.
    const { app, mcp } = await buildTransportApp();
    try {
      // Register a rogue tool — this would never happen in production but
      // proves the whitelist is the only gate that matters.
      const { z } = await import("zod");
      mcp.registerTool("query", {
        name: "propose_node",
        description: "rogue tool",
        inputSchema: z.object({}),
        handler: async () => ({ ok: true, result: "should not be reached" }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "propose_node", arguments: {} },
        },
      });
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (d) tools/call invalid Zod input — VALIDATION_INVALID_FORMAT envelope.
// ---------------------------------------------------------------------------

describe("MCP query transport — input validation (BR-24)", () => {
  it("returns VALIDATION_INVALID_FORMAT when input fails Zod parsing", async () => {
    // Acceptance (d) — bad input is mapped to the canonical Zod envelope via
    // the shared error mapper from TC-01.
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "get_node",
            // `node_id` must be a UUID — pass garbage to trip the Zod schema.
            arguments: { node_id: "not-a-uuid" },
          },
        },
      });
      const body = res.json() as {
        result: {
          ok: boolean;
          error: { code: string; message: string; details: unknown };
        };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("VALIDATION_INVALID_FORMAT");
      expect(Array.isArray(body.result.error.details)).toBe(true);
      // The service must NEVER be invoked when input validation fails.
      expect(mockedGetNode).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("returns STRUCTURAL_INVALID when tools/call params are malformed", async () => {
    // Defensive: the transport-level ToolsCallParamsSchema also produces a
    // typed envelope when `name` is missing.
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { arguments: { foo: "bar" } }, // no `name`
        },
      });
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });

  it("returns INVALID_REQUEST (transport level) for non-JSON-RPC bodies", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: { foo: "bar" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { error: { code: number; message: string } };
      // -32600 = JSON-RPC INVALID_REQUEST. Transport-level failures travel
      // in the JSON-RPC `error` field, not the tool envelope.
      expect(body.error.code).toBe(-32600);
    } finally {
      await app.close();
    }
  });

  it("returns METHOD_NOT_FOUND for unsupported JSON-RPC methods", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/banana" },
      });
      const body = res.json() as { error: { code: number } };
      expect(body.error.code).toBe(-32601);
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Error-mapping parity with REST — BR-24 / BR-26.
// ---------------------------------------------------------------------------

describe("MCP query transport — service errors map via the shared envelope (BR-24)", () => {
  it("get_node propagates RESOURCE_NOT_FOUND for an unknown node id", async () => {
    mockedGetNode.mockRejectedValueOnce(
      new ResourceNotFoundError("KnowledgeNode", NODE_ID)
    );
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_node", arguments: { node_id: NODE_ID } },
        },
      });
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("get_node propagates BUSINESS_NODE_DELETED for a tombstoned node", async () => {
    mockedGetNode.mockRejectedValueOnce(new NodeDeletedError(NODE_ID));
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_node", arguments: { node_id: NODE_ID } },
        },
      });
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.error.code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      await app.close();
    }
  });

  it("collapses unknown thrown errors to SYSTEM_INTERNAL_ERROR without leaking the message", async () => {
    // BR-24: never leak `err.message` on an unknown throw.
    mockedListNodeTypes.mockRejectedValueOnce(
      new Error("secret internal detail")
    );
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "list_node_types", arguments: {} },
        },
      });
      const body = res.json() as {
        result: { ok: boolean; error: { code: string; message: string } };
      };
      expect(body.result.error.code).toBe("SYSTEM_INTERNAL_ERROR");
      expect(JSON.stringify(body)).not.toContain("secret internal");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Service wrapping — each remaining tool exercises its handler at least once
// so the toolset's argument-mapping logic is covered.
// ---------------------------------------------------------------------------

describe("MCP query transport — service wrapping coverage", () => {
  it("list_nodes returns the service payload verbatim", async () => {
    mockedListNodes.mockResolvedValueOnce({
      total: 0,
      limit: 20,
      offset: 0,
      items: [],
    } as never);
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "list_nodes", arguments: {} },
        },
      });
      const body = res.json() as { result: { ok: boolean; result: unknown } };
      expect(body.result.ok).toBe(true);
      expect(body.result.result).toEqual({
        total: 0,
        limit: 20,
        offset: 0,
        items: [],
      });
    } finally {
      await app.close();
    }
  });

  it("traverse forwards link_types + depth + direction to the service", async () => {
    mockedTraverse.mockResolvedValueOnce({
      starting_node_id: NODE_ID,
      nodes: [],
      links: [],
    } as never);

    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "traverse",
            arguments: {
              node_id: NODE_ID,
              depth: 2,
              direction: "out",
              link_types: ["responsible_for"],
            },
          },
        },
      });
      expect(res.statusCode).toBe(200);
      const args = mockedTraverse.mock.calls[0]!;
      expect(args[2]).toMatchObject({
        startingNodeId: NODE_ID,
        direction: "out",
        depth: 2,
        linkTypeNames: ["responsible_for"],
      });
    } finally {
      await app.close();
    }
  });

  it("get_history_link forwards the link_id", async () => {
    mockedGetLinkHistory.mockResolvedValueOnce({ versions: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "get_history_link",
            arguments: { link_id: LINK_ID },
          },
        },
      });
      expect(mockedGetLinkHistory).toHaveBeenCalledWith(
        expect.anything(),
        LINK_ID,
        expect.anything()
      );
    } finally {
      await app.close();
    }
  });

  it("get_history_attribute forwards the attribute_id", async () => {
    mockedGetAttributeHistory.mockResolvedValueOnce({
      versions: [],
    } as never);
    const { app } = await buildTransportApp();
    try {
      await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "get_history_attribute",
            arguments: { attribute_id: ATTR_ID },
          },
        },
      });
      expect(mockedGetAttributeHistory).toHaveBeenCalledWith(
        expect.anything(),
        ATTR_ID,
        expect.anything()
      );
    } finally {
      await app.close();
    }
  });

  it("get_history_attribute_key forwards (node_id, key)", async () => {
    mockedGetAttributeKeyHistory.mockResolvedValueOnce({
      versions: [],
    } as never);
    const { app } = await buildTransportApp();
    try {
      await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "get_history_attribute_key",
            arguments: { node_id: NODE_ID, key: "title" },
          },
        },
      });
      const args = mockedGetAttributeKeyHistory.mock.calls[0]!;
      expect(args[2]).toEqual({ nodeId: NODE_ID, key: "title" });
    } finally {
      await app.close();
    }
  });

  it("list_link_types forwards include_rules", async () => {
    mockedListLinkTypes.mockResolvedValueOnce({
      total: 0,
      items: [],
    } as never);
    const { app } = await buildTransportApp();
    try {
      await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "list_link_types",
            arguments: { include_rules: "true" },
          },
        },
      });
      const args = mockedListLinkTypes.mock.calls[0]!;
      expect(args[1]).toEqual({ include_rules: true });
    } finally {
      await app.close();
    }
  });

  it("list_attribute_keys forwards node_type", async () => {
    mockedListAttributeKeys.mockResolvedValueOnce({
      total: 0,
      items: [],
    } as never);
    const { app } = await buildTransportApp();
    try {
      await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "list_attribute_keys",
            arguments: { node_type: "Person" },
          },
        },
      });
      const args = mockedListAttributeKeys.mock.calls[0]!;
      expect(args[2]).toEqual({ node_type: "Person" });
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// initialize handshake — sanity check.
// ---------------------------------------------------------------------------

describe("MCP query transport — initialize handshake", () => {
  it("returns the server info + tools capability and no audit headers", async () => {
    // BR-23 rule 2: no X-LLM-Run-Id is required or honoured by this transport.
    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        // Intentionally NO x-llm-run-id header — must succeed regardless.
        payload: { jsonrpc: "2.0", id: 1, method: "initialize" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: {
          protocolVersion: string;
          serverInfo: { name: string };
          capabilities: { tools: unknown };
        };
      };
      expect(body.result.serverInfo.name).toBe("remember-bff-query");
      expect(body.result.capabilities.tools).toBeDefined();
    } finally {
      await app.close();
    }
  });
});
