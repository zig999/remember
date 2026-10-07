import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  resolveOrCreateNode,
  type ResolveOrCreateNodeResult,
} from "../../../modules/ingestion/service/entity-resolution.service.js";

const PERSON_TYPE_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_TYPE_ID = "00000000-0000-0000-0000-000000000002";
const RUN_ID = "44444444-4444-4444-4444-444444444444";
const NEW_NODE_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

const HOMONYM_NAME = "CNPq";
const HOMONYM_NORM = "cnpq";
const CANONICAL_NORM = "conselho nacional de desenvolvimento cientifico";

const NODE_LOW = "11111111-1111-4111-8111-111111111111";
const NODE_OTHER_TYPE = "22222222-2222-4222-8222-222222222222";
const NODE_MERGED = "33333333-3333-4333-8333-333333333333";
const NODE_LATER = "44444444-4444-4444-8444-444444444444";
const NODE_MID = "55555555-5555-4555-8555-555555555555";
const NODE_HIGH = "99999999-9999-4999-8999-999999999999";

const EARLY = "2026-01-01T00:00:00.000Z";
const MIDDLE = "2026-02-01T00:00:00.000Z";
const LATE = "2026-03-01T00:00:00.000Z";

const REPETITIONS = 6;
const MATCHED = "matched_existing";

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: PERSON_TYPE_ID, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

interface StoreNode {
  readonly id: string;
  readonly node_type_id: string;
  readonly status: string;
}

interface StoreAlias {
  readonly node_id: string;
  readonly alias_norm: string;
  readonly created_at: string | null;
}

interface Store {
  readonly nodes: readonly StoreNode[];
  readonly aliases: readonly StoreAlias[];
  readonly rotate: boolean;
  exactQueries: number;
}

interface Answer {
  readonly rows: readonly unknown[];
  readonly rowCount: number;
}

type SortColumn = "created_at" | "node_id";

interface SortKey {
  readonly column: SortColumn;
  readonly direction: 1 | -1;
  readonly nullsFirst: boolean;
}

const ORDER_ITEM = /^(?:\w+\.)?(\w+)(?: (ASC|DESC))?(?: NULLS (FIRST|LAST))?$/i;
const ORDER_CLAUSE = /ORDER BY (.+?)(?: LIMIT \d+)?$/i;
const LIMIT_CLAUSE = /LIMIT (\d+)\s*$/i;
const NOT_NULL_FILTER = /created_at IS NOT NULL/i;

const SORT_COLUMNS = new Map<string, SortColumn>([
  ["created_at", "created_at"],
  ["node_id", "node_id"],
  ["id", "node_id"],
]);

function answerRows(rows: readonly unknown[]): Answer {
  return { rows, rowCount: rows.length };
}

function parseSortKey(item: string): SortKey {
  const parts = ORDER_ITEM.exec(item.trim());
  const column = SORT_COLUMNS.get((parts?.[1] ?? "").toLowerCase());
  if (parts === null || column === undefined) {
    throw new Error(`unsupported ORDER BY item in store stand-in: ${item}`);
  }
  const descending = (parts[2] ?? "").toUpperCase() === "DESC";
  const nulls = (parts[3] ?? "").toUpperCase();
  return {
    column,
    direction: descending ? -1 : 1,
    nullsFirst: nulls === "" ? descending : nulls === "FIRST",
  };
}

function compareValues(
  a: string | null,
  b: string | null,
  key: SortKey
): number {
  if (a === b) return 0;
  if (a === null) return key.nullsFirst ? -1 : 1;
  if (b === null) return key.nullsFirst ? 1 : -1;
  return (a < b ? -1 : 1) * key.direction;
}

