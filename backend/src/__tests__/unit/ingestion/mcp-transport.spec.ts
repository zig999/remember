// TC-014 — MCP-over-HTTP transport: JSON-RPC 2.0 dispatch over a per-request
// session. These tests exercise the Fastify route with `app.inject()` against
// a minimal Fastify scope (no auth — the auth path is covered in
// mcp-endpoint.spec.ts).
//
// Acceptance criteria addressed:
//   - "MCP session without ambient llm_run_id returns STRUCTURAL_INVALID
//      envelope without writing a tool_call row" (tools/list + tools/call)
//   - "MCP tool propose_fragment input_schema matches the JSON Schema derived
//      from ProposeFragmentInputSchema" (served via tools/list when run is
//      registered)
//   - "Unknown tool name returns NOT_FOUND envelope" (defensive transport
//      coverage)
//   - "Invalid JSON-RPC payload returns INVALID_REQUEST error" (JSON-RPC
//      conformance)
//   - "Unsupported method returns METHOD_NOT_FOUND error" (JSON-RPC
//      conformance)
//
// Strategy: mount the transport on a bare Fastify instance (no auth scope)
// using a fake pg pool that records DB calls. The ambient run check at the
// service layer happens *inside* the handler — but we want to assert the
// transport-level pre-handler behaviour (BR-21 first bullet) which fires
// BEFORE any DB call, so the pool's `connect()` is wired but only invoked on
// the "registered + reachable tool" path.

import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import pino from "pino";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  registerIngestMcpTransport,
  LLM_RUN_HEADER,
} from "../../../modules/ingestion/mcp/transport.js";
import { IngestToolInputJsonSchemas } from "../../../modules/ingestion/dto/index.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "00000000-0000-4000-8000-000000000001", name: "Person" },
      { id: "00000000-0000-4000-8000-000000000002", name: "Project" },
    ],
    linkTypes: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

interface FakeDbCalls {
  toolCallInserts: number;
  poolConnects: number;
}

function buildFakePool(calls: FakeDbCalls): import("pg").Pool {
  return {
    connect: async () => {
      calls.poolConnects += 1;
      return {
        query: async (...args: unknown[]) => {
          const sql = String(args[0]).replace(/\s+/g, " ").trim();
          const upper = sql.toUpperCase();
          if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
            return { rows: [], rowCount: 0 };
          }
          if (sql.startsWith("INSERT INTO tool_call")) {
            calls.toolCallInserts += 1;
            return { rows: [{ id: `tc-${calls.toolCallInserts}` }], rowCount: 1 };
          }
          // Default — empty rowset. The handler will treat the run as
          // missing and reject with STRUCTURAL_INVALID; that's fine for the
          // tests below (we only check the transport-side envelope mapping,
          // not the handler's deeper logic).
          return { rows: [], rowCount: 0 };
        },
        release: () => undefined,
      } as unknown as import("pg").PoolClient;
    },
  } as unknown as import("pg").Pool;
}

const silentLogger = pino({ level: "silent" });

async function buildTransportApp(calls: FakeDbCalls) {
  const app = Fastify({ logger: false });
  await registerIngestMcpTransport(app, {
    pool: buildFakePool(calls),
    logger: silentLogger,
    catalog: buildCatalog(),
  });
  return app;
}

