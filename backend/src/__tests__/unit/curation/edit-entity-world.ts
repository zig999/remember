import type { Pool, PoolClient } from "pg";
import pino from "pino";
import { vi } from "vitest";

import { AttributeChangeSchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import type {
  AttributeChange,
  EditEntityBody,
} from "../../../modules/curation/dto/edit-entity.dto.js";
import { editEntityService } from "../../../modules/curation/service/edit-entity.service.js";
import type { EditEntityResult } from "../../../modules/curation/service/edit-entity.service.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type {
  AttributeKeyRow,
  NodeTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";

export const NODE_ID = "66666666-0000-4000-8000-000000000001";
export const NEEDS_REVIEW_NODE_ID = "66666666-0000-4000-8000-000000000002";
export const ABSENT_NODE_ID = "66666666-0000-4000-8000-0000000000ff";
const NODE_TYPE_ID = "66666666-0000-4000-8000-0000000000f1";

export const DEADLINE_KEY_ID = "77777777-0000-4000-8000-000000000001";
export const EMAIL_KEY_ID = "77777777-0000-4000-8000-000000000002";
export const STAKEHOLDER_KEY_ID = "77777777-0000-4000-8000-000000000003";
export const NICKNAME_KEY_ID = "77777777-0000-4000-8000-000000000004";
export const PHASE_KEY_ID = "77777777-0000-4000-8000-000000000005";

export const DEADLINE_HELD_ID = "88888888-0000-4000-8000-000000000001";
export const EMAIL_HELD_ID = "88888888-0000-4000-8000-000000000002";
export const STAKEHOLDER_HELD_ID = "88888888-0000-4000-8000-000000000003";
export const NICKNAME_HELD_ID = "88888888-0000-4000-8000-000000000004";
export const DEADLINE_SUPERSEDED_ID = "88888888-0000-4000-8000-000000000005";
export const PHASE_SUPERSEDED_ID = "88888888-0000-4000-8000-000000000006";

export const REASON = "corrigido apos conferir o contrato assinado";
export const EDITED_AT = new Date("2026-10-07T14:35:09.000Z");
export const ACCEPTED = "accepted";
export const STORE_UNAVAILABLE_CODE = "08006";
const UNIQUE_VIOLATION_CODE = "23505";

export const OLD_DEADLINE = "2026-11-30";
export const NEW_DEADLINE = "2026-12-15";
export const PHASE_VALUE = "planejamento";
export const OTHER_PHASE_VALUE = "execucao";
export const HELD_STAKEHOLDER = "Ana";
export const ADDED_STAKEHOLDER = "Bia";
export const HELD_EMAIL = "ana@exemplo.com";
export const HELD_NICKNAME = "Zeca";
export const CORRECTED_NICKNAME = "Zequinha";

const STATEMENT_OUTSIDE = "statement outside the edit's records";
const TABLE_OUTSIDE = "table outside the edit's records";
const CHUNK_DIGIT = "e";
const PROVENANCE_DIGIT = "9";
const LIVE_STATUSES: readonly string[] = ["active", "uncertain", "disputed"];
const JSON_COLUMNS: readonly string[] = ["metadata", "payload"];

const INSERT_PATTERN =
  /^\s*INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i;
const PARAMETER_PATTERN = /^\$(\d+)/;
const NOW_CALL = /now\(\)/gi;
const QUOTE = /"/g;

export type Row = Record<string, unknown>;

export interface Store {
  nodes: Row[];
  attributes: Row[];
  rawInformation: Row[];
  rawChunk: Row[];
  llmRun: Row[];
  fragment: Row[];
  fragmentSource: Row[];
  provenance: Row[];
  curationAction: Row[];
}

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface StatementText {
  readonly sql: string;
  readonly params: unknown[];
}

interface TableSpec {
  readonly target: keyof Store;
  readonly digit: string;
  readonly defaults: () => Row;
}

export interface WorldOptions {
  readonly attributes?: readonly Row[];
  readonly failInsert?: { readonly table: string; readonly code?: string };
  readonly supersedeWhileWaiting?: string;
}

export type EventKind = "begin" | "commit" | "rollback" | "read" | "write";

export interface WorldEvent {
  readonly connection: number;
  readonly kind: EventKind;
}

export interface EditWorld {
  readonly store: Store;
  readonly untouched: Store;
  readonly events: readonly WorldEvent[];
  readonly edit: (
    body: EditEntityBody,
    nodeId?: string
  ) => Promise<EditEntityResult>;
}

interface Context {
  readonly store: Store;
  readonly options: WorldOptions;
  readonly sequences: Map<string, number>;
  snapshot: Store | undefined;
  waited: boolean;
}

type Handler = (context: Context, statement: StatementText) => QueryResult;

const PROJECT: NodeTypeRow = { id: NODE_TYPE_ID, name: "Project" };
const PHASE_ALLOWED: readonly string[] = [PHASE_VALUE, OTHER_PHASE_VALUE];

function keyRow(
  id: string,
  key: string,
  shape: Partial<AttributeKeyRow>
): AttributeKeyRow {
  return {
    id,
    node_type_id: NODE_TYPE_ID,
    key,
    value_type: "text",
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
    ...shape,
  };
}

const CATALOG = buildSnapshot({
  nodeTypes: [PROJECT],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [
    keyRow(DEADLINE_KEY_ID, "deadline", {
      value_type: "date",
      is_temporal: true,
      requires_valid_from: true,
    }),
    keyRow(EMAIL_KEY_ID, "email", {}),
    keyRow(STAKEHOLDER_KEY_ID, "stakeholder", { allows_multiple_current: true }),
    keyRow(NICKNAME_KEY_ID, "nickname", {}),
    keyRow(PHASE_KEY_ID, "phase", {}),
  ],
  attributeValidValues: PHASE_ALLOWED.map((value) => ({
    attribute_key_id: PHASE_KEY_ID,
    value,
  })),
});

export function heldAttribute(overrides: Row): Row {
  return {
    node_id: NODE_ID,
    value_type: "text",
    valid_from: null,
    valid_to: null,
    status: "active",
    confidence: "1.0",
    valid_from_source: null,
    superseded_at: null,
    supersedes_attribute_id: null,
    ...overrides,
  };
}

const DEFAULT_ATTRIBUTES: readonly Row[] = [
  heldAttribute({
    id: DEADLINE_HELD_ID,
    attribute_key_id: DEADLINE_KEY_ID,
    value_type: "date",
    value: OLD_DEADLINE,
    valid_from: "2026-03-01",
    valid_from_source: "stated",
  }),
  heldAttribute({
    id: EMAIL_HELD_ID,
    attribute_key_id: EMAIL_KEY_ID,
    value: HELD_EMAIL,
  }),
  heldAttribute({
    id: STAKEHOLDER_HELD_ID,
    attribute_key_id: STAKEHOLDER_KEY_ID,
    value: HELD_STAKEHOLDER,
  }),
  heldAttribute({
    id: NICKNAME_HELD_ID,
    attribute_key_id: NICKNAME_KEY_ID,
    value: HELD_NICKNAME,
  }),
  heldAttribute({
    id: DEADLINE_SUPERSEDED_ID,
    attribute_key_id: DEADLINE_KEY_ID,
    value_type: "date",
    value: "2026-06-30",
    status: "superseded",
    superseded_at: new Date("2026-09-01T10:00:00.000Z"),
  }),
  heldAttribute({
    id: PHASE_SUPERSEDED_ID,
    attribute_key_id: PHASE_KEY_ID,
    value: OTHER_PHASE_VALUE,
    status: "superseded",
    superseded_at: new Date("2026-09-01T10:00:00.000Z"),
  }),
];

const TABLES: Readonly<Record<string, TableSpec>> = {
  node_attribute: {
    target: "attributes",
    digit: "a",
    defaults: () => ({ superseded_at: null }),
  },
  raw_information: { target: "rawInformation", digit: "b", defaults: () => ({}) },
  llm_run: {
    target: "llmRun",
    digit: "c",
    defaults: () => ({ status: "running", finished_at: null }),
  },
  information_fragment: {
    target: "fragment",
    digit: "d",
    defaults: () => ({ status: "proposed" }),
  },
  provenance: {
    target: "provenance",
    digit: PROVENANCE_DIGIT,
    defaults: () => ({}),
  },
  curation_action: {
    target: "curationAction",
    digit: "f",
    defaults: () => ({ created_at: new Date() }),
  },
};

const UNIQUE_COLUMN: Readonly<Record<string, string>> = {
  raw_information: "content_hash",
  llm_run: "idempotency_key",
};

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resultOf(rows: readonly Row[]): QueryResult {
  return { rows: structuredClone([...rows]), rowCount: rows.length };
}

function nextId(context: Context, digit: string): string {
  const sequence = (context.sequences.get(digit) ?? 0) + 1;
  context.sequences.set(digit, sequence);
  return `${digit.repeat(8)}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function storeError(code: string): Error {
  return Object.assign(new Error(`store refused the write (${code})`), { code });
}

function parameterValue(column: string, value: unknown): unknown {
  if (JSON_COLUMNS.includes(column) && typeof value === "string") {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  }
  return value;
}

function parseInsert(statement: StatementText): { table: string; values: Row } {
  const match = INSERT_PATTERN.exec(statement.sql.replace(NOW_CALL, "NOW"));
  if (match === null) {
    throw new Error(`${STATEMENT_OUTSIDE}: ${statement.sql}`);
  }
  const [, table = "", columnList = "", valueList = ""] = match;
  const columns = columnList.split(",").map((c) => c.trim().replace(QUOTE, ""));
  const tokens = valueList.split(",").map((token) => token.trim());
  const values: Row = {};
  columns.forEach((column, position) => {
    const parameter = PARAMETER_PATTERN.exec(tokens[position] ?? "");
    if (parameter !== null) {
      const raw = statement.params[Number(parameter[1]) - 1];
      values[column] = parameterValue(column, raw);
    }
  });
  return { table, values };
}

function failIfRequested(context: Context, table: string): void {
  const failure = context.options.failInsert;
  if (failure?.table === table) {
    throw storeError(failure.code ?? STORE_UNAVAILABLE_CODE);
  }
}

function rejectDuplicate(
  context: Context,
  spec: TableSpec,
  inserted: { table: string; values: Row }
): void {
  const column = UNIQUE_COLUMN[inserted.table];
  if (column === undefined) return;
  const held = context.store[spec.target];
  if (held.some((row) => row[column] === inserted.values[column])) {
    throw storeError(UNIQUE_VIOLATION_CODE);
  }
}

const insertGeneric: Handler = (context, statement) => {
  const inserted = parseInsert(statement);
  const spec = TABLES[inserted.table];
  if (spec === undefined) {
    throw new Error(`${TABLE_OUTSIDE}: ${inserted.table}`);
  }
  failIfRequested(context, inserted.table);
  rejectDuplicate(context, spec, inserted);
  const row: Row = {
    id: nextId(context, spec.digit),
    ...spec.defaults(),
    ...inserted.values,
  };
  context.store[spec.target].push(row);
  return resultOf([row]);
};

const insertChunks: Handler = (context, statement) => {
  const [rawId, indices, texts, starts, ends, versions] = statement.params;
  const rows = listOf(indices).map((chunkIndex, position) => ({
    id: nextId(context, CHUNK_DIGIT),
    raw_information_id: rawId,
    chunk_index: chunkIndex,
    text: listOf(texts)[position],
    offset_start: listOf(starts)[position],
    offset_end: listOf(ends)[position],
    chunking_version: listOf(versions)[position],
  }));
  context.store.rawChunk.push(...rows);
  return resultOf(rows);
};

const insertFragmentSources: Handler = (context, statement) => {
  const [fragmentId, chunkIds] = statement.params;
  const rows = listOf(chunkIds).map((chunkId) => ({
    fragment_id: fragmentId,
    raw_chunk_id: chunkId,
  }));
  context.store.fragmentSource.push(...rows);
  return { rows: [], rowCount: rows.length };
};

const copyProvenanceRows: Handler = (context, statement) => {
  const [predecessorId, successorId] = statement.params;
  const copied = context.store.provenance
    .filter((row) => row.attribute_id === predecessorId)
    .map((row) => ({
      id: nextId(context, PROVENANCE_DIGIT),
      attribute_id: successorId,
      fragment_id: row.fragment_id,
    }));
  context.store.provenance.push(...copied);
  return resultOf(copied);
};

const selectNodes: Handler = (context, statement) => {
  const wanted = listOf(statement.params[0]);
  return resultOf(context.store.nodes.filter((node) => wanted.includes(node.id)));
};

function applyWaitedOperation(context: Context): void {
  const id = context.options.supersedeWhileWaiting;
  if (id === undefined || context.waited) return;
  context.waited = true;
  for (const held of [context.store, context.snapshot]) {
    const row = held?.attributes.find((candidate) => candidate.id === id);
    if (row !== undefined) {
      row.status = "superseded";
      row.superseded_at = EDITED_AT;
    }
  }
}

const selectAttributes: Handler = (context, statement) => {
  const { sql, params } = statement;
  if (/FOR\s+UPDATE/i.test(sql)) applyWaitedOperation(context);
  if (/WHERE\s+id\s*=\s*ANY/i.test(sql)) {
    const wanted = listOf(params[0]);
    return resultOf(
      context.store.attributes.filter((row) => wanted.includes(row.id))
    );
  }
  const [nodeId, keyId, statuses] = params;
  const allowed = listOf(statuses);
  return resultOf(
    context.store.attributes.filter(
      (row) =>
        row.node_id === nodeId &&
        row.attribute_key_id === keyId &&
        allowed.includes(row.status)
    )
  );
};

const updateAttribute: Handler = (context, statement) => {
  const [id, second, third] = statement.params;
  const row = context.store.attributes.find(
    (candidate) =>
      candidate.id === id && LIVE_STATUSES.includes(String(candidate.status))
  );
  if (row === undefined) return { rows: [], rowCount: 0 };
  if (/SET\s+status\s*=\s*'superseded'/i.test(statement.sql)) {
    row.status = "superseded";
    row.valid_to = second ?? row.valid_to;
    row.superseded_at = third ?? null;
  } else {
    row.status = "deleted";
    row.superseded_at = second;
  }
  return resultOf([{ id }]);
};

const acceptFragment: Handler = (context, statement) => {
  const fragment = context.store.fragment.find(
    (row) => row.id === statement.params[0] && row.status === "proposed"
  );
  if (fragment === undefined) return { rows: [], rowCount: 0 };
  fragment.status = "accepted";
  return resultOf([{ id: fragment.id }]);
};

const closeRun: Handler = (context, statement) => {
  const run = context.store.llmRun.find(
    (row) => row.id === statement.params[0] && row.status === "running"
  );
  if (run === undefined) return { rows: [], rowCount: 0 };
  run.status = statement.params[1];
  run.finished_at = new Date();
  return resultOf([run]);
};

const STATEMENTS: ReadonlyArray<readonly [RegExp, Handler]> = [
  [/^\s*SELECT\b[\s\S]*?\bFROM\s+knowledge_node\b/i, selectNodes],
  [/^\s*SELECT\b[\s\S]*?\bFROM\s+node_attribute\b/i, selectAttributes],
  [/^\s*INSERT INTO raw_chunk\b/i, insertChunks],
  [/^\s*INSERT INTO fragment_source\b/i, insertFragmentSources],
  [/^\s*INSERT INTO provenance\b[\s\S]*\bSELECT\b/i, copyProvenanceRows],
  [/^\s*INSERT INTO\b/i, insertGeneric],
  [/^\s*UPDATE node_attribute\b/i, updateAttribute],
  [/^\s*UPDATE information_fragment\b/i, acceptFragment],
  [/^\s*UPDATE llm_run\b/i, closeRun],
];

function runStatement(context: Context, statement: StatementText): QueryResult {
  const matched = STATEMENTS.find(([pattern]) => pattern.test(statement.sql));
  if (matched === undefined) {
    throw new Error(`${STATEMENT_OUTSIDE}: ${statement.sql}`);
  }
  return matched[1](context, statement);
}

function controlOf(sql: string): EventKind | undefined {
  const word = sql.trim().toUpperCase();
  if (word === "BEGIN") return "begin";
  if (word === "COMMIT") return "commit";
  if (word === "ROLLBACK") return "rollback";
  return undefined;
}

function applyControl(context: Context, control: EventKind): void {
  if (control === "begin") context.snapshot = structuredClone(context.store);
  if (control === "commit") context.snapshot = undefined;
  if (control === "rollback" && context.snapshot !== undefined) {
    Object.assign(context.store, context.snapshot);
    context.snapshot = undefined;
  }
}

function buildClient(
  context: Context,
  connection: number,
  events: WorldEvent[]
): PoolClient {
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    const control = controlOf(sql);
    const kind = control ?? (/^\s*SELECT\b/i.test(sql) ? "read" : "write");
    events.push({ connection, kind });
    if (control === undefined) return runStatement(context, { sql, params });
    applyControl(context, control);
    return { rows: [], rowCount: 0 };
  };
  return { query, release: () => undefined } as unknown as PoolClient;
}

function nodeRow(id: string, status: string): Row {
  return {
    id,
    node_type_id: NODE_TYPE_ID,
    canonical_name: "projeto de teste",
    status,
    merged_into_node_id: null,
  };
}

function seedStore(options: WorldOptions): Store {
  return {
    nodes: [nodeRow(NODE_ID, "active"), nodeRow(NEEDS_REVIEW_NODE_ID, "needs_review")],
    attributes: structuredClone([...(options.attributes ?? DEFAULT_ATTRIBUTES)]),
    rawInformation: [],
    rawChunk: [],
    llmRun: [],
    fragment: [],
    fragmentSource: [],
    provenance: [],
    curationAction: [],
  };
}

export function buildWorld(options: WorldOptions = {}): EditWorld {
  const store = seedStore(options);
  const events: WorldEvent[] = [];
  const context: Context = {
    store,
    options,
    sequences: new Map<string, number>(),
    snapshot: undefined,
    waited: false,
  };
  let connections = 0;
  const pool = {
    connect: async (): Promise<PoolClient> =>
      buildClient(context, ++connections, events),
  } as unknown as Pool;
  const deps = { pool, logger: pino({ level: "silent" }), catalog: CATALOG };
  return {
    store,
    untouched: structuredClone(store),
    events,
    edit: (body: EditEntityBody, nodeId: string = NODE_ID) =>
      editEntityService(deps, nodeId, body),
  };
}

export function setChange(
  attributeKey: string,
  value: string,
  extras: Readonly<Record<string, string>> = {}
): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: attributeKey,
    kind: "set",
    value,
    ...extras,
  });
}

export function removeChange(
  attributeKey: string,
  itemId: string
): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: attributeKey,
    kind: "remove",
    item_id: itemId,
  });
}

export function editOf(
  changes: readonly AttributeChange[],
  reason: string = REASON
): EditEntityBody {
  return { reason, changes: [...changes] };
}

export function mixedEdit(): EditEntityBody {
  return editOf([
    setChange("phase", PHASE_VALUE),
    setChange("stakeholder", HELD_STAKEHOLDER),
    setChange("deadline", NEW_DEADLINE, { item_id: DEADLINE_HELD_ID }),
    removeChange("email", EMAIL_HELD_ID),
    setChange("stakeholder", ADDED_STAKEHOLDER),
    setChange("nickname", CORRECTED_NICKNAME, { item_id: NICKNAME_HELD_ID }),
  ]);
}

export function onlyRow(rows: readonly Row[]): Row {
  const [row] = rows;
  if (rows.length !== 1 || row === undefined) {
    throw new Error(`expected exactly one row, found ${rows.length}`);
  }
  return row;
}

export function recordedAttributes(world: EditWorld): Row[] {
  const seeded = new Set(world.untouched.attributes.map((row) => row.id));
  return world.store.attributes.filter((row) => !seeded.has(row.id));
}

export function recordedIdOf(world: EditWorld, value: string): string {
  const row = recordedAttributes(world).find(
    (candidate) => candidate.value === value
  );
  if (row === undefined) {
    throw new Error(`expected an attribute recorded with value '${value}'`);
  }
  return String(row.id);
}

function entryOf(
  attributeKey: string,
  effect: string,
  ids: { item?: string; predecessor?: string } = {}
): Row {
  return {
    attribute_key: attributeKey,
    effect,
    item_id: ids.item ?? null,
    predecessor_id: ids.predecessor ?? null,
  };
}

export function mixedEditEntries(world: EditWorld): Row[] {
  const recorded = (value: string): string => recordedIdOf(world, value);
  return [
    entryOf("phase", "first_value", { item: recorded(PHASE_VALUE) }),
    entryOf("stakeholder", "unchanged"),
    entryOf("deadline", "succession", {
      item: recorded(NEW_DEADLINE),
      predecessor: DEADLINE_HELD_ID,
    }),
    entryOf("email", "removal", { predecessor: EMAIL_HELD_ID }),
    entryOf("stakeholder", "addition", { item: recorded(ADDED_STAKEHOLDER) }),
    entryOf("nickname", "correction", {
      item: recorded(CORRECTED_NICKNAME),
      predecessor: NICKNAME_HELD_ID,
    }),
  ];
}

export function plainRow(row: Row): Row {
  const identity = ["id", "created_at"];
  return Object.fromEntries(
    Object.entries(row).filter(([column]) => !identity.includes(column))
  );
}

export function codeOf(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
    return error.constructor.name;
  }
  return String(error);
}

export async function settledCode(
  world: EditWorld,
  body: EditEntityBody,
  nodeId?: string
): Promise<string> {
  try {
    await world.edit(body, nodeId);
    return ACCEPTED;
  } catch (error) {
    return codeOf(error);
  }
}

export interface TransactionShape {
  readonly connections: number;
  readonly begins: number;
  readonly commits: number;
  readonly rollbacks: number;
  readonly outside: number;
  readonly wrote: boolean;
}

export function transactionShapeOf(
  events: readonly WorldEvent[]
): TransactionShape {
  const open = new Set<number>();
  const count = (kind: EventKind): number =>
    events.filter((event) => event.kind === kind).length;
  let outside = 0;
  let wrote = false;
  for (const { connection, kind } of events) {
    if (kind === "begin") open.add(connection);
    else if (kind === "commit" || kind === "rollback") open.delete(connection);
    else if (!open.has(connection)) outside += 1;
    else if (kind === "write") wrote = true;
  }
  return {
    connections: new Set(events.map((event) => event.connection)).size,
    begins: count("begin"),
    commits: count("commit"),
    rollbacks: count("rollback"),
    outside,
    wrote,
  };
}

export function freezeClock(): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(EDITED_AT);
}

export function restoreClock(): void {
  vi.useRealTimers();
}
