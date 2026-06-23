// Unit tests for the chat-side ingest-adapter (`dispatchStartAsyncIngestion`).
//
// WHY these matter — `chat.back.md` §1 Testing rows (xvi) and (xviii):
//
//   (xvi) start_async_ingestion DISPATCH — the four bullet items the spec
//         pins are (1) ok:true envelope with status="running" on a fresh
//         intake, (2) chat_tool_call audit-row data exposed on the envelope
//         (BR-32 — the AUDIT row itself is persisted by the route, but the
//         FULL untruncated envelope MUST round-trip through the adapter
//         intact for the route to persist it; we assert the envelope shape),
//         (3) the adapter does NOT await `runLlmExtraction` (mandatory
//         never-resolving-promise stub — the chat HTTP response terminates
//         while the background promise is still pending), (4) the .catch(...)
//         is attached and emits `chat.ingest_extraction_background_failure`
//         WARN log on rejection (BR-43 step 6). Companion: dedupe path
//         (`outcome:'noop_existing'` from intake) yields
//         `already_ingested` and SCHEDULES NO extraction.
//
//   (xviii) LAYERED-VALIDATION ERROR MAPPING — when `ingestRawInformation`
//           rejects with a `ValidationFailure`, the adapter MUST emit
//           `ok:false` with `error.code: STRUCTURAL_INVALID` AND must NOT
//           throw (the chat-agent loop continues; the bad tool_result is
//           fed back to the model). Companion: pg-down → SYSTEM_SERVICE_
//           UNAVAILABLE; any other unexpected → SYSTEM_INTERNAL_ERROR with
//           sanitised message (no err.message leak — BR-23 spirit).
//
// All assertions encode WHY the behavior matters (Rule 9). The fire-and-
// forget proof uses a never-resolving promise stub so a regression that
// `await`-ed the extraction would deterministically hang the test (with a
// short test timeout) — proving the contract by impossibility-of-other-
// behavior, not by mock-call counting.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dispatchStartAsyncIngestion,
  type StartAsyncIngestionDeps,
} from "../ingest-adapter.js";
import { ValidationFailure } from "../../../ingestion/validation/errors.js";

/** Stub `pg.Pool` whose only contract is satisfying the `withTransaction`
 *  BEGIN/COMMIT wrapper. The ingest service's intake call is a DI stub, so
 *  the query() calls here are observability-only. */
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

function fakeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as StartAsyncIngestionDeps["logger"];
}

function makeDeps(
  overrides: Partial<StartAsyncIngestionDeps> = {}
): StartAsyncIngestionDeps {
  return {
    pool: fakePool(),
    logger: fakeLogger(),
    catalog: {} as unknown as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test-key",
    ...overrides,
  };
}

const baseInput = {
  content: "Rodrigo lidera o Projeto Apollo.",
  source_type: "outro" as const,
  metadata: {},
};

const fakeIntakeOk = {
  status: 201,
  body: {
    outcome: "created" as const,
    raw_information_id: "raw-abc",
    llm_run_id: "run-xyz",
    chunk_count: 3,
    content_hash: "a".repeat(64),
    chunks: [],
    idempotency_key: "b".repeat(64),
  },
};

const fakeIntakeNoop = {
  status: 200,
  body: {
    outcome: "noop_existing" as const,
    raw_information_id: "raw-dedupe",
    llm_run_id: "run-pre-existing",
    chunk_count: 5,
    content_hash: "c".repeat(64),
    chunks: [],
    idempotency_key: "d".repeat(64),
  },
};

