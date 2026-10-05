import { expect, it } from "vitest";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { registerIngestToolset } from "../../../modules/ingestion/index.js";
import {
  DOCUMENT_CONTEXT,
  HOLDS_NONE,
  RUN_ID,
  runReadPool,
  type HeldDocumentContext,
} from "./run-document-context-fixture.js";

const silentLogger = pino({ level: "silent" });

interface Envelope {
  ok: boolean;
  result?: Record<string, unknown>;
}

async function readStatusAnswer(
  held: HeldDocumentContext,
  promptVersion: string
): Promise<Record<string, unknown>> {
  const mcp = buildMcpServer(silentLogger);
  registerIngestToolset({
    mcp,
    pool: runReadPool({
      status: "completed",
      prompt_version: promptVersion,
      held,
    }),
    logger: silentLogger,
    catalog: buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    }),
    env: {
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-5",
      CONTEXT_MODEL: "claude-haiku-4-5",
    },
  });
  const tool = mcp.getTool("ingest", "get_ingestion_status");
  if (tool === undefined) throw new Error("get_ingestion_status is not registered");
  const envelope = (await tool.handler({ llm_run_id: RUN_ID })) as Envelope;
  expect(envelope.ok).toBe(true);
  return envelope.result ?? {};
}

it("carries the document context status of a run that holds one over MCP", async () => {
  const result = await readStatusAnswer({ status: "too-long", context: null }, "v5");

  expect(result.document_context_status).toBe("too-long");
});

it("carries the whole document context of a run that holds one over MCP", async () => {
  const result = await readStatusAnswer(
    { status: "produced", context: DOCUMENT_CONTEXT },
    "v5"
  );

  expect(result.document_context).toEqual(DOCUMENT_CONTEXT);
});

it("carries no document context for a run that holds none over MCP", async () => {
  const result = await readStatusAnswer({ status: "failed", context: null }, "v5");

  expect(result.document_context ?? null).toBeNull();
});

it("carries no document context status for a run that holds none over MCP", async () => {
  const result = await readStatusAnswer(HOLDS_NONE, "v4");

  expect(result.document_context_status ?? null).toBeNull();
});
