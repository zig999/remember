// MCP `ingest.propose_link` (UC-10).
//
// Thin transport adapter. Business logic — including the full 5-layer
// validation pipeline (BR-13) — lives in `service/propose-link.service.ts`.
// The handler:
//   1. Zod-parses the raw input at the boundary.
//   2. Opens a transaction via `runIngestHandler` (BR-19).
//   3. Calls `proposeLinkService(client, args, runCtx, deps)`.
//   4. Returns the envelope to the MCP transport.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ProposeLinkInputSchema,
  type ProposeLinkInput,
  type ProposeLinkResult,
} from "../dto/propose-link.dto.js";
import { proposeLinkService } from "../service/propose-link.service.js";
import { ValidationFailure } from "../validation/errors.js";

import {
  assertRunIsRunning,
  deriveValidationOutcome,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeLinkHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
  now?: () => Date;
}) {
  const now = args.now ?? (() => new Date());
  return async (raw: unknown): Promise<McpEnvelope<ProposeLinkResult>> => {
    const parsed = ProposeLinkInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_link",
        input: raw as ProposeLinkInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeLinkHandler(parsed.data, { ...args, now });
  };
}

export async function proposeLinkHandler(
  input: ProposeLinkInput,
  deps: {
    pool: Pool;
    logger: Logger;
    llm_run_id: string;
    catalog: CatalogSnapshot;
    now: () => Date;
  }
): Promise<McpEnvelope<ProposeLinkResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_link",
    input,
    run: async (client) => {
      const run = await assertRunIsRunning(client, deps.llm_run_id);
      const envelope = await proposeLinkService(
        client,
        input,
        { llmRunId: deps.llm_run_id, rawInformationId: run.input_raw_information_id },
        { catalog: deps.catalog, now: deps.now }
      );
      if (!envelope.ok) {
        return {
          result: envelope as unknown as ProposeLinkResult,
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
