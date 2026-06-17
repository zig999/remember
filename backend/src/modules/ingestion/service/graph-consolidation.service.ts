// Graph consolidation service — implements §6.5 of `remember-modelagem-v7.md`
// and BR-25 of `ingestion.spec.md` / BR-27 of `ingestion.back.md`.
//
// Responsibility: given a fully-validated `propose_link` / `propose_attribute`
// call (5-layer validation already passed), look up the vigent row(s) under
// `SELECT ... FOR UPDATE` (A11) and decide between the five branches of
// §6.5:
//
//   * consolidated      — same value / same valid_from / change_hint='none'
//                         AND a vigent row already exists: no new main row,
//                         provenance accumulates on the existing row (§6.5
//                         step 1).
//   * superseded_previous — functional type (allows_multiple_current=false),
//                         different value, succession signal in fragment
//                         texts AND/OR change_hint='succession': close the
//                         vigent row (valid_to, superseded_at, status=
//                         'superseded') and insert the new row chained via
//                         supersedes_* (§6.5 flow A).
//   * correction        — change_hint='correction' with errata signal
//                         (already verified by validateTemporal in layer 3):
//                         close the vigent row (superseded_at=now(),
//                         status='superseded'; valid_to untouched) and
//                         insert the new row chained via supersedes_*.
//                         Outcome is 'accepted' per BR-25 (the audit trail
//                         lives in supersedes_* and tool_call.result).
//   * disputed          — vigent row exists; same period; different value;
//                         no succession / correction signal: UPDATE the
//                         vigent row to status='disputed', INSERT the new
//                         row also as 'disputed' (§6.5 flow C).
//   * accepted (new)    — no vigent row in scope OR non-functional scope
//                         with non-overlapping period: INSERT a brand-new
//                         row with status from BR-17 (active|uncertain).
//
// In every branch where a (new or existing) main row id ends up being the
// provenance target, the service inserts one provenance row per fragment
// with ON CONFLICT DO NOTHING (the UNIQUE(link_id, fragment_id) and
// UNIQUE(attribute_id, fragment_id) partial indexes already exist in
// migrations/0001_init.sql). This satisfies BR-18 — every accepted /
// consolidated assertion has at least one provenance row.
//
// Transaction policy: this service NEVER calls BEGIN / COMMIT — the caller
// (the propose-link / propose-attribute service) owns the transaction
// (BR-19). All work happens on the open `PoolClient` it receives.
//
// SPEC DIVERGENCE — `status='corrected'`:
//   `ingestion.spec.md` BR-25, `ingestion.back.md` BR-27 and the task
//   contract describe the correction branch as closing the previous row
//   with `status='corrected'`. The actual `assertion_status` enum defined
//   in `migrations/0001_init.sql` is
//     ('active', 'uncertain', 'disputed', 'superseded', 'deleted')
//   — there is no `'corrected'` value (and no migration adds one). v7
//   §6.5-B itself describes the correction branch as
//     "Encerra o antigo só no eixo de transação: superseded_at = now(),
//      status = superseded, valid_to intocado"
//   which matches the DB enum. This service uses `'superseded'` for the
//   closed vigent row in the correction branch; the audit of WHY it was
//   superseded lives in (a) the supersedes_* chain on the new row and
//   (b) `tool_call.result.outcome = 'accepted'` plus the original `args`
//   (which carry `change_hint = 'correction'`). The two outcomes — natural
//   succession vs. correction — remain distinguishable by inspecting the
//   originating tool_call. This divergence is recorded in the delivery
//   file and was confirmed against v7 (the normative source per CLAUDE.md).
//
// SPEC DIVERGENCE — `valid_to` in succession branch when new row has no
// `valid_from`:
//   BR-27 succession step says `valid_to = $newValidFrom (or now()::date
//   if the new row has no valid_from)`. The new row is required to have
//   `valid_from` whenever `link_type.requires_valid_from = true` (layer 3
//   already enforced it). For functional types without that flag, we fall
//   back to `now()::date` per the task contract.

