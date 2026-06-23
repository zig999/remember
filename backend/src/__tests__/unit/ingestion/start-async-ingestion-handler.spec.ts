// Unit tests for the `start_async_ingestion` MCP handler (BR-32 / TC-01).
//
// WHY these matter: BR-32 is the ASYNC sibling of `ingest_document`. Its
// glue contract is what distinguishes it from BR-30 and what a regression
// would silently break:
//   1. new-run path -> return immediately with `run_status: 'running'` AND
//      schedule background extraction (the spec's "fire-and-forget").
//   2. noop_existing (idempotency BR-08) -> NO background extraction is
//      scheduled. A regression would re-run (and bill) extraction on every
//      duplicate submission, and worse, mutate a run that the prior call
//      already owned.
//   3. background failure -> the detached promise rejection MUST be caught
//      (top-level `.catch`) so `unhandledRejection` cannot crash the BFF
//      (BR-32 step 4 makes this mandatory). The handler itself MUST NOT
//      throw on a background failure — the caller has already returned.
//   4. Zod failure -> STRUCTURAL_INVALID envelope, no run created, no
//      background work (this is gated by the toolset registrar — the test
//      for the registrar gate lives separately).
//   5. pg down -> SYSTEM_SERVICE_UNAVAILABLE envelope (mirrors BR-30 step 2,
//      pinned so we never leak `err.message` through the SDK kernel).
//
// Collaborators are injected (the handler's DI seams — same pattern as
// `ingest-document-handler.spec.ts`) so we exercise the branch logic
// WITHOUT a database. `scheduleBackground` is also a seam: tests pass a
// synchronous scheduler so they can observe the detached task's outcome.

import { describe, expect, it, vi } from "vitest";

import {
  startAsyncIngestionHandler,
  type StartAsyncIngestionDeps,
} from "../../../modules/ingestion/mcp/start-async-ingestion.handler.js";
import { DEFAULT_INGEST_MODEL } from "../../../modules/ingestion/mcp/ingest-document.handler.js";
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
  } as unknown as StartAsyncIngestionDeps["pool"];
}

const logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
} as unknown as StartAsyncIngestionDeps["logger"];

const baseInput = {
  content: "Rodrigo lidera o Projeto Apollo.",
  source_type: "outro" as const,
  metadata: {},
};

function makeDeps(over: Partial<StartAsyncIngestionDeps>): StartAsyncIngestionDeps {
  return {
    pool: fakePool(),
    logger,
    catalog: {} as unknown as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test-key",
    // Default scheduler in tests is synchronous so we can observe the detached
    // promise's outcome deterministically. Production uses `setImmediate`.
    scheduleBackground: (task) => {
      void task();
    },
    ...over,
  };
}