function applyOrder(rows: readonly StoreAlias[], sql: string): StoreAlias[] {
  const clause = ORDER_CLAUSE.exec(sql);
  if (clause === null) return [...rows];
  const keys = (clause[1] ?? "").split(",").map(parseSortKey);
  return [...rows].sort((a, b) => {
    for (const key of keys) {
      const left = key.column === "node_id" ? a.node_id : a.created_at;
      const right = key.column === "node_id" ? b.node_id : b.created_at;
      const result = compareValues(left, right, key);
      if (result !== 0) return result;
    }
    return 0;
  });
}

function rotateRows(
  rows: readonly StoreAlias[],
  by: number
): StoreAlias[] {
  if (rows.length === 0) return [];
  const offset = by % rows.length;
  return [...rows.slice(offset), ...rows.slice(0, offset)];
}

function matchingAliases(
  store: Store,
  params: readonly unknown[]
): StoreAlias[] {
  const wanted = String(params[0]).trim().toLowerCase();
  const typeId = String(params[1]);
  return store.aliases.filter(
    (a) =>
      a.alias_norm === wanted &&
      store.nodes.some(
        (n) =>
          n.id === a.node_id &&
          n.node_type_id === typeId &&
          n.status === "active"
      )
  );
}

function answerExactMatch(
  store: Store,
  sql: string,
  params: readonly unknown[]
): Answer {
  const matching = matchingAliases(store, params);
  const shift = store.rotate ? store.exactQueries : 0;
  store.exactQueries += 1;
  const physical = rotateRows(matching, shift).filter(
    (a) => !NOT_NULL_FILTER.test(sql) || a.created_at !== null
  );
  const ordered = applyOrder(physical, sql);
  const limit = LIMIT_CLAUSE.exec(sql);
  const taken =
    limit === null ? ordered : ordered.slice(0, Number(limit[1]));
  return answerRows(taken.map((a) => ({ node_id: a.node_id })));
}

function answer(store: Store, sql: string, params: readonly unknown[]): Answer {
  if (sql.startsWith("SELECT (CAST")) return answerRows([{ key: "lock-key" }]);
  if (/pg_advisory_xact_lock/i.test(sql)) return answerRows([{}]);
  if (sql.startsWith("SELECT na.node_id") && sql.includes("alias_norm = norm(")) {
    return answerExactMatch(store, sql, params);
  }
  if (sql.startsWith("SELECT na.node_id") && sql.includes("alias_norm % norm(")) {
    return answerRows([]);
  }
  if (sql.startsWith("INSERT INTO knowledge_node")) {
    return answerRows([{ id: NEW_NODE_ID }]);
  }
  if (sql.startsWith("INSERT INTO node_alias")) return answerRows([]);
  throw new Error(`unexpected SQL in store stand-in: ${sql.slice(0, 80)}`);
}

function buildClient(store: Store): PoolClient {
  const query = async (...args: unknown[]): Promise<Answer> => {
    const sql = String(args[0]).replace(/\s+/g, " ").trim();
    const params: readonly unknown[] = Array.isArray(args[1]) ? args[1] : [];
    return answer(store, sql, params);
  };
  return { query, release: () => undefined } as unknown as PoolClient;
}

function storeOf(
  nodes: readonly StoreNode[],
  aliases: readonly StoreAlias[],
  rotate = false
): Store {
  return { nodes, aliases, rotate, exactQueries: 0 };
}

function activeNode(
  id: string,
  typeId = PERSON_TYPE_ID,
  status = "active"
): StoreNode {
  return { id, node_type_id: typeId, status };
}

function homonym(nodeId: string, createdAt: string | null): StoreAlias {
  return { node_id: nodeId, alias_norm: HOMONYM_NORM, created_at: createdAt };
}

async function proposeHomonym(
  store: Store
): Promise<ResolveOrCreateNodeResult> {
  return await resolveOrCreateNode(buildClient(store), {
    nodeTypeId: PERSON_TYPE_ID,
    name: HOMONYM_NAME,
    llmRunId: RUN_ID,
    catalog: CATALOG,
  });
}

