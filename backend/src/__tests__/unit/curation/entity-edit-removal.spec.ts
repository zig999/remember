import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { recordRemoval } from "../../../modules/curation/service/entity-edit-removal.js";

const NODE_ID = "66666666-0000-4000-8000-000000000001";
const EMAIL_KEY_ID = "77777777-0000-4000-8000-000000000001";
const PHONE_KEY_ID = "77777777-0000-4000-8000-000000000002";
const NAMED_EMAIL_ID = "88888888-0000-4000-8000-000000000001";
const OTHER_EMAIL_ID = "88888888-0000-4000-8000-000000000002";
const PHONE_ID = "88888888-0000-4000-8000-000000000003";

const EDITED_AT = new Date("2026-10-07T14:35:09.000Z");

const NAMED_EMAIL_VALUE = "ana@exemplo.com.br";
const OTHER_EMAIL_VALUE = "ana.souza@exemplo.com.br";
const PHONE_VALUE = "+55 11 99999-0000";

const LITERAL_PATTERN = /^'([^']*)'$/;
const PARAMETER_PATTERN = /^\$(\d+)(?:::\w+)?$/;
const NOW_PATTERN = /^now\(\)$/i;
const NULL_PATTERN = /^NULL$/i;
const UPDATE_PATTERN =
  /^\s*UPDATE (\w+)\s+SET([\s\S]*?)(?:\bWHERE([\s\S]*?))?(?:\bRETURNING\b[\s\S]*)?$/i;
const ASSIGNMENT_SPLIT = /,(?![^(]*\))/;
const CONDITION_SPLIT = /\bAND\b/i;
const ASSIGNMENT_PATTERN = /^(\w+)\s*=\s*([\s\S]+)$/;
const MEMBERSHIP_PATTERN = /^(\w+)\s+IN\s*\(([^)]*)\)$/i;
const EQUALITY_PATTERN = /^(\w+)\s*=\s*([\s\S]+)$/;
const NODE_ATTRIBUTE_TABLE = "node_attribute";

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface AttributeSpec {
  readonly id: string;
  readonly keyId: string;
  readonly value: string;
}

interface ParsedUpdate {
  readonly assignments: readonly string[];
  readonly conditions: readonly string[];
}

function attribute(spec: AttributeSpec): Row {
  return {
    id: spec.id,
    node_id: NODE_ID,
    attribute_key_id: spec.keyId,
    value: spec.value,
    status: "active",
    valid_from: null,
    valid_to: null,
    superseded_at: null,
    confidence: "1.0",
  };
}

const NAMED_EMAIL = attribute({
  id: NAMED_EMAIL_ID,
  keyId: EMAIL_KEY_ID,
  value: NAMED_EMAIL_VALUE,
});
const OTHER_EMAIL = attribute({
  id: OTHER_EMAIL_ID,
  keyId: EMAIL_KEY_ID,
  value: OTHER_EMAIL_VALUE,
});
const PHONE = attribute({ id: PHONE_ID, keyId: PHONE_KEY_ID, value: PHONE_VALUE });

const PERSON_ATTRIBUTES: readonly Row[] = [NAMED_EMAIL, OTHER_EMAIL, PHONE];

function trimmed(parts: readonly string[]): string[] {
  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

function parseUpdate(sql: string): ParsedUpdate {
  const match = UPDATE_PATTERN.exec(sql);
  if (match === null) {
    throw new Error(`statement outside the removal's records: ${sql}`);
  }
  const [, table = "", setText = "", whereText = ""] = match;
  if (table !== NODE_ATTRIBUTE_TABLE) {
    throw new Error(`table outside the removal's records: ${table}`);
  }
  return {
    assignments: trimmed(setText.split(ASSIGNMENT_SPLIT)),
    conditions: trimmed(whereText.split(CONDITION_SPLIT)),
  };
}

function valueOf(expression: string, row: Row, params: unknown[]): unknown {
  const text = expression.trim();
  const literal = LITERAL_PATTERN.exec(text);
  if (literal !== null) return literal[1];
  const parameter = PARAMETER_PATTERN.exec(text);
  if (parameter !== null) return params[Number(parameter[1]) - 1];
  if (NOW_PATTERN.test(text)) return new Date();
  if (NULL_PATTERN.test(text)) return null;
  if (text in row) return row[text];
  throw new Error(`expression outside the removal's records: ${text}`);
}

function satisfies(row: Row, condition: string, params: unknown[]): boolean {
  const membership = MEMBERSHIP_PATTERN.exec(condition);
  if (membership !== null) {
    const [, column = "", list = ""] = membership;
    const members = trimmed(list.split(",")).map((item) => valueOf(item, row, params));
    return members.includes(row[column]);
  }
  const equality = EQUALITY_PATTERN.exec(condition);
  if (equality === null) {
    throw new Error(`condition outside the removal's records: ${condition}`);
  }
  const [, column = "", operand = ""] = equality;
  return row[column] === valueOf(operand, row, params);
}

function assign(row: Row, assignment: string, params: unknown[]): void {
  const match = ASSIGNMENT_PATTERN.exec(assignment);
  if (match === null) {
    throw new Error(`assignment outside the removal's records: ${assignment}`);
  }
  const [, column = "", expression = ""] = match;
  row[column] = valueOf(expression, row, params);
}

function runUpdate(attributes: Row[], sql: string, params: unknown[]): QueryResult {
  const update = parseUpdate(sql);
  const matched = attributes.filter((row) =>
    update.conditions.every((condition) => satisfies(row, condition, params))
  );
  for (const row of matched) {
    for (const assignment of update.assignments) assign(row, assignment, params);
  }
  return { rows: matched.map((row) => ({ id: row.id })), rowCount: matched.length };
}

function buildClient(seed: readonly Row[]): {
  client: PoolClient;
  attributes: Row[];
} {
  const attributes = structuredClone([...seed]);
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => runUpdate(attributes, sql, params);
  return { client: { query } as unknown as PoolClient, attributes };
}

function rowOf(attributes: readonly Row[], id: string): Row {
  const row = attributes.find((candidate) => candidate.id === id);
  if (row === undefined) throw new Error("expected the attribute to exist");
  return row;
}

async function removeNamedEmail(): Promise<Row[]> {
  const { client, attributes } = buildClient(PERSON_ATTRIBUTES);
  await recordRemoval(client, { attributeId: NAMED_EMAIL_ID, editedAt: EDITED_AT });
  return attributes;
}

describe("the status of the attribute a removal names", () => {
  it("becomes deleted", async () => {
    const attributes = await removeNamedEmail();

    expect(rowOf(attributes, NAMED_EMAIL_ID).status).toBe("deleted");
  });
});

describe("the supersession time of the attribute a removal names", () => {
  it("is the moment of the edit", async () => {
    const attributes = await removeNamedEmail();

    expect(rowOf(attributes, NAMED_EMAIL_ID).superseded_at).toEqual(EDITED_AT);
  });
});

describe("a person's two active email attributes, one of them removed", () => {
  it("leaves the other email active", async () => {
    const attributes = await removeNamedEmail();

    expect(rowOf(attributes, OTHER_EMAIL_ID).status).toBe("active");
  });

  it("gives the other email no supersession time", async () => {
    const attributes = await removeNamedEmail();

    expect(rowOf(attributes, OTHER_EMAIL_ID).superseded_at).toBeNull();
  });

  it("leaves an attribute of another key on the same node exactly as it was", async () => {
    const attributes = await removeNamedEmail();

    expect(rowOf(attributes, PHONE_ID)).toEqual(PHONE);
  });
});
