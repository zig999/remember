import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import {
  AttributeChangeSchema,
  type AttributeChange,
} from "../../../modules/curation/dto/edit-entity.dto.js";
import { mapErrorToHttpResponse } from "../../../modules/curation/mcp/error-envelope.js";
import type { KnowledgeNodeLockedRow } from "../../../modules/curation/repository/curation.repository.js";
import { checkChangeAgainstHeldAttributes } from "../../../modules/curation/service/entity-edit-attributes.js";
import { ConflictError } from "../../../modules/curation/service/errors.js";
import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";

const ACCEPTED = "accepted";
const CONFLICT = "BUSINESS_ENTITY_EDIT_CONFLICT";
const OWN_VALUE = "2026-11-30";
const OTHER_VALUE = "2026-12-31";
const SUPERSEDED_AT = new Date("2026-10-05T10:00:00.000Z");

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const OTHER_NODE_ID = "66666666-0000-4000-8000-000000000002";
const NODE_TYPE_ID = "66666666-0000-4000-8000-0000000000f1";
const DEADLINE_KEY_ID = "77777777-0000-4000-8000-000000000001";
const STAKEHOLDER_KEY_ID = "77777777-0000-4000-8000-000000000002";
const ABSENT_ID = "88888888-0000-4000-8000-0000000000ff";
const LIVE_ID = "88888888-0000-4000-8000-000000000001";
const SUPERSEDED_ID = "88888888-0000-4000-8000-000000000002";
const DELETED_ID = "88888888-0000-4000-8000-000000000003";
const OTHER_KEY_ID = "88888888-0000-4000-8000-000000000004";
const OTHER_NODE_ATTRIBUTE_ID = "88888888-0000-4000-8000-000000000005";
const STATUS_ID = "88888888-0000-4000-8000-000000000006";
const ACTIVE_TIMED_ID = "88888888-0000-4000-8000-000000000011";
const UNCERTAIN_TIMED_ID = "88888888-0000-4000-8000-000000000012";
const ACTIVE_UNTIMED_ID = "88888888-0000-4000-8000-000000000013";
const UNCERTAIN_UNTIMED_ID = "88888888-0000-4000-8000-000000000014";

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface Case {
  readonly attributes: readonly Row[];
  readonly change: AttributeChange;
  readonly attributeKey?: AttributeKeyRow;
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

const STAKEHOLDER_KEY: AttributeKeyRow = {
  ...DEADLINE_KEY,
  id: STAKEHOLDER_KEY_ID,
  key: "stakeholder",
  allows_multiple_current: true,
};

function attributeRow(id: string, overrides: Row = {}): Row {
  return {
    id,
    node_id: NODE_ID,
    attribute_key_id: DEADLINE_KEY_ID,
    value_type: "date",
    value: OWN_VALUE,
    valid_from: null,
    valid_to: null,
    status: "active",
    confidence: "0.9",
    valid_from_source: null,
    superseded_at: null,
    supersedes_id: null,
    ...overrides,
  };
}

function selectRows(
  attributes: readonly Row[],
  sql: string,
  params: unknown[]
): Row[] {
  if (/WHERE\s+id\s*=\s*ANY/i.test(sql)) {
    const [ids] = params;
    const wanted = Array.isArray(ids) ? ids : [];
    return attributes.filter((row) => wanted.includes(row.id));
  }
  if (/attribute_key_id\s*=\s*\$2/i.test(sql)) {
    const [nodeId, keyId, statuses] = params;
    const allowed = Array.isArray(statuses) ? statuses : [];
    return attributes.filter(
      (row) =>
        row.node_id === nodeId &&
        row.attribute_key_id === keyId &&
        allowed.includes(row.status)
    );
  }
  throw new Error(`statement outside the held-attribute reads: ${sql}`);
}

function buildClient(attributes: readonly Row[]): {
  client: PoolClient;
  locked: string[];
} {
  const locked: string[] = [];
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    if (!/^\s*SELECT\b/i.test(sql) || !/FROM\s+node_attribute\b/i.test(sql)) {
      throw new Error(`statement outside the held-attribute reads: ${sql}`);
    }
    const rows = selectRows(attributes, sql, params);
    if (/FOR\s+UPDATE/i.test(sql)) {
      locked.push(...rows.map((row) => String(row.id)));
    }
    return { rows: structuredClone(rows), rowCount: rows.length };
  };
  return { client: { query } as unknown as PoolClient, locked };
}

