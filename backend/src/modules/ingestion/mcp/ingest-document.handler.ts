// MCP `ingest.ingest_document` handler (TC-MCI-002).
//
// One-shot document ingestion for EXTERNAL MCP clients (e.g. Claude Desktop).
// Wraps the two REST-only steps the in-process orchestrator path uses behind a
// single tool call, so a client that cannot create runs or manage chunk offsets
// can still ingest a source:
//
//   1. Persist RawInformation + chunks + a `running` LLMRun (own transaction,
//      BR-19) via `ingestRawInformation`.
//   2. Drive the SERVER-SIDE extraction orchestrator (`runLlmExtraction`),
//      which runs its own short transactions per proposal and closes the run.
//
// The extraction LLM is the SERVER's (ANTHROPIC_API_KEY) — the calling client
// only hands over the document; the inviolable rule that the LLM never touches
// the DB directly is preserved (every write still goes through the validated
// propose-* path the orchestrator calls).
//
// Idempotency (BR-08): if the same content was already ingested,
// `ingestRawInformation` returns `noop_existing`; we DO NOT re-run extraction
// (the existing run is completed, or running, and re-running would either no-op
// or 409). The tool reports `already_ingested` with the existing ids — never an
// error.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { ingestRawInformation } from "../service/ingestion.service.js";
import {
  runLlmExtraction,
  LlmProviderFatalError,
  ExtractionFatalError,
  type RunExtractionDeps,
} from "../service/extraction.service.js";
import { getLlmRunById } from "../service/llm-run.service.js";
import { DEFAULT_PROMPT_VERSION } from "../prompts/index.js";
import { isPgUnavailable } from "../../../shared/error-mapping.js";
import type { IngestDocumentMcpInput } from "./mcp-schemas.js";

/**
 * Hard-coded fallback extraction model used only when the caller omits `model`
 * AND no `ingestModel` is wired (e.g. a bare test harness). Production threads
 * `env.INGEST_MODEL` through `deps.ingestModel`. Cost-optimized to Sonnet 4.6 —
 * extraction is structured tool-calling steered by the closed catalog (Opus 4.8
 * was the original functional-E2E-validated model). Override per call (the
 * `model` arg) or via the INGEST_MODEL env (no recompile).
 */
export const DEFAULT_INGEST_MODEL = "claude-sonnet-4-6";

/** Canonical MCP envelope the toolset handlers return. */
export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface IngestDocumentDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  /** Ingestion catalog snapshot — required by the extraction orchestrator. */
  readonly catalog: CatalogSnapshot;
  readonly anthropicApiKey: string;
  /** Default extraction model when `input.model` is omitted (wired from
   *  `env.INGEST_MODEL`). Falls back to `DEFAULT_INGEST_MODEL` if unset. */
  readonly ingestModel?: string;
  /** Test seam — forwarded to the orchestrator. Production omits it. */
  readonly anthropicFactory?: RunExtractionDeps["anthropicFactory"];
  readonly now?: () => Date;
  /**
   * Collaborator seams (DI). Default to the real service functions in
   * production; tests inject stubs to exercise the branch/error-mapping logic
   * without a database (same pattern as `anthropicFactory` / `now`).
   */
  readonly ingestRaw?: typeof ingestRawInformation;
  readonly runExtraction?: typeof runLlmExtraction;
  /** Test seam — best-effort run-status read used on the idempotent path. */
  readonly readRunStatus?: (
    pool: Pool,
    llmRunId: string
  ) => Promise<string | undefined>;
}

/** Minimal single-statement transaction wrapper (BR-19). */
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
      // Swallow ROLLBACK failures — the original error is what we surface.
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Best-effort read of an LLMRun's status — used on the idempotent path so a
 *  previously-FAILED run is not reported as a successful ingestion. Returns
 *  `undefined` if the run can't be read (never throws). */
async function readRunStatus(
  pool: Pool,
  llmRunId: string
): Promise<string | undefined> {
  const client = await pool.connect();
  try {
    const run = await getLlmRunById(client, llmRunId);
    return run.status;
  } catch {
    return undefined;
  } finally {
    client.release();
  }
}

