import { beforeEach, expect, it, vi } from "vitest";
import pino from "pino";
import type { Pool } from "pg";

import { buildApp } from "../../../app.js";
import { loadEnv } from "../../../config/env.js";
import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import type { NeonAuth } from "../../../middleware/auth.js";
import type { CatalogSnapshot } from "../../../modules/ingestion/index.js";
import type { RunExtractionDeps } from "../../../modules/ingestion/service/extraction.service.js";

const mocks = vi.hoisted(() => ({
  runLlmExtraction: vi.fn(),
  ingestRawInformation: vi.fn(),
}));

vi.mock(
  "../../../modules/ingestion/service/extraction.service.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../modules/ingestion/service/extraction.service.js")
      >();
    return { ...actual, runLlmExtraction: mocks.runLlmExtraction };
  }
);

vi.mock(
  "../../../modules/ingestion/service/ingestion.service.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../modules/ingestion/service/ingestion.service.js")
      >();
    return { ...actual, ingestRawInformation: mocks.ingestRawInformation };
  }
);

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const CONFIGURED_CONTEXT_MODEL = "claude-context-under-test";
const CONFIGURED_INGEST_MODEL = "claude-ingest-other";
const silentLogger = pino({ level: "silent" });
const openAuth: NeonAuth = { preHandler: async () => undefined };

const CREATED_INTAKE = {
  status: 201,
  body: {
    outcome: "created",
    raw_information_id: "raw-1",
    llm_run_id: RUN_ID,
    chunk_count: 1,
    content_hash: "a".repeat(64),
    chunks: [],
    idempotency_key: "b".repeat(64),
  },
};

function buildFakePool(): Pool {
  const client = {
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => undefined,
  };
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
}

function buildConfiguredApp(mcp: McpServer) {
  const env = loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgresql://user:pw@localhost:5432/db",
    NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
    ANTHROPIC_API_KEY: "sk-ant-test-fixture",
    INGEST_MODEL: CONFIGURED_INGEST_MODEL,
    CONTEXT_MODEL: CONFIGURED_CONTEXT_MODEL,
  });
  return buildApp({
    env,
    logger: silentLogger,
    pool: buildFakePool(),
    auth: openAuth,
    mcp,
    ingestionCatalog: {} as unknown as CatalogSnapshot,
  });
}

function orchestratorDeps(): RunExtractionDeps | undefined {
  return mocks.runLlmExtraction.mock.calls[0]?.[4] as
    | RunExtractionDeps
    | undefined;
}

beforeEach(() => {
  mocks.runLlmExtraction.mockReset();
  mocks.ingestRawInformation.mockReset();
  mocks.runLlmExtraction.mockResolvedValue({ id: RUN_ID, status: "completed" });
  mocks.ingestRawInformation.mockResolvedValue(CREATED_INTAKE);
});

it("hands the configured context model to the orchestrator from the REST run-extraction route", async () => {
  const app = await buildConfiguredApp(buildMcpServer(silentLogger));

  try {
    await app.inject({
      method: "POST",
      url: `/api/v1/ingest/llm-runs/${RUN_ID}/run`,
      payload: {},
    });
  } finally {
    await app.close();
  }

  expect(orchestratorDeps()?.env.CONTEXT_MODEL).toBe(CONFIGURED_CONTEXT_MODEL);
});

it("hands the configured context model to the orchestrator from the MCP ingest toolset", async () => {
  const mcp = buildMcpServer(silentLogger);
  const app = await buildConfiguredApp(mcp);

  try {
    await mcp.getTool("ingest", "ingest_document")?.handler({
      content: "Rodrigo lidera o Projeto Apollo.",
      source_type: "outro",
    });
  } finally {
    await app.close();
  }

  expect(orchestratorDeps()?.env.CONTEXT_MODEL).toBe(CONFIGURED_CONTEXT_MODEL);
});
