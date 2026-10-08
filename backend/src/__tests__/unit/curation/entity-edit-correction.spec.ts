import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { AttributeChangeSchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import type {
  ItemLockedRow,
  KnowledgeNodeLockedRow,
} from "../../../modules/curation/repository/curation.repository.js";
import { recordCorrection } from "../../../modules/curation/service/entity-edit-correction.js";
import type { OperatorNoteRecord } from "../../../modules/curation/service/entity-edit-note.js";
import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const NODE_TYPE_ID = "66666666-0000-4000-8000-0000000000f1";
const DEADLINE_KEY_ID = "77777777-0000-4000-8000-000000000001";
const CNPJ_KEY_ID = "77777777-0000-4000-8000-000000000002";
const RUN_ID = "11111111-0000-4000-8000-000000000001";
const RAW_ID = "11111111-0000-4000-8000-000000000002";
const CHUNK_ID = "11111111-0000-4000-8000-000000000003";
const FRAGMENT_ID = "11111111-0000-4000-8000-000000000004";
const OLD_FRAGMENT_ID = "11111111-0000-4000-8000-000000000005";
const OLDER_FRAGMENT_ID = "11111111-0000-4000-8000-000000000006";
const OTHER_RUN_ID = "99999999-0000-4000-8000-000000000001";
const PREDECESSOR_ID = "88888888-0000-4000-8000-000000000001";

const EDITED_AT = new Date("2026-10-07T14:35:09.000Z");
const PREDECESSOR_END = "2026-06-30";
const OLD_CNPJ = "12.345.678/0001-90";
const NEW_CNPJ = "98.765.432/0001-10";
const OLD_DEADLINE = "2026-11-30";
const NEW_DEADLINE = "2026-12-15";

const LIVE_STATUSES: readonly string[] = ["active", "uncertain", "disputed"];
const INSERT_PATTERN =
  /^\s*INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i;
const COPY_PATTERN = /^\s*INSERT INTO provenance\b[\s\S]*?\bSELECT\b/i;
const UPDATE_PATTERN = /^\s*UPDATE node_attribute\b/i;
const PARAMETER_PATTERN = /^\$(\d+)/;

type Row = Record<string, unknown>;

interface Store {
  attributes: Row[];
  provenance: Row[];
}

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface Scenario {
  readonly key?: AttributeKeyRow;
  readonly predecessor?: Partial<ItemLockedRow>;
  readonly predecessorFragments?: readonly string[];
  readonly value?: string;
}

interface Outcome {
  readonly store: Store;
  readonly predecessor: Row;
  readonly recorded: Row;
}

const NODE: KnowledgeNodeLockedRow = {
  id: NODE_ID,
  node_type_id: NODE_TYPE_ID,
  canonical_name: "organizacao de teste",
  status: "active",
  merged_into_node_id: null,
};

const CNPJ_KEY: AttributeKeyRow = {
  id: CNPJ_KEY_ID,
  node_type_id: NODE_TYPE_ID,
  key: "cnpj",
  value_type: "text",
  is_temporal: false,
  allows_multiple_current: false,
  requires_valid_from: false,
};

const DEADLINE_KEY: AttributeKeyRow = {
  ...CNPJ_KEY,
  id: DEADLINE_KEY_ID,
  key: "deadline",
  value_type: "date",
  is_temporal: true,
  requires_valid_from: true,
};

const NOTE: OperatorNoteRecord = {
  llmRunId: RUN_ID,
  rawInformationId: RAW_ID,
  rawChunkId: CHUNK_ID,
  fragmentId: FRAGMENT_ID,
};

function parseInsert(
  sql: string,
  params: unknown[]
): { table: string; values: Row } {
  const match = INSERT_PATTERN.exec(sql.replace(/now\(\)/gi, "NOW"));
  if (match === null) {
    throw new Error(`statement outside the correction's records: ${sql}`);
  }
  const [, table = "", columnList = "", valueList = ""] = match;
  const columns = columnList.split(",").map((column) => column.trim());
  const tokens = valueList.split(",").map((token) => token.trim());
  const values: Row = {};
  columns.forEach((column, position) => {
    const parameter = PARAMETER_PATTERN.exec(tokens[position] ?? "");
    if (parameter !== null) {
      values[column] = params[Number(parameter[1]) - 1];
    }
  });
  return { table, values };
}

function supersedeStatement(store: Store, params: unknown[]): QueryResult {
  const [id, validTo, supersededAt] = params;
  const row = store.attributes.find(
    (candidate) =>
      candidate.id === id && LIVE_STATUSES.includes(String(candidate.status))
  );
  if (row === undefined) return { rows: [], rowCount: 0 };
  row.status = "superseded";
  row.valid_to = validTo ?? row.valid_to ?? null;
  row.superseded_at = supersededAt ?? null;
  return { rows: [{ id }], rowCount: 1 };
}

function addProvenance(store: Store, values: Row): number {
  const held = store.provenance.some(
    (row) =>
      row.attribute_id === values.attribute_id &&
      row.fragment_id === values.fragment_id
  );
  if (held) return 0;
  store.provenance.push(values);
  return 1;
}

function copyStatement(store: Store, params: unknown[]): QueryResult {
  const [predecessorId, successorId] = params;
  const fragments = store.provenance
    .filter((row) => row.attribute_id === predecessorId)
    .map((row) => row.fragment_id);
  const copied = fragments.filter(
    (fragmentId) =>
      addProvenance(store, { attribute_id: successorId, fragment_id: fragmentId }) === 1
  );
  return { rows: copied.map(() => ({ id: "provenance" })), rowCount: copied.length };
}

function insertStatement(
  store: Store,
  statement: { sql: string; params: unknown[] },
  nextId: () => string
): QueryResult {
  const { table, values } = parseInsert(statement.sql, statement.params);
  if (table === "node_attribute") {
    const row = { id: nextId(), ...values };
    store.attributes.push(row);
    return { rows: [{ id: row.id }], rowCount: 1 };
  }
  if (table === "provenance") {
    const added = addProvenance(store, values);
    return { rows: added === 1 ? [{ id: "provenance" }] : [], rowCount: added };
  }
  throw new Error(`table outside the correction's records: ${table}`);
}

function buildClient(
  attributes: readonly Row[],
  provenance: readonly Row[]
): { client: PoolClient; store: Store } {
  const store: Store = {
    attributes: structuredClone([...attributes]),
    provenance: structuredClone([...provenance]),
  };
  let sequence = 0;
  const nextId = (): string => `00000000-0000-4000-8000-${++sequence}`;
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    if (UPDATE_PATTERN.test(sql)) return supersedeStatement(store, params);
    if (COPY_PATTERN.test(sql)) return copyStatement(store, params);
    return insertStatement(store, { sql, params }, nextId);
  };
  return { client: { query } as unknown as PoolClient, store };
}

