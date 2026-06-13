// MCP `ingest.propose_node` (UC-09).
//
// Thin transport adapter. Business logic lives in
// `service/propose-node.service.ts`. The handler:
//   1. Zod-parses the raw input at the boundary.
//   2. Opens a transaction via `runIngestHandler` (BR-19).
//   3. Calls `proposeNodeService(client, args, runCtx, deps)`.
//   4. Returns the envelope to the MCP transport.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ProposeNodeInputSchema,
  type ProposeNodeInput,
  type ProposeNodeResult,
} from "../dto/propose-node.dto.js";
import { proposeNodeService } from "../service/propose-node.service.js";
import { ValidationFailure } from "../validation/errors.js";

import {
  assertRunIsRunning,
  deriveValidationOutcome,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeNodeHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
}) {
  return async (raw: unknown): Promise<McpEnvelope<ProposeNodeResult>> => {
    const parsed = ProposeNodeInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_node",
        input: raw as ProposeNodeInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeNodeHandler(parsed.data, args);
  };
}

export async function proposeNodeHandler(
  input: ProposeNodeInput,
  deps: { pool: Pool; logger: Logger; llm_run_id: string; catalog: CatalogSnapshot }
): Promise<McpEnvelope<ProposeNodeResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_node",
    input,
    run: async (client) => {
      const run = await assertRunIsRunning(client, deps.llm_run_id);
      const envelope = await proposeNodeService(
        client,
        input,
        { llmRunId: deps.llm_run_id, rawInformationId: run.input_raw_information_id },
        { catalog: deps.catalog }
      );
      if (!envelope.ok) {
        return {
          result: envelope as unknown as ProposeNodeResult,
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
