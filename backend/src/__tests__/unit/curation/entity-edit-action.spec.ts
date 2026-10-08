import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import {
  recordEditAction,
  type AppliedChange,
} from "../../../modules/curation/service/entity-edit-action.js";

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const ACTION_ID = "99999999-0000-4000-8000-000000000001";
const EMAIL_ITEM_ID = "88888888-0000-4000-8000-000000000001";
const ROLE_NEW_ITEM_ID = "88888888-0000-4000-8000-000000000002";
const ROLE_OLD_ITEM_ID = "88888888-0000-4000-8000-000000000003";

const CREATED_AT = new Date("2026-10-07T14:35:09.000Z");

const PLAIN_REASON = "Troca de cargo  após promoção";
const PADDED_REASON = "  \n Troca de cargo após promoção\t ";
const TRIMMED_REASON = "Troca de cargo após promoção";

const ENTRY_FIELDS = ["attribute_key", "effect", "item_id", "predecessor_id"];

const INSERT_PATTERN =
  /^\s*INSERT INTO curation_action\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)\s*RETURNING\b[\s\S]*$/i;
const PARAMETER_PATTERN = /^\$(\d+)(?:::(\w+))?$/;
const JSONB_CAST = "jsonb";

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface Recording {
  readonly actions: Row[];
  readonly id: string;
}

const SUCCESSION: AppliedChange = {
  attribute_key: "role",
  effect: "succession",
  item_id: ROLE_NEW_ITEM_ID,
  predecessor_id: ROLE_OLD_ITEM_ID,
};
const FIRST_VALUE: AppliedChange = {
  attribute_key: "email",
  effect: "first-value",
  item_id: EMAIL_ITEM_ID,
  predecessor_id: null,
};
const UNCHANGED: AppliedChange = {
  attribute_key: "phone",
  effect: "unchanged",
  item_id: null,
  predecessor_id: null,
};

const MIXED_CHANGES: readonly AppliedChange[] = [SUCCESSION, FIRST_VALUE, UNCHANGED];

function listOf(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function valueOf(expression: string, params: unknown[]): unknown {
  const parameter = PARAMETER_PATTERN.exec(expression);
  if (parameter === null) {
    throw new Error(`expression outside the action's record: ${expression}`);
  }
  const value = params[Number(parameter[1]) - 1];
  if (parameter[2] === JSONB_CAST && typeof value === "string") {
    return JSON.parse(value);
  }
  return value;
}

function insertedRow(sql: string, params: unknown[]): Row {
  const match = INSERT_PATTERN.exec(sql);
  if (match === null) {
    throw new Error(`statement outside the action's record: ${sql}`);
  }
  const [, columnText = "", valueText = ""] = match;
  const values = listOf(valueText);
  const row: Row = {};
  listOf(columnText).forEach((column, index) => {
    row[column] = valueOf(values[index] ?? "", params);
  });
  return row;
}

function buildClient(): { client: PoolClient; actions: Row[] } {
  const actions: Row[] = [];
  const query = async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
    actions.push(insertedRow(sql, params));
    return { rows: [{ id: ACTION_ID, created_at: CREATED_AT }], rowCount: 1 };
  };
  return { client: { query } as unknown as PoolClient, actions };
}

async function record(
  changes: readonly AppliedChange[],
  reason: string = PLAIN_REASON
): Promise<Recording> {
  const { client, actions } = buildClient();
  const id = await recordEditAction(client, {
    nodeId: NODE_ID,
    reason,
    applied: changes,
  });
  return { actions, id };
}

function onlyAction(actions: readonly Row[]): Row {
  const [action] = actions;
  if (action === undefined) throw new Error("expected an action to be recorded");
  return action;
}

function appliedOf(action: Row): Row[] {
  const payload = action.payload;
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("applied" in payload) ||
    !Array.isArray(payload.applied)
  ) {
    throw new Error("expected the payload to be an object holding an applied list");
  }
  return payload.applied;
}

function entryAt(action: Row, index: number): Row {
  const entry = appliedOf(action)[index];
  if (entry === undefined) throw new Error("expected the payload entry to exist");
  return entry;
}

