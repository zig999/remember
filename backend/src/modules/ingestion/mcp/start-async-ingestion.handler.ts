// MCP `ingest.start_async_ingestion` handler (BR-32 / UC-13).
//
// Async sibling of `ingest_document` (BR-30). Same intake step (synchronous,
// < 1 s), same idempotent semantics on `noop_existing`, same defaults — only
// the new-run path differs: BR-30 awaits the extraction orchestrator and
// returns the full run summary; BR-32 fires the orchestrator as a DETACHED
// promise and returns IMMEDIATELY with `run_status: 'running'`. The terminal
// outcome surfaces later through `get_ingestion_status` (BR-31).
//
// Why a second tool (not a flag on BR-30): MCP clients have no "fire then
// ignore" idiom — they only do tool calls. The async-vs-sync choice must be
// encoded in the tool itself so the producer (chat agentic loop, `mcp-remote`
// with a short client timeout) gets the right blocking semantics by name.
//
// Fire-and-forget contract (BR-32 step 4):
//   - The handler does NOT `await` the orchestrator.
//   - The detached promise carries a top-level `.catch(err => logger.error(…))`
//     so an unhandled rejection NEVER crashes the process (mandatory, see the
//     spec: "Node.js unhandledRejection policy is otherwise inherited from the
//     process — the catch is mandatory").
//   - The orchestrator manages its own per-tool-call transactions and writes
//     the terminal `llm_run.status` (`completed` | `failed`) on its own.
//
// Rollout flag (BR-32 §"Rollout flag"): registered at boot only when
// `env.CHAT_INGEST_ENABLED === true`. The flag is NOT consulted at request
// time — that gate is enforced by the toolset registrar
// (`ingest-toolset.ts`), not here.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { ingestRawInformation } from "../service/ingestion.service.js";
import {
  runLlmExtraction,
  type RunExtractionDeps,
} from "../service/extraction.service.js";
import { getLlmRunById } from "../service/llm-run.service.js";
import { DEFAULT_PROMPT_VERSION } from "../prompts/index.js";
import { isPgUnavailable } from "../../../shared/error-mapping.js";
import { DEFAULT_INGEST_MODEL } from "./ingest-document.handler.js";
import type { StartAsyncIngestionMcpInput } from "./mcp-schemas.js";

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

export interface StartAsyncIngestionDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly anthropicApiKey: string;
  /** Default extraction model when `input.model` is omitted. */
  readonly ingestModel?: string;
  /** Test seam — forwarded to the orchestrator. Production omits it. */
  readonly anthropicFactory?: RunExtractionDeps["anthropicFactory"];
  readonly now?: () => Date;
  /**
   * Collaborator seams (DI). Default to the real service functions in
   * production; tests inject stubs to exercise branch/error-mapping logic
   * without a database. Same pattern as `ingest-document.handler.ts`.
   */
  readonly ingestRaw?: typeof ingestRawInformation;
  readonly runExtraction?: typeof runLlmExtraction;
  /** Test seam — best-effort run-status read used on the idempotent path. */
  readonly readRunStatus?: (
    pool: Pool,
    llmRunId: string
  ) => Promise<string | undefined>;
  /**
   * Test seam — scheduler for the fire-and-forget extraction work. Defaults to
   * `setImmediate`; tests inject a synchronous scheduler so they can observe
   * the detached promise's resolution / rejection.
   */
  readonly scheduleBackground?: (task: () => Promise<void>) => void;
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

/** Best-effort run-status read for the idempotent path (mirrors BR-30). */
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

/** Default background scheduler — detach the orchestrator on the next macrotask. */
function defaultScheduleBackground(task: () => Promise<void>): void {
  setImmediate(() => {
    void task();
  });
}

export async function startAsyncIngestionHandler(
  input: StartAsyncIngestionMcpInput,
  deps: StartAsyncIngestionDeps
): Promise<McpEnvelopeJson> {
  const ingestRaw = deps.ingestRaw ?? ingestRawInformation;
  const runExtraction = deps.runExtraction ?? runLlmExtraction;
  const runStatusReader = deps.readRunStatus ?? readRunStatus;
  const scheduleBackground =
    deps.scheduleBackground ?? defaultScheduleBackground;

  const body = {
    source_type: input.source_type,
    content: input.content,
    storage_ref: null,
    metadata: input.metadata ?? {},
    model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL,
    prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,
  };

  // Step 1 — intake (synchronous, BR-32 step 2). Errors mapped to a clean
  // envelope here so the SDK kernel never sees a raw throw (would leak
  // err.message — including the BR-09 invariant text). Mirrors BR-30 step 2.
  let ingest;
  try {
    ingest = await withTransaction(deps.pool, (client) => ingestRaw(client, body));
  } catch (err) {
    const pgDown = isPgUnavailable(err);
    deps.logger.error(
      {
        component: "mcp.ingest",
        tool: "start_async_ingestion",
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "start_async_ingestion_intake_failed"
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

  // Step 2 — idempotent short-circuit (BR-32 step 3): symmetric to BR-30.
  // Do NOT fire background extraction — the existing run owns its lifecycle.
  if (outcome === "noop_existing") {
    const runStatus = await runStatusReader(deps.pool, llm_run_id);
    const completed = runStatus === "completed";
    deps.logger.info(
      {
        component: "mcp.ingest",
        tool: "start_async_ingestion",
        raw_information_id,
        llm_run_id,
        outcome,
        run_status: runStatus ?? "unknown",
      },
      "start_async_ingestion_noop_existing"
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

  // Step 3 — fire-and-forget extraction (BR-32 step 4). The detached promise
  // is wrapped in a top-level .catch so an unhandled rejection NEVER crashes
  // the process; the orchestrator writes the terminal `llm_run.status` on its
  // own and the caller observes the outcome via `get_ingestion_status`.
  const extractionDeps: RunExtractionDeps = {
    env: { ANTHROPIC_API_KEY: deps.anthropicApiKey },
    ...(deps.anthropicFactory !== undefined
      ? { anthropicFactory: deps.anthropicFactory }
      : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  };

  scheduleBackground(async () => {
    try {
      await runExtraction(
        deps.pool,
        llm_run_id,
        deps.logger,
        deps.catalog,
        extractionDeps
      );
    } catch (err) {
      // Mandatory top-level catch (BR-32 step 4): without this an
      // unhandledRejection could crash the BFF. The orchestrator already
      // wrote llm_run.status='failed' on a fatal — we just need to surface
      // the diagnostic in the logs so an operator can correlate by run id.
      deps.logger.error(
        {
          component: "mcp.ingest",
          tool: "start_async_ingestion",
          llm_run_id,
          raw_information_id,
          cause_message: err instanceof Error ? err.message : "unknown",
        },
        "start_async_ingestion_background_extraction_failed"
      );
    }
  });

  return {
    ok: true,
    result: {
      outcome: "ingested",
      raw_information_id,
      llm_run_id,
      chunk_count,
      run_status: "running",
    },
  };
}
