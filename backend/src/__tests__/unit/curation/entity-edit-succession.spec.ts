import type { PoolClient } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AttributeChangeSchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import type {
  ItemLockedRow,
  KnowledgeNodeLockedRow,
} from "../../../modules/curation/repository/curation.repository.js";
import type { OperatorNoteRecord } from "../../../modules/curation/service/entity-edit-note.js";
import { recordSuccession } from "../../../modules/curation/service/entity-edit-succession.js";
import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const NODE_TYPE_ID = "66666666-0000-4000-8000-0000000000f1";
const DEADLINE_KEY_ID = "77777777-0000-4000-8000-000000000001";
const STATUS_KEY_ID = "77777777-0000-4000-8000-000000000002";
const RUN_ID = "11111111-0000-4000-8000-000000000001";
const RAW_ID = "11111111-0000-4000-8000-000000000002";
const CHUNK_ID = "11111111-0000-4000-8000-000000000003";
const FRAGMENT_ID = "11111111-0000-4000-8000-000000000004";
const OTHER_RUN_ID = "99999999-0000-4000-8000-000000000001";
const PREDECESSOR_ID = "88888888-0000-4000-8000-000000000001";

const EDITED_AT = new Date("2026-10-07T14:35:09.000Z");
const EDITED_DATE = "2026-10-07";
const EDIT_BEHIND_UTC_DAY = new Date("2026-10-07T23:30:00-03:00");
const UTC_DATE_OF_THAT_EDIT = "2026-10-08";
const ZONE_BEHIND_UTC = "America/Sao_Paulo";

const PREDECESSOR_START = "2026-03-01";
const DAY_AFTER_PREDECESSOR_START = "2026-03-02";
const DAY_BEFORE_PREDECESSOR_START = "2026-02-28";
const STATED_START = "2026-09-01";
const STATED_END = "2027-01-31";

const OLD_DEADLINE = "2026-11-30";
const NEW_DEADLINE = "2026-12-15";
const OLD_STATUS = "em andamento";
const NEW_STATUS = "pausado";
const STATUS_PREDECESSOR_START = "2026-10-01";

const LIVE_STATUSES: readonly string[] = ["active", "uncertain", "disputed"];
const INSERT_PATTERN =
  /^\s*INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/i;
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
  readonly predecessorStart: string | null;
  readonly predecessorValue?: string;
  readonly change?: Record<string, string>;
  readonly editedAt?: Date;
}

interface Outcome {
  readonly store: Store;
  readonly predecessor: Row;
  readonly recorded: Row;
}

interface Case {
  readonly label: string;
  readonly scenario: Scenario;
  readonly expected: unknown;
}

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

const STATUS_KEY: AttributeKeyRow = {
  ...DEADLINE_KEY,
  id: STATUS_KEY_ID,
  key: "status_text",
  value_type: "text",
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
    throw new Error(`statement outside the succession's records: ${sql}`);
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
    store.provenance.push(values);
    return { rows: [{ id: "provenance" }], rowCount: 1 };
  }
  throw new Error(`table outside the succession's records: ${table}`);
}

function buildClient(seed: readonly Row[]): {
  client: PoolClient;
  store: Store;
} {
  const store: Store = { attributes: structuredClone([...seed]), provenance: [] };
  let sequence = 0;
  const nextId = (): string => `00000000-0000-4000-8000-${++sequence}`;
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    if (UPDATE_PATTERN.test(sql)) return supersedeStatement(store, params);
    return insertStatement(store, { sql, params }, nextId);
  };
  return { client: { query } as unknown as PoolClient, store };
}

function setChange(overrides: Record<string, string> = {}): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: "any",
    kind: "set",
    value: NEW_DEADLINE,
    ...overrides,
  });
}

