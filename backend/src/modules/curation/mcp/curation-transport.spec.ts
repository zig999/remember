// Unit tests for the MCP curation transport (TC-mcc-03, BR-29).
//
// Acceptance criteria addressed (validation.criteria of dev_tc_mcc_003):
//   - tools/list returns the 8 curation tool names (7 owned + compliance_delete).
//   - tools/call dispatches to bare and fully-qualified names (`merge_nodes`
//     and `curation.merge_nodes` reach the same handler).
//   - tools/call with a tool outside the whitelist returns
//     { ok: false, error.code: "NOT_FOUND" } — `propose_node` (ingest) and
//     `get_node` (query) are both refused even though they live on the same
//     McpServer.
//   - `initialize` returns the protocol handshake.
//   - Malformed JSON-RPC envelope surfaces `INVALID_REQUEST` (-32600).
//   - Unknown method surfaces `METHOD_NOT_FOUND` (-32601).
//   - Malformed `tools/call` params surface `STRUCTURAL_INVALID` envelope.
//   - The transport does NOT read or require any `X-LLM-Run-Id` header
//     (BR-29 rule 2) — the test issues calls without it and they succeed.
//
// Strategy: build a minimal Fastify instance, register the curation transport
// on it, populate the shared `McpServer` registry with stub tools (the 7
// curation names + `compliance_delete`), and exercise the route via
// `app.inject()`. The McpServer + the per-tool handlers are stubbed with
// `vi.fn` so this spec stays a pure transport-level unit test (no service-
// layer, no pg, no auth).

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  CURATION_TOOL_NAMES,
  type CurationToolName,
} from "./curation-toolset.js";
import {
  registerCurationMcpTransport,
  type CurationMcpToolDescriptor,
} from "./curation-transport.js";

const silentLogger = pino({ level: "silent" });

// ---------------------------------------------------------------------------
// Test fixture — a fresh Fastify app + McpServer with 8 stub tools registered.
// Each tool's handler is a vi.fn so the tests can assert dispatch routing and
// argument forwarding.
// ---------------------------------------------------------------------------

interface Fixture {
  app: ReturnType<typeof Fastify>;
  mcp: ReturnType<typeof buildMcpServer>;
  handlers: Record<string, ReturnType<typeof vi.fn>>;
}

async function setupTransport(): Promise<Fixture> {
  const mcp = buildMcpServer(silentLogger);
  // Build per-tool stub handlers. Each returns a deterministic envelope so the
  // test can verify routing and argument forwarding.
  const handlers: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of CURATION_TOOL_NAMES) {
    const fn = vi.fn(async (input: unknown) => ({
      ok: true as const,
      result: { tool: name, args: input },
    }));
    handlers[name] = fn;
    mcp.registerTool("curation", {
      name,
      description: `stub ${name}`,
      // Inputs are not validated by the stub — the transport just forwards
      // the arguments object. The real Zod schemas live on the toolset module.
      inputSchema: z.unknown(),
      handler: fn,
    });
  }
  // Register compliance_delete as the eighth tool on the same toolset key
  // (mirrors what `registerComplianceToolset` does at boot).
  const complianceFn = vi.fn(async (input: unknown) => ({
    ok: true as const,
    result: { tool: "compliance_delete", args: input },
  }));
  handlers["compliance_delete"] = complianceFn;
  mcp.registerTool("curation", {
    name: "compliance_delete",
    description: "stub compliance_delete",
    inputSchema: z.unknown(),
    handler: complianceFn,
  });

  // Also register a few foreign tools the whitelist MUST refuse: an ingest
  // `propose_node` and a query `get_node`. The test asserts these are
  // unreachable on the curation transport.
  mcp.registerTool("ingest", {
    name: "propose_node",
    description: "ingest tool",
    inputSchema: z.unknown(),
    handler: vi.fn(async () => ({
      ok: true as const,
      result: { tool: "propose_node" },
    })),
  });
  mcp.registerTool("query", {
    name: "get_node",
    description: "query tool",
    inputSchema: z.unknown(),
    handler: vi.fn(async () => ({
      ok: true as const,
      result: { tool: "get_node" },
    })),
  });

  // Build the Fastify app and mount the transport directly. We do NOT register
  // the auth preHandler — this is a unit test of the transport, not of auth.
  const app = Fastify({ logger: false });
  const complianceDescriptor: CurationMcpToolDescriptor = {
    name: "compliance_delete",
    description: "stub compliance_delete",
    inputSchema: { type: "object" },
  };
  await registerCurationMcpTransport(app, {
    pool: {} as never,
    logger: silentLogger,
    mcp,
    extraTools: [complianceDescriptor],
  });
  await app.ready();
  return { app, mcp, handlers };
}

// ---------------------------------------------------------------------------
// Helpers — build JSON-RPC bodies + parse responses.
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown> = {}): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

function rpcList(): unknown {
  return { jsonrpc: "2.0", id: 1, method: "tools/list" };
}

function rpcInit(): unknown {
  return { jsonrpc: "2.0", id: 1, method: "initialize" };
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    ok?: boolean;
    result?: unknown;
    error?: { code: string; message: string; details?: unknown };
    tools?: Array<{ name: string; description: string; inputSchema: unknown }>;
    protocolVersion?: string;
    serverInfo?: { name: string; version: string };
    capabilities?: unknown;
  };
  error?: { code: number; message: string; data?: unknown };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// initialize handshake
// ---------------------------------------------------------------------------

