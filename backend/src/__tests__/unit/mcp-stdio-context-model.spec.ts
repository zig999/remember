import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { McpHttpTool } from "../../mcp/sdk-http-transport.js";
import type { RunExtractionDeps } from "../../modules/ingestion/service/extraction.service.js";

const mocks = vi.hoisted(() => {
  const client = {
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => undefined,
  };
  return {
    pool: {
      connect: async () => client,
      on: () => undefined,
      end: async () => undefined,
    },
    runLlmExtraction: vi.fn(),
    ingestRawInformation: vi.fn(),
    buildConfiguredMcpServer: vi.fn(),
  };
});

vi.mock("../../config/db.js", () => ({
  buildPool: () => mocks.pool,
  pingDatabase: async () => undefined,
}));

vi.mock("../../modules/knowledge-graph/index.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../modules/knowledge-graph/index.js")>();
  return {
    ...actual,
    loadCatalog: async () => ({
      nodeTypeById: new Map(),
      linkTypeById: new Map(),
      linkTypeRules: [],
      attributeKeyById: new Map(),
    }),
  };
});

vi.mock("../../modules/ingestion/index.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../modules/ingestion/index.js")>();
  return { ...actual, loadCatalog: async () => ({}) };
});

vi.mock(
  "../../modules/ingestion/service/extraction.service.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../modules/ingestion/service/extraction.service.js")
      >();
    return { ...actual, runLlmExtraction: mocks.runLlmExtraction };
  }
);

vi.mock(
  "../../modules/ingestion/service/ingestion.service.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../modules/ingestion/service/ingestion.service.js")
      >();
    return { ...actual, ingestRawInformation: mocks.ingestRawInformation };
  }
);

vi.mock("../../mcp/sdk-http-transport.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../mcp/sdk-http-transport.js")>();
  return { ...actual, buildConfiguredMcpServer: mocks.buildConfiguredMcpServer };
});

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class {},
}));

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const CONFIGURED_CONTEXT_MODEL = "claude-context-under-test";

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

async function advertisedStdioTools(): Promise<readonly McpHttpTool[]> {
  await vi.waitFor(() =>
    expect(mocks.buildConfiguredMcpServer).toHaveBeenCalled()
  );
  const options = mocks.buildConfiguredMcpServer.mock.calls[0]?.[0] as {
    tools: readonly McpHttpTool[];
  };
  return options.tools;
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("LOG_LEVEL", "silent");
  vi.stubEnv("DATABASE_URL", "postgresql://user:pw@localhost:5432/db");
  vi.stubEnv("NEON_AUTH_URL", "https://ep-test.neon.tech/neondb/auth");
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-fixture");
  vi.stubEnv("CONTEXT_MODEL", CONFIGURED_CONTEXT_MODEL);
  vi.spyOn(process, "once").mockImplementation(() => process);
  vi.spyOn(process.stdin, "once").mockImplementation(() => process.stdin);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${String(code)})`);
  }) as never);
  mocks.buildConfiguredMcpServer.mockReturnValue({
    connect: async () => undefined,
  });
  mocks.ingestRawInformation.mockResolvedValue(CREATED_INTAKE);
  mocks.runLlmExtraction.mockResolvedValue({ id: RUN_ID, status: "completed" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("hands the configured context model to the orchestrator from the stdio server", async () => {
  await import("../../mcp-stdio.js");
  const tools = await advertisedStdioTools();

  await tools.find((t) => t.name === "ingest_document")?.handler({
    content: "Rodrigo lidera o Projeto Apollo.",
    source_type: "outro",
  });

  const deps = mocks.runLlmExtraction.mock.calls[0]?.[4] as
    | RunExtractionDeps
    | undefined;
  expect(deps?.env.CONTEXT_MODEL).toBe(CONFIGURED_CONTEXT_MODEL);
});