describe("Ingest MCP transport (TC-014)", () => {
  it("rejects a non-JSON-RPC body with INVALID_REQUEST", async () => {
    // JSON-RPC 2.0 §4: every request MUST have jsonrpc: "2.0" + method.
    // Failure to surface that as a -32600 error means malformed clients
    // would get a generic Fastify 500.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: { foo: "bar" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { error?: { code: number } };
      expect(body.error?.code).toBe(-32600);
      // No DB touched.
      expect(calls.poolConnects).toBe(0);
      expect(calls.toolCallInserts).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns METHOD_NOT_FOUND for unsupported JSON-RPC methods", async () => {
    // Anything outside { initialize, tools/list, tools/call } must surface
    // a -32601 error rather than silently succeed or 500.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "prompts/list" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { error?: { code: number } };
      expect(body.error?.code).toBe(-32601);
      expect(calls.poolConnects).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("initialize returns server capabilities", async () => {
    // MCP `initialize` is a handshake — the transport must advertise the
    // protocol version and capability set (tools, in our case) so MCP
    // clients can negotiate the session.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "initialize" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result?: Record<string, unknown> };
      expect(body.result?.protocolVersion).toBe("2024-11-05");
      expect(body.result?.serverInfo).toEqual({
        name: "remember-bff-ingest",
        version: "0.1.0",
      });
      expect((body.result?.capabilities as Record<string, unknown>).tools).toBeDefined();
    } finally {
      await app.close();
    }
  });

  it("tools/list returns empty list when no ambient llm_run_id is sent (BR-21)", async () => {
    // BR-21 first bullet: the transport must NOT expose `propose_*` until a
    // run is bound. The session factory returns `tools_registered: false`
    // and the transport relays that as an empty `tools` array. No DB call.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result?: { tools?: unknown[] } };
      expect(body.result?.tools).toEqual([]);
      expect(calls.poolConnects).toBe(0);
      expect(calls.toolCallInserts).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("tools/list with ambient run id exposes all four propose-* tools with correct JSON Schemas (BR-24)", async () => {
    // BR-24: the JSON Schema each tool publishes over MCP must be the very
    // object derived from the Zod DTO at module init. A snapshot equality
    // against `IngestToolInputJsonSchemas` would catch drift if the
    // transport ever re-derived or hard-coded the schemas.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
        headers: { [LLM_RUN_HEADER]: RUN_ID },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result?: { tools: Array<{ name: string; inputSchema: unknown }> };
      };
      const tools = body.result?.tools ?? [];
      const byName = Object.fromEntries(tools.map((t) => [t.name, t.inputSchema]));
      expect(Object.keys(byName).sort()).toEqual([
        "propose_attribute",
        "propose_fragment",
        "propose_link",
        "propose_node",
      ]);
      expect(byName.propose_fragment).toEqual(IngestToolInputJsonSchemas.propose_fragment);
      expect(byName.propose_node).toEqual(IngestToolInputJsonSchemas.propose_node);
      expect(byName.propose_link).toEqual(IngestToolInputJsonSchemas.propose_link);
      expect(byName.propose_attribute).toEqual(IngestToolInputJsonSchemas.propose_attribute);
    } finally {
      await app.close();
    }
  });

  it("tools/call without ambient run id returns STRUCTURAL_INVALID envelope and writes no tool_call row (BR-21 + BR-23 exception)", async () => {
    // BR-23 exception: the transport's "no ambient run" reject path is the
    // ONLY route through the system that does NOT persist a `tool_call`
    // audit row. This test pins that behaviour: a propose-* invocation
    // without the X-LLM-Run-Id header must short-circuit before any DB
    // connection is opened.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: {
            name: "propose_fragment",
            arguments: {
              text: "anything",
              confidence: 0.9,
              chunk_ids: ["66666666-6666-4666-8666-666666666666"],
            },
          },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result?: { ok: boolean; error?: { code: string } };
      };
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("STRUCTURAL_INVALID");
      expect(calls.poolConnects).toBe(0);
      expect(calls.toolCallInserts).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("tools/call with ambient run id but unknown tool name returns NOT_FOUND envelope", async () => {
    // Unknown tool names must surface as a NOT_FOUND envelope inside the
    // JSON-RPC `result` field — consistent with the project's MCP envelope
    // convention (HTTP 200, transport `error` field reserved for JSON-RPC).
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: {
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: { name: "propose_unicorn", arguments: {} },
        },
        headers: { [LLM_RUN_HEADER]: RUN_ID },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result?: { ok: boolean; error?: { code: string } };
      };
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("NOT_FOUND");
      // No business handler reached -> no DB call.
      expect(calls.poolConnects).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("tools/call accepts a fully-qualified tool name (`ingest.propose_fragment`)", async () => {
    // MCP clients sometimes pass the fully-qualified tool name. The
    // transport strips the `ingest.` prefix so we never refuse a legitimate
    // call. We assert the dispatch reaches the handler (pool.connect is
    // called) — the handler will then reject the run since our fake pool
    // returns no llm_run row, but that's downstream of the transport.
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: {
          jsonrpc: "2.0",
          id: 11,
          method: "tools/call",
          params: {
            name: "ingest.propose_fragment",
            arguments: {
              text: "any",
              confidence: 0.9,
              chunk_ids: ["66666666-6666-4666-8666-666666666666"],
            },
          },
        },
        headers: { [LLM_RUN_HEADER]: RUN_ID },
      });
      expect(res.statusCode).toBe(200);
      // Pool was reached -> the transport correctly resolved the qualified
      // name to the registered tool.
      expect(calls.poolConnects).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  it("tools/call with malformed params (no `name` field) returns STRUCTURAL_INVALID envelope", async () => {
    // Defensive: a malformed `tools/call` payload must produce a
    // well-formed envelope, not a 500 or a JSON-RPC INVALID_PARAMS leak
    // (we keep INVALID_PARAMS reserved for the wire-protocol layer; the
    // missing `name` is a semantic problem the envelope describes).
    const calls: FakeDbCalls = { toolCallInserts: 0, poolConnects: 0 };
    const app = await buildTransportApp(calls);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp",
        payload: {
          jsonrpc: "2.0",
          id: 13,
          method: "tools/call",
          params: { arguments: { foo: 1 } }, // no `name`
        },
        headers: { [LLM_RUN_HEADER]: RUN_ID },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result?: { ok: boolean; error?: { code: string } };
      };
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });
});