describe("curation transport — initialize", () => {
  it("returns the protocol handshake", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcInit(),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.protocolVersion).toBe("2024-11-05");
      expect(body.result?.serverInfo?.name).toBe("remember-bff-curation");
      // capabilities surface tool support.
      expect(body.result?.capabilities).toEqual({ tools: {} });
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// tools/list — BR-29 rule 5 closed whitelist of 8 names.
// ---------------------------------------------------------------------------

describe("curation transport — tools/list (BR-29 rule 5)", () => {
  it("returns exactly 8 tool names — 7 curation + compliance_delete", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      const tools = body.result?.tools ?? [];
      const names = tools.map((t) => t.name).sort();
      const expected = [
        ...CURATION_TOOL_NAMES,
        "compliance_delete",
      ].sort();
      expect(names).toEqual(expected);
      // Every entry has a non-empty inputSchema (BR-31).
      for (const t of tools) {
        expect(t.inputSchema).toBeTypeOf("object");
        expect(t.description.length).toBeGreaterThan(0);
      }
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// tools/call — dispatch + whitelist
// ---------------------------------------------------------------------------

describe("curation transport — tools/call dispatch (BR-29 rule 6)", () => {
  it("dispatches the bare name `merge_nodes` to the handler", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("merge_nodes", { survivor_id: "a", absorbed_id: "b" }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(true);
      expect(handlers["merge_nodes"]).toHaveBeenCalledTimes(1);
      expect(handlers["merge_nodes"]).toHaveBeenCalledWith({
        survivor_id: "a",
        absorbed_id: "b",
      });
    } finally {
      await app.close();
    }
  });

  it("dispatches the fully-qualified name `curation.merge_nodes` to the same handler", async () => {
    // BR-29 rule 6 — both forms reach the same handler. The handler is called
    // with the bare arguments object, identical to the bare-name path.
    const { app, handlers } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("curation.merge_nodes", {
          survivor_id: "a",
          absorbed_id: "b",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(true);
      expect(handlers["merge_nodes"]).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it("dispatches compliance_delete to the compliance-audit handler (8th tool)", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("compliance_delete", {
          raw_information_id: "x",
          reason: "owner-request",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(true);
      expect(handlers["compliance_delete"]).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  for (const name of CURATION_TOOL_NAMES) {
    it(`dispatches \`${name}\` (bare) to its handler`, async () => {
      const { app, handlers } = await setupTransport();
      try {
        const res = await app.inject({
          method: "POST",
          url: "/mcp/curation",
          payload: rpcCall(name, {}),
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as JsonRpcEnvelope;
        expect(body.result?.ok).toBe(true);
        expect(handlers[name]).toHaveBeenCalledTimes(1);
      } finally {
        await app.close();
      }
    });
  }
});

// ---------------------------------------------------------------------------
// tools/call — whitelist enforcement (BR-29 rule 5)
// ---------------------------------------------------------------------------

describe("curation transport — closed whitelist (BR-29 rule 5)", () => {
  it("rejects `propose_node` (ingest tool) with NOT_FOUND", async () => {
    // The ingest tool IS registered on the shared McpServer; the transport
    // must refuse it regardless because it is outside the closed whitelist
    // of 8 names.
    const { app, handlers } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("propose_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("NOT_FOUND");
      // No curation handler was reached.
      for (const fn of Object.values(handlers)) {
        expect(fn).not.toHaveBeenCalled();
      }
    } finally {
      await app.close();
    }
  });

  it("rejects `get_node` (query tool) with NOT_FOUND", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("get_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("rejects fully-qualified foreign names (e.g. `ingest.propose_node`)", async () => {
    // The transport's bare-name extraction only strips the `curation.` prefix;
    // `ingest.propose_node` does not match and falls through to the whitelist
    // check verbatim.
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("ingest.propose_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("rejects an unknown tool name with NOT_FOUND", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: rpcCall("does_not_exist", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// JSON-RPC envelope errors
// ---------------------------------------------------------------------------

describe("curation transport — JSON-RPC envelope errors", () => {
  it("malformed JSON-RPC body surfaces INVALID_REQUEST (-32600)", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: { not: "json-rpc" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.error?.code).toBe(-32600);
      // id is null because the envelope itself was invalid.
      expect(body.id).toBeNull();
    } finally {
      await app.close();
    }
  });

  it("unknown method surfaces METHOD_NOT_FOUND (-32601)", async () => {
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: { jsonrpc: "2.0", id: 42, method: "completions/create" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.error?.code).toBe(-32601);
      expect(body.id).toBe(42);
    } finally {
      await app.close();
    }
  });

  it("malformed tools/call params surface STRUCTURAL_INVALID envelope", async () => {
    // `name` is required; arguments alone is not a valid params block.
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        payload: {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: { arguments: {} },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(false);
      expect(body.result?.error?.code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Header policy — BR-29 rule 2 (no X-LLM-Run-Id required).
// ---------------------------------------------------------------------------

describe("curation transport — BR-29 rule 2 header policy", () => {
  it("dispatches successfully without an X-LLM-Run-Id header", async () => {
    // The curation surface is callable outside any LLM run; the ingest
    // transport's `LLM_RUN_HEADER` MUST NOT be required here.
    const { app, handlers } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/curation",
        // No X-LLM-Run-Id header set on the request.
        payload: rpcCall("list_review_queue", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.ok).toBe(true);
      expect(handlers["list_review_queue"]).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