function setChange(value: string, itemId?: string): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: "deadline",
    kind: "set",
    value,
    item_id: itemId,
  });
}

function removeChange(itemId: string): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: "deadline",
    kind: "remove",
    item_id: itemId,
  });
}

function caseOf(
  attributes: readonly Row[],
  change: AttributeChange,
  attributeKey: AttributeKeyRow = DEADLINE_KEY
): Case {
  return { attributes, change, attributeKey };
}

async function run(held: Case, client: PoolClient): Promise<void> {
  await checkChangeAgainstHeldAttributes(
    client,
    { node: NODE, attributeKey: held.attributeKey ?? DEADLINE_KEY },
    held.change
  );
}

async function outcomeOf(held: Case): Promise<string> {
  const { client } = buildClient(held.attributes);
  try {
    await run(held, client);
  } catch (error) {
    if (error instanceof ConflictError) return error.code;
    throw error;
  }
  return ACCEPTED;
}

async function refusalOf(held: Case): Promise<ConflictError> {
  const { client } = buildClient(held.attributes);
  try {
    await run(held, client);
  } catch (error) {
    if (error instanceof ConflictError) return error;
    throw error;
  }
  throw new Error("expected the change to be refused");
}

async function outcomesOf(
  cases: Readonly<Record<string, Case>>
): Promise<Record<string, string>> {
  const outcomes: Record<string, string> = {};
  for (const [name, held] of Object.entries(cases)) {
    outcomes[name] = await outcomeOf(held);
  }
  return outcomes;
}

function textOf(refusal: ConflictError): string {
  return `${refusal.message} ${JSON.stringify(refusal.details)}`;
}

const LIVE_OWN = attributeRow(LIVE_ID);
const SUPERSEDED_OWN = attributeRow(SUPERSEDED_ID, {
  status: "superseded",
  superseded_at: SUPERSEDED_AT,
});
const DELETED_OWN = attributeRow(DELETED_ID, { status: "deleted" });
const OTHER_KEY_ATTRIBUTE = attributeRow(OTHER_KEY_ID, {
  attribute_key_id: STAKEHOLDER_KEY_ID,
});
const OTHER_NODE_ATTRIBUTE = attributeRow(OTHER_NODE_ATTRIBUTE_ID, {
  node_id: OTHER_NODE_ID,
});
const ACTIVE_TIMED = attributeRow(ACTIVE_TIMED_ID, {
  status: "active",
  superseded_at: SUPERSEDED_AT,
});

const ASSERTION_STATUSES = [
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
] as const;

function statusCases(): Record<string, Case> {
  const cases: Record<string, Case> = {};
  for (const status of ASSERTION_STATUSES) {
    cases[status] = caseOf(
      [attributeRow(STATUS_ID, { status })],
      setChange(OWN_VALUE, STATUS_ID)
    );
  }
  return cases;
}

const NAMED_ATTRIBUTE_CASES: Record<string, Case> = {
  "a live attribute of the edited node and key": caseOf(
    [LIVE_OWN],
    setChange(OWN_VALUE, LIVE_ID)
  ),
  "a superseded attribute of the edited node and key": caseOf(
    [SUPERSEDED_OWN],
    setChange(OWN_VALUE, SUPERSEDED_ID)
  ),
  "a deleted attribute of the edited node and key": caseOf(
    [DELETED_OWN],
    setChange(OWN_VALUE, DELETED_ID)
  ),
  "a live attribute of another key of the edited node": caseOf(
    [OTHER_KEY_ATTRIBUTE],
    setChange(OWN_VALUE, OTHER_KEY_ID)
  ),
  "a live attribute of another node": caseOf(
    [OTHER_NODE_ATTRIBUTE],
    setChange(OWN_VALUE, OTHER_NODE_ATTRIBUTE_ID)
  ),
  "an identity at which no attribute is held": caseOf(
    [],
    setChange(OWN_VALUE, ABSENT_ID)
  ),
};

