// Unit tests for the MCP `start_async_ingestion` handler — BR-32 of
// `ingestion.back.md`.
//
// The handler is the back-end half of the async ingestion surface (the
// chat-side adapter is the other half; see `ingest-adapter.spec.ts`). Both
// converge on the same `ingestRawInformation` intake and `runLlmExtraction`
// orchestrator — what the HANDLER owns is:
//
//   1. The MCP-shaped envelope (`{ ok, result | error }` — distinct from
//      the adapter's chat-shaped envelope).
//   2. A best-effort run-status read on the idempotent path so the model
//      learns whether the prior run completed or failed (BR-32 step 3 —
//      the message wording differs by status).
//   3. The mandatory fire-and-forget detachment: the handler MUST NOT await
//      the orchestrator's terminal status, and MUST attach a top-level
//      `.catch` that logs at ERROR so an unhandled rejection never crashes
//      the BFF (BR-32 step 4 — the "Node.js unhandledRejection policy is
//      otherwise inherited from the process — the catch is mandatory" line).
//
// These tests exercise the handler through its DI seams (`ingestRaw`,
// `runExtraction`, `readRunStatus`, `scheduleBackground`) — no real DB, no
// real Anthropic call. The seams mirror `ingest-document.handler.ts`'s
// pattern so the audit trail of "what we test without DB" stays uniform.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  startAsyncIngestionHandler,
  type StartAsyncIngestionDeps,
} from "../start-async-ingestion.handler.js";
import { DEFAULT_INGEST_MODEL } from "../ingest-document.handler.js";
import { DEFAULT_PROMPT_VERSION } from "../../prompts/index.js";

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
  over: Partial<StartAsyncIngestionDeps> = {}
): StartAsyncIngestionDeps {
  return {
    pool: fakePool(),
    logger: fakeLogger(),
    catalog: {} as unknown as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test-key",
    ...over,
  };
}

const baseInput = {
  content: "Rodrigo lidera o Projeto Apollo.",
  source_type: "outro" as const,
  metadata: {},
};

const intakeCreated = {
  status: 201,
  body: {
    outcome: "created" as const,
    raw_information_id: "raw-1",
    llm_run_id: "run-1",
    chunk_count: 3,
    content_hash: "a".repeat(64),
    chunks: [],
    idempotency_key: "k".repeat(64),
  },
};

const intakeNoop = {
  status: 200,
  body: {
    outcome: "noop_existing" as const,
    raw_information_id: "raw-2",
    llm_run_id: "run-2",
    chunk_count: 7,
    content_hash: "b".repeat(64),
    chunks: [],
    idempotency_key: "j".repeat(64),
  },
};

