// Unit tests for the stdio MCP wiring (TC-03 of mcp-stdio-transport).
//
// What this suite owns:
//   (a) `buildConfiguredMcpServer` advertises the EXACT closed set of 18 tool
//       names the stdio entry point composes — QUERY (9) + QUERY_RETRIEVAL (4)
//       + INGEST (4) + `ingest_document` (1).
//   (b) A `tools/call` for a known tool (`list_node_types`) reaches the handler
//       and the resulting `result.content[0].text` parses as the OK envelope's
//       `result` field — `{ ok: true, result: <payload> }` at the handler level,
//       which the builder renders as `content[0].text = JSON.stringify(result)`.
//   (c) A `tools/call` for an UNKNOWN tool name yields `isError: true` and
//       `content[0].text` parses to `{ code: 'NOT_FOUND', message, ... }`
//       (the shared mapper renders the error envelope's `error` payload).
//
// What this suite intentionally does NOT cover (out of scope for the stdio
// wiring layer):
//   - The boot composition in `mcp-stdio.ts` (env validation, pg pool, catalog
//     loads, registrar calls, transport.connect) — that's an integration
//     concern; the entry-point file runs `void main()` at import time so it
//     cannot be safely imported in Vitest. The TC-02 unit suite
//     (`stdio-tools.spec.ts`) pins the multi-toolset projector
//     `resolveStdioTools`; THIS suite pins the next layer up (the SDK Server
//     built from those projected `McpHttpTool[]`).
//   - JSON-RPC framing, protocol-version negotiation, malformed-message
//     handling — those are the SDK's responsibility.
//
// Strategy:
//   - Use `InMemoryTransport.createLinkedPair()` from `@modelcontextprotocol/sdk`
//     to talk to the configured server with a real MCP Client — no stdin /
//     stdout, no real database, no real Anthropic API. Same wire contract as a
//     stdio client would observe (since the SDK abstracts the transport).
//   - The fake tools array is constructed DIRECTLY (no registrar / catalog /
//     pool) — the unit under test is the SDK wiring (`buildConfiguredMcpServer`
//     + tool dispatch), not the toolset registrars.
//   - `list_node_types` carries a real-ish handler that consults a fake pool
//     mock (vi.fn-style stubs honouring BEGIN READ ONLY / SELECT / ROLLBACK)
//     so AC4 demonstrates the dispatch path actually reaches a handler that
//     returns a typed envelope — not just a hard-coded stub.

import { describe, expect, it, vi } from "vitest";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { z } from "zod";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import {
  buildConfiguredMcpServer,
  type McpEnvelope,
  type McpHttpTool,
} from "../../mcp/sdk-http-transport.js";

import { INGEST_TOOL_NAMES } from "../../modules/ingestion/index.js";
import { QUERY_TOOL_NAMES } from "../../modules/knowledge-graph/index.js";
import { QUERY_RETRIEVAL_TOOL_NAMES } from "../../modules/query-retrieval/index.js";
import { listNodeTypesService } from "../../modules/knowledge-graph/service/catalog.service.js";
import { withReadOnly } from "../../modules/curation/service/transaction.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** The 18 tool names the stdio entry point composes (mcp-stdio.ts step 6). */
const EXPECTED_TOOL_NAMES: readonly string[] = [
  ...QUERY_TOOL_NAMES,
  ...QUERY_RETRIEVAL_TOOL_NAMES,
  ...INGEST_TOOL_NAMES,
  "ingest_document",
];

/** Known node-type row the fake pool returns for `list_node_types`. */
const FAKE_NODE_TYPE = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Person",
  description: "Human actor",
  version: 1,
};

/** Build a fake `Pool` whose only obligation is to honour the read-only
 *  transaction shell (`BEGIN READ ONLY` / `ROLLBACK`) plus the single SELECT
 *  the `listNodeTypes` repository issues. */
function buildFakePool(): Pool {
  const queryFn = vi.fn(async <R extends QueryResultRow = QueryResultRow>(
    text: string
  ): Promise<QueryResult<R>> => {
    if (/^\s*BEGIN/i.test(text) || /^\s*ROLLBACK/i.test(text)) {
      return { rows: [], rowCount: 0, command: "", oid: 0, fields: [] };
    }
    if (/FROM node_type/i.test(text)) {
      return {
        rows: [FAKE_NODE_TYPE] as unknown as R[],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      };
    }
    throw new Error(`fakePool: unexpected query: ${text}`);
  });
  const client = {
    query: queryFn,
    release: vi.fn(),
  } as unknown as PoolClient;
  return {
    connect: vi.fn(async () => client),
  } as unknown as Pool;
}

/** Build the 18 `McpHttpTool` descriptors the stdio entry point feeds into
 *  `buildConfiguredMcpServer`. Only `list_node_types` carries a real-ish
 *  handler (consulting the fake pool); the other 17 carry inert stubs — the
 *  builder advertises them in `tools/list` but the suite never calls them. */
function buildFakeTools(pool: Pool): readonly McpHttpTool[] {
  const inertHandler = async (): Promise<McpEnvelope> => ({
    ok: true,
    result: null,
  });
  const listNodeTypesHandler = async (): Promise<McpEnvelope> => {
    // The fake pool succeeds on the happy path; no envelope-mapping branch is
    // exercised here. The real toolset handler wraps this same call shape with
    // `mapErrorToEnvelope`, which is covered by the knowledge-graph MCP suite.
    const result = await withReadOnly(pool, (client) =>
      listNodeTypesService(client)
    );
    return { ok: true, result };
  };
  return EXPECTED_TOOL_NAMES.map(
    (name): McpHttpTool => ({
      name,
      description: `fake ${name} description`,
      inputSchema: z.object({}),
      handler: name === "list_node_types" ? listNodeTypesHandler : inertHandler,
    })
  );
}

