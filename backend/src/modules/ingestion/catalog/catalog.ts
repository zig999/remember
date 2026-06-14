// Catalog cache — read-only in-process snapshot of node_type, link_type,
// link_type_rule and attribute_key, loaded at BFF startup.
//
// Rationale (§12 of v7 + "Known Technical Constraints" of `ingestion.back.md`):
//   Catalog data is migration-only. Reading it on every MCP call is wasteful;
//   loading once at boot is correct because the only mutation path is a
//   versioned migration that requires a BFF restart anyway.
//
// The catalog covers BR-14 (UNKNOWN_TYPE on node_type / link_type / key) and
// BR-15 (RULE_VIOLATION via `LinkTypeRule`).
//
// As of TC-02 (valid-values-attribute-domains, BR-30), the snapshot also
// materializes the closed value domains per `AttributeKey` from the new
// `attribute_valid_value` table (owned by the `knowledge-graph` domain,
// migration `0003_attribute_valid_value.sql`; read-only here). A key with
// zero rows = open domain (backward-compatible legacy behavior; any literal
// that parses against `value_type` is accepted). A key with >= 1 rows =
// closed domain — only the listed values are accepted by the structural
// validator. Surface: `attributeValidValuesByKeyId` map +
// `domainOf(snapshot, keyId)` helper.

import type { PoolClient } from "pg";

/** A `node_type` row — small enough to keep verbatim. */
export interface NodeTypeRow {
  readonly id: string;
  readonly name: string;
  /**
   * Catalog description — rendered in the extraction prompt so the LLM can map
   * abstract types (e.g. `Document`) from the text. Optional: in-memory test
   * fixtures may omit it; the live `loadCatalog` always populates it.
   */
  readonly description?: string;
}

/** A `link_type` row plus the flags consulted by the temporal layer. */
export interface LinkTypeRow {
  readonly id: string;
  readonly name: string;
  readonly is_temporal: boolean;
  readonly allows_multiple_current: boolean;
  readonly requires_valid_from: boolean;
  readonly requires_valid_to_on_change: boolean;
}

/**
 * A vigent `link_type_rule` row. We snapshot the whole table — the temporal
 * filter (`valid_to IS NULL OR valid_to > current_date`) is applied at
 * lookup time so a rule that expires between reloads is honoured.
 */
export interface LinkTypeRuleRow {
  readonly link_type_id: string;
  readonly source_node_type_id: string;
  readonly target_node_type_id: string;
  readonly valid_from: Date | null;
  readonly valid_to: Date | null;
}

/** Attribute key entry — scoped to a `node_type_id`. */
export interface AttributeKeyRow {
  readonly id: string;
  readonly node_type_id: string;
  readonly key: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly is_temporal: boolean;
  readonly allows_multiple_current: boolean;
  readonly requires_valid_from: boolean;
}

/**
 * Row shape for `attribute_valid_value` — only the two columns needed at
 * boot. The migration also stores `label`, `sort_order`, `description` and
 * `version`, but those are surface metadata that the validator does not
 * consult; loading them would only enlarge the snapshot without changing
 * behavior. If a future feature needs them, extend this row and the SELECT
 * in `loadCatalog`.
 */
export interface AttributeValidValueRow {
  readonly attribute_key_id: string;
  readonly value: string;
}

