// Unit tests for the MCP `query` toolset + the `POST /api/v1/mcp/query`
// transport (now on @modelcontextprotocol/sdk, Streamable HTTP).
//
// What this suite owns (post-SDK migration):
//   (a) tools/list advertises the 9 names with non-empty JSON Schemas.
//   (b) tools/call success → the service payload in a text content block.
//   (c) business errors → an isError result carrying our { code, ... } envelope.
//   (d) input that fails Zod validation is rejected before the service runs.
//   (e) the closed tool set is STRUCTURAL: only `toolNames` are registered on
//       the per-request SDK server, so an ingest/rogue name is unreachable.
//   (f) per-tool argument mapping (MCP arg names → service args).
//   (g) initialize handshake advertises serverInfo + tools capability.
//
// JSON-RPC framing, protocol-version negotiation, unknown-method / malformed-
// request handling, and the exact validation-error wording are now the SDK's
// responsibility (covered by the SDK's own tests), so the hand-rolled-transport
// assertions for those were removed in the migration.
//
// Strategy: stub the nine service functions via `vi.mock` so the test never
// touches pg. The fake pool only honours BEGIN READ ONLY / ROLLBACK.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import { buildSnapshot, type CatalogSnapshot } from "../catalog/catalog.js";
import { NodeDeletedError, ResourceNotFoundError } from "../service/errors.js";
import {
  QUERY_TOOL_NAMES,
  QueryToolInputJsonSchemas,
  registerQueryToolset,
} from "./query-toolset.js";
import { registerQueryMcpTransport } from "./query-transport.js";

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

import { getNodeByIdService, listNodesService } from "../service/node.service.js";
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

const silentLogger = pino({ level: "silent" });

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "00000000-0000-4000-8000-000000000001", name: "Person", description: null, version: 1 },
      { id: "00000000-0000-4000-8000-000000000002", name: "Project", description: null, version: 1 },
    ],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

