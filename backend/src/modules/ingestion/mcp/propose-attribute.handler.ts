// MCP `ingest.propose_attribute` (UC-11).
//
// Thin transport adapter. Business logic — including the full 5-layer
// validation pipeline (BR-13) — lives in
// `service/propose-attribute.service.ts`. The handler:
//   1. Zod-parses the raw input at the boundary.
//   2. Opens a transaction via `runIngestHandler` (BR-19).
//   3. Calls `proposeAttributeService(client, args, runCtx, deps)`.
//   4. Returns the envelope to the MCP transport.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ProposeAttributeInputSchema,
  type ProposeAttributeInput,
  type ProposeAttributeResult,
} from "../dto/propose-attribute.dto.js";
import { proposeAttributeService } from "../service/propose-attribute.service.js";
import { ValidationFailure } from "../validation/errors.js";

import {
  assertRunIsRunning,
  deriveValidationOutcome,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeAttributeHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
  now?: () => Date;
}) {
  const now = args.now ?? (() => new Date());
  return async (raw: unknown): Promise<McpEnvelope<ProposeAttributeResult>> => {
    const parsed = ProposeAttributeInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_attribute",
        input: raw as ProposeAttributeInput,
        run: async () => {
          throw new ValidationFailure(
            "VALIDATION_INVALID_FORMAT",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeAttributeHandler(parsed.data, { ...args, now });
  };
}

export async function proposeAttributeHandler(
  input: ProposeAttributeInput,
  deps: {
    pool: Pool;
    logger: Logger;
    llm_run_id: string;
    catalog: CatalogSnapshot;
    now: () => Date;
  }
): Promise<McpEnvelope<ProposeAttributeResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_attribute",
    input,
    run: async (client) => {
      const run = await assertRunIsRunning(client, deps.llm_run_id);
      const envelope = await proposeAttributeService(
        client,
        input,
        { llmRunId: deps.llm_run_id, rawInformationId: run.input_raw_information_id },
        { catalog: deps.catalog, now: deps.now }
      );
      if (!envelope.ok) {
        return {
          result: envelope as unknown as ProposeAttributeResult,
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
