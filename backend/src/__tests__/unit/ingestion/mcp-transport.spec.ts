// TC-MCI-001 — Ingest MCP transport on the shared SDK transport kernel.
//
// What this suite owns (post-SDK migration, v1.2.4):
//   - `tools/list` always returns the four propose_* tool names with schemas
//     (no per-session gating — the per-session factory is RETIRED).
//   - `tools/call` dispatches each name to its handler (args forwarded
//     verbatim including the `llm_run_id` argument — Option B run binding).
//   - The closed set is STRUCTURAL: only `toolNames` are registered, so a
//     curation `merge_nodes` / query `get_node` / unknown name is unreachable
//     (isError NOT_FOUND).
//   - No `X-LLM-Run-Id` ambient header is read or required (the previous
//     `LLM_RUN_HEADER` symbol no longer exists).
//   - `initialize` handshake advertises serverInfo + tools capability.
//
// JSON-RPC framing, protocol-version negotiation, malformed-request handling,
// and the qualified-name alias are now the SDK's responsibility, so those
// hand-rolled-transport assertions were removed.
//
// Strategy: stub the 4 handlers via vi.fn on a fresh registry; exercise via
// app.inject(). No service layer, no pg, no auth.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  INGEST_TOOL_NAMES,
  registerIngestMcpTransport,
} from "../../../modules/ingestion/index.js";

const silentLogger = pino({ level: "silent" });

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

const RUN_ID = "44444444-4444-4444-4444-444444444444";

interface Fixture {
  app: FastifyInstance;
  handlers: Record<string, ReturnType<typeof vi.fn>>;
}

async function setupTransport(): Promise<Fixture> {
  const mcp = buildMcpServer(silentLogger);
  const handlers: Record<string, ReturnType<typeof vi.fn>> = {};

  // Register the four propose_* tools with stub handlers that echo the input.
  for (const name of INGEST_TOOL_NAMES) {
    const fn = vi.fn(async (input: unknown) => ({
      ok: true as const,
      result: { tool: name, args: input },
    }));
    handlers[name] = fn;
    mcp.registerTool("ingest", {
      name,
      description: `stub ${name}`,
      inputSchema: z.unknown(),
      handler: fn,
    });
  }

  // Foreign tools the closed set MUST NOT expose (registered on other keys).
  mcp.registerTool("curation", {
    name: "merge_nodes",
    description: "curation tool",
    inputSchema: z.unknown(),
    handler: vi.fn(async () => ({ ok: true as const, result: {} })),
  });
  mcp.registerTool("query", {
    name: "get_node",
    description: "query tool",
    inputSchema: z.unknown(),
    handler: vi.fn(async () => ({ ok: true as const, result: {} })),
  });

  const app = Fastify({ logger: false });
  await registerIngestMcpTransport(app, {
    logger: silentLogger,
    mcp,
    toolNames: [...INGEST_TOOL_NAMES],
  });
  await app.ready();
  return { app, handlers };
}

// ---- MCP call helpers ----

function rpc(method: string, params?: unknown): object {
  return { jsonrpc: "2.0", id: 1, method, ...(params !== undefined ? { params } : {}) };
}
function toolCall(name: string, args: Record<string, unknown> = {}): object {
  return rpc("tools/call", { name, arguments: args });
}
async function post(app: FastifyInstance, body: object) {
  return app.inject({
    method: "POST",
    url: "/mcp/ingest",
    headers: { accept: MCP_ACCEPT },
    payload: body,
  });
}
interface ToolResult {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  tools?: Array<{ name: string; description: string; inputSchema?: unknown }>;
}
function result(res: { json: () => unknown }): ToolResult {
  return (res.json() as { result: ToolResult }).result;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ingest transport — initialize", () => {
  it("advertises serverInfo + tools capability", async () => {
    const { app } = await setupTransport();
    try {
      const res = await post(
        app,
        rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "t", version: "0" },
        })
      );
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { serverInfo?: { name: string }; capabilities?: { tools?: unknown } };
      };
      expect(body.result.serverInfo?.name).toBe("remember-bff-ingest");
      expect(body.result.capabilities?.tools).toBeDefined();
    } finally {
      await app.close();
    }
  });
});

describe("ingest transport — tools/list (always lists all 4 tools, no gating)", () => {
  it("returns exactly the 4 propose_* names with schemas (no X-LLM-Run-Id needed)", async () => {
    // BR-21 (revised, v1.2.4): the per-session factory is retired — tools are
    // always listed by `tools/list`, regardless of any header / argument
    // state. The closed whitelist mirrors INGEST_TOOL_NAMES.
    const { app } = await setupTransport();
    try {
      const res = await post(app, rpc("tools/list"));
      expect(res.statusCode).toBe(200);
      const tools = result(res).tools ?? [];
      expect(tools.map((t) => t.name).sort()).toEqual([...INGEST_TOOL_NAMES].sort());
      for (const t of tools) {
        expect(t.inputSchema).toBeTypeOf("object");
        expect(t.description.length).toBeGreaterThan(0);
      }
    } finally {
      await app.close();
    }
  });

  it("does NOT read any X-LLM-Run-Id header (no gating on request headers)", async () => {
    // The X-LLM-Run-Id ambient header is RETIRED in v1.2.4. Sending it has
    // no effect on dispatch; tools/list remains the full closed whitelist.
    const { app } = await setupTransport();
    try {
      const res = await app.inject({
        method: "POST",
        url: "/mcp/ingest",
        headers: { accept: MCP_ACCEPT, "x-llm-run-id": "ignored" },
        payload: rpc("tools/list"),
      });
      expect(res.statusCode).toBe(200);
      const tools = result(res).tools ?? [];
      expect(tools.map((t) => t.name).sort()).toEqual([...INGEST_TOOL_NAMES].sort());
    } finally {
      await app.close();
    }
  });
});

describe("ingest transport — tools/call dispatch", () => {
  for (const name of INGEST_TOOL_NAMES) {
    it(`dispatches \`${name}\` to its handler with the args forwarded verbatim`, async () => {
      // Option B run binding: `llm_run_id` is passed as a tool argument, not
      // as a header. The SDK kernel does not unwrap it — the handler sees the
      // full arguments object (the per-tool registrar splits it inside the
      // handler).
      const { app, handlers } = await setupTransport();
      try {
        const args = { llm_run_id: RUN_ID, payload: "x" };
        const res = await post(app, toolCall(name, args));
        expect(res.statusCode).toBe(200);
        expect(result(res).isError).toBeFalsy();
        expect(handlers[name]).toHaveBeenCalledTimes(1);
        expect(handlers[name]).toHaveBeenCalledWith(args);
      } finally {
        await app.close();
      }
    });
  }
});

describe("ingest transport — closed tool set (structural)", () => {
  it("a curation `merge_nodes` on the shared registry is unreachable (isError)", async () => {
    // The curation tool IS registered on the shared McpServer (under the
    // `curation` toolset key); the closed whitelist must refuse it.
    const { app, handlers } = await setupTransport();
    try {
      const res = await post(app, toolCall("merge_nodes", {}));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
      for (const fn of Object.values(handlers)) expect(fn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("a query `get_node` on the shared registry is unreachable (isError)", async () => {
    const { app } = await setupTransport();
    try {
      const res = await post(app, toolCall("get_node", {}));
      expect(result(res).isError).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("an unknown tool name is unreachable (isError)", async () => {
    const { app } = await setupTransport();
    try {
      const res = await post(app, toolCall("does_not_exist", {}));
      expect(result(res).isError).toBe(true);
    } finally {
      await app.close();
    }
  });
});