import type { PoolClient } from "pg";

import type {
  AttributeKeyRow,
  LinkTypeRow,
} from "../catalog/catalog.js";
import { ValidationFailure } from "../validation/errors.js";

import type { RunContext } from "./propose.types.js";

/** A textual succession marker — case-insensitive substring on any fragment. */
const SUCCESSION_MARKERS = [
  "deixou de",
  "passou a",
  "novo",
  "nova",
  "substituiu",
  "substituido",
  "substituido por",
  "succeeded",
  "replaced",
] as const;

/** Visible for unit tests. */
export function hasSuccessionSignal(
  fragmentTexts: readonly string[]
): boolean {
  for (const f of fragmentTexts) {
    const lower = f.toLowerCase();
    for (const m of SUCCESSION_MARKERS) {
      if (lower.includes(m)) return true;
    }
  }
  return false;
}

/** Discriminated union of consolidator outcomes (shape consumed by callers). */
export type ConsolidateOutcome =
  | "accepted"
  | "consolidated"
  | "superseded_previous"
  | "disputed";

/** Arguments for the link branch. */
export interface ConsolidateLinkArgs {
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
  readonly change_hint: "none" | "succession" | "correction";
  readonly fragment_ids: readonly string[];
  /** `'active'` if confidence ≥ 0.75, else `'uncertain'` (BR-17). */
  readonly status_for_new_row: "active" | "uncertain";
}

/** Arguments for the attribute branch. */
export interface ConsolidateAttributeArgs {
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly value: string;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
  readonly change_hint: "none" | "succession" | "correction";
  readonly fragment_ids: readonly string[];
  /** `'active'` if confidence ≥ 0.75, else `'uncertain'` (BR-17). */
  readonly status_for_new_row: "active" | "uncertain";
}

/** Result for the link branch (consumed by `proposeLinkService`). */
export interface ConsolidateLinkResult {
  readonly outcome: ConsolidateOutcome;
  /**
   * For `accepted` / `superseded_previous` / `disputed`: the id of the new
   * row. For `consolidated`: the id of the existing (re-affirmed) row.
   */
  readonly link_id: string;
  /** When `outcome = 'superseded_previous'` or `outcome = 'disputed'`. */
  readonly superseded_link_id?: string;
  readonly conflicting_link_id?: string;
}

/** Result for the attribute branch. */
export interface ConsolidateAttributeResult {
  readonly outcome: ConsolidateOutcome;
  readonly attribute_id: string;
  readonly superseded_attribute_id?: string;
  readonly conflicting_attribute_id?: string;
}

/**
 * Shape of a `knowledge_link` row touched by the consolidator. Only the
 * columns this service reads are listed.
 */
interface VigentLinkRow {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: string;
}

/** Shape of a `node_attribute` row touched by the consolidator. */
interface VigentAttributeRow {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly value: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: string;
}

/** Postgres error shape — narrowed to the fields we need. */
interface PgError extends Error {
  readonly code?: string;
  readonly constraint?: string;
}

function isDupGuardViolation(err: unknown, guard: string): boolean {
  const e = err as PgError;
  return (
    e instanceof Error &&
    e.code === "23505" &&
    e.constraint === guard
  );
}

/**
 * Insert provenance rows for a (link_id | attribute_id, fragment_id) pair
 * set. `ON CONFLICT DO NOTHING` makes re-affirmation idempotent (§18).
 *
 * Creating a Provenance row is the §6.6 trigger that promotes each cited
 * fragment `proposed -> accepted`, so each inserter follows the write with
 * `promoteFragmentsToAccepted` in the same transaction.
 */
async function insertLinkProvenance(
  client: PoolClient,
  linkId: string,
  fragmentIds: readonly string[]
): Promise<void> {
  await client.query(
    `INSERT INTO provenance (link_id, fragment_id)
       SELECT $1, f FROM unnest($2::uuid[]) AS f
       ON CONFLICT DO NOTHING`,
    [linkId, fragmentIds]
  );
  await promoteFragmentsToAccepted(client, fragmentIds);
}

