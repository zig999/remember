// Shared scaffolding for the MCP `ingest` tool handlers.
//
// Every handler follows the same shape:
//   1. Refuse to operate without an ambient `llm_run_id` (BR-21) — no
//      `tool_call` row is written in that case.
//   2. Open ONE transaction (BR-19), run the layered validation (BR-13), do
//      the business writes.
//   3. Write the `tool_call` row in the same transaction on success.
//   4. On `ValidationFailure`: ROLLBACK the business TX, then open a SEPARATE
//      short TX to write the audit `tool_call` row (BR-23).
//   5. On uncaught error: ROLLBACK, write `tool_call` with `error`, surface
//      `INTERNAL` envelope.
//
// The MCP envelope is `{ ok: true, result } | { ok: false, error }`.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import { isValidationFailure, ValidationFailure } from "../validation/errors.js";
import {
  insertToolCall,
  insertToolCallStandalone,
} from "../repository/llm-run.repository.js";
import type {
  IngestToolName,
  ValidationOutcome,
} from "../dto/llm-run.dto.js";
import { findLlmRunById } from "../repository/llm-run.repository.js";

/** Surface of dependencies every handler shares. */
export interface IngestHandlerDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  /** Ambient run id — bound at MCP session start by the transport. */
  readonly llm_run_id: string;
}

// Envelope shape is shared with the transport-agnostic service layer — the
// canonical declaration lives there to keep all three transports (MCP, REST,
// in-process orchestrator) on the same contract.
export type { McpEnvelope, McpErr, McpOk } from "../service/propose.types.js";
import type { McpEnvelope, McpErr } from "../service/propose.types.js";

/**
 * Outcome shape returned by the inner `run` closure of a handler. The handler
 * shell does the audit + envelope wrapping.
 */
export type HandlerBusinessOutcome<R> = {
  readonly result: R;
  readonly validation_outcome: ValidationOutcome;
  /** What we persist in `tool_call.result` (the verbatim envelope sent back). */
  readonly tool_call_result: Record<string, unknown>;
};

/**
 * Map a service-layer success envelope to a `validation_outcome` for the
 * `tool_call` audit row.
 *
 * Rule: when `result.outcome === 'rejected'` (the BELOW_CONFIDENCE_FLOOR
 * branch returns this), the audit row is `'rejected'` per BR-17. Every other
 * `ok:true` envelope is `'accepted'`. Full graph-consolidation outcomes
 * (`consolidated` / `superseded_previous` / `disputed` / `needs_review` /
 * `uncertain`) become reachable in TC-010 / TC-011; this helper recognises
 * them by their `outcome` field.
 */
export function deriveValidationOutcome<R>(
  envelope: { ok: true; result: R }
): ValidationOutcome {
  const result = envelope.result as unknown as { outcome?: string; resolution?: string };
  const tag = result?.outcome ?? result?.resolution;
  switch (tag) {
    case "rejected":
      return "rejected";
    case "consolidated":
      return "consolidated";
    case "superseded_previous":
      return "superseded_previous";
    case "disputed":
      return "disputed";
    case "needs_review":
      return "needs_review";
    case "uncertain":
      return "uncertain";
    default:
      // `accepted`, `matched_existing`, `created_new`, `proposed`, missing
      // tag — all collapse to `accepted` per the current contract.
      return "accepted";
  }
}

/**
 * Validate the ambient `llm_run_id` actually points at a `running` row. Throws
 * `ValidationFailure(STRUCTURAL_INVALID)` when missing or not-running so the
 * handler shell short-circuits.
 *
 * Per BR-21, the call WITHOUT an ambient id is filtered at the MCP transport
 * (no `tool_call` row in that case). This function handles the second-tier
 * case: ambient id exists but the run row is gone or not-running.
 */
