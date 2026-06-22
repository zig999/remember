// Chat-side dispatcher for `start_async_ingestion` (BR-43, v2.4).
//
// The chat catalog (BR-05 v2.4) advertises `start_async_ingestion` from the
// `ingest` toolset when `env.CHAT_INGEST_ENABLED === true` (BR-44). The chat
// agentic loop (`chat-agent.service.ts`) routes the tool_use block to THIS
// adapter (rather than to the toolset's own handler) because the chat domain
// imposes one extra concern beyond the toolset: extraction is FIRE-AND-FORGET
// from chat's perspective.
//
// Why fire-and-forget? Chat budgets are `TOOL_TIMEOUT_MS=15s` (BR-17) /
// `TURN_TIMEOUT_MS=90s` (BR-16). The intake call `ingestRawInformation`
// completes in < 1 s (a few INSERTs); the LLM-driven extraction
// `runLlmExtraction` runs minutes per chunk. Awaiting extraction would
// timeout the turn deterministically; the chat must return the
// `{outcome, run_id, status:"running"}` envelope synchronously and detach
// extraction from the request lifecycle.
//
// The adapter is pure composition over `ingestion.service` — no chat-owned
// write transaction, no chat-owned `chat_*` writes (those are owned by the
// route layer per BR-32). The ingestion service owns its own intake
// transaction (BR-19 of ingestion) and the extraction service owns its own
// per-proposal transactions (UC-12 of ingestion). The single inviolable
// invariant — "the LLM never reaches the DB directly" — is preserved by
// delegating every byte of state change to ingestion's audited surface
// (v7 §2).
//
// Error mapping (BR-43 step 2):
//   - pg-down (intake)           -> SYSTEM_SERVICE_UNAVAILABLE
//   - layered-validation failure -> STRUCTURAL_INVALID
//   - any other unexpected       -> SYSTEM_INTERNAL_ERROR (sanitised message)
//
// Failure during background extraction is observability-only on the chat side
// (`chat.ingest_extraction_background_failure` WARN log — BR-43 step 6); the
// `ingestion` service sets `llm_run.status = 'failed'` on its own fatal path,
// and the Owner discovers it via a subsequent `get_ingestion_status` call.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import { ingestRawInformation } from "../../ingestion/service/ingestion.service.js";
import { runLlmExtraction } from "../../ingestion/service/extraction.service.js";
import type { RunExtractionDeps } from "../../ingestion/service/extraction.service.js";
import type { CatalogSnapshot } from "../../ingestion/catalog/catalog.js";
import { DEFAULT_PROMPT_VERSION } from "../../ingestion/prompts/index.js";
import { DEFAULT_INGEST_MODEL } from "../../ingestion/mcp/ingest-document.handler.js";
import { SourceTypeSchema } from "../../ingestion/dto/source-type.js";
import { isPgUnavailable } from "../../../shared/error-mapping.js";
import { isValidationFailure } from "../../ingestion/validation/errors.js";

/** Input schema for the `start_async_ingestion` chat tool (BR-43 step 1).
 *  Schema mirrors `ingest_document` (`ingestion.back.md` BR-30) modulo the
 *  tool name. `content` is bounded at 10 MiB code points (matches
 *  `IngestRawInformationRequest.content`). */