async function insertAttributeProvenance(
  client: PoolClient,
  attributeId: string,
  fragmentIds: readonly string[]
): Promise<void> {
  await client.query(
    `INSERT INTO provenance (attribute_id, fragment_id)
       SELECT $1, f FROM unnest($2::uuid[]) AS f
       ON CONFLICT DO NOTHING`,
    [attributeId, fragmentIds]
  );
  await promoteFragmentsToAccepted(client, fragmentIds);
}

/**
 * §6.6 state machine: an InformationFragment cited by an accepted
 * consolidation (a `Provenance` row was just created) transitions
 * `proposed -> accepted`. Scoped to `status = 'proposed'` so the write is
 * idempotent under re-affirmation (§18) and never resurrects a `rejected`,
 * `superseded`, or `deleted` fragment. Without this the search fragment layer
 * and node-provenance synthesis (both `WHERE status = 'accepted'`) never see
 * ingested fragments — the graph populates but `/search` returns nothing.
 */
async function promoteFragmentsToAccepted(
  client: PoolClient,
  fragmentIds: readonly string[]
): Promise<void> {
  if (fragmentIds.length === 0) return;
  await client.query(
    `UPDATE information_fragment
        SET status = 'accepted'
      WHERE id = ANY($1::uuid[])
        AND status = 'proposed'`,
    [fragmentIds]
  );
}

/**
 * Close a vigent row for a §6.5-A succession (Emenda v7.3 — validity-axis close).
 *
 * Succession means the fact changed in the WORLD: the old version was TRUE for
 * `[valid_from, closeDate)` and remains the system's current belief about that
 * past window. So succession closes the **validity axis only** — set
 * `valid_to = closeDate` (the new version's `valid_from`, or `today` when the
 * new row has none) and LEAVE `superseded_at = NULL`. This keeps the old version
 * visible to valid-time travel (query (b), `temporal-filter.ts`) within its
 * window — which is what makes acceptance scenario C7 pass. The current view
 * (a) still excludes it because `valid_to` is set. This is the §5.6 distinction:
 * succession = validity axis; correction (§6.5-B) = transaction axis.
 *
 * EXCEPTION — intra-day collapse: validity is day-granular (`date`, §5.1) and
 * `valid_from < valid_to` is strict (CHECK + temporal.ts). When the vigent row's
 * own `valid_from` is on/after `closeDate` (a same-effective-date succession),
 * setting `valid_to = closeDate` would produce a degenerate `[D, D)` interval and
 * fail the CHECK. `date` cannot represent that sub-day boundary, so for that row
 * ONLY we fall back to the TRANSACTION axis (`superseded_at = now()`, `valid_to`
 * untouched) — the same mechanism correction uses. C7 is unreachable for sub-day
 * successions (documented day-granularity limitation); the `supersedes_*` lineage
 * still orders the versions. Both CASEs key off the row's own `valid_from` vs the
 * DB clock in SQL — no TS/SQL clock skew.
 *
 * `table` is a fixed literal (never input) — safe to interpolate.
 */
async function closeVigentForSuccession(
  client: PoolClient,
  table: "knowledge_link" | "node_attribute",
  vigentId: string,
  closeDate: string | null
): Promise<void> {
  const closeExpr = closeDate !== null ? "$2::date" : "now()::date";
  const params: unknown[] = closeDate !== null ? [vigentId, closeDate] : [vigentId];
  await client.query(
    `UPDATE ${table}
        SET valid_to = CASE
                         WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                           THEN valid_to
                         ELSE ${closeExpr}
                       END,
            superseded_at = CASE
                              WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                                THEN now()
                              ELSE superseded_at
                            END,
            status        = 'superseded'::assertion_status
      WHERE id = $1`,
    params
  );
}

