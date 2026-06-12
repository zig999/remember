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

import type { PoolClient } from "pg";

/** A `node_type` row — small enough to keep verbatim. */
export interface NodeTypeRow {
  readonly id: string;
  readonly name: string;
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
    `SELECT id, name FROM node_type`
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

  return buildSnapshot({
    nodeTypes: nodeTypeRes.rows,
    linkTypes: linkTypeRes.rows,
    linkTypeRules: ruleRes.rows,
    attributeKeys: attrRes.rows,
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
  return {
    nodeTypeByName,
    nodeTypeById,
    linkTypeByName,
    linkTypeById,
    linkTypeRules: args.linkTypeRules,
    attributeKeyByNodeTypeAndKey,
    attributeKeyById,
  };
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