function lockedRow(
  key: AttributeKeyRow,
  start: string | null,
  value: string
): ItemLockedRow {
  return {
    id: PREDECESSOR_ID,
    node_id: NODE_ID,
    attribute_key_id: key.id,
    value_type: key.value_type,
    value,
    valid_from: start,
    valid_to: null,
    status: "active",
    confidence: "1.0",
    valid_from_source: start === null ? null : "stated",
    superseded_at: null,
  };
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

async function runSuccession(scenario: Scenario): Promise<Outcome> {
  const key = scenario.key ?? DEADLINE_KEY;
  const predecessor = lockedRow(
    key,
    scenario.predecessorStart,
    scenario.predecessorValue ?? OLD_DEADLINE
  );
  const { client, store } = buildClient([
    {
      ...predecessor,
      created_by_run_id: OTHER_RUN_ID,
      supersedes_attribute_id: null,
    },
  ]);
  await recordSuccession(client, {
    target: { node: NODE, attributeKey: key },
    change: setChange(scenario.change),
    note: NOTE,
    editedAt: scenario.editedAt ?? EDITED_AT,
    predecessor,
  });
  return {
    store,
    predecessor: rowOf(store, PREDECESSOR_ID),
    recorded: recordedRowOf(store),
  };
}

async function observeEach(
  cases: readonly Case[],
  read: (outcome: Outcome) => unknown
): Promise<Record<string, unknown>> {
  const observed: Record<string, unknown> = {};
  for (const current of cases) {
    observed[current.label] = read(await runSuccession(current.scenario));
  }
  return observed;
}

function expectedOf(cases: readonly Case[]): Record<string, unknown> {
  return Object.fromEntries(cases.map((current) => [current.label, current.expected]));
}

function freezeClockAtTheEdit(): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(EDITED_AT);
}

const DEADLINE_EXAMPLE: Scenario = { predecessorStart: PREDECESSOR_START };

const STATUS_EXAMPLE: Scenario = {
  key: STATUS_KEY,
  predecessorStart: STATUS_PREDECESSOR_START,
  predecessorValue: OLD_STATUS,
  change: { value: NEW_STATUS, valid_from: STATED_START },
};

const VALIDITY_END_CASES: readonly Case[] = [
  {
    label: "predecessor holds no start",
    scenario: { predecessorStart: null, change: { valid_from: STATED_START } },
    expected: STATED_START,
  },
  {
    label: "new start one day after the predecessor's start",
    scenario: {
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: DAY_AFTER_PREDECESSOR_START },
    },
    expected: DAY_AFTER_PREDECESSOR_START,
  },
  {
    label: "new start on the predecessor's start",
    scenario: {
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: PREDECESSOR_START },
    },
    expected: null,
  },
  {
    label: "new start one day before the predecessor's start",
    scenario: {
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: DAY_BEFORE_PREDECESSOR_START },
    },
    expected: null,
  },
];

const SUPERSESSION_TIME_CASES: readonly Case[] = [
  {
    label: "predecessor holds no start",
    scenario: { predecessorStart: null, change: { valid_from: STATED_START } },
    expected: null,
  },
  {
    label: "new start later than the predecessor's start",
    scenario: {
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: DAY_AFTER_PREDECESSOR_START },
    },
    expected: null,
  },
  {
    label: "new start on the predecessor's start",
    scenario: {
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: PREDECESSOR_START },
    },
    expected: EDITED_AT,
  },
  {
    label: "status starting 2026-10-01 set with a stated start of 2026-09-01",
    scenario: STATUS_EXAMPLE,
    expected: EDITED_AT,
  },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("the status of the attribute a succession supersedes", () => {
  it("is superseded whether or not the succession gives it a validity end", async () => {
    const withEnd = await runSuccession(DEADLINE_EXAMPLE);
    const withoutEnd = await runSuccession({
      predecessorStart: PREDECESSOR_START,
      change: { valid_from: PREDECESSOR_START },
    });

    expect({
      withEnd: withEnd.predecessor.status,
      withoutEnd: withoutEnd.predecessor.status,
    }).toEqual({ withEnd: "superseded", withoutEnd: "superseded" });
  });
});

describe("the new attribute a succession records and the attribute it supersedes", () => {
  it("names that attribute as the one it supersedes", async () => {
    const outcome = await runSuccession(DEADLINE_EXAMPLE);

    expect(outcome.recorded.supersedes_attribute_id).toBe(PREDECESSOR_ID);
  });
});