describe("dispatchStartAsyncIngestion — BR-43 v2.4", () => {
  // The four bullets of row (xvi) — fresh intake, audit envelope, fire-and-
  // forget non-blocking, .catch(...) attached.
  describe("(xvi) fresh intake — outcome:'ingested' / status:'running'", () => {
    let extractionRunning: { resolve: () => void; reject: (e: unknown) => void };
    let extractionStub: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // A never-resolving promise — the linchpin of the "does NOT await"
      // assertion. If the adapter regressed to `await runExtraction(...)`,
      // every test in this block would hang to the vitest timeout.
      const pending = new Promise<void>((res, rej) => {
        extractionRunning = { resolve: res, reject: rej };
      });
      extractionStub = vi.fn().mockReturnValue(pending);
    });

    afterEach(() => {
      // Settle the pending promise so the test runner exits cleanly. We
      // resolve (not reject) so the .catch(...) is NOT triggered here —
      // the rejection-path test below installs its own pending promise.
      extractionRunning?.resolve();
    });

    it("returns ok:true with status='running' BEFORE extraction settles (proves fire-and-forget)", async () => {
      // The never-resolving extraction stub guarantees that if the adapter
      // awaited the extraction promise the await would never return and the
      // test would time out. The fact that we receive the envelope is itself
      // the proof that the adapter detached the extraction (BR-43 step 3 /
      // BR-32 step 4 of the underlying handler).
      const ingestRaw = vi.fn().mockResolvedValue(fakeIntakeOk);
      const scheduleSpy = vi.fn((cb: () => void) => cb()); // run synchronously

      const env = await dispatchStartAsyncIngestion(
        baseInput,
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            extractionStub as unknown as StartAsyncIngestionDeps["runExtraction"],
          schedule: scheduleSpy,
        })
      );

      expect(env.ok).toBe(true);
      // The result shape carries the fields the chat-agent surfaces back to
      // the model. status="running" is the only legal value on a fresh intake
      // — the extraction has not finished by definition.
      if (!env.ok) throw new Error("guarded above");
      expect(env.result).toMatchObject({
        outcome: "ingested",
        run_id: "run-xyz",
        raw_information_id: "raw-abc",
        status: "running",
        chunk_count: 3,
      });

      // The schedule callback fired exactly once — the adapter committed to
      // a single background extraction call (regression: a retry loop or a
      // double-schedule would fail this).
      expect(scheduleSpy).toHaveBeenCalledOnce();
      expect(extractionStub).toHaveBeenCalledOnce();
      // The extraction stub is still pending — it never settled, yet we got
      // the envelope. Proof of non-await.
    });

    it("forwards run/raw identifiers to runExtraction so background work targets the new run", async () => {
      // Anti-regression: if the wiring crossed two runs (e.g. forwarded the
      // intake's raw_information_id instead of llm_run_id, or used a stale
      // closure) the orchestrator would write fragments against the WRONG
      // run row. The argument order is asserted here so a refactor of the
      // signature cannot silently break the wire.
      const ingestRaw = vi.fn().mockResolvedValue(fakeIntakeOk);
      await dispatchStartAsyncIngestion(
        baseInput,
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            extractionStub as unknown as StartAsyncIngestionDeps["runExtraction"],
          schedule: (cb) => cb(),
        })
      );

      // Per `ingest-adapter.ts` line ~330: `runExtraction(pool, llm_run_id,
      // logger, catalog, extractionDeps)`. Assert the llm_run_id slot.
      const [poolArg, runIdArg, , catalogArg] = extractionStub.mock.calls[0]!;
      expect(poolArg).toBeDefined();
      expect(runIdArg).toBe("run-xyz");
      expect(catalogArg).toBeDefined();
    });
  });

  it("(xvi step 4) .catch(...) attached → WARN chat.ingest_extraction_background_failure on rejection, no throw", async () => {
    // BR-43 step 6: the background promise MUST have a top-level .catch so
    // an unhandledRejection never crashes the BFF. We install a stub that
    // rejects deterministically and assert (a) no throw escapes the adapter
    // (we await its return), (b) the WARN was emitted with the run ids
    // wired so an operator can correlate.
    const ingestRaw = vi.fn().mockResolvedValue(fakeIntakeOk);
    // A rejected promise; runExtraction stub returns it directly.
    const backgroundErr = new Error("simulated provider 529");
    const runExtraction = vi.fn().mockReturnValue(Promise.reject(backgroundErr));
    const logger = fakeLogger();

    const env = await dispatchStartAsyncIngestion(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
        logger,
        schedule: (cb) => cb(),
      })
    );

    // Synchronous-schedule + immediately-rejecting promise: yield a microtask
    // so the attached .catch handler runs before assertions.
    await new Promise((r) => setImmediate(r));

    expect(env.ok).toBe(true);
    // WARN-level log (not ERROR) is the agreed level for background failure
    // observability — ERROR is reserved for the intake step (server-side
    // catastrophe). A regression that downgraded to debug() or omitted the
    // call entirely would lose the only signal the operator has.
    expect(logger.warn).toHaveBeenCalled();
    const warnCalls = (logger.warn as ReturnType<typeof vi.fn>).mock.calls;
    const matching = warnCalls.find(
      ([p]) =>
        typeof p === "object" &&
        p !== null &&
        (p as Record<string, unknown>).event ===
          "chat.ingest_extraction_background_failure"
    );
    expect(matching).toBeDefined();
    const payload = matching![0] as Record<string, unknown>;
    // The run id is the operator's only key to correlate the background
    // failure with the prior tool_result the model already consumed.
    expect(payload).toMatchObject({
      event: "chat.ingest_extraction_background_failure",
      llm_run_id: "run-xyz",
      raw_information_id: "raw-abc",
    });
  });

  it("(xvi companion) outcome:'noop_existing' → 'already_ingested' AND NO background extraction scheduled", async () => {
    // BR-43 step 4 (idempotent dedupe): re-sending content that hashed to an
    // existing RawInformation returns the existing identifiers. A regression
    // that scheduled a second extraction on this path would bill an LLM run
    // for content already extracted — the audit row would also lie (two
    // active LLMRuns for one content_hash).
    const ingestRaw = vi.fn().mockResolvedValue(fakeIntakeNoop);
    const runExtraction = vi.fn();
    const scheduleSpy = vi.fn();

    const env = await dispatchStartAsyncIngestion(
      baseInput,
      makeDeps({
        ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        runExtraction:
          runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
        schedule: scheduleSpy,
      })
    );

    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("guarded above");
    expect(env.result.outcome).toBe("already_ingested");
    expect(env.result.run_id).toBe("run-pre-existing");
    expect(env.result.chunk_count).toBe(5);

    // The two negative assertions — neither scheduled nor invoked.
    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(runExtraction).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Row (xviii) — layered-validation error mapping
  // ---------------------------------------------------------------------------

  describe("(xviii) layered-validation error mapping", () => {
    it("ValidationFailure from intake → ok:false STRUCTURAL_INVALID; adapter does NOT throw (turn continues)", async () => {
      // The spec invariant: a layered-validation rejection is a business
      // RESULT, not an exception. The adapter MUST translate it into a
      // tool_result envelope; the chat-agent loop then feeds that envelope
      // back to the model on the same turn (the turn continues — Rule 9).
      const failure = new ValidationFailure(
        "STRUCTURAL_INVALID",
        "metadata.title must be a string",
        { field: "metadata.title" }
      );
      const ingestRaw = vi.fn().mockRejectedValue(failure);
      const runExtraction = vi.fn();
      const scheduleSpy = vi.fn();

      const env = await dispatchStartAsyncIngestion(
        baseInput,
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
          schedule: scheduleSpy,
        })
      );

      expect(env.ok).toBe(false);
      if (env.ok) throw new Error("guarded above");
      expect(env.error.code).toBe("STRUCTURAL_INVALID");
      // The original layered-validation details survive — they are useful to
      // the model when crafting a follow-up correction prompt.
      expect(env.error.details).toMatchObject({ field: "metadata.title" });
      // No background work fires on a structural reject.
      expect(scheduleSpy).not.toHaveBeenCalled();
      expect(runExtraction).not.toHaveBeenCalled();
    });

    it("pg-unavailable from intake → ok:false SYSTEM_SERVICE_UNAVAILABLE (NOT throw)", async () => {
      // Distinguishing pg-down from any-other-error matters: only pg-down
      // can plausibly recover on the SAME turn (a transient connection
      // blip). The model can suggest a retry. Other unexpected errors get
      // the sanitised INTERNAL code so we never leak err.message through
      // the model's view of the tool_result.
      const pgErr = Object.assign(new Error("connection refused"), {
        code: "ECONNREFUSED",
      });
      const ingestRaw = vi.fn().mockRejectedValue(pgErr);

      const env = await dispatchStartAsyncIngestion(
        baseInput,
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        })
      );

      expect(env.ok).toBe(false);
      if (env.ok) throw new Error("guarded above");
      expect(env.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    });

    it("unexpected error from intake → ok:false SYSTEM_INTERNAL_ERROR with sanitised message (no err.message leak)", async () => {
      // Regression guard for the spec's BR-23 spirit: never leak the raw
      // err.message — it can carry the BR-09 invariant text + idempotency
      // ids. A regression that returned `err.message` verbatim would leak
      // internal invariants to the model (and ultimately to the Owner-
      // facing transcript).
      const ingestRaw = vi
        .fn()
        .mockRejectedValue(
          new Error(
            "BR-09 invariant violated: idempotency_key 99999... please re-run."
          )
        );

      const env = await dispatchStartAsyncIngestion(
        baseInput,
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        })
      );

      expect(env.ok).toBe(false);
      if (env.ok) throw new Error("guarded above");
      expect(env.error.code).toBe("SYSTEM_INTERNAL_ERROR");
      // Must NOT leak the internal message verbatim.
      expect(env.error.message).not.toContain("idempotency_key");
      expect(env.error.message).not.toContain("BR-09");
    });

    it("zod-parse failure (bad input shape) → ok:false STRUCTURAL_INVALID + intake never called", async () => {
      // BR-43 step 1: a zod-parse failure surfaces as STRUCTURAL_INVALID and
      // the intake function is NEVER invoked (the bad payload would error
      // even harder inside the service). This isolates the failure point
      // for the model's recovery prompt.
      const ingestRaw = vi.fn();
      const env = await dispatchStartAsyncIngestion(
        // `content` is required by the schema; an empty object trips it.
        { foo: "bar" },
        makeDeps({
          ingestRaw: ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        })
      );

      expect(env.ok).toBe(false);
      if (env.ok) throw new Error("guarded above");
      expect(env.error.code).toBe("STRUCTURAL_INVALID");
      expect(ingestRaw).not.toHaveBeenCalled();
    });
  });
});