/**
 * Acquire FOR UPDATE on the vigent knowledge_link row for the functional
 * scope (source, link_type). Returns the row (if any). Note: dup-guard
 * scope is (source, link_type, target) but FUNCTIONAL succession scope is
 * (source, link_type) — for functional types we lock the broader scope so
 * a sibling-target update sees a consistent vigent set.
 */
async function lockVigentLinkBySourceAndType(
  client: PoolClient,
  sourceNodeId: string,
  linkTypeId: string
): Promise<VigentLinkRow | null> {
  const res = await client.query<VigentLinkRow>(
    `SELECT id, source_node_id, target_node_id, link_type_id,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM knowledge_link
      WHERE source_node_id = $1
        AND link_type_id   = $2
        AND valid_to       IS NULL
        AND superseded_at  IS NULL
      FOR UPDATE`,
    [sourceNodeId, linkTypeId]
  );
  return res.rows[0] ?? null;
}

/**
 * Acquire FOR UPDATE on the vigent knowledge_link row for the DUP-GUARD
 * scope (source, link_type, target). Used by multi-valued (non-functional)
 * types where succession is not allowed.
 */
async function lockVigentLinkByTriple(
  client: PoolClient,
  sourceNodeId: string,
  linkTypeId: string,
  targetNodeId: string
): Promise<VigentLinkRow | null> {
  const res = await client.query<VigentLinkRow>(
    `SELECT id, source_node_id, target_node_id, link_type_id,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM knowledge_link
      WHERE source_node_id = $1
        AND link_type_id   = $2
        AND target_node_id = $3
        AND valid_to       IS NULL
        AND superseded_at  IS NULL
      FOR UPDATE`,
    [sourceNodeId, linkTypeId, targetNodeId]
  );
  return res.rows[0] ?? null;
}

/** Mirror of `lockVigentLinkBySourceAndType` for the attribute table. */
async function lockVigentAttributeByNodeAndKey(
  client: PoolClient,
  nodeId: string,
  attributeKeyId: string
): Promise<VigentAttributeRow | null> {
  const res = await client.query<VigentAttributeRow>(
    `SELECT id, node_id, attribute_key_id, value,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM node_attribute
      WHERE node_id          = $1
        AND attribute_key_id = $2
        AND valid_to         IS NULL
        AND superseded_at    IS NULL
      FOR UPDATE`,
    [nodeId, attributeKeyId]
  );
  return res.rows[0] ?? null;
}

/** Mirror of `lockVigentLinkByTriple` for the attribute table. */
async function lockVigentAttributeByTriple(
  client: PoolClient,
  nodeId: string,
  attributeKeyId: string,
  value: string
): Promise<VigentAttributeRow | null> {
  const res = await client.query<VigentAttributeRow>(
    `SELECT id, node_id, attribute_key_id, value,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM node_attribute
      WHERE node_id          = $1
        AND attribute_key_id = $2
        AND value            = $3
        AND valid_to         IS NULL
        AND superseded_at    IS NULL
      FOR UPDATE`,
    [nodeId, attributeKeyId, value]
  );
  return res.rows[0] ?? null;
}

/**
 * Consolidate a proposed link into the graph.
 *
 * Caller owns the transaction. This function performs lookup-and-decide
 * inside an internal SAVEPOINT so that a SQLSTATE 23505 on the partial
 * dup-guard (`knowledge_link_current_dup_guard`) — produced by a
 * concurrent committed INSERT racing us between our FOR UPDATE and our
 * INSERT — can be recovered (ROLLBACK TO SAVEPOINT keeps the parent
 * transaction usable). On a 23505 we re-run the lookup ONCE; the racer's
 * row is now visible to our SELECT FOR UPDATE so the decision settles
 * deterministically. A second 23505 surfaces as
 * `ValidationFailure('STRUCTURAL_INVALID')` per BR-25 / BR-27.
 *
 * Non-23505 errors thrown inside the savepoint are rolled back (so the
 * parent transaction stays usable) and re-thrown unchanged.
 */
