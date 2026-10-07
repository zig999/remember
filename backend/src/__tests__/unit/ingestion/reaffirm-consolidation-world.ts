import type { PoolClient } from "pg";

export type HeldRow = Readonly<Record<string, string | null>>;

export interface HeldProvenance {
  readonly target_id: string;
  readonly fragment_id: string;
}

export interface Write {
  readonly table: "knowledge_link" | "node_attribute";
  readonly kind: "insert" | "update";
}

export interface WorldSeed {
  readonly links?: readonly HeldRow[];
  readonly attributes?: readonly HeldRow[];
  readonly provenance?: readonly HeldProvenance[];
}

export interface World {
  readonly client: PoolClient;
  readonly writes: Write[];
  readonly provenance: HeldProvenance[];
}

interface Answer {
  readonly rows: readonly Record<string, unknown>[];
  readonly rowCount: number;
}

interface State {
  readonly links: readonly HeldRow[];
  readonly attributes: readonly HeldRow[];
  readonly writes: Write[];
  readonly provenance: HeldProvenance[];
}

const EQUALITY = /(\w+)\s*=\s*\$(\d+)/g;
const IS_NULL = /(\w+)\s+IS\s+NULL/g;
const SAVEPOINT_CONTROL = /^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT) /;
const WRITE_STATEMENT = /^(INSERT INTO|UPDATE) (knowledge_link|node_attribute)\b/;
const SELECTED_TABLE = /FROM (\w+)/;
const EMPTY: Answer = { rows: [], rowCount: 0 };
const UNIQUE_VIOLATION = "23505";
const LINK_PROVENANCE_INDEX = "provenance_link_fragment_uq";
const ATTRIBUTE_PROVENANCE_INDEX = "provenance_attr_fragment_uq";

class UniqueViolation extends Error {
  readonly code = UNIQUE_VIOLATION;
  readonly constraint: string;

  constructor(constraint: string) {
    super(`duplicate key value violates unique constraint "${constraint}"`);
    this.constraint = constraint;
  }
}

function matchesWhere(
  row: HeldRow,
  sql: string,
  params: readonly unknown[]
): boolean {
  const at = sql.indexOf("WHERE");
  const where = at < 0 ? "" : sql.slice(at);
  const equal = [...where.matchAll(EQUALITY)].every(
    (m) => row[m[1] ?? ""] === params[Number(m[2]) - 1]
  );
  const open = [...where.matchAll(IS_NULL)].every(
    (m) => row[m[1] ?? ""] === null
  );
  return equal && open;
}

function selectHeld(
  state: State,
  sql: string,
  params: readonly unknown[]
): Answer {
  const table = SELECTED_TABLE.exec(sql)?.[1];
  const rows = table === "knowledge_link" ? state.links : state.attributes;
  const found = rows.filter((row) => matchesWhere(row, sql, params));
  return { rows: found, rowCount: found.length };
}

function fragmentIdsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function storeProvenance(
  state: State,
  sql: string,
  params: readonly unknown[]
): Answer {
  const target = String(params[0]);
  const tolerant = sql.includes("ON CONFLICT");
  const index = sql.includes("link_id")
    ? LINK_PROVENANCE_INDEX
    : ATTRIBUTE_PROVENANCE_INDEX;
  for (const fragment_id of fragmentIdsOf(params[1])) {
    const held = state.provenance.some(
      (p) => p.target_id === target && p.fragment_id === fragment_id
    );
    if (held && !tolerant) throw new UniqueViolation(index);
    if (!held) state.provenance.push({ target_id: target, fragment_id });
  }
  return EMPTY;
}

function recordWrite(state: State, sql: string): Answer {
  const match = WRITE_STATEMENT.exec(sql);
  if (match === null) throw new Error(`unexpected statement: ${sql}`);
  const table = match[2] === "knowledge_link" ? "knowledge_link" : "node_attribute";
  const kind = match[1] === "UPDATE" ? "update" : "insert";
  state.writes.push({ table, kind });
  if (kind === "update") return EMPTY;
  return { rows: [{ id: `inserted-${table}-${state.writes.length}` }], rowCount: 1 };
}

function answer(
  state: State,
  sql: string,
  params: readonly unknown[]
): Answer {
  if (SAVEPOINT_CONTROL.test(sql)) return EMPTY;
  if (sql.startsWith("SELECT") && sql.includes("FOR UPDATE")) {
    return selectHeld(state, sql, params);
  }
  if (sql.startsWith("INSERT INTO provenance")) {
    return storeProvenance(state, sql, params);
  }
  if (sql.startsWith("UPDATE information_fragment")) return EMPTY;
  return recordWrite(state, sql);
}

export function buildWorld(seed: WorldSeed = {}): World {
  const state: State = {
    links: seed.links ?? [],
    attributes: seed.attributes ?? [],
    writes: [],
    provenance: [...(seed.provenance ?? [])],
  };
  const client = {
    query: async (
      text: string,
      params: readonly unknown[] = []
    ): Promise<Answer> => answer(state, text.replace(/\s+/g, " ").trim(), params),
    release: (): void => undefined,
  } as unknown as PoolClient;
  return { client, writes: state.writes, provenance: state.provenance };
}
