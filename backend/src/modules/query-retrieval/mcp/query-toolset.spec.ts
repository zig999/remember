// Unit tests for the MCP query-retrieval toolset + its composition onto the
// shared `POST /api/v1/mcp/query` transport owned by knowledge-graph.
//
// Acceptance criteria addressed (TC-03 validation.criteria):
//   (a) tools/list returns all four query-retrieval tool names (alongside the
//       nine knowledge-graph tools, totalling 13) with non-empty inputSchema.
//   (b) tools/call search with valid params returns { ok: true, result: ... }.
//   (c) tools/call get_provenance_link with non-existent id returns
//       { ok: false, error: { code: 'RESOURCE_NOT_FOUND' } }.
//   (d) tools/call get_provenance_fragment with non-accepted fragment returns
//       { ok: false, error: { code: 'BUSINESS_FRAGMENT_NOT_ACCEPTED' } }.
//
// Strategy: stub the four service functions via `vi.mock` so the test never
// touches pg. The fake pool only needs to honour `BEGIN READ ONLY` / ROLLBACK.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../knowledge-graph/catalog/catalog.js";
import {
  registerQueryMcpTransport,
  registerQueryToolset,
  type QueryMcpToolDescriptor,
} from "../../knowledge-graph/index.js";
import { ResourceNotFoundError } from "../../knowledge-graph/service/errors.js";
import { FragmentNotAcceptedError } from "../service/errors.js";
import {
  QUERY_RETRIEVAL_TOOL_NAMES,
  QueryRetrievalToolDescriptions,
  QueryRetrievalToolInputJsonSchemas,
  registerQueryRetrievalToolset,
} from "./query-toolset.js";

// ---------------------------------------------------------------------------
// vi.mock — stub every service function the query-retrieval toolset wraps.
// ---------------------------------------------------------------------------

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
    ],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/** Minimal pg.Pool fake — the service mocks intercept every read so the
 *  client only needs to honour the transaction control statements. */
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

/** Build a Fastify app with the shared MCP transport, both the
 *  knowledge-graph registrar AND the query-retrieval registrar wired in —
 *  this mirrors the production composition in `app.ts`. */
async function buildTransportApp() {
  const mcp = buildMcpServer(silentLogger);
  const catalog = buildCatalog();
  const pool = buildFakePool();

  // Register both toolsets on the shared registry, just like app.ts.
  registerQueryToolset({ mcp, pool, logger: silentLogger, catalog });
  registerQueryRetrievalToolset({ mcp, pool, logger: silentLogger, catalog });

  // Build the descriptor list the bootstrap passes to the transport so it
  // can surface the four extra tools through tools/list and admit them
  // through the closed-whitelist gate.
  const extraTools: QueryMcpToolDescriptor[] = QUERY_RETRIEVAL_TOOL_NAMES.map(
    (name) => ({
      name,
      description: QueryRetrievalToolDescriptions[name],
      inputSchema: QueryRetrievalToolInputJsonSchemas[name] as unknown as Record<
        string,
        unknown
      >,
    })
  );

  const app = Fastify({ logger: false });
  await registerQueryMcpTransport(app, {
    pool,
    logger: silentLogger,
    mcp,
    extraTools,
  });
  return { app, mcp };
}

