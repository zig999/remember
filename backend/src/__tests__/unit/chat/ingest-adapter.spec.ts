// TC-04 (v2.4) acceptance criteria covered for `service/ingest-adapter.ts`:
//
//   BR-43 step 1 — Zod parse failure -> STRUCTURAL_INVALID envelope.
//   BR-43 step 2 — pg-down -> SYSTEM_SERVICE_UNAVAILABLE; layered-validation
//     -> STRUCTURAL_INVALID; other unexpected -> SYSTEM_INTERNAL_ERROR
//     (sanitised message — never raw err.message).
//   BR-43 step 3 — On fresh `outcome:"created"` intake, `runLlmExtraction` is
//     scheduled via the `schedule` seam (setImmediate in prod) — NOT awaited;
//     the adapter resolves BEFORE the scheduled work runs.
//   BR-43 step 4 — On `outcome:"noop_existing"` intake, NO second extraction
//     is scheduled; envelope returns `outcome:"already_ingested"`.
//   BR-43 step 6 — `runLlmExtraction` rejection is caught and logged WARN
//     `chat.ingest_extraction_background_failure`; the adapter does NOT throw.

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import pino from "pino";

import { dispatchStartAsyncIngestion } from "../../../modules/chat/service/ingest-adapter.js";
import type {
  StartAsyncIngestionDeps,
  StartAsyncIngestionEnvelope,
} from "../../../modules/chat/service/ingest-adapter.js";
import { ValidationFailure } from "../../../modules/ingestion/validation/errors.js";

/** Synchronous schedule shim — the callback runs IMMEDIATELY when invoked, so
 *  tests can flush microtasks deterministically with a single `await
 *  flushPromises()` and inspect the post-schedule state. */
function syncSchedule(cb: () => void): void {
  cb();
}

/** Deferred schedule shim — keeps the callbacks queued so a test can
 *  assert "the adapter does NOT await the background work" by inspecting the
 *  envelope BEFORE manually flushing the queue. */
function makeDeferredSchedule(): {
  schedule: (cb: () => void) => void;
  flush: () => void;
  pending: () => number;
} {
  const queue: Array<() => void> = [];
  return {
    schedule: (cb: () => void) => {
      queue.push(cb);
    },
    flush: () => {
      while (queue.length > 0) {
        queue.shift()!();
      }
    },
    pending: () => queue.length,
  };
}

interface IntakeRow {
  readonly outcome: "created" | "noop_existing";
  readonly raw_information_id: string;
  readonly llm_run_id: string;
  readonly chunk_count: number;
}

function intakeOk(row: IntakeRow): StartAsyncIngestionDeps["ingestRaw"] {
  return (async () => ({
    status: row.outcome === "created" ? 201 : 200,
    body: {
      outcome: row.outcome,
      raw_information_id: row.raw_information_id,
      content_hash: "0".repeat(64),
      chunk_count: row.chunk_count,
      chunks: [],
      llm_run_id: row.llm_run_id,
      idempotency_key: "0".repeat(64),
    },
  })) as unknown as StartAsyncIngestionDeps["ingestRaw"];
}

function intakeThrows(err: unknown): StartAsyncIngestionDeps["ingestRaw"] {
  return (async () => {
    throw err;
  }) as unknown as StartAsyncIngestionDeps["ingestRaw"];
}

/** Fake `pg.Pool` that hands out a fake client which only stubs the queries
 *  the adapter's `withTransaction` wrapper issues (`BEGIN`/`COMMIT`/`ROLLBACK`).
 *  All actual SQL flows through the injected `ingestRaw` stub. */
function makePool(): { pool: any; releaseCount: () => number } {
  let releases = 0;
  const fakeClient = {
    query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    release: () => {
      releases += 1;
    },
  };
  const pool = {
    connect: async () => fakeClient,
  };
  return { pool, releaseCount: () => releases };
}

function baseDeps(
  overrides: Partial<StartAsyncIngestionDeps> = {}
): StartAsyncIngestionDeps {
  const { pool } = makePool();
  return {
    pool: pool as unknown as StartAsyncIngestionDeps["pool"],
    logger: pino({ level: "silent" }),
    catalog: {} as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test",
    schedule: syncSchedule,
    ...overrides,
  };
}

const VALID_INPUT = {
  source_type: "outro" as const,
  content: "lorem ipsum dolor sit amet",
};