const TIMED_ROWS: Record<string, Row> = {
  "an active attribute with a supersession time": attributeRow(
    ACTIVE_TIMED_ID,
    { status: "active", superseded_at: SUPERSEDED_AT }
  ),
  "an uncertain attribute with a supersession time": attributeRow(
    UNCERTAIN_TIMED_ID,
    { status: "uncertain", superseded_at: SUPERSEDED_AT }
  ),
  "an active attribute with no supersession time": attributeRow(
    ACTIVE_UNTIMED_ID,
    { status: "active" }
  ),
  "an uncertain attribute with no supersession time": attributeRow(
    UNCERTAIN_UNTIMED_ID,
    { status: "uncertain" }
  ),
};

function supersessionCases(): Record<string, Case> {
  const cases: Record<string, Case> = {};
  for (const [name, row] of Object.entries(TIMED_ROWS)) {
    const id = String(row.id);
    cases[`${name}, stating its own value`] = caseOf(
      [row],
      setChange(OWN_VALUE, id)
    );
    cases[`${name}, stating another value`] = caseOf(
      [row],
      setChange(OTHER_VALUE, id)
    );
  }
  return cases;
}

function heldOfStatus(status: string): Row {
  return attributeRow(LIVE_ID, { status });
}

const SECOND_VALUE_CASES: Record<string, Case> = {
  "a single-current key holding an active attribute": caseOf(
    [heldOfStatus("active")],
    setChange(OTHER_VALUE)
  ),
  "a single-current key holding an uncertain attribute": caseOf(
    [heldOfStatus("uncertain")],
    setChange(OTHER_VALUE)
  ),
  "a single-current key whose only attribute is disputed": caseOf(
    [heldOfStatus("disputed")],
    setChange(OTHER_VALUE)
  ),
  "a single-current key whose attributes are all superseded or deleted": caseOf(
    [SUPERSEDED_OWN, DELETED_OWN],
    setChange(OTHER_VALUE)
  ),
  "a single-current key holding no attribute": caseOf(
    [],
    setChange(OTHER_VALUE)
  ),
  "a single-current key held live only by another node": caseOf(
    [OTHER_NODE_ATTRIBUTE],
    setChange(OTHER_VALUE)
  ),
  "a single-current key whose live attribute is on another key": caseOf(
    [OTHER_KEY_ATTRIBUTE],
    setChange(OTHER_VALUE)
  ),
  "a multiple-current key holding an active attribute": caseOf(
    [attributeRow(LIVE_ID, { attribute_key_id: STAKEHOLDER_KEY_ID })],
    setChange(OTHER_VALUE),
    STAKEHOLDER_KEY
  ),
};

const REFUSAL_CASES: ReadonlyArray<readonly [string, Case]> = [
  [
    "a change naming a superseded attribute",
    caseOf([SUPERSEDED_OWN], setChange(OTHER_VALUE, SUPERSEDED_ID)),
  ],
  [
    "a value change to an attribute carrying a supersession time",
    caseOf([ACTIVE_TIMED], setChange(OTHER_VALUE, ACTIVE_TIMED_ID)),
  ],
  [
    "a second current value on a single-current key",
    caseOf([LIVE_OWN], setChange(OTHER_VALUE)),
  ],
];

const NAMING_REFUSAL_CASES = REFUSAL_CASES.slice(0, 2);

describe("a change naming an attribute, by what the node holds at that identity", () => {
  it("is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity", async () => {
    const outcomes = await outcomesOf(NAMED_ATTRIBUTE_CASES);

    expect(outcomes).toEqual({
      "a live attribute of the edited node and key": ACCEPTED,
      "a superseded attribute of the edited node and key": CONFLICT,
      "a deleted attribute of the edited node and key": CONFLICT,
      "a live attribute of another key of the edited node": CONFLICT,
      "a live attribute of another node": CONFLICT,
      "an identity at which no attribute is held": CONFLICT,
    });
  });

  it("is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses", async () => {
    const outcomes = await outcomesOf(statusCases());

    expect(outcomes).toEqual({
      active: ACCEPTED,
      uncertain: ACCEPTED,
      disputed: ACCEPTED,
      superseded: CONFLICT,
      deleted: CONFLICT,
    });
  });

});