const LINK_ID = "22222222-2222-4222-8222-222222222222";
const FRAGMENT_ID = "44444444-4444-4444-8444-444444444444";
const ATTRIBUTE_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// (a) tools/list — BR-25: all 13 tools visible (9 KG + 4 query-retrieval),
//     each with a non-empty JSON Schema. The four names this domain owns are
//     advertised by the shared transport via the `extraTools` descriptor
//     bundle the bootstrap composes.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval transport — tools/list (BR-25)", () => {
  it("includes all four query-retrieval tools alongside the nine knowledge-graph tools", async () => {
    // UC-01 / UC-07 / UC-08 / UC-09 — names per spec §14.3.
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
      const names = body.result.tools.map((t) => t.name);
      // Spec validation criterion: 13 tools total (9 KG + 4 query-retrieval).
      expect(names).toHaveLength(13);
      // The four query-retrieval names appear in the union set.
      for (const name of QUERY_RETRIEVAL_TOOL_NAMES) {
        expect(names).toContain(name);
      }
      // Every advertised tool carries a non-empty JSON Schema (BR-25).
      for (const tool of body.result.tools) {
        expect(tool.inputSchema).toBeTypeOf("object");
        expect(tool.inputSchema).not.toBeNull();
        const schema = tool.inputSchema as Record<string, unknown>;
        expect(
          schema.type !== undefined || schema.$ref !== undefined
        ).toBe(true);
      }
    } finally {
      await app.close();
    }
  });

  it("pins the same JSON Schema objects the toolset module exports", () => {
    // BR-25 single-source guarantee: downstream consumers importing
    // QueryRetrievalToolInputJsonSchemas observe the same objects the
    // transport serves over tools/list.
    expect(Object.keys(QueryRetrievalToolInputJsonSchemas).sort()).toEqual(
      [...QUERY_RETRIEVAL_TOOL_NAMES].sort()
    );
    for (const name of QUERY_RETRIEVAL_TOOL_NAMES) {
      const schema = QueryRetrievalToolInputJsonSchemas[name] as Record<
        string,
        unknown
      >;
      expect(schema).toBeTypeOf("object");
      expect(schema).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) tools/call search — success path wraps service return value verbatim.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — tools/call search (BR-23)", () => {
  it("returns { ok: true, result: <SearchResponse> } verbatim", async () => {
    const payload = {
      query: "alice",
      total: 0,
      limit: 20,
      offset: 0,
      items: [],
    };
    mockedSearch.mockResolvedValueOnce(payload as never);

    const { app } = await buildTransportApp();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/query",
        payload: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search", arguments: { query: "alice" } },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result: { ok: boolean; result: unknown } };
      expect(body.result).toEqual({ ok: true, result: payload });

      // The toolset maps MCP→service argument names. SearchQuerySchema applies
      // defaults (limit=20, offset=0, expand=true, etc.), so we assert the
      // shape rather than the full kwarg set.
      expect(mockedSearch).toHaveBeenCalledTimes(1);
      const callArgs = mockedSearch.mock.calls[0]!;
      expect(callArgs[2]).toMatchObject({
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
// (c) tools/call get_provenance_link — non-existent id surfaces
//     RESOURCE_NOT_FOUND via the shared mapper (BR-24).
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_link not-found (BR-24)", () => {
  it("returns { ok: false, error: { code: 'RESOURCE_NOT_FOUND' } } for unknown link_id", async () => {
    mockedGetProvLink.mockRejectedValueOnce(
      new ResourceNotFoundError("KnowledgeLink", LINK_ID)
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
          params: {
            name: "get_provenance_link",
            arguments: { link_id: LINK_ID },
          },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (d) tools/call get_provenance_fragment — non-accepted fragment surfaces
//     BUSINESS_FRAGMENT_NOT_ACCEPTED via the shared mapper (BR-24).
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_fragment non-accepted (BR-24)", () => {
  it("returns BUSINESS_FRAGMENT_NOT_ACCEPTED when the fragment is not in status='accepted'", async () => {
    mockedGetProvFragment.mockRejectedValueOnce(
      new FragmentNotAcceptedError(FRAGMENT_ID, "proposed")
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
          params: {
            name: "get_provenance_fragment",
            arguments: { fragment_id: FRAGMENT_ID },
          },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { ok: boolean; error: { code: string } };
      };
      expect(body.result.ok).toBe(false);
      expect(body.result.error.code).toBe("BUSINESS_FRAGMENT_NOT_ACCEPTED");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Bonus: get_provenance_attribute success path — confirms the third
// provenance tool dispatches and returns the service payload verbatim. Not
// in the validation.criteria list but completes the four-tool coverage.
// ---------------------------------------------------------------------------

describe("MCP query-retrieval — get_provenance_attribute success", () => {
  it("returns { ok: true, result: <ProvenanceResponse> } verbatim", async () => {
    const payload = {
      fragments: [
        {
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          text: "fact",
          confidence: 0.9,
          status: "accepted",
          chunks: [],
        },
      ],
    };
    mockedGetProvAttribute.mockResolvedValueOnce(payload as never);

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
            name: "get_provenance_attribute",
            arguments: { attribute_id: ATTRIBUTE_ID },
          },
        },
      });
      const body = res.json() as { result: { ok: boolean; result: unknown } };
      expect(body.result).toEqual({ ok: true, result: payload });
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
