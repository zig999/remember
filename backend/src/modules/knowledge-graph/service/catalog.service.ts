// Catalog service — implements UC-01 / UC-02 / UC-03 (read-only catalog
// endpoints). Bypasses the in-memory cache (BR-10 stack note) so the
// authoritative DB row is what reaches the client; the cache is reserved
// for query-parameter validation (BR-03, BR-04).

import type { PoolClient } from "pg";

import type {
  AttributeKeyListResponse,
  LinkTypeListResponse,
  LinkTypeRuleResponse,
  NodeTypeListResponse,
} from "../dto/catalog.dto.js";
import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  listAttributeKeys,
  listAttributeValidValues,
  listLinkTypeRules,
  listLinkTypes,
  listNodeTypes,
  type LinkTypeRuleJoined,
} from "../repository/catalog.repository.js";
import { UnknownNodeTypeError } from "./errors.js";

/** UC-01 — GET /api/v1/node-types */
export async function listNodeTypesService(
  client: PoolClient
): Promise<NodeTypeListResponse> {
  const rows = await listNodeTypes(client);
  return {
    total: rows.length,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
    })),
  };
}

/** UC-02 — GET /api/v1/link-types[?include_rules=true] */
export async function listLinkTypesService(
  client: PoolClient,
  options: { include_rules: boolean }
): Promise<LinkTypeListResponse> {
  const linkTypes = await listLinkTypes(client);

  let rulesByLinkType: Map<string, LinkTypeRuleJoined[]> | null = null;
  if (options.include_rules) {
    rulesByLinkType = new Map();
    const rules = await listLinkTypeRules(client);
    for (const r of rules) {
      const arr = rulesByLinkType.get(r.link_type_id);
      if (arr === undefined) {
        rulesByLinkType.set(r.link_type_id, [r]);
      } else {
        arr.push(r);
      }
    }
  }

  return {
    total: linkTypes.length,
    items: linkTypes.map((lt) => {
      const base = {
        id: lt.id,
        name: lt.name,
        label: lt.label,
        description: lt.description,
        inverse_name: lt.inverse_name,
        is_temporal: lt.is_temporal,
        allows_multiple_current: lt.allows_multiple_current,
        requires_valid_from: lt.requires_valid_from,
        requires_valid_to_on_change: lt.requires_valid_to_on_change,
        version: lt.version,
      };
      if (rulesByLinkType === null) return base;

      const ruleRows = rulesByLinkType.get(lt.id) ?? [];
      const rules: LinkTypeRuleResponse[] = ruleRows.map((r) => ({
        id: r.id,
        source_node_type: r.source_node_type,
        target_node_type: r.target_node_type,
        valid_from: r.valid_from ? formatDate(r.valid_from) : null,
        valid_to: r.valid_to ? formatDate(r.valid_to) : null,
      }));
      return { ...base, rules };
    }),
  };
}

/** UC-03 — GET /api/v1/attribute-keys[?node_type=Project] */
export async function listAttributeKeysService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  options: { node_type?: string }
): Promise<AttributeKeyListResponse> {
  let nodeTypeId: string | undefined;
  if (options.node_type !== undefined) {
    const row = catalog.nodeTypeByName.get(options.node_type);
    if (row === undefined) {
      // BR-03 — fail fast before SQL.
      throw new UnknownNodeTypeError(options.node_type);
    }
    nodeTypeId = row.id;
  }

  const rows = await listAttributeKeys(client, { node_type_id: nodeTypeId });

  // BR-30 — attach closed-domain values so REST/MCP clients see the allowed
  // set up-front (parity with the chat ontology block). Group per key id;
  // keys with no rows stay OPEN (no `valid_values`).
  const validValueRows = await listAttributeValidValues(client, {
    node_type_id: nodeTypeId,
  });
  const valuesByKeyId = new Map<string, string[]>();
  for (const vv of validValueRows) {
    const arr = valuesByKeyId.get(vv.attribute_key_id);
    if (arr === undefined) {
      valuesByKeyId.set(vv.attribute_key_id, [vv.value]);
    } else {
      arr.push(vv.value);
    }
  }

  return {
    total: rows.length,
    items: rows.map((r) => {
      const base = {
        id: r.id,
        node_type: r.node_type,
        key: r.key,
        value_type: r.value_type,
        is_temporal: r.is_temporal,
        allows_multiple_current: r.allows_multiple_current,
        requires_valid_from: r.requires_valid_from,
        description: r.description,
        version: r.version,
      };
      const values = valuesByKeyId.get(r.id);
      return values !== undefined && values.length > 0
        ? { ...base, valid_values: [...values].sort() }
        : base;
    }),
  };
}

/** Format `Date` as `YYYY-MM-DD` using UTC components (DB dates are TZ-less). */
function formatDate(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
