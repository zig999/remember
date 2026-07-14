// Unit tests for `listAttributeKeysService` — BR-30 closed-domain surfacing.
//
// Intent: a REST/MCP client must SEE the allowed values of a closed-domain
// attribute up-front (`valid_values`) instead of discovering them by triggering
// a `VALIDATION_INVALID_FORMAT` rejection. This is the REST/MCP mirror of the
// chat ontology-block change; both transports flow through this one service.

import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import { listAttributeKeysService } from "../../../modules/knowledge-graph/service/catalog.service.js";

interface QueryCall {
  readonly sql: string;
  readonly params: readonly unknown[] | undefined;
}

/**
 * Minimal `PoolClient` stub that dispatches by table name. The service calls
 * `attribute_key` first, then `attribute_valid_value`; the valid-value query
 * JOINs `attribute_key`, so it MUST be matched first.
 */
function mockClient(rows: {
  attributeKeys: unknown[];
  validValues: unknown[];
}): { client: PoolClient; calls: QueryCall[] } {
  const calls: QueryCall[] = [];
  const client = {
    query: async (sql: string, params?: readonly unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("attribute_valid_value")) {
        return { rows: rows.validValues };
      }
      if (sql.includes("attribute_key")) {
        return { rows: rows.attributeKeys };
      }
      throw new Error(`unexpected query: ${sql}`);
    },
  } as unknown as PoolClient;
  return { client, calls };
}

const AK_STATUS = {
  id: "ak-status",
  node_type_id: "nt-task",
  node_type: "Task",
  key: "status",
  value_type: "text" as const,
  is_temporal: false,
  allows_multiple_current: false,
  requires_valid_from: false,
  description: "Task lifecycle status.",
  version: 1,
};
const AK_NOTE = {
  ...AK_STATUS,
  id: "ak-note",
  key: "note",
  description: "Free-form note.",
};

const EMPTY_CATALOG = buildSnapshot({
  nodeTypes: [{ id: "nt-task", name: "Task", description: "d", version: 1 }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

describe("listAttributeKeysService — closed-domain valid_values (BR-30)", () => {
  it("attaches SORTED valid_values to a closed-domain key, omits it on an open key", async () => {
    const { client } = mockClient({
      attributeKeys: [AK_STATUS, AK_NOTE],
      validValues: [
        { attribute_key_id: "ak-status", value: "em andamento" },
        { attribute_key_id: "ak-status", value: "a fazer" },
        { attribute_key_id: "ak-status", value: "concluida" },
      ],
    });

    const out = await listAttributeKeysService(client, EMPTY_CATALOG, {});

    const status = out.items.find((i) => i.id === "ak-status");
    const note = out.items.find((i) => i.id === "ak-note");
    expect(status?.valid_values).toEqual([
      "a fazer",
      "concluida",
      "em andamento",
    ]);
    // Open domain (no rows) -> field absent, not an empty array.
    expect(note?.valid_values).toBeUndefined();
  });

  it("threads the resolved node_type_id filter into BOTH queries (attribute_key AND attribute_valid_value)", async () => {
    const { client, calls } = mockClient({
      attributeKeys: [AK_STATUS],
      validValues: [{ attribute_key_id: "ak-status", value: "a fazer" }],
    });

    await listAttributeKeysService(client, EMPTY_CATALOG, {
      node_type: "Task",
    });

    // "Task" resolves to nt-task via the catalog; the closed-domain query must
    // be filtered by the SAME id so a filtered listing does not leak values
    // from other node types.
    const validValueCall = calls.find((c) =>
      c.sql.includes("attribute_valid_value")
    );
    expect(validValueCall?.params).toEqual(["nt-task"]);
  });
});
