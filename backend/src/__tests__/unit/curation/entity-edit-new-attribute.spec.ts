import type { PoolClient } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AttributeChangeSchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import type { KnowledgeNodeLockedRow } from "../../../modules/curation/repository/curation.repository.js";
import {
  recordNewAttribute,
  type NewAttributeInput,
} from "../../../modules/curation/service/entity-edit-new-attribute.js";
import type { OperatorNoteRecord } from "../../../modules/curation/service/entity-edit-note.js";
import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const OTHER_NODE_ID = "66666666-0000-4000-8000-000000000002";
const NODE_TYPE_ID = "66666666-0000-4000-8000-0000000000f1";
const DEADLINE_KEY_ID = "77777777-0000-4000-8000-000000000001";
const STAKEHOLDER_KEY_ID = "77777777-0000-4000-8000-000000000002";
const CNPJ_KEY_ID = "77777777-0000-4000-8000-000000000003";
const RUN_ID = "11111111-0000-4000-8000-000000000001";
const RAW_ID = "11111111-0000-4000-8000-000000000002";
const CHUNK_ID = "11111111-0000-4000-8000-000000000003";
const FRAGMENT_ID = "11111111-0000-4000-8000-000000000004";
const OTHER_RUN_ID = "99999999-0000-4000-8000-000000000001";
const SUPERSEDED_ID = "88888888-0000-4000-8000-000000000001";
const ACTIVE_ID = "88888888-0000-4000-8000-000000000002";
const UNCERTAIN_ID = "88888888-0000-4000-8000-000000000003";
const OTHER_KEY_ROW_ID = "88888888-0000-4000-8000-000000000004";
const OTHER_NODE_ROW_ID = "88888888-0000-4000-8000-000000000005";

const EDITED_AT = new Date("2026-10-07T14:35:09.000Z");
const EDITED_DATE = "2026-10-07";
const FIRST_MOMENT_OF_UTC_DAY = new Date("2026-10-08T00:00:00.000Z");
const FIRST_UTC_DAY = "2026-10-08";
const LAST_MOMENT_OF_UTC_DAY = new Date("2026-10-07T23:59:59.999Z");
const ZONE_BEHIND_UTC = "America/Sao_Paulo";
const ZONE_AHEAD_OF_UTC = "Pacific/Kiritimati";
const STATED_START = "2026-01-15";
const STATED_END = "2027-03-31";
const SUPERSEDED_AT = new Date("2026-09-01T10:00:00.000Z");
const DEADLINE_VALUE = "2026-12-31";
const STAKEHOLDER_VALUE = "maria";
const CNPJ_VALUE = "12.345.678/0001-90";

type Row = Record<string, unknown>;

interface Store {
  attributes: Row[];
  provenance: Row[];
}

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

const INSERT_PATTERN =
  /^\s*INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i;
const PARAMETER_PATTERN = /^\$(\d+)/;

const NODE: KnowledgeNodeLockedRow = {
  id: NODE_ID,
  node_type_id: NODE_TYPE_ID,
  canonical_name: "projeto de teste",
  status: "active",
  merged_into_node_id: null,
};

const DEADLINE_KEY: AttributeKeyRow = {
  id: DEADLINE_KEY_ID,
  node_type_id: NODE_TYPE_ID,
  key: "deadline",
  value_type: "date",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
};

const STAKEHOLDER_KEY: AttributeKeyRow = {
  ...DEADLINE_KEY,
  id: STAKEHOLDER_KEY_ID,
  key: "stakeholder",
  value_type: "text",
  allows_multiple_current: true,
};

const CNPJ_KEY: AttributeKeyRow = {
  ...DEADLINE_KEY,
  id: CNPJ_KEY_ID,
  key: "cnpj",
  value_type: "text",
  is_temporal: false,
  requires_valid_from: false,
};

const NOTE: OperatorNoteRecord = {
  llmRunId: RUN_ID,
  rawInformationId: RAW_ID,
  rawChunkId: CHUNK_ID,
  fragmentId: FRAGMENT_ID,
};

