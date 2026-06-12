// Catalog repository — parameterized SQL only (CLAUDE.md "Security").
//
// Surfaces fresh rows for UC-01 / UC-02 / UC-03 (catalog read endpoints).
// Per the back spec stack note, these endpoints bypass the in-memory cache
// to return the authoritative DB rows.

import type { PoolClient } from "pg";

import type {
  AttributeKeyRow,
  LinkTypeRow,
  LinkTypeRuleRow,
  NodeTypeRow,
} from "../catalog/catalog.js";

// ---------------------------------------------------------------------------
// node_type
// ---------------------------------------------------------------------------

export async function listNodeTypes(
  client: PoolClient
): Promise<readonly NodeTypeRow[]> {
  const res = await client.query<NodeTypeRow>(
    `SELECT id, name, description, version
       FROM node_type
       ORDER BY name ASC`
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// link_type + link_type_rule
// ---------------------------------------------------------------------------

export async function listLinkTypes(
  client: PoolClient
): Promise<readonly LinkTypeRow[]> {
  const res = await client.query<LinkTypeRow>(
    `SELECT id, name, label, description, inverse_name,
            is_temporal, allows_multiple_current,
            requires_valid_from, requires_valid_to_on_change, version
       FROM link_type
       ORDER BY name ASC`
  );
  return res.rows;
}

/**
 * Row shape returned by `listLinkTypeRules`: includes the source/target
 * node_type names already joined for the response payload (UC-02 surfaces
 * names, not ids, in the rule projection).
 */
export interface LinkTypeRuleJoined {
  readonly id: string;
  readonly link_type_id: string;
  readonly source_node_type: string;
  readonly target_node_type: string;
  readonly valid_from: Date | null;
  readonly valid_to: Date | null;
}

export async function listLinkTypeRules(
  client: PoolClient
): Promise<readonly LinkTypeRuleJoined[]> {
  const res = await client.query<LinkTypeRuleJoined>(
    `SELECT r.id,
            r.link_type_id,
            src.name AS source_node_type,
            tgt.name AS target_node_type,
            r.valid_from,
            r.valid_to
       FROM link_type_rule r
       JOIN node_type src ON src.id = r.source_node_type_id
       JOIN node_type tgt ON tgt.id = r.target_node_type_id
       ORDER BY r.link_type_id, src.name, tgt.name`
  );
  return res.rows;
}

/** Returned `LinkTypeRuleRow` carries ids only; kept for cache parity. */
export async function listLinkTypeRuleRows(
  client: PoolClient
): Promise<readonly LinkTypeRuleRow[]> {
  const res = await client.query<LinkTypeRuleRow>(
    `SELECT id, link_type_id, source_node_type_id, target_node_type_id,
            valid_from, valid_to
       FROM link_type_rule`
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// attribute_key
// ---------------------------------------------------------------------------

/**
 * Attribute key joined with its scope NodeType name (response payload uses
 * the name, not the id).
 */
export interface AttributeKeyJoined {
  readonly id: string;
  readonly node_type_id: string;
  readonly node_type: string;
  readonly key: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly is_temporal: boolean;
  readonly allows_multiple_current: boolean;
  readonly requires_valid_from: boolean;
  readonly description: string;
  readonly version: number;
}

/**
 * List all AttributeKeys (optionally restricted to a single `node_type_id`).
 * The service layer translates the name -> id via the catalog cache before
 * calling this method (BR-03).
 */
export async function listAttributeKeys(
  client: PoolClient,
  filter: { node_type_id?: string } = {}
): Promise<readonly AttributeKeyJoined[]> {
  if (filter.node_type_id !== undefined) {
    const res = await client.query<AttributeKeyJoined>(
      `SELECT ak.id, ak.node_type_id, nt.name AS node_type, ak.key,
              ak.value_type, ak.is_temporal, ak.allows_multiple_current,
              ak.requires_valid_from, ak.description, ak.version
         FROM attribute_key ak
         JOIN node_type nt ON nt.id = ak.node_type_id
         WHERE ak.node_type_id = $1
         ORDER BY ak.key ASC`,
      [filter.node_type_id]
    );
    return res.rows;
  }

  const res = await client.query<AttributeKeyJoined>(
    `SELECT ak.id, ak.node_type_id, nt.name AS node_type, ak.key,
            ak.value_type, ak.is_temporal, ak.allows_multiple_current,
            ak.requires_valid_from, ak.description, ak.version
       FROM attribute_key ak
       JOIN node_type nt ON nt.id = ak.node_type_id
       ORDER BY nt.name ASC, ak.key ASC`
  );
  return res.rows;
}

// kept here only to placate downstream unused-import checks
export type { AttributeKeyRow };