/** Read-only snapshot exposed to the validation layers. */
export interface CatalogSnapshot {
  readonly nodeTypeByName: ReadonlyMap<string, NodeTypeRow>;
  readonly nodeTypeById: ReadonlyMap<string, NodeTypeRow>;
  readonly linkTypeByName: ReadonlyMap<string, LinkTypeRow>;
  readonly linkTypeById: ReadonlyMap<string, LinkTypeRow>;
  /** All rules; queries filter by date at lookup time (BR-15). */
  readonly linkTypeRules: readonly LinkTypeRuleRow[];
  /** Keyed by `${node_type_id}\x1F${key}`. */
  readonly attributeKeyByNodeTypeAndKey: ReadonlyMap<string, AttributeKeyRow>;
  /** Keyed by `attribute_key.id` — used by `propose_attribute` cross-checks. */
  readonly attributeKeyById: ReadonlyMap<string, AttributeKeyRow>;
  /**
   * Closed value domains per `AttributeKey` (BR-30).
   *
   * Key: `attribute_key.id`. Value: the set of allowed literal values for
   * that key. Absence of an entry — or an empty set, which `loadCatalog`
   * does not produce but `buildSnapshot` accepts — means **open domain**:
   * any literal that parses against `attribute_key.value_type` is
   * accepted. Presence with at least one value means **closed domain**:
   * only the listed values are accepted.
   *
   * Backward compatibility: every `AttributeKey` already in the catalog
   * has zero rows in `attribute_valid_value` at the time `0003` is applied
   * (except for the explicitly seeded `Document.doc_type` /
   * `Event.event_type`), so existing behavior is preserved.
   *
   * Boot-only: changes to `attribute_valid_value` require a BFF restart.
   */
  readonly attributeValidValuesByKeyId: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Build the cache key for attribute lookup `(node_type_id, key)` -> row. The
 * separator is the ASCII US (`\x1F`) — same convention as the advisory-lock
 * key in BR-20.
 */
export function attributeKeyCacheKey(nodeTypeId: string, key: string): string {
  return `${nodeTypeId}\x1F${key}`;
}

/** Load the entire catalog into memory. Called once at BFF startup. */
export async function loadCatalog(
  client: PoolClient
): Promise<CatalogSnapshot> {
  const nodeTypeRes = await client.query<NodeTypeRow>(
    `SELECT id, name, description FROM node_type`
  );
  const linkTypeRes = await client.query<LinkTypeRow>(
    `SELECT id, name, is_temporal, allows_multiple_current,
            requires_valid_from, requires_valid_to_on_change
       FROM link_type`
  );
  const ruleRes = await client.query<LinkTypeRuleRow>(
    `SELECT link_type_id, source_node_type_id, target_node_type_id,
            valid_from, valid_to
       FROM link_type_rule`
  );
  const attrRes = await client.query<AttributeKeyRow>(
    `SELECT id, node_type_id, key, value_type,
            is_temporal, allows_multiple_current, requires_valid_from
       FROM attribute_key`
  );
  // BR-30 — closed value domains per AttributeKey. The table is owned by
  // the knowledge-graph domain (migration 0003_attribute_valid_value.sql)
  // and is read-only here. Only the two columns consumed by the validator
  // are loaded — see the comment on `AttributeValidValueRow`.
  const validValueRes = await client.query<AttributeValidValueRow>(
    `SELECT attribute_key_id, value FROM attribute_valid_value`
  );

  return buildSnapshot({
    nodeTypes: nodeTypeRes.rows,
    linkTypes: linkTypeRes.rows,
    linkTypeRules: ruleRes.rows,
    attributeKeys: attrRes.rows,
    attributeValidValues: validValueRes.rows,
  });
}

/**
 * Pure assembler — exported for tests. Builds the `CatalogSnapshot` from raw
 * row arrays without touching the DB.
 */
export function buildSnapshot(args: {
  nodeTypes: readonly NodeTypeRow[];
  linkTypes: readonly LinkTypeRow[];
  linkTypeRules: readonly LinkTypeRuleRow[];
  attributeKeys: readonly AttributeKeyRow[];
  /**
   * Optional — when omitted, every `AttributeKey` is treated as having an
   * open domain. Test fixtures that do not exercise BR-30 may leave this
   * out; the live `loadCatalog` always passes the full result of
   * `SELECT attribute_key_id, value FROM attribute_valid_value`.
   */
  attributeValidValues?: readonly AttributeValidValueRow[];
}): CatalogSnapshot {
  const nodeTypeByName = new Map<string, NodeTypeRow>();
  const nodeTypeById = new Map<string, NodeTypeRow>();
  for (const r of args.nodeTypes) {
    nodeTypeByName.set(r.name, r);
    nodeTypeById.set(r.id, r);
  }
  const linkTypeByName = new Map<string, LinkTypeRow>();
  const linkTypeById = new Map<string, LinkTypeRow>();
  for (const r of args.linkTypes) {
    linkTypeByName.set(r.name, r);
    linkTypeById.set(r.id, r);
  }
  const attributeKeyByNodeTypeAndKey = new Map<string, AttributeKeyRow>();
  const attributeKeyById = new Map<string, AttributeKeyRow>();
  for (const r of args.attributeKeys) {
    attributeKeyByNodeTypeAndKey.set(
      attributeKeyCacheKey(r.node_type_id, r.key),
      r
    );
    attributeKeyById.set(r.id, r);
  }
  // BR-30 — accumulate the closed value domain per attribute_key_id. A
  // `Set` deduplicates incidentally; the table's UNIQUE(attribute_key_id,
  // value) constraint (0003) already guarantees uniqueness at the DB
  // level, but tests pass raw arrays so we still build via .add().
  const attributeValidValuesByKeyId = new Map<string, Set<string>>();
  for (const r of args.attributeValidValues ?? []) {
    let bucket = attributeValidValuesByKeyId.get(r.attribute_key_id);
    if (bucket === undefined) {
      bucket = new Set<string>();
      attributeValidValuesByKeyId.set(r.attribute_key_id, bucket);
    }
    bucket.add(r.value);
  }
  return {
    nodeTypeByName,
    nodeTypeById,
    linkTypeByName,
    linkTypeById,
    linkTypeRules: args.linkTypeRules,
    attributeKeyByNodeTypeAndKey,
    attributeKeyById,
    attributeValidValuesByKeyId,
  };
}

/**
 * Closed-domain lookup for `AttributeKey` (BR-30).
 *
 * Returns `null` when the key has NO entry in
 * `attributeValidValuesByKeyId` — i.e. an **open domain**: no closed-domain
 * check applies and the structural validator falls through to its
 * subsequent layers. This is the backward-compatible default for every
 * key that has not been explicitly closed in `0003_attribute_valid_value`
 * (or a successor migration).
 *
 * Returns the (read-only) `Set<string>` of allowed values when the key has
 * at least one entry — i.e. a **closed domain**: only values present in
 * the set are accepted; everything else fails with `STRUCTURAL_INVALID`
 * carrying `{ value, allowed_values }`.
 *
 * Pure function: no DB access, no mutation of the snapshot. The returned
 * `Set` is the snapshot's own instance — callers MUST NOT mutate it. The
 * snapshot fields are typed `ReadonlyMap<…, ReadonlySet<…>>` to make that
 * contract explicit.
 *
 * The keyId is an `attribute_key.id` (a UUID); the convention `keyId` is
 * preserved from the spec to match the BR-30 description.
 */
export function domainOf(
  snapshot: CatalogSnapshot,
  keyId: string
): ReadonlySet<string> | null {
  const domain = snapshot.attributeValidValuesByKeyId.get(keyId);
  // Defensive: a set with zero entries is also treated as open. The live
  // loader never produces such a row (every entry in the snapshot map
  // comes from a real DB row), but a hand-built test fixture might, and
  // an empty set carries the same semantic as no entry at all.
  if (domain === undefined || domain.size === 0) {
    return null;
  }
  return domain;
}

/**
 * Look up an active `link_type_rule` for the given (source, link, target)
 * triple. Returns `true` iff at least one rule covers the triple AND its
 * validity window includes today (semi-open `[valid_from, valid_to)`; nulls
 * mean unbounded — §5.1).
 */
export function isLinkRuleActive(
  snapshot: CatalogSnapshot,
  args: {
    source_node_type_id: string;
    link_type_id: string;
    target_node_type_id: string;
    today: Date;
  }
): boolean {
  const today = stripTime(args.today);
  for (const r of snapshot.linkTypeRules) {
    if (
      r.link_type_id !== args.link_type_id ||
      r.source_node_type_id !== args.source_node_type_id ||
      r.target_node_type_id !== args.target_node_type_id
    ) {
      continue;
    }
    const from = r.valid_from ? stripTime(r.valid_from) : null;
    const to = r.valid_to ? stripTime(r.valid_to) : null;
    if (from !== null && today.getTime() < from.getTime()) continue;
    if (to !== null && today.getTime() >= to.getTime()) continue;
    return true;
  }
  return false;
}

function stripTime(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