describe("the kind of the curation action an edit records", () => {
  it("is written edit_entity", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(onlyAction(actions).action).toBe("edit_entity");
  });
});

describe("the target of the curation action an edit records", () => {
  it("is of the kind node", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(onlyAction(actions).target_kind).toBe("node");
  });

  it("is the edited node's identity", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(onlyAction(actions).target_id).toBe(NODE_ID);
  });
});

describe("the reason of the curation action an edit records", () => {
  it("is the edit's reason, inner whitespace kept", async () => {
    const { actions } = await record(MIXED_CHANGES, PLAIN_REASON);

    expect(onlyAction(actions).reason).toBe(PLAIN_REASON);
  });

  it("is the edit's reason without its surrounding whitespace", async () => {
    const { actions } = await record(MIXED_CHANGES, PADDED_REASON);

    expect(onlyAction(actions).reason).toBe(TRIMMED_REASON);
  });
});

describe("the payload of the curation action an edit records", () => {
  it("is an object holding an applied list", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(onlyAction(actions).payload).toEqual(
      expect.objectContaining({ applied: expect.any(Array) })
    );
  });

  it("lists one entry for each applied change", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(appliedOf(onlyAction(actions))).toHaveLength(MIXED_CHANGES.length);
  });

  it("lists the entries in the order the changes were given", async () => {
    const { actions } = await record(MIXED_CHANGES);

    const keys = appliedOf(onlyAction(actions)).map((entry) => entry.attribute_key);

    expect(keys).toEqual(MIXED_CHANGES.map((change) => change.attribute_key));
  });

  it("gives each entry exactly attribute_key, effect, item_id and predecessor_id", async () => {
    const withExtraField = { ...SUCCESSION, note: "not part of the entry" };

    const { actions } = await record([withExtraField]);

    expect(Object.keys(entryAt(onlyAction(actions), 0)).sort()).toEqual(ENTRY_FIELDS);
  });

  it("gives an entry the values of the applied change it lists", async () => {
    const { actions } = await record([SUCCESSION]);

    expect(entryAt(onlyAction(actions), 0)).toEqual({
      attribute_key: "role",
      effect: "succession",
      item_id: ROLE_NEW_ITEM_ID,
      predecessor_id: ROLE_OLD_ITEM_ID,
    });
  });

  it("writes the effect of a first-value entry as first_value", async () => {
    const { actions } = await record([FIRST_VALUE]);

    expect(entryAt(onlyAction(actions), 0).effect).toBe("first_value");
  });

  it("carries item_id as null on an unchanged entry rather than omitting it", async () => {
    const { actions } = await record([UNCHANGED]);

    expect(entryAt(onlyAction(actions), 0)).toHaveProperty("item_id", null);
  });

  it("carries predecessor_id as null on a first-value entry rather than omitting it", async () => {
    const { actions } = await record([FIRST_VALUE]);

    expect(entryAt(onlyAction(actions), 0)).toHaveProperty("predecessor_id", null);
  });
});

describe("recording the curation action of an edit", () => {
  it("returns the identity of the action it recorded", async () => {
    const { id } = await record(MIXED_CHANGES);

    expect(id).toBe(ACTION_ID);
  });

  it("records one action for one accepted edit however many changes it applied", async () => {
    const { actions } = await record(MIXED_CHANGES);

    expect(actions).toHaveLength(1);
  });

  it("records the edit_entity action on the edited node with the reason and every applied change", async () => {
    const { actions } = await record(MIXED_CHANGES, PLAIN_REASON);

    expect(actions).toEqual([
      {
        action: "edit_entity",
        target_kind: "node",
        target_id: NODE_ID,
        payload: {
          applied: [
            {
              attribute_key: "role",
              effect: "succession",
              item_id: ROLE_NEW_ITEM_ID,
              predecessor_id: ROLE_OLD_ITEM_ID,
            },
            {
              attribute_key: "email",
              effect: "first_value",
              item_id: EMAIL_ITEM_ID,
              predecessor_id: null,
            },
            {
              attribute_key: "phone",
              effect: "unchanged",
              item_id: null,
              predecessor_id: null,
            },
          ],
        },
        reason: PLAIN_REASON,
      },
    ]);
  });
});