function buildFakePool(): import("pg").Pool {
  const client = {
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
  return { connect: async () => client } as unknown as import("pg").Pool;
}

/** Build a fresh in-process registry, register the 9 KG tools, and mount the
 *  SDK transport on a bare Fastify scope (no auth — covered upstream in app.ts). */
async function buildTransportApp() {
  const mcp = buildMcpServer(silentLogger);
  registerQueryToolset({ mcp, pool: buildFakePool(), logger: silentLogger, catalog: buildCatalog() });
  const app = Fastify({ logger: false });
  await registerQueryMcpTransport(app, {
    pool: buildFakePool(),
    logger: silentLogger,
    mcp,
    toolNames: QUERY_TOOL_NAMES,
  });
  return { app, mcp };
}

// ---- MCP call helpers ----

function rpc(method: string, params?: unknown): object {
  return { jsonrpc: "2.0", id: 1, method, ...(params !== undefined ? { params } : {}) };
}
function toolCall(name: string, args: Record<string, unknown>): object {
  return rpc("tools/call", { name, arguments: args });
}
async function post(app: FastifyInstance, payload: object) {
  return app.inject({
    method: "POST",
    url: "/mcp/query",
    headers: { accept: MCP_ACCEPT },
    payload,
  });
}
interface ToolResult {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  tools?: Array<{ name: string; inputSchema?: unknown }>;
}
function result(res: { json: () => unknown }): ToolResult {
  return (res.json() as { result: ToolResult }).result;
}
/** Parse the JSON payload carried in a tool result's text content block. */
function payload(res: { json: () => unknown }): unknown {
  return JSON.parse(result(res).content?.[0]?.text ?? "null");
}

const NODE_ID = "11111111-1111-4111-8111-111111111111";
const LINK_ID = "22222222-2222-4222-8222-222222222222";
const ATTR_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// (a) tools/list
// ---------------------------------------------------------------------------

describe("MCP query transport — tools/list (BR-25)", () => {
  it("advertises all nine tool names with non-empty inputSchema", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, rpc("tools/list"));
      expect(res.statusCode).toBe(200);
      const tools = result(res).tools ?? [];
      expect(tools.map((t) => t.name).sort()).toEqual([...QUERY_TOOL_NAMES].sort());
      for (const tool of tools) {
        const schema = tool.inputSchema as Record<string, unknown>;
        expect(schema).toBeTypeOf("object");
        expect(schema).not.toBeNull();
        expect(schema.type !== undefined || schema.$ref !== undefined).toBe(true);
      }
    } finally {
      await app.close();
    }
  });

  it("pins the same JSON Schema object exposed by the toolset module", () => {
    expect(Object.keys(QueryToolInputJsonSchemas).sort()).toEqual([...QUERY_TOOL_NAMES].sort());
    for (const name of QUERY_TOOL_NAMES) {
      const schema = QueryToolInputJsonSchemas[name] as Record<string, unknown>;
      expect(schema).toBeTypeOf("object");
      expect(schema).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) tools/call success
// ---------------------------------------------------------------------------

describe("MCP query transport — tools/call success (BR-23)", () => {
  it("get_node returns the service payload verbatim in a text content block", async () => {
    const node = {
      id: NODE_ID,
      node_type: "Person",
      canonical_name: "Alice",
      status: "active",
      aliases: [],
      attributes: [],
    };
    mockedGetNode.mockResolvedValueOnce(node as never);

    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_node", { node_id: NODE_ID }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBeFalsy();
      expect(payload(res)).toEqual(node);

      // The toolset maps MCP arg names → service args.
      expect(mockedGetNode).toHaveBeenCalledTimes(1);
      expect(mockedGetNode.mock.calls[0]![1]).toMatchObject({
        nodeId: NODE_ID,
        inEffectOnly: false,
        includeUncertain: true,
      });
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (e) closed tool set is structural
// ---------------------------------------------------------------------------

describe("MCP query transport — closed tool set (structural)", () => {
  it("an unknown tool name is unreachable (isError)", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("totally_made_up_tool", {}));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("a rogue tool on the shared registry is NOT exposed (only toolNames are registered)", async () => {
    // Even if a future bug registers `propose_node` under the `query` key on
    // the shared registry, the per-request SDK server only registers the names
    // in `toolNames` — so it is structurally unreachable here.
    const { app, mcp } = await buildTransportApp();
    try {
      const { z } = await import("zod");
      mcp.registerTool("query", {
        name: "propose_node",
        description: "rogue tool",
        inputSchema: z.object({}),
        handler: async () => ({ ok: true, result: "should not be reached" }),
      });
      const res = await post(app, toolCall("propose_node", {}));
      expect(result(res).isError).toBe(true);
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (d) input validation — rejected before the service runs
// ---------------------------------------------------------------------------

describe("MCP query transport — input validation", () => {
  it("rejects a non-UUID node_id and never invokes the service", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_node", { node_id: "not-a-uuid" }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
      // The SDK validates input against the Zod schema; the service must not run.
      expect(mockedGetNode).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (c) business errors map via the shared envelope (BR-24)
// ---------------------------------------------------------------------------

describe("MCP query transport — business errors map via the shared envelope (BR-24)", () => {
  it("get_node propagates RESOURCE_NOT_FOUND for an unknown node id", async () => {
    mockedGetNode.mockRejectedValueOnce(new ResourceNotFoundError("KnowledgeNode", NODE_ID));
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_node", { node_id: NODE_ID }));
      expect(result(res).isError).toBe(true);
      expect((payload(res) as { code: string }).code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("get_node propagates BUSINESS_NODE_DELETED for a tombstoned node", async () => {
    mockedGetNode.mockRejectedValueOnce(new NodeDeletedError(NODE_ID));
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_node", { node_id: NODE_ID }));
      expect((payload(res) as { code: string }).code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      await app.close();
    }
  });

  it("collapses unknown thrown errors to SYSTEM_INTERNAL_ERROR without leaking the message", async () => {
    mockedListNodeTypes.mockRejectedValueOnce(new Error("secret internal detail"));
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("list_node_types", {}));
      expect((payload(res) as { code: string }).code).toBe("SYSTEM_INTERNAL_ERROR");
      expect(JSON.stringify(res.json())).not.toContain("secret internal");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (f) per-tool argument-mapping coverage
// ---------------------------------------------------------------------------

describe("MCP query transport — service wrapping coverage", () => {
  it("list_nodes returns the service payload verbatim", async () => {
    mockedListNodes.mockResolvedValueOnce({ total: 0, limit: 20, offset: 0, items: [] } as never);
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("list_nodes", {}));
      expect(result(res).isError).toBeFalsy();
      expect(payload(res)).toEqual({ total: 0, limit: 20, offset: 0, items: [] });
    } finally {
      await app.close();
    }
  });

  it("traverse forwards link_types + depth + direction to the service", async () => {
    mockedTraverse.mockResolvedValueOnce({ starting_node_id: NODE_ID, nodes: [], links: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await post(
        app,
        toolCall("traverse", {
          node_id: NODE_ID,
          depth: 2,
          direction: "out",
          link_types: ["responsible_for"],
        })
      );
      expect(mockedTraverse.mock.calls[0]![2]).toMatchObject({
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
      await post(app, toolCall("get_history_link", { link_id: LINK_ID }));
      expect(mockedGetLinkHistory).toHaveBeenCalledWith(expect.anything(), LINK_ID, expect.anything());
    } finally {
      await app.close();
    }
  });

  it("get_history_attribute forwards the attribute_id", async () => {
    mockedGetAttributeHistory.mockResolvedValueOnce({ versions: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await post(app, toolCall("get_history_attribute", { attribute_id: ATTR_ID }));
      expect(mockedGetAttributeHistory).toHaveBeenCalledWith(expect.anything(), ATTR_ID, expect.anything());
    } finally {
      await app.close();
    }
  });

  it("get_history_attribute_key forwards (node_id, key)", async () => {
    mockedGetAttributeKeyHistory.mockResolvedValueOnce({ versions: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await post(app, toolCall("get_history_attribute_key", { node_id: NODE_ID, key: "title" }));
      expect(mockedGetAttributeKeyHistory.mock.calls[0]![2]).toEqual({ nodeId: NODE_ID, key: "title" });
    } finally {
      await app.close();
    }
  });

  it("list_link_types coerces include_rules='true' to boolean before the service", async () => {
    mockedListLinkTypes.mockResolvedValueOnce({ total: 0, items: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await post(app, toolCall("list_link_types", { include_rules: "true" }));
      expect(mockedListLinkTypes.mock.calls[0]![1]).toEqual({ include_rules: true });
    } finally {
      await app.close();
    }
  });

  it("list_attribute_keys forwards node_type", async () => {
    mockedListAttributeKeys.mockResolvedValueOnce({ total: 0, items: [] } as never);
    const { app } = await buildTransportApp();
    try {
      await post(app, toolCall("list_attribute_keys", { node_type: "Person" }));
      expect(mockedListAttributeKeys.mock.calls[0]![2]).toEqual({ node_type: "Person" });
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (g) initialize handshake
// ---------------------------------------------------------------------------

describe("MCP query transport — initialize handshake", () => {
  it("returns serverInfo + tools capability", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await post(
        app,
        rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" },
        })
      );
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { protocolVersion: string; serverInfo: { name: string }; capabilities: { tools?: unknown } };
      };
      expect(body.result.serverInfo.name).toBe("remember-bff-query");
      expect(body.result.capabilities.tools).toBeDefined();
    } finally {
      await app.close();
    }
  });
});