describe("startAsyncIngestionHandler", () => {
  it("created → returns {ingested, running} immediately AND fires background extraction", async () => {
    // WHY: the whole point of BR-32 is that the response does not wait for
    // extraction. The handler must return `run_status: 'running'` (NOT the
    // full run summary), and the orchestrator must be invoked (once, with
    // the run id the upload just created).
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

    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      outcome: "ingested",
      raw_information_id: "raw-1",
      llm_run_id: "run-1",
      chunk_count: 3,
      run_status: "running",
    });
    // Background extraction MUST have been scheduled against the new run id.
    expect(runExtraction).toHaveBeenCalledOnce();
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

  it("noop_existing → `already_ingested` + run_status, WITHOUT scheduling extraction", async () => {
    // WHY: a duplicate submission must not re-run (and bill) extraction nor
    // mutate the existing run. This is the BR-08 idempotency guarantee
    // mirrored from BR-30 — re-running here would double-charge the LLM and
    // race with the original run.
    const ingestRaw = noopIngestRaw();
    const runExtraction = vi.fn();

    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
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

  it("noop_existing (FAILED prior run) → surfaces run_status='failed' + not-completed message", async () => {
    // Fail-loud regression (mirrors the BR-30 C1 finding): a previously-
    // failed run must not be reported as a clean success. The recovery
    // limitation (no MCP retry tool) is stated in the message.
    const ingestRaw = noopIngestRaw();
    const runExtraction = vi.fn();

    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
        readRunStatus: async () => "failed",
      })
    );

    expect(env.ok).toBe(true);
    const result = env.result as { run_status: string; message: string };
    expect(result.run_status).toBe("failed");
    expect(result.message).toMatch(/not completed|recovery/i);
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("background extraction rejection → logged at ERROR, does NOT escape to the handler", async () => {
    // WHY this matters: BR-32 step 4 makes the top-level .catch MANDATORY.
    // An unhandled rejection in the detached promise would crash the BFF
    // (Node's default unhandledRejection policy). A regression that drops
    // the .catch would let this test surface the failure as a thrown error
    // out of the synchronous scheduler.
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "raw-bg",
        llm_run_id: "run-bg",
        chunk_count: 1,
        content_hash: "9".repeat(64),
        chunks: [],
        idempotency_key: "8".repeat(64),
      },
    });
    const runExtraction = vi
      .fn()
      .mockRejectedValue(new Error("provider exploded"));
    const errorLog = vi.fn();
    const localLogger = { ...logger, error: errorLog } as unknown as
      StartAsyncIngestionDeps["logger"];

    // The synchronous scheduler returns the detached promise's settlement
    // via the next microtask — we capture and await it to assert the catch.
    let detached: Promise<unknown> | undefined;
    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        logger: localLogger,
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
        scheduleBackground: (task) => {
          detached = task();
        },
      })
    );

    // Handler MUST have returned the new-run envelope BEFORE the background
    // task settles — that is the whole async contract.
    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      outcome: "ingested",
      llm_run_id: "run-bg",
      run_status: "running",
    });

    // Now drive the detached task to completion — the .catch must swallow
    // and log. If the .catch were missing, this `await` would re-throw and
    // fail the test.
    expect(detached).toBeDefined();
    await expect(detached!).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalledWith(
      expect.objectContaining({ llm_run_id: "run-bg" }),
      "start_async_ingestion_background_extraction_failed"
    );
  });

  it("intake error (non-pg) → ok:false INTERNAL envelope, NOT a thrown exception (mirrors BR-30)", async () => {
    // Same regression guard as BR-30 step 2: if the throw escaped here, the
    // SDK kernel would render `err.message` verbatim (the BR-09 invariant
    // text + idempotency key) on the wire. Map to a generic INTERNAL with
    // the raw message kept only in server-side logs.
    const ingestRaw = vi
      .fn()
      .mockRejectedValue(
        new Error("BR-09 invariant violated: idempotency_key abc123 …")
      );
    const runExtraction = vi.fn();

    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("INTERNAL");
    expect(env.error?.message ?? "").not.toContain("idempotency_key");
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("intake error (pg unavailable) → ok:false SYSTEM_SERVICE_UNAVAILABLE", async () => {
    const pgErr = Object.assign(new Error("connection refused"), {
      code: "ECONNREFUSED",
    });
    const ingestRaw = vi.fn().mockRejectedValue(pgErr);
    const runExtraction = vi.fn();

    const env = await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
      })
    );

    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("defaults model + prompt_version when the caller omits them (matches BR-30 byte-for-byte)", async () => {
    // The two tools must produce byte-equivalent `llm_run` rows on the new-
    // run path (BR-32 "Defaults" paragraph). Pin the defaults so a future
    // accidental divergence fails this test.
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

    await startAsyncIngestionHandler(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
      })
    );

    const sentBody = ingestRaw.mock.calls[0]?.[1] as {
      model: string;
      prompt_version: string;
    };
    expect(sentBody.model).toBe(DEFAULT_INGEST_MODEL);
    expect(sentBody.prompt_version).toBe(DEFAULT_PROMPT_VERSION);
  });
});