describe("the validity end of the attribute a succession supersedes", () => {
  it("is the new start, and none when the predecessor holds a start the new start does not pass", async () => {
    const observed = await observeEach(
      VALIDITY_END_CASES,
      (outcome) => outcome.predecessor.valid_to ?? null
    );

    expect(observed).toEqual(expectedOf(VALIDITY_END_CASES));
  });
});

describe("the supersession time of the attribute a succession supersedes", () => {
  it("is the moment of the supersession only where the succession gives it no validity end", async () => {
    freezeClockAtTheEdit();

    const observed = await observeEach(
      SUPERSESSION_TIME_CASES,
      (outcome) => outcome.predecessor.superseded_at ?? null
    );

    expect(observed).toEqual(expectedOf(SUPERSESSION_TIME_CASES));
  });
});

describe("a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start", () => {
  it("gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time", async () => {
    const outcome = await runSuccession(DEADLINE_EXAMPLE);

    expect({
      newStart: outcome.recorded.valid_from,
      newBasis: outcome.recorded.valid_from_source,
      earlierValidTo: outcome.predecessor.valid_to,
      earlierSupersededAt: outcome.predecessor.superseded_at ?? null,
    }).toEqual({
      newStart: EDITED_DATE,
      newBasis: "received",
      earlierValidTo: EDITED_DATE,
      earlierSupersededAt: null,
    });
  });
});

describe("a project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01", () => {
  it("supersedes the earlier status with no validity end and records the new status starting 2026-09-01 with the basis stated", async () => {
    const outcome = await runSuccession(STATUS_EXAMPLE);

    expect({
      earlierStatus: outcome.predecessor.status,
      earlierValidTo: outcome.predecessor.valid_to ?? null,
      newStart: outcome.recorded.valid_from,
      newBasis: outcome.recorded.valid_from_source,
    }).toEqual({
      earlierStatus: "superseded",
      earlierValidTo: null,
      newStart: STATED_START,
      newBasis: "stated",
    });
  });
});

describe("the state of the new attribute a succession records", () => {
  it("is active at confidence 1.0 under the LLM run of the edit's note", async () => {
    const outcome = await runSuccession(DEADLINE_EXAMPLE);

    expect({
      status: outcome.recorded.status,
      confidence: Number(outcome.recorded.confidence),
      createdByRunId: outcome.recorded.created_by_run_id,
    }).toEqual({ status: "active", confidence: 1.0, createdByRunId: RUN_ID });
  });
});

describe("the provenance of the new attribute a succession records", () => {
  it("holds the edit's information fragment", async () => {
    const outcome = await runSuccession(DEADLINE_EXAMPLE);

    expect(outcome.store.provenance).toContainEqual({
      attribute_id: outcome.recorded.id,
      fragment_id: FRAGMENT_ID,
    });
  });
});

describe("the validity end of the new attribute a succession records", () => {
  it("is the end the change states, or none when it states none", async () => {
    const stating = await runSuccession({
      ...DEADLINE_EXAMPLE,
      change: { valid_from: STATED_START, valid_to: STATED_END },
    });
    const silent = await runSuccession(DEADLINE_EXAMPLE);

    expect({
      stating: stating.recorded.valid_to ?? null,
      silent: silent.recorded.valid_to ?? null,
    }).toEqual({ stating: STATED_END, silent: null });
  });
});

describe("a succession with no stated start, made in a server zone behind UTC at a moment whose UTC date differs from the zone's date", () => {
  it("gives the new attribute the UTC calendar date of the edit as its start", async () => {
    vi.stubEnv("TZ", ZONE_BEHIND_UTC);

    const outcome = await runSuccession({
      ...DEADLINE_EXAMPLE,
      editedAt: EDIT_BEHIND_UTC_DAY,
    });

    expect(outcome.recorded.valid_from).toBe(UTC_DATE_OF_THAT_EDIT);
  });

  it("gives the superseded attribute that same UTC calendar date as its validity end", async () => {
    vi.stubEnv("TZ", ZONE_BEHIND_UTC);

    const outcome = await runSuccession({
      ...DEADLINE_EXAMPLE,
      editedAt: EDIT_BEHIND_UTC_DAY,
    });

    expect(outcome.predecessor.valid_to).toBe(UTC_DATE_OF_THAT_EDIT);
  });
});