export async function assertRunIsRunning(
  client: PoolClient,
  llmRunId: string
): Promise<{ input_raw_information_id: string }> {
  const row = await findLlmRunById(client, llmRunId);
  if (row === null) {
    throw new ValidationFailure(
      "STRUCTURAL_INVALID",
      "Ambient llm_run_id does not match any LLMRun row.",
      { llm_run_id: llmRunId }
    );
  }
  if (row.status !== "running") {
    throw new ValidationFailure(
      "STRUCTURAL_INVALID",
      `LLMRun ${llmRunId} is not running (status='${row.status}').`,
      { llm_run_id: llmRunId, status: row.status }
    );
  }
  return { input_raw_information_id: row.input_raw_information_id };
}

/**
 * Run a handler's business logic inside a single TX, persist the `tool_call`
 * audit row, and wrap the outcome in the canonical MCP envelope.
 *
 * BR-23: even when the business transaction rolls back, the audit row is
 * written via a SEPARATE short transaction (`insertToolCallStandalone`).
 */
export async function runIngestHandler<I, R>(args: {
  deps: IngestHandlerDeps;
  tool_name: IngestToolName;
  input: I;
  /** Pure runner: receives an open client and produces a business outcome. */
  run: (client: PoolClient) => Promise<HandlerBusinessOutcome<R>>;
}): Promise<McpEnvelope<R>> {
  const client = await args.deps.pool.connect();
  let outcome: HandlerBusinessOutcome<R> | null = null;
  let validationFailure: ValidationFailure | null = null;
  let internalError: unknown = null;

  try {
    await client.query("BEGIN");
    outcome = await args.run(client);
    // Audit row in SAME transaction (BR-19 + BR-23 happy path).
    await insertToolCall(client, {
      llm_run_id: args.deps.llm_run_id,
      tool_name: args.tool_name,
      arguments: args.input as unknown as Record<string, unknown>,
      result: outcome.tool_call_result,
      validation_outcome: outcome.validation_outcome,
    });
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* swallow rollback failure — original error wins */
    }
    if (isValidationFailure(err)) {
      validationFailure = err;
    } else {
      internalError = err;
    }
  } finally {
    client.release();
  }

  // Rolled-back paths: write the audit row in a brand-new transaction (BR-23).
  if (validationFailure !== null) {
    const errEnv: McpErr = {
      ok: false,
      error: {
        code: validationFailure.code,
        message: validationFailure.message,
        details: validationFailure.details,
      },
    };
    await safeWriteAuditOnRollback(args.deps, args.tool_name, args.input, errEnv, "rejected");
    return errEnv;
  }

  if (internalError !== null) {
    args.deps.logger.error(
      {
        tool_name: args.tool_name,
        llm_run_id: args.deps.llm_run_id,
        // NEVER log raw arguments — they may contain `text` / `value` PII.
        cause_message: internalError instanceof Error ? internalError.message : "unknown",
      },
      "mcp_handler_internal_error"
    );
    const errEnv: McpErr = {
      ok: false,
      error: { code: "INTERNAL", message: "Internal error in MCP handler." },
    };
    await safeWriteAuditOnRollback(args.deps, args.tool_name, args.input, errEnv, "error");
    return errEnv;
  }

  // Happy path.
  return { ok: true, result: outcome!.result };
}

/**
 * Write the audit row in a separate short transaction. Wrapped in try/catch:
 * if the audit write itself fails we log and swallow — the original envelope
 * is what the caller sees.
 */
async function safeWriteAuditOnRollback<I>(
  deps: IngestHandlerDeps,
  tool_name: IngestToolName,
  input: I,
  envelope: McpErr,
  outcome: Extract<ValidationOutcome, "rejected" | "error">
): Promise<void> {
  try {
    await insertToolCallStandalone(deps.pool, {
      llm_run_id: deps.llm_run_id,
      tool_name,
      arguments: input as unknown as Record<string, unknown>,
      result: envelope as unknown as Record<string, unknown>,
      validation_outcome: outcome,
    });
  } catch (err) {
    deps.logger.error(
      {
        tool_name,
        llm_run_id: deps.llm_run_id,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "tool_call_audit_write_failed"
    );
    // Swallow — we already lost the business TX; failing to audit must not
    // surface a SECOND error to the LLM.
  }
}
