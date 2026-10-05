import type { Pool } from "pg";
import type { Logger } from "pino";

import { withTransaction } from "../../../shared/pg-transaction.js";
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

export const DEFAULT_INGEST_MODEL = "claude-sonnet-4-6";

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
  readonly catalog: CatalogSnapshot;
  readonly anthropicApiKey: string;
  readonly ingestModel?: string;
  readonly contextModel: string;
  readonly anthropicFactory?: RunExtractionDeps["anthropicFactory"];
  readonly now?: () => Date;
  readonly ingestRaw?: typeof ingestRawInformation;
  readonly runExtraction?: typeof runLlmExtraction;
  readonly readRunStatus?: (
    pool: Pool,
    llmRunId: string
  ) => Promise<string | undefined>;
}

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

function buildExtractionDeps(deps: IngestDocumentDeps): RunExtractionDeps {
  return {
    env: {
      ANTHROPIC_API_KEY: deps.anthropicApiKey,
      CONTEXT_MODEL: deps.contextModel,
    },
    ...(deps.anthropicFactory !== undefined
      ? { anthropicFactory: deps.anthropicFactory }
      : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  };
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
            code: "SYSTEM_INTERNAL_ERROR",
            message: "Failed to persist the document before extraction.",
          },
    };
  }
  const { raw_information_id, llm_run_id, chunk_count, outcome } = ingest.body;

  if (outcome === "noop_existing") {
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

  try {
    const run = await runExtraction(
      deps.pool,
      llm_run_id,
      deps.logger,
      deps.catalog,
      buildExtractionDeps(deps)
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
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Unexpected error during document ingestion.",
        details: { llm_run_id, raw_information_id },
      },
    };
  }
}