function lockedRow(
  key: AttributeKeyRow,
  overrides: Partial<ItemLockedRow>
): ItemLockedRow {
  return {
    id: PREDECESSOR_ID,
    node_id: NODE_ID,
    attribute_key_id: key.id,
    value_type: key.value_type,
    value: OLD_CNPJ,
    valid_from: null,
    valid_to: null,
    status: "active",
    confidence: "1.0",
    valid_from_source: null,
    superseded_at: null,
    ...overrides,
  };
}

function fragmentsOf(
  attributeId: string,
  fragmentIds: readonly string[]
): Row[] {
  return fragmentIds.map((fragmentId) => ({
    attribute_id: attributeId,
    fragment_id: fragmentId,
  }));
}

function rowOf(store: Store, id: string): Row {
  const row = store.attributes.find((candidate) => candidate.id === id);
  if (row === undefined) throw new Error("expected the attribute to exist");
  return row;
}

function recordedRowOf(store: Store): Row {
  const row = store.attributes.find((candidate) => candidate.id !== PREDECESSOR_ID);
  if (row === undefined) throw new Error("expected the recorded attribute");
  return row;
}

async function runCorrection(scenario: Scenario): Promise<Outcome> {
  const key = scenario.key ?? CNPJ_KEY;
  const predecessor = lockedRow(key, scenario.predecessor ?? {});
  const { client, store } = buildClient(
    [{ ...predecessor, created_by_run_id: OTHER_RUN_ID, supersedes_attribute_id: null }],
    fragmentsOf(PREDECESSOR_ID, scenario.predecessorFragments ?? [OLD_FRAGMENT_ID])
  );
  const change = AttributeChangeSchema.parse({
    attribute_key: "any",
    kind: "set",
    value: scenario.value ?? NEW_CNPJ,
  });
  await recordCorrection(client, {
    target: { node: NODE, attributeKey: key },
    change,
    note: NOTE,
    editedAt: EDITED_AT,
    predecessor,
  });
  return {
    store,
    predecessor: rowOf(store, PREDECESSOR_ID),
    recorded: recordedRowOf(store),
  };
}