describe("a change naming an attribute that is no longer live", () => {
  it("is refused as a conflict when a set change states another value for the superseded deadline attribute", async () => {
    const held = caseOf(
      [SUPERSEDED_OWN],
      setChange(OTHER_VALUE, SUPERSEDED_ID)
    );

    const outcome = await outcomeOf(held);

    expect(outcome).toBe(CONFLICT);
  });

  it.each([
    ["superseded", SUPERSEDED_OWN, SUPERSEDED_ID],
    ["deleted", DELETED_OWN, DELETED_ID],
  ])(
    "is refused as a conflict when a set change names a %s attribute and states that attribute's own value",
    async (_status, row, id) => {
      const held = caseOf([row], setChange(OWN_VALUE, id));

      const outcome = await outcomeOf(held);

      expect(outcome).toBe(CONFLICT);
    }
  );

});

describe("a remove change naming an attribute", () => {
  it("is refused as a conflict when the attribute is superseded", async () => {
    const held = caseOf([SUPERSEDED_OWN], removeChange(SUPERSEDED_ID));

    const outcome = await outcomeOf(held);

    expect(outcome).toBe(CONFLICT);
  });
});

describe("a set change naming an attribute that carries a supersession time", () => {
  it("is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own", async () => {
    const outcomes = await outcomesOf(supersessionCases());

    expect(outcomes).toEqual({
      "an active attribute with a supersession time, stating its own value":
        ACCEPTED,
      "an active attribute with a supersession time, stating another value":
        CONFLICT,
      "an uncertain attribute with a supersession time, stating its own value":
        ACCEPTED,
      "an uncertain attribute with a supersession time, stating another value":
        CONFLICT,
      "an active attribute with no supersession time, stating its own value":
        ACCEPTED,
      "an active attribute with no supersession time, stating another value":
        ACCEPTED,
      "an uncertain attribute with no supersession time, stating its own value":
        ACCEPTED,
      "an uncertain attribute with no supersession time, stating another value":
        ACCEPTED,
    });
  });
});

describe("a set change naming no attribute", () => {
  it("is refused as a conflict only when a single-current key already holds a live attribute of the edited node", async () => {
    const outcomes = await outcomesOf(SECOND_VALUE_CASES);

    expect(outcomes).toEqual({
      "a single-current key holding an active attribute": CONFLICT,
      "a single-current key holding an uncertain attribute": CONFLICT,
      "a single-current key whose only attribute is disputed": CONFLICT,
      "a single-current key whose attributes are all superseded or deleted":
        ACCEPTED,
      "a single-current key holding no attribute": ACCEPTED,
      "a single-current key held live only by another node": ACCEPTED,
      "a single-current key whose live attribute is on another key": ACCEPTED,
      "a multiple-current key holding an active attribute": ACCEPTED,
    });
  });
});

describe("a conflict refusal naming the key", () => {
  it.each(REFUSAL_CASES)("for %s names the change's attribute key", async (_name, held) => {
    const refusal = await refusalOf(held);

    expect(textOf(refusal)).toContain(held.change.attribute_key);
  });
});

describe("a conflict refusal naming the attribute", () => {
  it.each(NAMING_REFUSAL_CASES)(
    "for %s names the attribute the change names",
    async (_name, held) => {
      const refusal = await refusalOf(held);

      expect(textOf(refusal)).toContain(String(held.change.item_id));
    }
  );
});

describe("a conflict refusal over REST", () => {
  it.each(REFUSAL_CASES)("for %s is answered HTTP 409", async (_name, held) => {
    const refusal = await refusalOf(held);

    const answer = mapErrorToHttpResponse(refusal);

    expect({ status: answer.statusCode, code: answer.envelope.error.code }).toEqual({
      status: 409,
      code: CONFLICT,
    });
  });
});

describe("the rows a stale-form check reads", () => {
  it("are locked when the change names an attribute", async () => {
    const { client, locked } = buildClient([LIVE_OWN, SUPERSEDED_OWN]);
    const held = caseOf([LIVE_OWN], setChange(OWN_VALUE, LIVE_ID));

    await run(held, client);

    expect(locked).toEqual([LIVE_ID]);
  });

  it("include the live attributes of the key, locked, when a set change names none", async () => {
    const { client, locked } = buildClient([LIVE_OWN, SUPERSEDED_OWN]);
    const held = caseOf([LIVE_OWN], setChange(OTHER_VALUE));

    await run(held, client).catch((error: unknown) => {
      if (!(error instanceof ConflictError)) throw error;
    });

    expect(locked).toContain(LIVE_ID);
  });
});