export const StartAsyncIngestionInputSchema = z.object({
  source_type: SourceTypeSchema,
  content: z
    .string()
    .min(1, "content must not be empty")
    .max(10 * 1024 * 1024, "content must not exceed 10 MiB"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Forwarded to `ingestion.service.ingestRawInformation` (and ultimately to
   *  `runLlmExtraction`'s tool-use loop). Default: `env.INGEST_MODEL` or
   *  `DEFAULT_INGEST_MODEL` per ingestion. */
  model: z.string().min(1).optional(),
  /** Default: `DEFAULT_PROMPT_VERSION` per `ingestion.back.md` BR-26. */
  prompt_version: z.string().min(1).optional(),
});

export type StartAsyncIngestionInput = z.infer<
  typeof StartAsyncIngestionInputSchema
>;

/** Envelope returned by the adapter — flows back to the chat-agent as the
 *  tool_result block (BR-07). Success carries the run identifiers; failure
 *  carries the standard `{code, message, details?}` shape. */
export type StartAsyncIngestionEnvelope =
  | {
      readonly ok: true;
      readonly result: {
        readonly outcome: "ingested" | "already_ingested";
        readonly run_id: string;
        readonly raw_information_id: string;
        readonly status: "running" | "failed" | "completed";
        readonly chunk_count: number;
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | "STRUCTURAL_INVALID"
          | "SYSTEM_SERVICE_UNAVAILABLE"
          | "SYSTEM_INTERNAL_ERROR";
        readonly message: string;
        readonly details?: Record<string, unknown>;
      };
    };

/** Dependencies the adapter needs to drive intake + schedule extraction. */
export interface StartAsyncIngestionDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  /** Catalog snapshot — required by the extraction orchestrator (UC-12). */
  readonly catalog: CatalogSnapshot;
  readonly anthropicApiKey: string;
  /** Default ingestion model when `input.model` is omitted (wired from
   *  `env.INGEST_MODEL`). Falls back to `DEFAULT_INGEST_MODEL` if absent. */
  readonly ingestModel?: string;
  /** Test seam — forwarded to `runLlmExtraction`. Production omits it. */
  readonly anthropicFactory?: RunExtractionDeps["anthropicFactory"];
  /** Test seam — wall-clock injection for the extraction service. */
  readonly now?: () => Date;
  /** Collaborator seams (DI). Tests inject stubs to exercise branch +
   *  error-mapping logic without a database. */
  readonly ingestRaw?: typeof ingestRawInformation;
  readonly runExtraction?: typeof runLlmExtraction;
  /** Test seam — overrides `setImmediate` so the fire-and-forget dispatch is
   *  observable in tests. Defaults to `setImmediate`. */
  readonly schedule?: (cb: () => void) => void;
}

/** Optional context for observability — attached to the WARN log emitted on
 *  background-extraction failure (BR-43 step 6). */
export interface StartAsyncIngestionContext {
  readonly conversation_id?: string;
  readonly request_id?: string;
}

/** Minimal `withTransaction` wrapper — the ingestion service expects to run
 *  inside a BEGIN/COMMIT boundary. Mirrors the wrapper used by
 *  `ingestion/mcp/ingest-document.handler.ts` so behavior is identical. */
async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow ROLLBACK failures — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Dispatch a `start_async_ingestion` tool_use block (BR-43).
 *
 * Steps (BR-43 1-6):
 *   1. Zod-parse the input. Failure -> STRUCTURAL_INVALID envelope.
 *   2. Synchronous intake via `ingestion.service.ingestRawInformation` in a
 *      single BEGIN/COMMIT transaction. Map errors:
 *        - pg-down                -> SYSTEM_SERVICE_UNAVAILABLE
 *        - layered-validation     -> STRUCTURAL_INVALID
 *        - other unexpected       -> SYSTEM_INTERNAL_ERROR (sanitised message)
 *   3. On `outcome="created"` (fresh insert), schedule `runLlmExtraction` via
 *      `setImmediate` (fire-and-forget, NOT awaited). Attach a `.catch(...)`
 *      that logs WARN `chat.ingest_extraction_background_failure`.
 *   4. On `outcome="noop_existing"` (idempotent dedupe), DO NOT schedule a
 *      second extraction — return the existing identifiers with
 *      `outcome="already_ingested"`.
 *   5. Return the success envelope (status is `"running"` on a fresh
 *      ingestion; for the dedupe path we report `"running"` as well — the
 *      Owner can call `get_ingestion_status` to learn the real state of the
 *      pre-existing run; the simple constant keeps the envelope shape stable).
 *   6. The background promise is intentionally NOT tracked in any chat-side
 *      registry — the extraction's lifecycle is owned by `ingestion`.
 *
 * The function MUST NOT re-throw the background extraction promise's
 * rejection into the caller — the `.catch(...)` is mandatory (BR-43 step 6).
 */
export async function dispatchStartAsyncIngestion(
  rawInput: unknown,
  deps: StartAsyncIngestionDeps,
  ctx: StartAsyncIngestionContext = {}
): Promise<StartAsyncIngestionEnvelope> {
  // --- Step 1 — Zod parse ----------------------------------------------------
  const parsed = StartAsyncIngestionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "start_async_ingestion arguments failed validation.",
        details: { issues: parsed.error.issues },
      },
    };
  }
  const input = parsed.data;

  const ingestRaw = deps.ingestRaw ?? ingestRawInformation;
  const runExtraction = deps.runExtraction ?? runLlmExtraction;
  const schedule = deps.schedule ?? setImmediate;

  const ingestRequest = {
    source_type: input.source_type,
    content: input.content,
    storage_ref: null,
    metadata: input.metadata ?? {},
    model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL,
    prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,
  };

  // --- Step 2 — Synchronous intake ------------------------------------------
  let intake;
  try {
    intake = await withTransaction(deps.pool, (client) =>
      ingestRaw(client, ingestRequest)
    );
  } catch (err) {
    // pg-down — surface as service-unavailable so the model can suggest a
    // retry to the Owner without leaking infrastructure details.
    if (isPgUnavailable(err)) {
      deps.logger.error(
        {
          event: "chat.ingest_adapter_intake_failed",
          reason: "pg_unavailable",
          conversation_id: ctx.conversation_id,
          request_id: ctx.request_id,
        },
        "start_async_ingestion intake failed: postgres unavailable"
      );
      return {
        ok: false,
        error: {
          code: "SYSTEM_SERVICE_UNAVAILABLE",
          message: "Ingestion service is temporarily unavailable.",
        },
      };
    }
    // Layered-validation rejection (the ingestion service throws
    // `ValidationFailure` when a future layer fails inside intake; today the
    // 5-layer pipeline runs in `runLlmExtraction` but the codepath is reserved
    // for forward-compatibility — BR-43 step 2 mandates the mapping).
    if (isValidationFailure(err)) {
      deps.logger.warn(
        {
          event: "chat.ingest_adapter_intake_rejected",
          code: err.code,
          conversation_id: ctx.conversation_id,
          request_id: ctx.request_id,
        },
        "start_async_ingestion intake rejected: layered-validation failure"
      );
      return {
        ok: false,
        error: {
          code: "STRUCTURAL_INVALID",
          message: err.message,
          details: err.details,
        },
      };
    }
    // Any other unexpected error — sanitised message, never the raw
    // `err.message` (BR-23 spirit; the chat domain MUST NOT leak ingestion
    // internals to the LLM).
    deps.logger.error(
      {
        event: "chat.ingest_adapter_intake_failed",
        reason: "unexpected_error",
        cause_message: err instanceof Error ? err.message : "unknown",
        conversation_id: ctx.conversation_id,
        request_id: ctx.request_id,
      },
      "start_async_ingestion intake failed: unexpected error"
    );
    return {
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Failed to persist the document before extraction.",
      },
    };
  }

  const {
    outcome: intakeOutcome,
    raw_information_id,
    llm_run_id,
    chunk_count,
  } = intake.body;

  // --- Step 4 — Idempotent dedupe path --------------------------------------
  if (intakeOutcome === "noop_existing") {
    deps.logger.info(
      {
        event: "chat.ingest_adapter_already_ingested",
        raw_information_id,
        llm_run_id,
        conversation_id: ctx.conversation_id,
        request_id: ctx.request_id,
      },
      "start_async_ingestion: content_hash dedupe — no new extraction scheduled"
    );
    return {
      ok: true,
      result: {
        outcome: "already_ingested",
        run_id: llm_run_id,
        raw_information_id,
        status: "running",
        chunk_count,
      },
    };
  }

  // --- Step 3 — Schedule extraction fire-and-forget -------------------------
  // The chat HTTP response will terminate while this promise is still
  // pending. The .catch is mandatory (BR-43 step 6); the chat domain has NO
  // responsibility for the extraction's lifecycle thereafter — UC-12 of
  // ingestion writes `llm_run.status = 'failed'` on its own fatal path.
  const extractionDeps: RunExtractionDeps = {
    env: { ANTHROPIC_API_KEY: deps.anthropicApiKey },
    ...(deps.anthropicFactory !== undefined
      ? { anthropicFactory: deps.anthropicFactory }
      : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  };

  schedule(() => {
    const extractionPromise = runExtraction(
      deps.pool,
      llm_run_id,
      deps.logger,
      deps.catalog,
      extractionDeps
    );
    // BR-43 step 6 — the `.catch` is mandatory. Never await; never re-throw.
    extractionPromise.catch((err: unknown) => {
      deps.logger.warn(
        {
          event: "chat.ingest_extraction_background_failure",
          err: err instanceof Error ? { message: err.message, name: err.name } : err,
          llm_run_id,
          raw_information_id,
          conversation_id: ctx.conversation_id,
          request_id: ctx.request_id,
        },
        "background runLlmExtraction rejected after chat response terminated"
      );
    });
  });

  deps.logger.info(
    {
      event: "chat.ingest_adapter_intake_succeeded",
      raw_information_id,
      llm_run_id,
      chunk_count,
      conversation_id: ctx.conversation_id,
      request_id: ctx.request_id,
    },
    "start_async_ingestion intake succeeded — extraction scheduled in background"
  );

  return {
    ok: true,
    result: {
      outcome: "ingested",
      run_id: llm_run_id,
      raw_information_id,
      status: "running",
      chunk_count,
    },
  };
}