export async function consolidateLink(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  linkTypeInfo: LinkTypeRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateLinkResult> {
  // Two attempts max (BR-27 / task contract).
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const savepoint = `gc_link_${attempt}`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await consolidateLinkOnce(
        client,
        args,
        linkTypeInfo,
        fragmentTexts,
        runCtx
      );
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (err) {
      if (!isDupGuardViolation(err, "knowledge_link_current_dup_guard")) {
        // Non-dup-guard error: rollback the savepoint to keep the parent
        // transaction usable, then propagate.
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        throw err;
      }
      // Dup-guard race: rollback the savepoint and either retry or give up.
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      if (attempt === 2) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.",
          { scope: "knowledge_link" }
        );
      }
      // attempt === 1 -> loop and retry. The concurrent row is now
      // visible to our SELECT FOR UPDATE.
    }
  }
  // Unreachable — the loop returns or throws on every path.
  throw new ValidationFailure(
    "INTERNAL",
    "consolidateLinkWithRetry: unreachable loop exit.",
    {}
  );
}

/**
 * Single lookup-and-decide attempt for the link branch. Does NOT manage
 * savepoints; the caller wraps it.
 */
async function consolidateLinkOnce(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  linkTypeInfo: LinkTypeRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateLinkResult> {
  const functional = !linkTypeInfo.allows_multiple_current;

  // Step 1 / 2 — lock the vigent row(s).
  //
  // For FUNCTIONAL types: the succession scope is (source, link_type). We
  // lock that broader scope, then refine the decision by comparing target.
  //
  // For MULTI-VALUED types: succession does not apply (§6.5). The scope is
  // (source, link_type, target) — same as the dup-guard. We lock that
  // narrow scope; the only valid outcomes are `consolidated` (same row)
  // or `accepted` (new row).
  let vigent: VigentLinkRow | null;
  if (functional) {
    vigent = await lockVigentLinkBySourceAndType(
      client,
      args.source_node_id,
      linkTypeInfo.id
    );
  } else {
    vigent = await lockVigentLinkByTriple(
      client,
      args.source_node_id,
      linkTypeInfo.id,
      args.target_node_id
    );
  }

  // ---- Branch decision per §6.5 / BR-27 -----------------------------
  if (vigent !== null) {
    const sameTarget = vigent.target_node_id === args.target_node_id;
    const sameValidFrom = vigent.valid_from === (args.valid_from ?? null);

    // (a) Re-affirmation (consolidation) — same target, change_hint='none'.
    //
    //     For MULTI-CURRENT types (`functional === false`): `valid_from`
    //     equality is NOT required. The dup-guard scope already enforces
    //     at most one vigent row per (source, target, link_type), so a
    //     vigent row reached here IS the same assertion. The only reason
    //     `valid_from` may differ between proposals is the per-document
    //     `received` fallback (temporal.ts FR-001) — a metadata artifact
    //     of the receiving document, not an assertion of the fact itself.
    //     Consolidating regardless of `valid_from` satisfies v7 §18
    //     "re-afirmação consolida, nunca duplica" and v7 §6.5 (same
    //     source/target/link_type + change_hint='none' + no
    //     succession/correction signal = re-affirmation).
    //
    //     For FUNCTIONAL types (`functional === true`): also require
    //     `sameValidFrom`. On a functional type, a different `valid_from`
    //     genuinely signals a different period — potential succession or
    //     dispute, not a simple re-affirmation. The stricter check
    //     preserves branches (c) and (d).
    const reaffirmation =
      sameTarget &&
      args.change_hint === "none" &&
      (!functional || sameValidFrom);
    if (reaffirmation) {
      await insertLinkProvenance(client, vigent.id, args.fragment_ids);
      return { outcome: "consolidated", link_id: vigent.id };
    }

    // (b) Correction — change_hint='correction' AND errata signal already
    //     verified by validateTemporal. Same period preserved on the old
    //     row (valid_to UNCHANGED) per §6.5-B; only mark superseded_at /
    //     status='superseded'. The OUTCOME is 'accepted'.
    if (args.change_hint === "correction") {
      // Close the vigent row (transaction axis only — valid_to untouched
      // per §6.5-B).
      await client.query(
        `UPDATE knowledge_link
            SET superseded_at = now(),
                status        = 'superseded'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      // Insert the corrected row, chained.
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_link_id: vigent.id,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "accepted",
        link_id: newRow.id,
        superseded_link_id: vigent.id,
      };
    }

    // (c) Succession (functional only) — different target on a functional
    //     type AND succession signal (change_hint='succession' OR
    //     textual marker).
    if (
      functional &&
      !sameTarget &&
      (args.change_hint === "succession" ||
        hasSuccessionSignal(fragmentTexts))
    ) {
      // Close the old row for succession (§6.5-A): valid_to = the new row's
      // valid_from (or today when absent), EXCEPT for an intra-day succession
      // where that would collapse the interval — then close on the transaction
      // axis only. See closeVigentForSuccession.
      await closeVigentForSuccession(
        client,
        "knowledge_link",
        vigent.id,
        args.valid_from
      );
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_link_id: vigent.id,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "superseded_previous",
        link_id: newRow.id,
        superseded_link_id: vigent.id,
      };
    }

    // (d) Dispute — functional vigent row exists with overlapping
    //     period, different value, no succession / correction signal.
    //
    //     For multi-valued types: a vigent row with the SAME target is
    //     ALWAYS caught by branch (a) above (re-affirmation now ignores
    //     `valid_from` differences for multi-current types). Multi-valued
    //     can only reach here when change_hint is 'succession' or
    //     'correction' on a multi-current type — semantically odd, since
    //     succession does not apply to multi-current types (§6.5). We
    //     fall through to (e) which will hit the dup-guard and surface
    //     STRUCTURAL_INVALID — the correct outcome for a malformed
    //     proposal on a multi-current type.
    if (!functional) {
      // Multi-valued — fall through to (e) below.
    } else {
      // Functional, vigent row exists, NOT a re-affirmation, NOT
      // correction, NOT succession -> dispute (§6.5-C).
      await client.query(
        `UPDATE knowledge_link
            SET status = 'disputed'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: "disputed",
        supersedes_link_id: null,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "disputed",
        link_id: newRow.id,
        conflicting_link_id: vigent.id,
      };
    }
  }

  // (e) Accepted (new) — no vigent row in scope, or multi-valued with
  //     coexisting validity that doesn't overlap.
  const newRow = await insertLinkRow(client, args, runCtx, {
    status: args.status_for_new_row,
    supersedes_link_id: null,
  });
  await insertLinkProvenance(client, newRow.id, args.fragment_ids);
  return { outcome: "accepted", link_id: newRow.id };
}

/** Insert a `knowledge_link` row with the resolved status and supersedes-link. */
async function insertLinkRow(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  runCtx: RunContext,
  extras: {
    readonly status: "active" | "uncertain" | "disputed";
    readonly supersedes_link_id: string | null;
  }
): Promise<{ readonly id: string }> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO knowledge_link
       (source_node_id, target_node_id, link_type_id,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id, supersedes_link_id)
     VALUES ($1, $2, $3,
             $4::date, $5::date,
             $6::assertion_status, $7,
             $8::valid_from_source, $9, $10)
     RETURNING id`,
    [
      args.source_node_id,
      args.target_node_id,
      args.link_type_id,
      args.valid_from,
      args.valid_to,
      extras.status,
      args.confidence,
      args.valid_from_basis,
      runCtx.llmRunId,
      extras.supersedes_link_id,
    ]
  );
  return res.rows[0]!;
}

// =====================================================================
// Attribute branch — mirrors the link branch with key-scoped predicates.
// =====================================================================

/** Public entry point — see `consolidateLink` doc for the retry semantics. */
export async function consolidateAttribute(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  attrKeyInfo: AttributeKeyRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateAttributeResult> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const savepoint = `gc_attr_${attempt}`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await consolidateAttributeOnce(
        client,
        args,
        attrKeyInfo,
        fragmentTexts,
        runCtx
      );
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (err) {
      if (!isDupGuardViolation(err, "node_attribute_current_dup_guard")) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        throw err;
      }
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      if (attempt === 2) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.",
          { scope: "node_attribute" }
        );
      }
    }
  }
  throw new ValidationFailure(
    "INTERNAL",
    "consolidateAttributeWithRetry: unreachable loop exit.",
    {}
  );
}

async function consolidateAttributeOnce(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  attrKeyInfo: AttributeKeyRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateAttributeResult> {
  const functional = !attrKeyInfo.allows_multiple_current;

  let vigent: VigentAttributeRow | null;
  if (functional) {
    vigent = await lockVigentAttributeByNodeAndKey(
      client,
      args.node_id,
      attrKeyInfo.id
    );
  } else {
    vigent = await lockVigentAttributeByTriple(
      client,
      args.node_id,
      attrKeyInfo.id,
      args.value
    );
  }

  if (vigent !== null) {
    const sameValue = vigent.value === args.value;
    const sameValidFrom = vigent.valid_from === (args.valid_from ?? null);

    // (a) Re-affirmation.
    if (
      sameValue &&
      sameValidFrom &&
      args.change_hint === "none"
    ) {
      await insertAttributeProvenance(client, vigent.id, args.fragment_ids);
      return { outcome: "consolidated", attribute_id: vigent.id };
    }

    // (b) Correction.
    if (args.change_hint === "correction") {
      await client.query(
        `UPDATE node_attribute
            SET superseded_at = now(),
                status        = 'superseded'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_attribute_id: vigent.id,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "accepted",
        attribute_id: newRow.id,
        superseded_attribute_id: vigent.id,
      };
    }

    // (c) Succession (functional only).
    if (
      functional &&
      !sameValue &&
      (args.change_hint === "succession" ||
        hasSuccessionSignal(fragmentTexts))
    ) {
      // §6.5-A succession close with the same intra-day collapse guard as links.
      await closeVigentForSuccession(
        client,
        "node_attribute",
        vigent.id,
        args.valid_from
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_attribute_id: vigent.id,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "superseded_previous",
        attribute_id: newRow.id,
        superseded_attribute_id: vigent.id,
      };
    }

    // (d) Dispute (functional only).
    if (functional) {
      await client.query(
        `UPDATE node_attribute
            SET status = 'disputed'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: "disputed",
        supersedes_attribute_id: null,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "disputed",
        attribute_id: newRow.id,
        conflicting_attribute_id: vigent.id,
      };
    }
    // Multi-valued vigent row with same value would have been caught by
    // re-affirmation; fall through to accepted-new (different valid_from
    // on a multi-valued attribute is coexistence).
  }

  // (e) Accepted (new).
  const newRow = await insertAttributeRow(client, args, runCtx, {
    status: args.status_for_new_row,
    supersedes_attribute_id: null,
  });
  await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
  return { outcome: "accepted", attribute_id: newRow.id };
}

async function insertAttributeRow(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  runCtx: RunContext,
  extras: {
    readonly status: "active" | "uncertain" | "disputed";
    readonly supersedes_attribute_id: string | null;
  }
): Promise<{ readonly id: string }> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO node_attribute
       (node_id, attribute_key_id, value_type, value,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id, supersedes_attribute_id)
     VALUES ($1, $2, $3::attribute_value_type, $4,
             $5::date, $6::date,
             $7::assertion_status, $8,
             $9::valid_from_source, $10, $11)
     RETURNING id`,
    [
      args.node_id,
      args.attribute_key_id,
      args.value_type,
      args.value,
      args.valid_from,
      args.valid_to,
      extras.status,
      args.confidence,
      args.valid_from_basis,
      runCtx.llmRunId,
      extras.supersedes_attribute_id,
    ]
  );
  return res.rows[0]!;
}

/** Test-only helpers. */
export const __testing__ = {
  hasSuccessionSignal,
  SUCCESSION_MARKERS,
};