function resolvedTo(nodeId: string): { node_id: string; resolution: string } {
  return { node_id: nodeId, resolution: MATCHED };
}

function pickResolution(result: ResolveOrCreateNodeResult): {
  node_id: string;
  resolution: string;
} {
  return { node_id: result.node_id, resolution: result.resolution };
}

describe("exact-alias lookup — homonym nodes with different creation times", () => {
  it("resolves to the node whose matching alias was created earliest even when its node identity is higher and it is stored second", async () => {
    const store = storeOf(
      [activeNode(NODE_LOW), activeNode(NODE_HIGH)],
      [homonym(NODE_LOW, LATE), homonym(NODE_HIGH, EARLY)]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_HIGH));
  });
});

describe("exact-alias lookup — homonym nodes with equal creation times", () => {
  it("resolves to the node with the lower node identity even when it is stored second", async () => {
    const store = storeOf(
      [activeNode(NODE_HIGH), activeNode(NODE_LOW)],
      [homonym(NODE_HIGH, EARLY), homonym(NODE_LOW, EARLY)]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_LOW));
  });
});

describe("exact-alias lookup — the same homonym proposal repeated", () => {
  it("resolves to the same node on every repetition although the store returns candidate rows in a different order each time", async () => {
    const store = storeOf(
      [activeNode(NODE_HIGH), activeNode(NODE_LOW), activeNode(NODE_MID)],
      [
        homonym(NODE_HIGH, EARLY),
        homonym(NODE_LOW, EARLY),
        homonym(NODE_MID, LATE),
      ],
      true
    );

    const resolved: string[] = [];
    for (let i = 0; i < REPETITIONS; i += 1) {
      resolved.push((await proposeHomonym(store)).node_id);
    }

    expect(new Set(resolved).size).toBe(1);
  });
});

describe("exact-alias lookup — a name equal to an alias of exactly one active node", () => {
  it("resolves the later proposal named CNPq to the node holding the canonical alias and the alias CNPq as matched_existing", async () => {
    const store = storeOf(
      [activeNode(NODE_MID)],
      [
        { node_id: NODE_MID, alias_norm: CANONICAL_NORM, created_at: EARLY },
        homonym(NODE_MID, EARLY),
      ]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_MID));
  });
});

describe("exact-alias lookup — matching alias with no recorded creation time", () => {
  it("resolves to a node whose alias has a creation time rather than to a lower-identity node whose alias has none", async () => {
    const store = storeOf(
      [activeNode(NODE_LOW), activeNode(NODE_HIGH)],
      [homonym(NODE_LOW, null), homonym(NODE_HIGH, LATE)]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_HIGH));
  });

  it("still resolves to the node when its matching alias is the only candidate and has no creation time", async () => {
    const store = storeOf(
      [activeNode(NODE_LOW)],
      [homonym(NODE_LOW, null)]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_LOW));
  });
});

describe("exact-alias lookup — every clause of the earliest-alias rule at once", () => {
  it("resolves to the earliest-created alias of an active node of the type, ties going to the lowest identity, alias with no time last, other types and inactive nodes ignored", async () => {
    const store = storeOf(
      [
        activeNode(NODE_LOW),
        activeNode(NODE_OTHER_TYPE, OTHER_TYPE_ID),
        activeNode(NODE_MERGED, PERSON_TYPE_ID, "merged"),
        activeNode(NODE_HIGH),
        activeNode(NODE_MID),
        activeNode(NODE_LATER),
      ],
      [
        homonym(NODE_LOW, null),
        homonym(NODE_OTHER_TYPE, EARLY),
        homonym(NODE_MERGED, EARLY),
        homonym(NODE_HIGH, MIDDLE),
        homonym(NODE_MID, MIDDLE),
        homonym(NODE_LATER, LATE),
      ]
    );

    const result = await proposeHomonym(store);

    expect(pickResolution(result)).toEqual(resolvedTo(NODE_MID));
  });
});
