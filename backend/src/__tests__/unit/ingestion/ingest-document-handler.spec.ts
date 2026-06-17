// Unit tests for the `ingest_document` MCP handler (TC-MCI-002).
//
// WHY these matter: `ingest_document` is the one-shot ingestion entry point for
// external MCP clients (e.g. Claude Desktop). Its job is pure orchestration of
// two already-tested services, so the intent worth pinning is the GLUE:
//   1. created  -> run the extraction orchestrator, report `ingested`.
//   2. noop_existing (idempotency BR-08) -> DO NOT re-extract, report
//      `already_ingested`. A regression here would re-run (and bill) extraction
//      on every duplicate submission.
//   3. provider/extraction fatal -> a clean error envelope carrying the run id
//      and code (fail loud), NOT a thrown exception that escapes the tool.
//
// Collaborators are injected (the handler's DI seams) so we test the branching
// without a database, matching the repo's injection convention.

import { describe, expect, it, vi } from "vitest";

import {
  ingestDocumentHandler,
  DEFAULT_INGEST_MODEL,
  type IngestDocumentDeps,
} from "../../../modules/ingestion/mcp/ingest-document.handler.js";
import {
  LlmProviderFatalError,
  ExtractionFatalError,
} from "../../../modules/ingestion/service/extraction.service.js";
import { DEFAULT_PROMPT_VERSION } from "../../../modules/ingestion/prompts/index.js";

/** A pool whose only job is to satisfy the handler's BEGIN/COMMIT wrapper. */
function fakePool() {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn(),
  };
  return {
    connect: vi.fn().mockResolvedValue(client),
    _client: client,
  } as unknown as IngestDocumentDeps["pool"];
}

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

function makeDeps(over: Partial<IngestDocumentDeps>): IngestDocumentDeps {
  return {
    pool: fakePool(),
    logger,
    catalog: {} as unknown as IngestDocumentDeps["catalog"],
    anthropicApiKey: "sk-test-key",
    ...over,
  };
}

describe("ingestDocumentHandler", () => {
  it("created → drives extraction and reports `ingested`", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "raw-1",
        llm_run_id: "run-1",
        chunk_count: 3,
        content_hash: "a".repeat(64),
        chunks: [],
        idempotency_key: "b".repeat(64),
      },
    });
    const runExtraction = vi
      .fn()
      .mockResolvedValue({ id: "run-1", status: "completed" });

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      outcome: "ingested",
      raw_information_id: "raw-1",
      llm_run_id: "run-1",
      chunk_count: 3,
    });
    expect(runExtraction).toHaveBeenCalledOnce();
    // The orchestrator must be driven against the run the upload just created.
    expect(runExtraction.mock.calls[0]?.[1]).toBe("run-1");
  });

  function noopIngestRaw() {
    return vi.fn().mockResolvedValue({
      status: 200,
      body: {
        outcome: "noop_existing",
        raw_information_id: "raw-2",
        llm_run_id: "run-2",
        chunk_count: 5,
        content_hash: "c".repeat(64),
        chunks: [],
        idempotency_key: "d".repeat(64),
      },
    });
  }

  it("noop_existing (completed) → `already_ingested` + run_status, WITHOUT re-running extraction", async () => {
    const ingestRaw = noopIngestRaw();
    const runExtraction = vi.fn();

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
        readRunStatus: async () => "completed",
      })
    );

    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      outcome: "already_ingested",
      llm_run_id: "run-2",
      chunk_count: 5,
      run_status: "completed",
    });
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("noop_existing (FAILED prior run) → surfaces run_status='failed' and a not-completed message (fail loud)", async () => {
    // Regression guard for the C1 finding: a previously-failed run must NOT be
    // reported as a clean success. The client needs to know extraction did not
    // finish (recovery = re-run the LLMRun).
    const ingestRaw = noopIngestRaw();
    const runExtraction = vi.fn();

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
        readRunStatus: async () => "failed",
      })
    );

    expect(env.ok).toBe(true);
    const result = env.result as { run_status: string; message: string };
    expect(result.run_status).toBe("failed");
    expect(result.message).toMatch(/not completed|recovery/i);
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("provider fatal → ok:false envelope with the run id and provider code", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "raw-3",
        llm_run_id: "run-3",
        chunk_count: 1,
        content_hash: "e".repeat(64),
        chunks: [],
        idempotency_key: "f".repeat(64),
      },
    });
    const partial = { id: "run-3", status: "failed" } as never;
    const runExtraction = vi
      .fn()
      .mockRejectedValue(
        new LlmProviderFatalError("run-3", "Anthropic 529 overloaded", partial)
      );

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("SYSTEM_LLM_PROVIDER_UNAVAILABLE");
    expect(env.error?.details).toMatchObject({ llm_run_id: "run-3" });
  });

  it("extraction fatal → ok:false envelope with the internal-error code", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "raw-4",
        llm_run_id: "run-4",
        chunk_count: 2,
        content_hash: "1".repeat(64),
        chunks: [],
        idempotency_key: "2".repeat(64),
      },
    });
    const partial = { id: "run-4", status: "failed" } as never;
    const runExtraction = vi
      .fn()
      .mockRejectedValue(
        new ExtractionFatalError("run-4", "3 consecutive tool errors", partial)
      );

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(env.error?.details).toMatchObject({ llm_run_id: "run-4" });
  });

  it("defaults model + prompt_version when the caller omits them", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "raw-5",
        llm_run_id: "run-5",
        chunk_count: 1,
        content_hash: "3".repeat(64),
        chunks: [],
        idempotency_key: "4".repeat(64),
      },
    });
    const runExtraction = vi
      .fn()
      .mockResolvedValue({ id: "run-5", status: "completed" });

    await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
      })
    );

    // The upload body must carry the EXACT documented defaults (parts of the
    // idempotency key) when the caller omits them — a wrong/swapped default
    // must fail this test (Rule 9), so assert equality, not mere presence.
    const sentBody = ingestRaw.mock.calls[0]?.[1] as {
      model: string;
      prompt_version: string;
    };
    expect(sentBody.model).toBe(DEFAULT_INGEST_MODEL);
    expect(sentBody.prompt_version).toBe(DEFAULT_PROMPT_VERSION);
  });

  it("intake error (non-pg) → ok:false INTERNAL envelope, NOT a thrown exception", async () => {
    // Regression guard for the B1 finding: an error from step 1 (ingestRaw) must
    // be mapped to a clean envelope. If it escaped, the SDK kernel would turn it
    // into a JSON-RPC error leaking err.message (the BR-09 invariant text + ids).
    const ingestRaw = vi
      .fn()
      .mockRejectedValue(
        new Error("BR-09 invariant violated: idempotency_key abc123 …")
      );
    const runExtraction = vi.fn();

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as IngestDocumentDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("INTERNAL");
    // Must NOT leak the internal message verbatim.
    expect(env.error?.message ?? "").not.toContain("idempotency_key");
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("intake error (pg unavailable) → ok:false SYSTEM_SERVICE_UNAVAILABLE", async () => {
    const pgErr = Object.assign(new Error("connection refused"), {
      code: "ECONNREFUSED",
    });
    const ingestRaw = vi.fn().mockRejectedValue(pgErr);

    const env = await ingestDocumentHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
  });
});
