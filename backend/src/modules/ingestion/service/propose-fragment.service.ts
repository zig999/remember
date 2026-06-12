// Service: `ingest.propose_fragment` business logic (UC-08).
//
// Transport-agnostic. Receives an OPEN `PoolClient` (transaction wrapping is
// the caller's responsibility per BR-19 + this Task Contract's constraint:
// "do NOT move transaction management into the service").
//
// Layered validation (BR-13):
//   1. Structural — Zod has already enforced text length / confidence range /
//      non-empty chunk_ids at the boundary; here we cross-check that every
//      chunk_id exists and belongs to the run's `input_raw_information_id`.
//   2. Graph rules — N/A.
//   3. Temporal — N/A.
//   4. Confidence — N/A here (the fragment carries the value verbatim).
//   5. Anti-hallucination — N/A (fragments ARE the anchor).
//
// On any layer failure the service throws `ValidationFailure`; the caller
// (MCP handler shell / REST mirror / orchestrator) handles ROLLBACK + the
// `tool_call` audit write (BR-23).

import type { PoolClient } from "pg";

import type {
  ProposeFragmentInput,
  ProposeFragmentResult,
} from "../dto/propose-fragment.dto.js";
import {
  countChunksInSource,
  insertFragmentWithSources,
} from "../repository/llm-run.repository.js";
import { ValidationFailure } from "../validation/errors.js";

import type { McpEnvelope, RunContext } from "./propose.types.js";

/**
 * Business function for `propose_fragment`. Pure with respect to the caller's
 * transaction: returns a success envelope on the happy path, throws
 * `ValidationFailure` on any layer rejection.
 */
export async function proposeFragmentService(
  client: PoolClient,
  args: ProposeFragmentInput,
  runCtx: RunContext
): Promise<McpEnvelope<ProposeFragmentResult>> {
  // Layer 1 — structural cross-checks against the run row + chunks.
  const matched = await countChunksInSource(client, {
    chunk_ids: args.chunk_ids,
    expected_raw_information_id: runCtx.rawInformationId,
  });
  if (matched !== args.chunk_ids.length) {
    // We can't tell from a single COUNT whether the miss is "not found" vs
    // "wrong source". The spec maps both to errors:
    //  - chunk_id resolves to no row -> NOT_FOUND (UC-08 alt 2b).
    //  - chunk_id belongs to a different source -> STRUCTURAL_INVALID (alt 2c).
    // Disambiguate with a follow-up count of existence-only.
    const existsRes = await client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM raw_chunk WHERE id = ANY($1::uuid[])`,
      [args.chunk_ids]
    );
    const exists = Number.parseInt(existsRes.rows[0]?.n ?? "0", 10);
    if (exists !== args.chunk_ids.length) {
      throw new ValidationFailure(
        "NOT_FOUND",
        "One or more chunk_ids do not resolve to an existing raw_chunk row.",
        { chunk_ids: args.chunk_ids }
      );
    }
    throw new ValidationFailure(
      "STRUCTURAL_INVALID",
      "One or more chunk_ids are not part of this run's source.",
      {
        chunk_ids: args.chunk_ids,
        expected_raw_information_id: runCtx.rawInformationId,
      }
    );
  }

  // Business write — fragment + sources in the same TX (the open client).
  const fragment = await insertFragmentWithSources(client, {
    llm_run_id: runCtx.llmRunId,
    text: args.text,
    confidence: args.confidence,
    chunk_ids: args.chunk_ids,
  });

  const result: ProposeFragmentResult = {
    fragment_id: fragment.id,
    status: "proposed",
  };
  return { ok: true, result };
}
