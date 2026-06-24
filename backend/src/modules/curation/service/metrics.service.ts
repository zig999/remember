// BR-33 — GET /api/v1/curation/metrics.
//
// Read-only §16 calibration snapshot. All seven aggregates come from ONE
// `BEGIN READ ONLY` transaction (via `withReadOnly`) so they are mutually
// coherent at the wall-clock anchor `computed_at` (curation.back.md BR-33,
// openapi.yaml CurationMetricsResponse).
//
// REST-only — no MCP tool surface (the §14 / BR-29 closed whitelist of 8 names
// is unchanged; metrics is operator UI, not LLM-actionable).
//
// Time source: `computed_at` is the BFF wall clock captured INSIDE the open
// `BEGIN READ ONLY` transaction (after the seven SELECTs, before COMMIT) so
// the value is the snapshot-close anchor described by openapi.yaml.

import type { Pool } from "pg";
import type { Logger } from "pino";

import { aggregateCurationMetrics } from "../repository/curation.repository.js";
import { withReadOnly } from "./transaction.js";

/**
 * Response shape mirroring `openapi.yaml` `CurationMetricsResponse`
 * (lines 1518-1603). Kept as a domain type rather than a re-export so the
 * service layer is the canonical source of the field set the route ultimately
 * wraps in `{ ok: true, result }`.
 */
export interface CurationMetricsResponse {
  readonly accept_rate: number;
  readonly reject_rate_by_code: Readonly<Record<string, number>>;
  readonly needs_review_count: number;
  readonly uncertain_count: number;
  readonly disputed_count: number;
  readonly entity_match_queue_count: number;
  readonly disputed_queue_count: number;
  readonly computed_at: string;
}

export interface MetricsServiceDeps {
  readonly pool: Pool;
  readonly logger: Logger;
}

/**
 * Compute the §16 calibration snapshot. Wraps the seven aggregate SELECTs in
 * a single `BEGIN READ ONLY` transaction (curation.back.md BR-33 point 1):
 *   (a) PostgreSQL snapshot guarantee — all aggregates see the same MVCC view;
 *   (b) `READ ONLY` rejects any accidentally-introduced DML defensively;
 *   (c) honours the OpenAPI "single read transaction" wording verbatim.
 *
 * Any thrown `pg` error bubbles to the route layer's local error mapper,
 * which re-maps residual 500s to 503 per BR-33's graceful-degradation contract.
 */
export async function computeCurationMetricsService(
  deps: MetricsServiceDeps
): Promise<CurationMetricsResponse> {
  const computationStart = Date.now();
  const row = await withReadOnly(deps.pool, async (client) => {
    return aggregateCurationMetrics(client);
  });
  // `computed_at` is the BFF wall clock at the moment the read transaction
  // closed (immediately after `withReadOnly` returns). All counts in `row`
  // come from the SAME MVCC snapshot so the coherence guarantee holds.
  const computedAt = new Date().toISOString();
  const computationMs = Date.now() - computationStart;

  // §16 observability: one INFO line on success with the snapshot counts
  // (BR-33 logging contract). `reject_rate_by_code` keys are NOT logged
  // individually — only the count of distinct keys, to guard against
  // cardinality blow-up if the payload schema ever extends.
  deps.logger.info(
    {
      route: "GET /api/v1/curation/metrics",
      operation: "getCurationMetrics",
      transport: "rest",
      computation_ms: computationMs,
      accept_rate: row.accept_rate,
      reject_rate_by_code_keys: Object.keys(row.reject_rate_by_code).length,
      needs_review_count: row.needs_review_count,
      uncertain_count: row.uncertain_count,
      disputed_count: row.disputed_count,
      entity_match_queue_count: row.entity_match_queue_count,
      disputed_queue_count: row.disputed_queue_count,
      outcome: 200,
    },
    "curation_metrics_computed"
  );

  return {
    accept_rate: row.accept_rate,
    reject_rate_by_code: row.reject_rate_by_code,
    needs_review_count: row.needs_review_count,
    uncertain_count: row.uncertain_count,
    disputed_count: row.disputed_count,
    entity_match_queue_count: row.entity_match_queue_count,
    disputed_queue_count: row.disputed_queue_count,
    computed_at: computedAt,
  };
}
