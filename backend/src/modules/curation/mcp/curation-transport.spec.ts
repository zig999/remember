// Unit tests for the MCP curation transport (now on the shared SDK transport
// kernel, src/mcp/sdk-http-transport.ts).
//
// What this suite owns (post-SDK migration):
//   - tools/list returns the 8 names (7 curation + compliance_delete) with schemas.
//   - tools/call dispatches each name to its handler (args forwarded verbatim).
//   - the closed set is STRUCTURAL: only `toolNames` are registered, so ingest
//     `propose_node` / query `get_node` / unknown names are unreachable (isError).
//   - no X-LLM-Run-Id is required (BR-29 rule 2).
//   - initialize handshake advertises serverInfo + tools capability.
//
// JSON-RPC framing, protocol-version negotiation, unknown-method / malformed-
// request handling, and the qualified-name alias are now the SDK's
// responsibility, so those hand-rolled-transport assertions were removed.
//
// Strategy: stub the 8 handlers via vi.fn on a fresh registry; exercise via
// app.inject(). No service layer, no pg, no auth.

import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer } from "../../../mcp/server.js";
import { CURATION_TOOL_NAMES } from "./curation-toolset.js";
import { registerCurationMcpTransport } from "./curation-transport.js";

const silentLogger = pino({ level: "silent" });

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

interface Fixture {
  app: FastifyInstance;
  handlers: Record<string, ReturnType<typeof vi.fn>>;
}

async function setupTransport(): Promise<Fixture> {
  const mcp = buildMcpServer(silentLogger);
  const handlers: Record<string, ReturnType<typeof vi.fn>> = {};

  for (const name of [...CURATION_TOOL_NAMES, "compliance_delete"]) {
    const fn = vi.fn(async (input: unknown) => ({
      ok: true as const,
      result: { tool: name, args: input },
    }));
    handlers[name] = fn;
    mcp.registerTool("curation", {
      name,
      description: `stub ${name}`,
      inputSchema: z.unknown(),
      handler: fn,
    });
  }

  // Foreign tools the closed set MUST NOT expose (registered on other keys).
  mcp.registerTool("ingest", {
    name: "propose_node",
    description: "ingest tool",
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
  await registerCurationMcpTransport(app, {
    logger: silentLogger,
    mcp,
    toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"],
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
  return app.inject({ method: "POST", url: "/mcp/curation", headers: { accept: MCP_ACCEPT }, payload: body });
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

describe("curation transport — initialize", () => {
  it("advertises serverInfo + tools capability", async () => {
    const { app } = await setupTransport();
    try {
      const res = await post(
        app,
        rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } })
      );
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result: { serverInfo?: { name: string }; capabilities?: { tools?: unknown } } };
      expect(body.result.serverInfo?.name).toBe("remember-bff-curation");
      expect(body.result.capabilities?.tools).toBeDefined();
    } finally {
      await app.close();
    }
  });
});

describe("curation transport — tools/list", () => {
  it("returns exactly 8 names (7 curation + compliance_delete) with schemas", async () => {
    const { app } = await setupTransport();
    try {
      const res = await post(app, rpc("tools/list"));
      expect(res.statusCode).toBe(200);
      const tools = result(res).tools ?? [];
      expect(tools.map((t) => t.name).sort()).toEqual([...CURATION_TOOL_NAMES, "compliance_delete"].sort());
      for (const t of tools) {
        expect(t.inputSchema).toBeTypeOf("object");
        expect(t.description.length).toBeGreaterThan(0);
      }
    } finally {
      await app.close();
    }
  });
});

describe("curation transport — tools/call dispatch", () => {
  it("dispatches `merge_nodes` and forwards arguments verbatim", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await post(app, toolCall("merge_nodes", { survivor_id: "a", absorbed_id: "b" }));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBeFalsy();
      expect(handlers["merge_nodes"]).toHaveBeenCalledWith({ survivor_id: "a", absorbed_id: "b" });
    } finally {
      await app.close();
    }
  });

  it("dispatches compliance_delete (the 8th tool)", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await post(app, toolCall("compliance_delete", { raw_information_id: "x", reason: "owner-request" }));
      expect(result(res).isError).toBeFalsy();
      expect(handlers["compliance_delete"]).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  for (const name of CURATION_TOOL_NAMES) {
    it(`dispatches \`${name}\` to its handler`, async () => {
      const { app, handlers } = await setupTransport();
      try {
        const res = await post(app, toolCall(name, {}));
        expect(res.statusCode).toBe(200);
        expect(result(res).isError).toBeFalsy();
        expect(handlers[name]).toHaveBeenCalledTimes(1);
      } finally {
        await app.close();
      }
    });
  }
});

describe("curation transport — closed tool set (structural)", () => {
  it("an ingest `propose_node` on the shared registry is unreachable (isError)", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await post(app, toolCall("propose_node", {}));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBe(true);
      for (const fn of Object.values(handlers)) expect(fn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("a query `get_node` is unreachable (isError)", async () => {
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

describe("curation transport — BR-29 rule 2 header policy", () => {
  it("dispatches successfully without an X-LLM-Run-Id header", async () => {
    const { app, handlers } = await setupTransport();
    try {
      const res = await post(app, toolCall("list_review_queue", {}));
      expect(res.statusCode).toBe(200);
      expect(result(res).isError).toBeFalsy();
      expect(handlers["list_review_queue"]).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
