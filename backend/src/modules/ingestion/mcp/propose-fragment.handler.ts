// MCP `ingest.propose_fragment` (UC-08).
//
// Thin transport adapter. Business logic lives in
// `service/propose-fragment.service.ts`. The handler:
//   1. Zod-parses the raw input at the boundary.
//   2. Opens a transaction via `runIngestHandler` (BR-19).
//   3. Calls `proposeFragmentService(client, args, runCtx)`.
//   4. Returns the envelope to the MCP transport.

import type { Pool } from "pg";
import type { Logger } from "pino";

import {
  ProposeFragmentInputSchema,
  type ProposeFragmentInput,
  type ProposeFragmentResult,
} from "../dto/propose-fragment.dto.js";
import { proposeFragmentService } from "../service/propose-fragment.service.js";
import { ValidationFailure } from "../validation/errors.js";

import {
  assertRunIsRunning,
  deriveValidationOutcome,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

/** Factory used by the MCP toolset registrar. Returns a Zod-validated handler. */
export function buildProposeFragmentHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
}) {
  return async (raw: unknown): Promise<McpEnvelope<ProposeFragmentResult>> => {
    const parsed = ProposeFragmentInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_fragment",
        input: raw as ProposeFragmentInput,
        run: async () => {
          throw new ValidationFailure(
            "VALIDATION_INVALID_FORMAT",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeFragmentHandler(parsed.data, {
      pool: args.pool,
      logger: args.logger,
      llm_run_id: args.llm_run_id,
    });
  };
}

/**
 * Adapter — exported for unit testing without the Zod-edge wrapper. Assumes
 * `input` has already passed Zod parse.
 */
export async function proposeFragmentHandler(
  input: ProposeFragmentInput,
  deps: { pool: Pool; logger: Logger; llm_run_id: string }
): Promise<McpEnvelope<ProposeFragmentResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_fragment",
    input,
    run: async (client) => {
      // BR-21 (defence in depth at the service-call boundary). Returns the
      // run's `input_raw_information_id` used to scope the service.
      const run = await assertRunIsRunning(client, deps.llm_run_id);
      const envelope = await proposeFragmentService(client, input, {
        llmRunId: deps.llm_run_id,
        rawInformationId: run.input_raw_information_id,
      });
      // Service only returns success envelopes (errors throw ValidationFailure).
      if (!envelope.ok) {
        // Defensive: a future evolution of the service contract could return
        // an error envelope directly. Map it to the audit shape so the
        // handler shell records the right outcome.
        return {
          result: envelope as unknown as ProposeFragmentResult,
          validation_outcome: "rejected",
          tool_call_result: envelope as unknown as Record<string, unknown>,
        };
      }
      return {
        result: envelope.result,
        validation_outcome: deriveValidationOutcome(envelope),
        tool_call_result: { ...(envelope.result as unknown as Record<string, unknown>) },
      };
    },
  });
}
