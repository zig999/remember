// Catalog cache for the knowledge-graph domain.
//
// Catalog data (`node_type`, `link_type`, `link_type_rule`, `attribute_key`)
// mutates ONLY via versioned migrations (BR-10 / §12). Loading it once into
// process memory at BFF startup yields O(1) name/id lookups for the
// validation layers (BR-03, BR-04) without paying for repeated SQL.
//
// Per the back spec stack note:
//   "Read endpoints (UC-01, UC-02, UC-03) bypass the cache to surface the
//    authoritative row identifiers, but UC-04 / UC-05 / UC-06 use it to
//    validate filter values cheaply (BR-03, BR-04)."
//
// Cache invalidation = process restart, accompanying every catalog migration.

import type { PoolClient } from "pg";

/** Row shape for `node_type` — verbatim columns plus version. */
export interface NodeTypeRow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
}

/** Row shape for `link_type` (full). */
export interface LinkTypeRow {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly inverse_name: string;
  readonly is_temporal: boolean;
  readonly allows_multiple_current: boolean;
  readonly requires_valid_from: boolean;
  readonly requires_valid_to_on_change: boolean;
  readonly version: number;
}

/** Row shape for `link_type_rule`. */
export interface LinkTypeRuleRow {
  readonly id: string;
  readonly link_type_id: string;
  readonly source_node_type_id: string;
  readonly target_node_type_id: string;
  readonly valid_from: Date | null;
  readonly valid_to: Date | null;
}

/** Row shape for `attribute_key`. */
export interface AttributeKeyRow {
  readonly id: string;
  readonly node_type_id: string;
  readonly key: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly is_temporal: boolean;
  readonly allows_multiple_current: boolean;
  readonly requires_valid_from: boolean;
  readonly description: string;
  readonly version: number;
}

/** Row shape for `attribute_valid_value` (closed-domain catalog, BR-30). */
export interface AttributeValidValueRow {
  readonly attribute_key_id: string;
  readonly value: string;
}

/** Read-only snapshot exposed to validation layers (services). */
export interface CatalogSnapshot {
  readonly nodeTypeByName: ReadonlyMap<string, NodeTypeRow>;
  readonly nodeTypeById: ReadonlyMap<string, NodeTypeRow>;
  readonly linkTypeByName: ReadonlyMap<string, LinkTypeRow>;
  readonly linkTypeById: ReadonlyMap<string, LinkTypeRow>;
  readonly linkTypeRules: readonly LinkTypeRuleRow[];
  /** Keyed by `${node_type_id}\x1F${key}`. */
  readonly attributeKeyByNodeTypeAndKey: ReadonlyMap<string, AttributeKeyRow>;
  readonly attributeKeyById: ReadonlyMap<string, AttributeKeyRow>;
  /**
   * Closed value domains keyed by `attribute_key.id` (BR-30). An `AttributeKey`
   * WITHOUT an entry here has an OPEN domain (any literal parsing against its
   * `value_type` is accepted). Consumed by the chat ontology block so the model
   * SEES the allowed values up-front instead of discovering them by rejection.
   */
  readonly attributeValidValuesByKeyId: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Build the composite lookup key `(node_type_id, key)` for attribute_key. */
export function attributeKeyCacheKey(
  nodeTypeId: string,
  key: string
): string {
  return `${nodeTypeId}\x1F${key}`;
}

/** Load the catalog from the DB into memory. Called once at BFF startup. */
export async function loadCatalog(
  client: PoolClient
): Promise<CatalogSnapshot> {
  // A single PoolClient serializes queries — issue them sequentially. Running
  // concurrent client.query() on one client is deprecated in pg (removed in
  // pg@9). This loads four tiny catalog tables once at startup, so the serial
  // round-trips are negligible.
  const nodeTypeRes = await client.query<NodeTypeRow>(
    `SELECT id, name, description, version FROM node_type`
  );
  const linkTypeRes = await client.query<LinkTypeRow>(
    `SELECT id, name, label, description, inverse_name,
            is_temporal, allows_multiple_current,
            requires_valid_from, requires_valid_to_on_change, version
       FROM link_type`
  );
  const ruleRes = await client.query<LinkTypeRuleRow>(
    `SELECT id, link_type_id, source_node_type_id, target_node_type_id,
            valid_from, valid_to
       FROM link_type_rule`
  );
  const attrRes = await client.query<AttributeKeyRow>(
    `SELECT id, node_type_id, key, value_type, is_temporal,
            allows_multiple_current, requires_valid_from,
            description, version
       FROM attribute_key`
  );
  // BR-30 — closed value domains per AttributeKey. Only the two columns the
  // renderer needs are loaded (the migration's `label` column is deliberately
  // omitted). Table is owned by 0003_attribute_valid_value.sql.
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

/** Pure assembler — exported for tests. */
export function buildSnapshot(args: {
  nodeTypes: readonly NodeTypeRow[];
  linkTypes: readonly LinkTypeRow[];
  linkTypeRules: readonly LinkTypeRuleRow[];
  attributeKeys: readonly AttributeKeyRow[];
  /**
   * Optional — when omitted, every `AttributeKey` is treated as OPEN (no
   * closed-domain entries). Test fixtures that do not exercise BR-30 may leave
   * it out; the live `loadCatalog` always passes the full result of
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
  // BR-30 — accumulate the closed value domain per attribute_key_id. The DB's
  // UNIQUE(attribute_key_id, value) constraint already guarantees uniqueness;
  // the `Set` deduplicates hand-built test fixtures too.
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
