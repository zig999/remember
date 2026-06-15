// Unit tests for the MCP query-retrieval toolset + its composition onto the
// shared `POST /api/v1/mcp/query` transport owned by knowledge-graph (now on
// @modelcontextprotocol/sdk).
//
//   (a) tools/list returns all 13 tool names (9 KG + 4 query-retrieval) with
//       non-empty inputSchema.
//   (b) tools/call search success → the SearchResponse payload in a text block.
//   (c) get_provenance_link unknown id → isError carrying RESOURCE_NOT_FOUND.
//   (d) get_provenance_fragment non-accepted → isError carrying
//       BUSINESS_FRAGMENT_NOT_ACCEPTED.
//   (e) get_provenance_attribute success → payload + arg mapping.
//
// Strategy: stub the four service functions via `vi.mock`; the fake pool only
// honours the transaction-control statements.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import { buildSnapshot, type CatalogSnapshot } from "../../knowledge-graph/catalog/catalog.js";
import {
  QUERY_TOOL_NAMES,
  registerQueryMcpTransport,
  registerQueryToolset,
} from "../../knowledge-graph/index.js";
import { ResourceNotFoundError } from "../../knowledge-graph/service/errors.js";
import { FragmentNotAcceptedError } from "../service/errors.js";
import {
  QUERY_RETRIEVAL_TOOL_NAMES,
  QueryRetrievalToolInputJsonSchemas,
  registerQueryRetrievalToolset,
} from "./query-toolset.js";

vi.mock("../service/search.service.js", () => ({
  searchKnowledgeService: vi.fn(),
}));
vi.mock("../service/provenance.service.js", () => ({
  getProvenanceByLinkService: vi.fn(),
  getProvenanceByAttributeService: vi.fn(),
  getProvenanceByFragmentService: vi.fn(),
}));

import { searchKnowledgeService } from "../service/search.service.js";
import {
  getProvenanceByAttributeService,
  getProvenanceByFragmentService,
  getProvenanceByLinkService,
} from "../service/provenance.service.js";

const mockedSearch = vi.mocked(searchKnowledgeService);
const mockedGetProvLink = vi.mocked(getProvenanceByLinkService);
const mockedGetProvAttribute = vi.mocked(getProvenanceByAttributeService);
const mockedGetProvFragment = vi.mocked(getProvenanceByFragmentService);

const silentLogger = pino({ level: "silent" });

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "00000000-0000-4000-8000-000000000001", name: "Person", description: null, version: 1 },
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

/** Build a Fastify app with the SDK query transport, both the knowledge-graph
 *  and query-retrieval toolsets registered on the shared registry — mirrors the
 *  production composition in `app.ts`. The transport exposes the 13-name union. */
async function buildTransportApp() {
  const mcp = buildMcpServer(silentLogger);
  const catalog = buildCatalog();
  registerQueryToolset({ mcp, pool: buildFakePool(), logger: silentLogger, catalog });
  registerQueryRetrievalToolset({ mcp, pool: buildFakePool(), logger: silentLogger, catalog });

  const app = Fastify({ logger: false });
  await registerQueryMcpTransport(app, {
    pool: buildFakePool(),
    logger: silentLogger,
    mcp,
    toolNames: [...QUERY_TOOL_NAMES, ...QUERY_RETRIEVAL_TOOL_NAMES],
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
async function post(app: FastifyInstance, body: object) {
  return app.inject({ method: "POST", url: "/mcp/query", headers: { accept: MCP_ACCEPT }, payload: body });
}
interface ToolResult {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  tools?: Array<{ name: string; inputSchema?: unknown }>;
}
function result(res: { json: () => unknown }): ToolResult {
  return (res.json() as { result: ToolResult }).result;
}
function payload(res: { json: () => unknown }): unknown {
  return JSON.parse(result(res).content?.[0]?.text ?? "null");
}

const LINK_ID = "22222222-2222-4222-8222-222222222222";
const FRAGMENT_ID = "44444444-4444-4444-8444-444444444444";
const ATTRIBUTE_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// (a) tools/list — all 13 tools (9 KG + 4 query-retrieval), each with a schema.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval transport — tools/list (BR-25)", () => {
  it("includes all four query-retrieval tools alongside the nine knowledge-graph tools", async () => {
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, rpc("tools/list"));
      expect(res.statusCode).toBe(200);
      const tools = result(res).tools ?? [];
      expect(tools).toHaveLength(13);
      const names = tools.map((t) => t.name);
      for (const name of QUERY_RETRIEVAL_TOOL_NAMES) {
        expect(names).toContain(name);
      }
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

  it("pins the same JSON Schema objects the toolset module exports", () => {
    expect(Object.keys(QueryRetrievalToolInputJsonSchemas).sort()).toEqual(
      [...QUERY_RETRIEVAL_TOOL_NAMES].sort()
    );
    for (const name of QUERY_RETRIEVAL_TOOL_NAMES) {
      const schema = QueryRetrievalToolInputJsonSchemas[name] as Record<string, unknown>;
      expect(schema).toBeTypeOf("object");
      expect(schema).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) tools/call search — success path.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — tools/call search (BR-23)", () => {
  it("returns the SearchResponse payload verbatim and maps args", async () => {
    const response = { query: "alice", total: 0, limit: 20, offset: 0, items: [] };
    mockedSearch.mockResolvedValueOnce(response as never);

    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("search", { query: "alice" }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBeFalsy();
      expect(payload(res)).toEqual(response);

      expect(mockedSearch).toHaveBeenCalledTimes(1);
      expect(mockedSearch.mock.calls[0]![2]).toMatchObject({
        query: "alice",
        limit: 20,
        offset: 0,
        expand: true,
      });
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (c) get_provenance_link not-found.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_link not-found (BR-24)", () => {
  it("surfaces RESOURCE_NOT_FOUND for an unknown link_id", async () => {
    mockedGetProvLink.mockRejectedValueOnce(new ResourceNotFoundError("KnowledgeLink", LINK_ID));
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_provenance_link", { link_id: LINK_ID }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
      expect((payload(res) as { code: string }).code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (d) get_provenance_fragment non-accepted.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_fragment non-accepted (BR-24)", () => {
  it("surfaces BUSINESS_FRAGMENT_NOT_ACCEPTED when the fragment is not accepted", async () => {
    mockedGetProvFragment.mockRejectedValueOnce(new FragmentNotAcceptedError(FRAGMENT_ID, "proposed"));
    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_provenance_fragment", { fragment_id: FRAGMENT_ID }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
      expect((payload(res) as { code: string }).code).toBe("BUSINESS_FRAGMENT_NOT_ACCEPTED");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (e) get_provenance_attribute success — completes the four-tool coverage.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_attribute success", () => {
  it("returns the ProvenanceResponse payload verbatim and forwards the id", async () => {
    const response = {
      fragments: [
        { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", text: "fact", confidence: 0.9, status: "accepted", chunks: [] },
      ],
    };
    mockedGetProvAttribute.mockResolvedValueOnce(response as never);

    const { app } = await buildTransportApp();
    try {
      const res = await post(app, toolCall("get_provenance_attribute", { attribute_id: ATTRIBUTE_ID }));
      expect(result(res).isError).toBeFalsy();
      expect(payload(res)).toEqual(response);
      expect(mockedGetProvAttribute).toHaveBeenCalledWith(
        expect.anything(),
        ATTRIBUTE_ID,
        expect.anything()
      );
    } finally {
      await app.close();
    }
  });
});