function fragmentsHeldBy(store: Store, attributeId: unknown): unknown[] {
  return store.provenance
    .filter((row) => row.attribute_id === attributeId)
    .map((row) => row.fragment_id);
}

describe("the status of the attribute a correction supersedes", () => {
  it("becomes superseded", async () => {
    const outcome = await runCorrection({});

    expect(outcome.predecessor.status).toBe("superseded");
  });
});

describe("the supersession time of the attribute a correction supersedes", () => {
  it("is the moment of the supersession when the attribute holds no validity end", async () => {
    const outcome = await runCorrection({});

    expect(outcome.predecessor.superseded_at).toEqual(EDITED_AT);
  });

  it("is the moment of the supersession when the attribute already holds a validity end", async () => {
    const outcome = await runCorrection({
      key: DEADLINE_KEY,
      value: NEW_DEADLINE,
      predecessor: {
        value: OLD_DEADLINE,
        valid_from: "2026-03-01",
        valid_to: PREDECESSOR_END,
      },
    });

    expect(outcome.predecessor.superseded_at).toEqual(EDITED_AT);
  });
});

describe("the new attribute a correction records", () => {
  it("names the superseded attribute as the one it supersedes", async () => {
    const outcome = await runCorrection({});

    expect(outcome.recorded.supersedes_attribute_id).toBe(PREDECESSOR_ID);
  });
});

describe("an organization's active cnpj with no validity, corrected to another cnpj", () => {
  it("keeps no validity end once superseded", async () => {
    const outcome = await runCorrection({});

    expect(outcome.predecessor.valid_to ?? null).toBeNull();
  });

  it("is replaced in that edit by a new attribute holding the other cnpj", async () => {
    const outcome = await runCorrection({});

    expect(outcome.recorded.value).toBe(NEW_CNPJ);
  });
});

describe("the provenance of the new attribute a correction records", () => {
  it("holds the edit's information fragment and every provenance of the superseded attribute", async () => {
    const outcome = await runCorrection({
      predecessorFragments: [OLD_FRAGMENT_ID, OLDER_FRAGMENT_ID],
    });

    expect(fragmentsHeldBy(outcome.store, outcome.recorded.id)).toEqual(
      expect.arrayContaining([FRAGMENT_ID, OLD_FRAGMENT_ID, OLDER_FRAGMENT_ID])
    );
  });
});

describe("the state of the new attribute a correction records", () => {
  it("is active even when the superseded attribute was uncertain and held a validity end", async () => {
    const outcome = await runCorrection({
      key: DEADLINE_KEY,
      value: NEW_DEADLINE,
      predecessor: {
        value: OLD_DEADLINE,
        status: "uncertain",
        valid_from: "2026-03-01",
        valid_to: PREDECESSOR_END,
      },
    });

    expect(outcome.recorded.status).toBe("active");
  });
});