/** Build a Client + Server pair linked by `InMemoryTransport`. The server has
 *  the 18-tool closed set wired through the shared `buildConfiguredMcpServer`
 *  builder — the SAME function the stdio entry point and HTTP transports use. */
async function buildLinkedClient(pool: Pool): Promise<Client> {
  const server = buildConfiguredMcpServer({
    serverName: "remember-bff-stdio-test",
    serverVersion: "0.0.0",
    tools: buildFakeTools(pool),
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client(
    { name: "stdio-unit-test", version: "0.0.0" },
    { capabilities: {} }
  );
  await client.connect(clientTransport);
  return client;
}

// ---------------------------------------------------------------------------
// (a) tools/list — the 18-name closed set
// ---------------------------------------------------------------------------

describe("MCP stdio wiring — tools/list (AC3)", () => {
  it("advertises exactly the 18 expected tool names", async () => {
    // GIVEN — a configured MCP server with the 18-tool closed set.
    const pool = buildFakePool();
    const client = await buildLinkedClient(pool);

    try {
      // WHEN — a standard MCP client issues `tools/list`.
      const res = await client.listTools();

      // THEN — exactly 18 tools, each with the expected name.
      const names = res.tools.map((t) => t.name).sort();
      expect(names).toEqual([...EXPECTED_TOOL_NAMES].sort());
      expect(res.tools).toHaveLength(18);

      // Spot-check the union breakdown so a future drift in any of the three
      // upstream toolset modules surfaces here, not deep inside an HTTP test.
      const queryCount = res.tools.filter((t) =>
        (QUERY_TOOL_NAMES as readonly string[]).includes(t.name)
      ).length;
      const qrCount = res.tools.filter((t) =>
        (QUERY_RETRIEVAL_TOOL_NAMES as readonly string[]).includes(t.name)
      ).length;
      const ingestCount = res.tools.filter((t) =>
        (INGEST_TOOL_NAMES as readonly string[]).includes(t.name)
      ).length;
      const ingestDocumentCount = res.tools.filter(
        (t) => t.name === "ingest_document"
      ).length;
      expect(queryCount).toBe(9);
      expect(qrCount).toBe(4);
      expect(ingestCount).toBe(4);
      expect(ingestDocumentCount).toBe(1);
    } finally {
      await client.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) tools/call — a known tool returns a parseable OK envelope (AC4)
// ---------------------------------------------------------------------------

describe("MCP stdio wiring — tools/call success (AC4)", () => {
  it("list_node_types returns isError=false and a JSON-parseable OK payload", async () => {
    // GIVEN — a server whose `list_node_types` handler hits a fake pool
    //         returning one known node-type row.
    const pool = buildFakePool();
    const client = await buildLinkedClient(pool);

    try {
      // WHEN — the client calls `list_node_types`.
      const res = await client.callTool({
        name: "list_node_types",
        arguments: {},
      });

      // THEN — the result is NOT an error and the text content is the JSON
      //        payload the handler returned in `envelope.result`.
      expect(res.isError).toBeFalsy();
      const content = res.content as Array<{ type: string; text: string }>;
      expect(content[0]?.type).toBe("text");
      const payload = JSON.parse(content[0]?.text ?? "null") as {
        total: number;
        items: Array<{ id: string; name: string; description: string | null; version: number }>;
      };
      // The handler wraps the service in `{ ok: true, result: <payload> }`;
      // the builder renders `content[0].text = JSON.stringify(envelope.result)`.
      // So `payload` is the service's `NodeTypeListResponse` directly.
      expect(payload.total).toBe(1);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toMatchObject({
        id: FAKE_NODE_TYPE.id,
        name: FAKE_NODE_TYPE.name,
        description: FAKE_NODE_TYPE.description,
        version: FAKE_NODE_TYPE.version,
      });

      // Pool was consulted exactly once (single read-only transaction).
      expect(pool.connect).toHaveBeenCalledTimes(1);
    } finally {
      await client.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (c) tools/call — an unknown tool maps to NOT_FOUND isError (AC5)
// ---------------------------------------------------------------------------

describe("MCP stdio wiring — tools/call NOT_FOUND (AC5)", () => {
  it("an unknown tool name yields isError=true and a NOT_FOUND envelope", async () => {
    // GIVEN — the same configured server (18-tool closed set).
    const pool = buildFakePool();
    const client = await buildLinkedClient(pool);

    try {
      // WHEN — the client calls a tool that is NOT in the closed set.
      const res = await client.callTool({
        name: "totally_made_up_tool",
        arguments: {},
      });

      // THEN — isError=true and the text content carries the structured
      //        `{ code, message, ... }` envelope the shared mapper produces.
      expect(res.isError).toBe(true);
      const content = res.content as Array<{ type: string; text: string }>;
      const errorPayload = JSON.parse(content[0]?.text ?? "{}") as {
        code: string;
        message: string;
        details?: unknown;
      };
      expect(errorPayload.code).toBe("NOT_FOUND");
      expect(errorPayload.message).toMatch(/totally_made_up_tool/);

      // No handler was reached — the pool was never consulted on this path.
      expect(pool.connect).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });
});
