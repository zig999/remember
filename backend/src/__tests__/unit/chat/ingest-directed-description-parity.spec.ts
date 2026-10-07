import { beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pino from "pino";
import { z } from "zod";
import type { Pool } from "pg";

import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import {
  buildSnapshot,
  registerIngestMcpTransport,
  registerIngestToolset,
} from "../../../modules/ingestion/index.js";
import {
  CHAT_TOOL_NAMES,
  buildChatToolCatalog,
  __resetChatToolCatalogForTests,
} from "../../../modules/chat/service/tool-catalog.js";
import { buildToolDescriptors } from "../../../modules/chat/service/chat-agent.service.js";

const silentLogger = pino({ level: "silent" });
const MCP_ACCEPT = "application/json, text/event-stream";
const DIRECTED_TOOL = "ingest_directed";

interface ListedTool {
  readonly name: string;
  readonly description: string;
}

function buildRegistry(): McpServer {
  const mcp = buildMcpServer(silentLogger);
  for (const name of CHAT_TOOL_NAMES) {
    mcp.registerTool("query", {
      name,
      description: `stub query ${name}`,
      inputSchema: z.object({}),
      handler: async () => ({ ok: true }),
    });
  }
  registerIngestToolset({
    mcp,
    pool: {} as unknown as Pool,
    logger: silentLogger,
    catalog: buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    }),
    env: {
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "test-ingest-model",
      CONTEXT_MODEL: "test-context-model",
      CHAT_INGEST_ENABLED: true,
    },
  });
  return mcp;
}

async function mountIngestEndpoint(mcp: McpServer): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await registerIngestMcpTransport(app, {
    logger: silentLogger,
    mcp,
    toolNames: [DIRECTED_TOOL],
  });
  await app.ready();
  return app;
}

async function listedDescription(app: FastifyInstance): Promise<string | undefined> {
  const res = await app.inject({
    method: "POST",
    url: "/mcp/ingest",
    headers: { accept: MCP_ACCEPT },
    payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  });
  const body = res.json() as { result: { tools: ListedTool[] } };
  return body.result.tools.find((tool) => tool.name === DIRECTED_TOOL)?.description;
}

function chatDescription(mcp: McpServer): string | undefined {
  const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: true });
  if (catalog === undefined) return undefined;
  return buildToolDescriptors(catalog, silentLogger).find(
    (tool) => tool.name === DIRECTED_TOOL
  )?.description;
}

describe("ingest_directed description shared by the chat catalog and the MCP ingest endpoint", () => {
  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  it("presents the chat assistant exactly the text the MCP ingest endpoint lists for the tool", async () => {
    const mcp = buildRegistry();
    const app = await mountIngestEndpoint(mcp);
    try {
      const listed = await listedDescription(app);
      const presentedToChat = chatDescription(mcp);

      expect(listed).toBeTypeOf("string");
      expect(listed!.length).toBeGreaterThan(0);
      expect(presentedToChat).toBe(listed);
    } finally {
      await app.close();
    }
  });
});
