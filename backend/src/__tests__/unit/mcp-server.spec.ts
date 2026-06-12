// TC-01 acceptance: "The MCP server skeleton must allow toolset registration
// by each domain module." This suite exercises register/getTool/listTools and
// the duplicate-registration guard.

import { describe, expect, it } from "vitest";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer } from "../../mcp/server.js";

const silentLogger = pino({ level: "silent" });

describe("McpServer", () => {
  it("starts with an empty registry", () => {
    const mcp = buildMcpServer(silentLogger);
    expect(mcp.listTools()).toEqual([]);
  });

  it("registers a tool under a toolset and exposes the qualified key", () => {
    const mcp = buildMcpServer(silentLogger);
    mcp.registerTool("ingest", {
      name: "ingest_raw",
      description: "ingest a raw document",
      inputSchema: z.object({ content: z.string() }),
      handler: async () => ({ ok: true }),
    });
    expect(mcp.listTools()).toEqual(["ingest.ingest_raw"]);
    expect(mcp.getTool("ingest", "ingest_raw")).toBeDefined();
  });

  it("isolates tools across toolsets", () => {
    // Domain modules must be able to register tools with the same short name
    // under different toolsets (e.g. `query.get_node` and `curation.get_node`)
    // without colliding.
    const mcp = buildMcpServer(silentLogger);
    mcp.registerTool("query", {
      name: "get_node",
      description: "query side",
      inputSchema: z.object({ id: z.string() }),
      handler: async () => ({}),
    });
    mcp.registerTool("curation", {
      name: "get_node",
      description: "curation side",
      inputSchema: z.object({ id: z.string() }),
      handler: async () => ({}),
    });
    expect(mcp.listTools().sort()).toEqual([
      "curation.get_node",
      "query.get_node",
    ]);
  });

  it("rejects duplicate registration of the same key", () => {
    const mcp = buildMcpServer(silentLogger);
    const tool = {
      name: "get_node",
      description: "x",
      inputSchema: z.object({ id: z.string() }),
      handler: async () => ({}),
    };
    mcp.registerTool("query", tool);
    expect(() => mcp.registerTool("query", tool)).toThrowError(
      /already registered/
    );
  });

  it("returns undefined for an unknown tool", () => {
    const mcp = buildMcpServer(silentLogger);
    expect(mcp.getTool("ingest", "missing")).toBeUndefined();
  });
});