function heldRow(id: string, overrides: Row = {}): Row {
  return {
    id,
    node_id: NODE_ID,
    attribute_key_id: STAKEHOLDER_KEY_ID,
    value_type: "text",
    value: "joao",
    status: "active",
    confidence: 0.9,
    valid_from: null,
    valid_to: null,
    valid_from_source: null,
    created_by_run_id: OTHER_RUN_ID,
    supersedes_attribute_id: null,
    superseded_at: null,
    ...overrides,
  };
}

function parseInsert(
  sql: string,
  params: unknown[]
): { table: string; values: Row } {
  const match = INSERT_PATTERN.exec(sql.replace(/now\(\)/gi, "NOW"));
  if (match === null) {
    throw new Error(`statement outside the new attribute's records: ${sql}`);
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

function buildClient(seed: readonly Row[] = []): {
  client: PoolClient;
  store: Store;
} {
  const store: Store = { attributes: structuredClone([...seed]), provenance: [] };
  let sequence = 0;
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    const { table, values } = parseInsert(sql, params);
    if (table === "node_attribute") {
      const row = { id: `00000000-0000-4000-8000-${++sequence}`, ...values };
      store.attributes.push(row);
      return { rows: [{ id: row.id }], rowCount: 1 };
    }
    if (table === "provenance") {
      store.provenance.push(values);
      return { rows: [{ id: "provenance" }], rowCount: 1 };
    }
    throw new Error(`table outside the new attribute's records: ${table}`);
  };
  return { client: { query } as unknown as PoolClient, store };
}

function setChange(overrides: Record<string, string> = {}): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: "any",
    kind: "set",
    value: DEADLINE_VALUE,
    ...overrides,
  });
}

function inputFor(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  editedAt: Date = EDITED_AT
): NewAttributeInput {
  return { target: { node: NODE, attributeKey }, change, note: NOTE, editedAt };
}

function rowOf(store: Store, id: string): Row {
  const row = store.attributes.find((candidate) => candidate.id === id);
  if (row === undefined) throw new Error("expected the recorded attribute");
  return row;
}

function validityOf(row: Row): Row {
  return {
    valid_from: row.valid_from ?? null,
    valid_to: row.valid_to ?? null,
    valid_from_source: row.valid_from_source ?? null,
  };
}

function startOf(row: Row): Row {
  return {
    valid_from: row.valid_from ?? null,
    valid_from_source: row.valid_from_source ?? null,
  };
}

function everyRowBut(store: Store, id: string): Row[] {
  return store.attributes.filter((row) => row.id !== id);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the status of the attribute an entity edit records for a first value or an addition", () => {
  it("is active", async () => {
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange())
    );

    expect(rowOf(store, id).status).toBe("active");
  });
});

describe("the confidence of the attribute an entity edit records for a first value or an addition", () => {
  it("is 1.0", async () => {
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange())
    );

    expect(Number(rowOf(store, id).confidence)).toBe(1.0);
  });
});

describe("the run of the attribute an entity edit records for a first value or an addition", () => {
  it("is the LLM run of the edit's note", async () => {
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange())
    );

    expect(rowOf(store, id).created_by_run_id).toBe(RUN_ID);
  });
});

describe("the provenance of the attribute an entity edit records for a first value or an addition", () => {
  it("is exactly one, pointing at the edit's information fragment", async () => {
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange())
    );

    expect(store.provenance).toEqual([
      { attribute_id: id, fragment_id: FRAGMENT_ID },
    ]);
  });
});

describe("a set change to a temporal key that states no validity start, in a server zone behind UTC", () => {
  it("is recorded with today's UTC calendar date as the start and the basis received", async () => {
    vi.stubEnv("TZ", ZONE_BEHIND_UTC);
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange(), FIRST_MOMENT_OF_UTC_DAY)
    );

    expect(startOf(rowOf(store, id))).toEqual({
      valid_from: FIRST_UTC_DAY,
      valid_from_source: "received",
    });
  });
});

