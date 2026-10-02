// `applyTemporalFilter` — single source of truth for the WHERE clause that
// composes the temporal-axis filters surfaced by the knowledge-graph read
// endpoints (BR-07 / BR-08 of `knowledge-graph.back.md`).
//
// This helper RETURNS the SQL fragment plus the parameter list (the caller
// is responsible for stitching it into the final query and forwarding the
// extended parameter array to `pg.query`). It NEVER concatenates user input
// — every value supplied here lands in a positional placeholder (CLAUDE.md
// "Security").

import { InvariantError } from "../../../shared/invariant-error.js";

export interface TemporalFilterOptions {
  /** Optional valid-time anchor (ISO YYYY-MM-DD). */
  readonly asOf?: string;
  readonly inEffectOnly?: boolean;
}

export interface TemporalFilterFragment {
  /** SQL fragment to append directly after an existing WHERE clause. */
  readonly sql: string;
  /** Parameter values to extend the caller's parameter array with. */
  readonly params: readonly unknown[];
}

/**
 * Build the temporal filter SQL fragment plus its bound parameters.
 *
 * @param alias        Table/view alias to qualify column references with
 *                     (e.g. `"kl"` or `"na"`). MUST be a SQL identifier
 *                     literal authored by the developer — NEVER a value
 *                     received from the network.
 * @param nextParamIdx 1-based index of the NEXT positional placeholder the
 *                     caller will assign. The helper appends placeholders
 *                     starting from this index. The caller then passes the
 *                     extended parameter array to `pg.query`.
 */
export function applyTemporalFilter(
  alias: string,
  nextParamIdx: number,
  opts: TemporalFilterOptions
): TemporalFilterFragment {
  if (!isValidIdentifier(alias)) {
    // Programming bug — surfaces as 500 via the global handler.
    throw new InvariantError(
      `applyTemporalFilter: invalid alias "${alias}". Aliases must be SQL identifiers.`
    );
  }

  if (opts.asOf !== undefined) {
    // Query (b) — valid-time travel.
    const p = nextParamIdx;
    const sql = [
      `AND ${alias}.superseded_at IS NULL`,
      `AND (${alias}.valid_from IS NULL OR ${alias}.valid_from <= $${p})`,
      `AND (${alias}.valid_to   IS NULL OR ${alias}.valid_to   >  $${p})`,
    ].join("\n         ");
    return { sql, params: [opts.asOf] };
  }

  // Query (a) — current view.
  const lines = [
    `AND ${alias}.valid_to IS NULL`,
    `AND ${alias}.superseded_at IS NULL`,
  ];
  if (opts.inEffectOnly) {
    lines.push(
      `AND (${alias}.valid_from IS NULL OR ${alias}.valid_from <= current_date)`
    );
  }
  return { sql: lines.join("\n         "), params: [] };
}

/** Conservative identifier check — letters, digits, underscores only. */
function isValidIdentifier(s: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);
}
