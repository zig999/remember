// MCP `ingest.propose_fragment` (UC-08).
//
// Pipeline (BR-13 layered validation):
//   1. Structural — Zod schema (text length, confidence range, non-empty
//      chunk_ids) is applied at the transport; here we additionally verify
//      every chunk_id exists and belongs to the run's `input_raw_information_id`.
//   2. Graph rules — N/A (no link types involved).
//   3. Temporal — N/A.
//   4. Confidence — N/A here (the fragment carries the value verbatim;
//      routing happens when the fragment is cited by a link/attribute).
//   5. Anti-hallucination — N/A here (fragments ARE the anchor; layer 5
//      applies to assertions, not fragments).
//
// On success: a new `information_fragment` row + one `fragment_source` per
// chunk_id, committed in one transaction with the `tool_call` audit row.

import type { Pool } from "pg";
import type { Logger } from "pino";

import {
  ProposeFragmentInputSchema,
  type ProposeFragmentInput,
  type ProposeFragmentResult,
} from "../dto/propose-fragment.dto.js";
import {
  countChunksInSource,
  insertFragmentWithSources,
} from "../repository/llm-run.repository.js";
import { ValidationFailure } from "../validation/errors.js";
import {
  assertRunIsRunning,
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
    // Zod parse at the boundary -> STRUCTURAL_INVALID if it fails.
    const parsed = ProposeFragmentInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_fragment",
        input: raw as ProposeFragmentInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
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
 * Pure handler — exported for unit testing without the Zod-edge wrapper.
 * Assumes `input` has already passed Zod parse.
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
      // Layer 1 — structural cross-checks against the run row + chunks.
      const run = await assertRunIsRunning(client, deps.llm_run_id);

      const matched = await countChunksInSource(client, {
        chunk_ids: input.chunk_ids,
        expected_raw_information_id: run.input_raw_information_id,
      });
      if (matched !== input.chunk_ids.length) {
        // We can't tell from a single COUNT whether the miss is "not found" vs
        // "wrong source". The spec maps both to errors:
        //  - chunk_id resolves to no row -> NOT_FOUND (UC-08 alt 2b).
        //  - chunk_id belongs to a different source -> STRUCTURAL_INVALID (alt 2c).
        // Disambiguate with a follow-up count of existence-only.
        const existsRes = await client.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM raw_chunk WHERE id = ANY($1::uuid[])`,
          [input.chunk_ids]
        );
        const exists = Number.parseInt(existsRes.rows[0]?.n ?? "0", 10);
        if (exists !== input.chunk_ids.length) {
          throw new ValidationFailure(
            "NOT_FOUND",
            "One or more chunk_ids do not resolve to an existing raw_chunk row.",
            { chunk_ids: input.chunk_ids }
          );
        }
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "One or more chunk_ids are not part of this run's source.",
          {
            chunk_ids: input.chunk_ids,
            expected_raw_information_id: run.input_raw_information_id,
          }
        );
      }

      // Business write — fragment + sources in the same TX.
      const fragment = await insertFragmentWithSources(client, {
        llm_run_id: deps.llm_run_id,
        text: input.text,
        confidence: input.confidence,
        chunk_ids: input.chunk_ids,
      });

      const result: ProposeFragmentResult = {
        fragment_id: fragment.id,
        status: "proposed",
      };
      return {
        result,
        validation_outcome: "accepted",
        // The audit `result` mirrors the envelope's `result` payload.
        tool_call_result: { ...result },
      };
    },
  });
}