describe("a set change to a temporal key that states no validity start, in a server zone ahead of UTC", () => {
  it("is recorded with the UTC calendar date of the edit as the start", async () => {
    vi.stubEnv("TZ", ZONE_AHEAD_OF_UTC);
    const { client, store } = buildClient();

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange(), LAST_MOMENT_OF_UTC_DAY)
    );

    expect(rowOf(store, id).valid_from).toBe(EDITED_DATE);
  });
});

describe("a set change that states a validity start", () => {
  it("is recorded with that start and the basis stated", async () => {
    const { client, store } = buildClient();
    const change = setChange({ valid_from: STATED_START });

    const id = await recordNewAttribute(client, inputFor(DEADLINE_KEY, change));

    expect(startOf(rowOf(store, id))).toEqual({
      valid_from: STATED_START,
      valid_from_source: "stated",
    });
  });
});

describe("a set change to a temporal key and the validity end it states", () => {
  it("is recorded holding that end, or none when it states none, whether or not it states a start", async () => {
    const { client, store } = buildClient();
    const withBoth = setChange({ valid_from: STATED_START, valid_to: STATED_END });
    const endOnly = setChange({ valid_to: STATED_END });
    const neither = setChange();

    const bothId = await recordNewAttribute(client, inputFor(DEADLINE_KEY, withBoth));
    const endOnlyId = await recordNewAttribute(client, inputFor(DEADLINE_KEY, endOnly));
    const neitherId = await recordNewAttribute(client, inputFor(DEADLINE_KEY, neither));

    expect({
      withBoth: rowOf(store, bothId).valid_to ?? null,
      endOnly: rowOf(store, endOnlyId).valid_to ?? null,
      neither: rowOf(store, neitherId).valid_to ?? null,
    }).toEqual({ withBoth: STATED_END, endOnly: STATED_END, neither: null });
  });
});

describe("a new attribute of a key that is not temporal", () => {
  it("holds no validity start, no validity end and no basis, whether or not the change states a validity", async () => {
    const { client, store } = buildClient();
    const bare = setChange({ value: CNPJ_VALUE });
    const stating = setChange({
      value: CNPJ_VALUE,
      valid_from: STATED_START,
      valid_to: STATED_END,
    });

    const bareId = await recordNewAttribute(client, inputFor(CNPJ_KEY, bare));
    const statingId = await recordNewAttribute(client, inputFor(CNPJ_KEY, stating));

    const none = { valid_from: null, valid_to: null, valid_from_source: null };
    expect({
      bare: validityOf(rowOf(store, bareId)),
      stating: validityOf(rowOf(store, statingId)),
    }).toEqual({ bare: none, stating: none });
  });
});

describe("a first value", () => {
  it("names no attribute it supersedes and leaves the key's historical attribute as it was", async () => {
    const historical = heldRow(SUPERSEDED_ID, {
      attribute_key_id: DEADLINE_KEY_ID,
      value_type: "date",
      value: "2026-06-30",
      status: "superseded",
      superseded_at: SUPERSEDED_AT,
    });
    const { client, store } = buildClient([historical]);

    const id = await recordNewAttribute(
      client,
      inputFor(DEADLINE_KEY, setChange())
    );

    expect({
      supersedes: rowOf(store, id).supersedes_attribute_id ?? null,
      others: everyRowBut(store, id),
    }).toEqual({ supersedes: null, others: [historical] });
  });
});

describe("an addition", () => {
  it("leaves every other attribute of its key, and of other keys and nodes, as it was", async () => {
    const held = [
      heldRow(ACTIVE_ID),
      heldRow(UNCERTAIN_ID, { status: "uncertain", value: "ana" }),
      heldRow(OTHER_KEY_ROW_ID, { attribute_key_id: DEADLINE_KEY_ID }),
      heldRow(OTHER_NODE_ROW_ID, { node_id: OTHER_NODE_ID }),
    ];
    const { client, store } = buildClient(held);
    const change = setChange({ value: STAKEHOLDER_VALUE });

    const id = await recordNewAttribute(client, inputFor(STAKEHOLDER_KEY, change));

    expect(everyRowBut(store, id)).toEqual(held);
  });
});
