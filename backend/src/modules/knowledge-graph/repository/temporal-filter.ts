// `applyTemporalFilter` — single source of truth for the WHERE clause that
// composes the temporal-axis filters surfaced by the knowledge-graph read
// endpoints (BR-07 / BR-08 of `knowledge-graph.back.md`).
//
// This helper RETURNS the SQL fragment plus the parameter list (the caller
// is responsible for stitching it into the final query and forwarding the
// extended parameter array to `pg.query`). It NEVER concatenates user input
// — every value supplied here lands in a positional placeholder (CLAUDE.md
// "Security").
//
// Modes:
//
//   1. asOf undefined            -> "current view" (query (a), BR-07):
//        AND <alias>.valid_to IS NULL
//        AND <alias>.superseded_at IS NULL
//        [AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= current_date)]
//          (the bracketed clause is added when `inEffectOnly = true`)
//
//   2. asOf provided             -> "valid-time travel" (query (b), BR-08):
//        AND <alias>.superseded_at IS NULL
//        AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= $asOf)
//        AND (<alias>.valid_to   IS NULL OR <alias>.valid_to   >  $asOf)
//
// Note: the `inEffectOnly` flag is meaningful only in mode 1 — when
// `asOf` is provided, the valid_from check is already part of the filter.

export interface TemporalFilterOptions {
  /** Optional valid-time anchor (ISO YYYY-MM-DD). */
  readonly asOf?: string;
  /** When true (and `asOf` undefined), restrict to rows in effect today. */
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
    throw new Error(
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