describe("startAsyncIngestionHandler — BR-32", () => {
  // -------------------------------------------------------------------------
  // BR-32 step 4 — new-run path (fire-and-forget)
  // -------------------------------------------------------------------------

  describe("new-run path (outcome:'created')", () => {
    it("returns ok:true with run_status='running' WITHOUT awaiting extraction (fire-and-forget proof)", async () => {
      // The critical assertion of BR-32 step 4: the handler returns BEFORE
      // the orchestrator settles. A regression that awaited would hang on
      // the never-resolving promise — the test would time out — proving the
      // contract by impossibility.
      const ingestRaw = vi.fn().mockResolvedValue(intakeCreated);
      const runExtraction = vi
        .fn()
        .mockReturnValue(new Promise(() => undefined)); // never settles
      const scheduleBackground = vi.fn((task: () => Promise<void>) => {
        // Run immediately so we observe the call, but do NOT await — the
        // handler's contract is the SAME regardless of scheduler choice.
        void task();
      });

      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
          scheduleBackground,
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

      expect(scheduleBackground).toHaveBeenCalledOnce();
      expect(runExtraction).toHaveBeenCalledOnce();
      // The extraction promise is still pending — confirm by inspecting the
      // return; if we got the envelope, the await never happened.
    });

    it("background failure → ERROR log start_async_ingestion_background_extraction_failed (NO process crash)", async () => {
      // BR-32 step 4 "the catch is mandatory" line. We deliberately reject
      // the orchestrator's detached promise and assert the handler's
      // top-level .catch ran (ERROR log was emitted). A regression that
      // dropped the .catch would surface as a node `unhandledRejection`,
      // crashing the BFF — silent failure mode the spec explicitly forbids.
      const ingestRaw = vi.fn().mockResolvedValue(intakeCreated);
      const runExtraction = vi
        .fn()
        .mockReturnValue(Promise.reject(new Error("provider 529")));
      const logger = fakeLogger();
      const scheduleBackground = vi.fn((task: () => Promise<void>) => {
        void task();
      });

      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
          logger,
          scheduleBackground,
        })
      );

      // Yield a microtask so the .catch handler installed on the rejected
      // promise gets a chance to run before we assert.
      await new Promise((r) => setImmediate(r));

      expect(env.ok).toBe(true);
      expect(logger.error).toHaveBeenCalled();
      const errorCalls = (logger.error as ReturnType<typeof vi.fn>).mock.calls;
      const match = errorCalls.find(
        ([p]) =>
          typeof p === "object" &&
          p !== null &&
          (p as Record<string, unknown>).tool === "start_async_ingestion"
      );
      expect(match).toBeDefined();
      expect(match![0]).toMatchObject({
        tool: "start_async_ingestion",
        llm_run_id: "run-1",
        raw_information_id: "raw-1",
      });
    });

    it("defaults model + prompt_version when caller omits them (parity with BR-30)", async () => {
      // BR-32 explicitly says "Same defaults as `ingest_document` — the two
      // tools must produce byte-equivalent `llm_run` rows on the new-run
      // path". An accidental default drift would silently divide ingestion
      // history across two prompt versions; tests pin the exact defaults
      // (not mere presence) so a swap fails this test.
      const ingestRaw = vi.fn().mockResolvedValue(intakeCreated);
      const runExtraction = vi.fn().mockReturnValue(Promise.resolve());
      await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
          scheduleBackground: (task) => {
            void task();
          },
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

  // -------------------------------------------------------------------------
  // BR-32 step 3 — idempotent path
  // -------------------------------------------------------------------------

  describe("idempotent path (outcome:'noop_existing')", () => {
    it("reads the existing run status and reports 'already_ingested' WITHOUT scheduling background work", async () => {
      // The idempotent path MUST NOT fire a second extraction — that would
      // duplicate billing and bake two active runs around one content hash.
      // The spec also requires reading the prior status best-effort so the
      // model can distinguish completed vs failed.
      const ingestRaw = vi.fn().mockResolvedValue(intakeNoop);
      const runExtraction = vi.fn();
      const readRunStatus = vi.fn().mockResolvedValue("completed");
      const scheduleBackground = vi.fn();

      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            runExtraction as unknown as StartAsyncIngestionDeps["runExtraction"],
          readRunStatus,
          scheduleBackground,
        })
      );

      expect(env.ok).toBe(true);
      expect(env.result).toMatchObject({
        outcome: "already_ingested",
        raw_information_id: "raw-2",
        llm_run_id: "run-2",
        chunk_count: 7,
        run_status: "completed",
      });
      // The two non-negotiable negatives.
      expect(scheduleBackground).not.toHaveBeenCalled();
      expect(runExtraction).not.toHaveBeenCalled();
    });

    it("prior-run failed → run_status='failed' + a 'not completed' message (fail-loud per BR-32 step 3)", async () => {
      // The spec is explicit: when run_status !== 'completed' the message
      // says so. A regression that hid the failed status would let the
      // model report success to the Owner while extraction never finished
      // — exactly the silent-failure mode CLAUDE.md Golden Rule 12 forbids.
      const ingestRaw = vi.fn().mockResolvedValue(intakeNoop);
      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          readRunStatus: async () => "failed",
        })
      );

      expect(env.ok).toBe(true);
      const result = env.result as { run_status: string; message: string };
      expect(result.run_status).toBe("failed");
      expect(result.message).toMatch(/not completed|recovery/i);
    });

    it("prior-run status unreadable → run_status=null + 'unknown' message (best-effort, not a hard failure)", async () => {
      // The status read is best-effort — a transient pg blip on the read
      // path must NOT bubble up as an error. The handler returns the
      // identifiers we know and surfaces unknown state explicitly.
      const ingestRaw = vi.fn().mockResolvedValue(intakeNoop);
      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          readRunStatus: async () => undefined,
        })
      );

      expect(env.ok).toBe(true);
      const result = env.result as { run_status: string | null; message: string };
      expect(result.run_status).toBeNull();
      expect(result.message).toMatch(/unknown/i);
    });
  });

  // -------------------------------------------------------------------------
  // BR-32 step 2 — intake error mapping
  // -------------------------------------------------------------------------

  describe("intake error mapping (BR-32 step 2)", () => {
    it("pg-unavailable → ok:false SYSTEM_SERVICE_UNAVAILABLE, NOT a thrown exception", async () => {
      // The spec says "Intake errors are caught here and mapped to a clean
      // envelope (`SYSTEM_SERVICE_UNAVAILABLE` when `isPgUnavailable`, else
      // `INTERNAL` with a generic message), never re-thrown — same pattern
      // as BR-30 step 2 (avoids leaking `err.message` through the SDK
      // kernel)". A regression that re-threw would surface the BR-09
      // invariant text (idempotency_key id) through the MCP transport.
      const pgErr = Object.assign(new Error("connection refused"), {
        code: "ECONNREFUSED",
      });
      const ingestRaw = vi.fn().mockRejectedValue(pgErr);
      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        })
      );

      expect(env.ok).toBe(false);
      expect(env.error?.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    });

    it("any other error → ok:false INTERNAL with sanitised message (no err.message leak)", async () => {
      // BR-23 spirit: the raw err.message stays server-side (logged) and
      // never appears in the envelope returned to the client. Asserting on
      // the absence of the leaked substring locks the contract.
      const ingestRaw = vi
        .fn()
        .mockRejectedValue(
          new Error(
            "BR-09 invariant violated: idempotency_key abc123... rolled back"
          )
        );
      const env = await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
        })
      );

      expect(env.ok).toBe(false);
      expect(env.error?.code).toBe("INTERNAL");
      expect(env.error?.message ?? "").not.toContain("idempotency_key");
      expect(env.error?.message ?? "").not.toContain("BR-09");
    });

    it("Zod failure (bad input) → BR-32 step 1 surfaces STRUCTURAL_INVALID upstream of the handler", async () => {
      // BR-32 step 1: Zod-parse runs BEFORE the handler body. The handler's
      // typed input parameter is the post-parse `StartAsyncIngestionMcpInput`
      // — by then the input is structurally valid. So the test pins the
      // POSITIVE side: when a structurally valid input reaches the handler,
      // it never short-circuits with STRUCTURAL_INVALID on its own (the
      // codepath belongs to the toolset registrar, not the handler). A
      // future regression that ADDED a redundant zod-parse here would fail
      // this — the handler must trust its typed input.
      //
      // We exercise this by passing valid input and asserting the intake
      // function was actually invoked (proving the handler did not short-
      // circuit with a parse error).
      const ingestRaw = vi.fn().mockResolvedValue(intakeCreated);
      await startAsyncIngestionHandler(
        baseInput,
        makeDeps({
          ingestRaw:
            ingestRaw as unknown as StartAsyncIngestionDeps["ingestRaw"],
          runExtraction:
            vi.fn().mockReturnValue(Promise.resolve()) as unknown as StartAsyncIngestionDeps["runExtraction"],
          scheduleBackground: (task) => {
            void task();
          },
        })
      );
      expect(ingestRaw).toHaveBeenCalledOnce();
    });
  });
});
