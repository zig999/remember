import { describe, expect, it, vi } from "vitest";

import {
  ingestDocumentHandler,
  type IngestDocumentDeps,
} from "../../../modules/ingestion/mcp/ingest-document.handler.js";
import {
  selectPromptModule,
  UnknownPromptVersionError,
} from "../../../modules/ingestion/prompts/index.js";

const VERSION_RULE_REQUIRES_WHEN_NONE_IS_NAMED = "v5";
const EXPLICIT_VERSION = "v3";
const DECLARED_VERSIONS = ["v1", "v2", "v3", "v4", "v5"];
const VERSION_OUTSIDE_THE_ENUMERATION = "v6";

const logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
} as unknown as IngestDocumentDeps["logger"];

const baseInput = {
  content: "Rodrigo lidera o Projeto Apollo.",
  source_type: "outro" as const,
  metadata: {},
};

function fakePool(): IngestDocumentDeps["pool"] {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn(),
  };
  return {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as IngestDocumentDeps["pool"];
}

function createdIntake() {
  return vi.fn().mockResolvedValue({
    status: 201,
    body: {
      outcome: "created",
      raw_information_id: "raw-1",
      llm_run_id: "run-1",
      chunk_count: 1,
      content_hash: "a".repeat(64),
      chunks: [],
      idempotency_key: "b".repeat(64),
    },
  });
}

async function runHandlerAndReadOpenedRunBody(
  input: Parameters<typeof ingestDocumentHandler>[0]
): Promise<{ prompt_version: string }> {
  const ingestRaw = createdIntake();
  const runExtraction = vi
    .fn()
    .mockResolvedValue({ id: "run-1", status: "completed" });
  const deps: IngestDocumentDeps = {
    pool: fakePool(),
    logger,
    catalog: {} as unknown as IngestDocumentDeps["catalog"],
    anthropicApiKey: "sk-test-key",
    ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
    runExtraction:
      runExtraction as unknown as IngestDocumentDeps["runExtraction"],
  };

  await ingestDocumentHandler(input, deps);

  return ingestRaw.mock.calls[0]?.[1] as { prompt_version: string };
}

describe("default prompt version", () => {
  it("opens the run under v5 when an ingest_document call names no prompt version", async () => {
    const input = { ...baseInput };

    const opened = await runHandlerAndReadOpenedRunBody(input);

    expect(opened.prompt_version).toBe(
      VERSION_RULE_REQUIRES_WHEN_NONE_IS_NAMED
    );
  });

  it("opens the run under the version an ingest_document call names instead of the default", async () => {
    const input = { ...baseInput, prompt_version: EXPLICIT_VERSION };

    const opened = await runHandlerAndReadOpenedRunBody(input);

    expect(opened.prompt_version).toBe(EXPLICIT_VERSION);
  });
});

describe("prompt version enumeration", () => {
  it("resolves exactly v1 to v5 and refuses a version outside them", () => {
    const resolved = DECLARED_VERSIONS.map(
      (version) => selectPromptModule(version).version
    );

    expect(resolved).toEqual(DECLARED_VERSIONS);
    expect(() => selectPromptModule(VERSION_OUTSIDE_THE_ENUMERATION)).toThrow(
      UnknownPromptVersionError
    );
  });
});