export async function ingestDocumentHandler(
  input: IngestDocumentMcpInput,
  deps: IngestDocumentDeps
): Promise<McpEnvelopeJson> {
  const ingestRaw = deps.ingestRaw ?? ingestRawInformation;
  const runExtraction = deps.runExtraction ?? runLlmExtraction;
  const runStatusReader = deps.readRunStatus ?? readRunStatus;

  const body = {
    source_type: input.source_type,
    content: input.content,
    storage_ref: null,
    metadata: input.metadata ?? {},
    model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL,
    prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,
  };

  // Step 1 — persist raw info + chunks + run (committed before extraction; the
  // orchestrator manages its own short transactions and must see committed rows).
  // Intake errors are mapped to a clean envelope HERE — an uncaught throw would
  // otherwise be turned by the SDK kernel into a JSON-RPC error leaking the raw
  // `err.message` (e.g. the BR-09 invariant message with ids), and pg-down would
  // be mis-surfaced. No `tool_call` audit row is due — no run exists yet.
  let ingest;
  try {
    ingest = await withTransaction(deps.pool, (client) => ingestRaw(client, body));
  } catch (err) {
    const pgDown = isPgUnavailable(err);
    deps.logger.error(
      {
        component: "mcp.ingest",
        tool: "ingest_document",
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "ingest_document_intake_failed"
    );
    return {
      ok: false,
      error: pgDown
        ? {
            code: "SYSTEM_SERVICE_UNAVAILABLE",
            message: "A backing service is temporarily unavailable.",
          }
        : {
            code: "INTERNAL",
            message: "Failed to persist the document before extraction.",
          },
    };
  }
  const { raw_information_id, llm_run_id, chunk_count, outcome } = ingest.body;

  // Step 2 — idempotent short-circuit: already ingested, do not re-extract.
  if (outcome === "noop_existing") {
    // Surface the existing run's status so the caller is NOT told a failed run
    // "succeeded" (fail loud). `noopExisting` does not return the status, so we
    // read it best-effort; a non-`completed` run means the prior extraction did
    // not finish and recovery requires re-running that LLMRun (no retry tool is
    // exposed over MCP yet — see BR-30).
    const runStatus = await runStatusReader(deps.pool, llm_run_id);
    const completed = runStatus === "completed";
    deps.logger.info(
      {
        component: "mcp.ingest",
        tool: "ingest_document",
        raw_information_id,
        llm_run_id,
        outcome,
        run_status: runStatus ?? "unknown",
      },
      "ingest_document_noop_existing"
    );
    return {
      ok: true,
      result: {
        outcome: "already_ingested",
        raw_information_id,
        llm_run_id,
        chunk_count,
        run_status: runStatus ?? null,
        message: completed
          ? "This exact content was already ingested and its extraction completed; returning the existing run. No new extraction was triggered."
          : `This exact content was already ingested, but its run is '${runStatus ?? "unknown"}' (not completed) — the prior extraction did not finish. No new extraction was triggered; recovery requires re-running that LLMRun.`,
      },
    };
  }

  // Step 3 — drive the server-side extraction orchestrator.
  const extractionDeps: RunExtractionDeps = {
    env: { ANTHROPIC_API_KEY: deps.anthropicApiKey },
    ...(deps.anthropicFactory !== undefined
      ? { anthropicFactory: deps.anthropicFactory }
      : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  };

  try {
    const run = await runExtraction(
      deps.pool,
      llm_run_id,
      deps.logger,
      deps.catalog,
      extractionDeps
    );
    return {
      ok: true,
      result: {
        outcome: "ingested",
        raw_information_id,
        llm_run_id,
        chunk_count,
        run,
      },
    };
  } catch (err) {
    // The run was just created `running`, so NotFound/NotRunnable cannot occur
    // here; the realistic failures are provider/extraction fatals (the run is
    // already closed `failed` and a partial summary is attached).
    if (
      err instanceof LlmProviderFatalError ||
      err instanceof ExtractionFatalError
    ) {
      deps.logger.error(
        {
          component: "mcp.ingest",
          tool: "ingest_document",
          llm_run_id,
          code: err.code,
          cause_message: err.message,
        },
        "ingest_document_extraction_failed"
      );
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: { llm_run_id, raw_information_id, partial_run: err.partialRun },
        },
      };
    }
    // Unknown — surface loud as INTERNAL with ids for forensics (never swallow).
    deps.logger.error(
      {
        component: "mcp.ingest",
        tool: "ingest_document",
        llm_run_id,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "ingest_document_unexpected_error"
    );
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Unexpected error during document ingestion.",
        details: { llm_run_id, raw_information_id },
      },
    };
  }
}