const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe("chat/service/ingest-adapter (BR-43)", () => {
  it("BR-43 step 1: Zod parse failure -> STRUCTURAL_INVALID envelope", async () => {
    const ingestRaw = vi.fn();
    const runExtraction = vi.fn();
    const deps = baseDeps({
      ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
      runExtraction:
        runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
    });

    // Missing `content` -> Zod failure.
    const env = await dispatchStartAsyncIngestion({ source_type: "outro" }, deps);
    expect(env.ok).toBe(false);
    if (env.ok) throw new Error("unreachable");
    expect(env.error.code).toBe("STRUCTURAL_INVALID");
    expect(env.error.message).toMatch(/failed validation/);
    expect(env.error.details).toMatchObject({ issues: expect.any(Array) });
    // Intake / extraction never ran.
    expect(ingestRaw).not.toHaveBeenCalled();
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("BR-43 step 1: source_type outside catalog -> STRUCTURAL_INVALID", async () => {
    const deps = baseDeps({
      ingestRaw: vi.fn() as unknown as StartAsyncIngestionDeps["ingestRaw"],
    });
    const env = await dispatchStartAsyncIngestion(
      { source_type: "not_a_real_type", content: "hi" },
      deps
    );
    expect(env.ok).toBe(false);
    if (env.ok) throw new Error("unreachable");
    expect(env.error.code).toBe("STRUCTURAL_INVALID");
  });

  it("BR-43 step 3: ok:true + status:running + schedules runLlmExtraction (NOT awaited)", async () => {
    const def = makeDeferredSchedule();
    const runExtraction = vi.fn(async () => ({ /* run row, not asserted */ })) as unknown as StartAsyncIngestionDeps["runExtraction"];
    const deps = baseDeps({
      ingestRaw: intakeOk({
        outcome: "created",
        raw_information_id: "ri-1",
        llm_run_id: "rn-1",
        chunk_count: 3,
      }),
      runExtraction,
      schedule: def.schedule,
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);

    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    expect(env.result.outcome).toBe("ingested");
    expect(env.result.run_id).toBe("rn-1");
    expect(env.result.raw_information_id).toBe("ri-1");
    expect(env.result.status).toBe("running");
    expect(env.result.chunk_count).toBe(3);

    // Critical assertion: the adapter resolves with the background work
    // STILL pending (BR-43 step 6 / step 3). It does NOT await extraction.
    expect(def.pending()).toBe(1);
    expect(runExtraction).not.toHaveBeenCalled();

    def.flush();
    expect(runExtraction).toHaveBeenCalledTimes(1);
    // The args forwarded to runLlmExtraction include the llm_run_id from intake.
    expect((runExtraction as ReturnType<typeof vi.fn>).mock.calls[0]![1]).toBe(
      "rn-1"
    );
  });

  it("BR-43 step 4: outcome=noop_existing -> already_ingested + NO extraction scheduled", async () => {
    const def = makeDeferredSchedule();
    const runExtraction = vi.fn(async () => ({})) as unknown as StartAsyncIngestionDeps["runExtraction"];
    const deps = baseDeps({
      ingestRaw: intakeOk({
        outcome: "noop_existing",
        raw_information_id: "ri-2",
        llm_run_id: "rn-2",
        chunk_count: 5,
      }),
      runExtraction,
      schedule: def.schedule,
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);

    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    expect(env.result.outcome).toBe("already_ingested");
    expect(env.result.run_id).toBe("rn-2");
    expect(env.result.raw_information_id).toBe("ri-2");
    expect(env.result.status).toBe("running");
    expect(env.result.chunk_count).toBe(5);

    // No background work scheduled — the dedupe path returns immediately
    // without touching runLlmExtraction.
    expect(def.pending()).toBe(0);
    def.flush();
    expect(runExtraction).not.toHaveBeenCalled();
  });

  it("BR-43 step 6: runLlmExtraction rejection -> WARN log; adapter does NOT throw", async () => {
    const extractionError = new Error("anthropic refused, run failed");
    const runExtraction = vi.fn(async () => {
      throw extractionError;
    }) as unknown as StartAsyncIngestionDeps["runExtraction"];

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const deps = baseDeps({
      ingestRaw: intakeOk({
        outcome: "created",
        raw_information_id: "ri-3",
        llm_run_id: "rn-3",
        chunk_count: 2,
      }),
      runExtraction,
      // sync schedule + flushPromises lets us observe the catch handler firing.
      schedule: syncSchedule,
      logger: logger as unknown as StartAsyncIngestionDeps["logger"],
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps, {
      conversation_id: "cv-1",
      request_id: "req-1",
    });

    // Adapter still resolves with the success envelope — the failure is
    // observability-only on the chat side.
    expect(env.ok).toBe(true);

    // Let the rejected promise propagate to the .catch handler.
    await flushPromises();
    await flushPromises();

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [payload, msg] = (logger.warn as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    expect(payload.event).toBe("chat.ingest_extraction_background_failure");
    expect(payload.llm_run_id).toBe("rn-3");
    expect(payload.raw_information_id).toBe("ri-3");
    expect(payload.conversation_id).toBe("cv-1");
    expect(payload.request_id).toBe("req-1");
    expect(payload.err).toMatchObject({ message: extractionError.message });
    expect(msg).toMatch(/background runLlmExtraction rejected/);
  });

  it("BR-43 step 2: pg-down (Error with code 'ECONNREFUSED') -> SYSTEM_SERVICE_UNAVAILABLE", async () => {
    const pgErr = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });
    const deps = baseDeps({
      ingestRaw: intakeThrows(pgErr),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(false);
    if (env.ok) throw new Error("unreachable");
    expect(env.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    expect(env.error.message).toMatch(/temporarily unavailable/);
    // Sanitised — never leaks raw pg error message.
    expect(env.error.message).not.toMatch(/ECONNREFUSED/);
  });

  it("BR-43 step 2: layered-validation error (ValidationFailure) -> STRUCTURAL_INVALID", async () => {
    const validationErr = new ValidationFailure(
      "STRUCTURAL_INVALID",
      "intake content failed structural validation",
      { field: "content" }
    );
    const deps = baseDeps({
      ingestRaw: intakeThrows(validationErr),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(false);
    if (env.ok) throw new Error("unreachable");
    expect(env.error.code).toBe("STRUCTURAL_INVALID");
    expect(env.error.message).toBe(validationErr.message);
    expect(env.error.details).toMatchObject({ field: "content" });
  });

  it("BR-43 step 2: any other unexpected error -> SYSTEM_INTERNAL_ERROR + sanitised message", async () => {
    const surpriseErr = new Error("connection password was 'hunter2'");
    const deps = baseDeps({
      ingestRaw: intakeThrows(surpriseErr),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(false);
    if (env.ok) throw new Error("unreachable");
    expect(env.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    // Sanitised message — must NOT echo the raw err.message contents.
    expect(env.error.message).toMatch(/Failed to persist/);
    expect(env.error.message).not.toMatch(/hunter2/);
  });

  it("forwards optional model + prompt_version + metadata to ingestRawInformation", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "ri-4",
        content_hash: "0".repeat(64),
        chunk_count: 1,
        chunks: [],
        llm_run_id: "rn-4",
        idempotency_key: "0".repeat(64),
      },
    });
    const def = makeDeferredSchedule();
    const deps = baseDeps({
      ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
      runExtraction: (async () => ({})) as unknown as StartAsyncIngestionDeps["runExtraction"],
      schedule: def.schedule,
    });

    const result: StartAsyncIngestionEnvelope =
      await dispatchStartAsyncIngestion(
        {
          source_type: "outro",
          content: "x",
          metadata: { tag: "demo" },
          model: "claude-test-model",
          prompt_version: "v9",
        },
        deps
      );

    expect(result.ok).toBe(true);
    expect(ingestRaw).toHaveBeenCalledTimes(1);
    const passed = ingestRaw.mock.calls[0]![1];
    expect(passed).toMatchObject({
      source_type: "outro",
      content: "x",
      storage_ref: null,
      metadata: { tag: "demo" },
      model: "claude-test-model",
      prompt_version: "v9",
    });
  });

  it("falls back to deps.ingestModel and DEFAULT_PROMPT_VERSION when args are omitted", async () => {
    const ingestRaw = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        outcome: "created",
        raw_information_id: "ri-5",
        content_hash: "0".repeat(64),
        chunk_count: 1,
        chunks: [],
        llm_run_id: "rn-5",
        idempotency_key: "0".repeat(64),
      },
    });
    const def = makeDeferredSchedule();
    const deps = baseDeps({
      ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
      runExtraction: (async () => ({})) as unknown as StartAsyncIngestionDeps["runExtraction"],
      schedule: def.schedule,
      ingestModel: "sonnet-from-env",
    });

    await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    const passed = ingestRaw.mock.calls[0]![1];
    expect(passed.model).toBe("sonnet-from-env");
    expect(typeof passed.prompt_version).toBe("string");
    expect(passed.prompt_version.length).toBeGreaterThan(0);
  });
});
