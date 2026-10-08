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
const DISPUTED = "BUSINESS_ENTITY_EDIT_DISPUTED";
const OWN_VALUE = "Alpha Team";
const CASE_ONLY_VALUE = "alpha team";
const OTHER_VALUE = "Beta Team";
const ATTRIBUTE_KEY = "owning_team";

const NODE_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const NODE_TYPE_ID = "aaaaaaaa-0000-4000-8000-0000000000f1";
const KEY_ID = "bbbbbbbb-0000-4000-8000-000000000001";
const ITEM_ID = "cccccccc-0000-4000-8000-000000000001";

type Row = Record<string, unknown>;

const NODE: KnowledgeNodeLockedRow = {
  id: NODE_ID,
  node_type_id: NODE_TYPE_ID,
  canonical_name: "projeto de teste",
  status: "active",
  merged_into_node_id: null,
};

const TEAM_KEY: AttributeKeyRow = {
  id: KEY_ID,
  node_type_id: NODE_TYPE_ID,
  key: ATTRIBUTE_KEY,
  value_type: "text",
  is_temporal: false,
  allows_multiple_current: false,
  requires_valid_from: false,
};

function heldRow(status: string): Row {
  return {
    id: ITEM_ID,
    node_id: NODE_ID,
    attribute_key_id: KEY_ID,
    value_type: "text",
    value: OWN_VALUE,
    valid_from: null,
    valid_to: null,
    status,
    confidence: "0.9",
    valid_from_source: null,
    superseded_at: null,
    supersedes_id: null,
  };
}

function buildClient(attributes: readonly Row[]): PoolClient {
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: Row[]; rowCount: number }> => {
    if (!/^\s*SELECT\b/i.test(sql) || !/FROM\s+node_attribute\b/i.test(sql)) {
      throw new Error(`statement outside the held-attribute reads: ${sql}`);
    }
    const [ids] = params;
    const wanted = Array.isArray(ids) ? ids : [];
    const rows = attributes.filter((row) => wanted.includes(row.id));
    return { rows: structuredClone(rows), rowCount: rows.length };
  };
  return { query } as unknown as PoolClient;
}

function setChange(value: string): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: ATTRIBUTE_KEY,
    kind: "set",
    value,
    item_id: ITEM_ID,
  });
}

function removeChange(): AttributeChange {
  return AttributeChangeSchema.parse({
    attribute_key: ATTRIBUTE_KEY,
    kind: "remove",
    item_id: ITEM_ID,
  });
}

async function check(status: string, change: AttributeChange): Promise<void> {
  await checkChangeAgainstHeldAttributes(
    buildClient([heldRow(status)]),
    { node: NODE, attributeKey: TEAM_KEY },
    change
  );
}

async function outcomeOf(
  status: string,
  change: AttributeChange
): Promise<string> {
  try {
    await check(status, change);
  } catch (error) {
    if (error instanceof ConflictError) return error.code;
    throw error;
  }
  return ACCEPTED;
}

async function refusalOf(
  status: string,
  change: AttributeChange
): Promise<ConflictError> {
  try {
    await check(status, change);
  } catch (error) {
    if (error instanceof ConflictError) return error;
    throw error;
  }
  throw new Error("expected the change to be refused");
}

function textOf(refusal: ConflictError): string {
  return `${refusal.message} ${JSON.stringify(refusal.details)}`;
}

describe("a set change naming a disputed attribute", () => {
  it("is refused as disputed when it states a value other than the attribute's own", async () => {
    const change = setChange(OTHER_VALUE);

    const outcome = await outcomeOf("disputed", change);

    expect(outcome).toBe(DISPUTED);
  });

  it("is refused as disputed when it states a value differing from the attribute's own only in letter case", async () => {
    const change = setChange(CASE_ONLY_VALUE);

    const outcome = await outcomeOf("disputed", change);

    expect(outcome).toBe(DISPUTED);
  });

  it("is not refused as disputed when it states the attribute's own value character for character", async () => {
    const change = setChange(OWN_VALUE);

    const outcome = await outcomeOf("disputed", change);

    expect(outcome).toBe(ACCEPTED);
  });
});

describe("a remove change naming a disputed attribute", () => {
  it("is refused as disputed", async () => {
    const change = removeChange();

    const outcome = await outcomeOf("disputed", change);

    expect(outcome).toBe(DISPUTED);
  });
});

describe("a disputed refusal", () => {
  it("names the attribute key of the change", async () => {
    const change = setChange(OTHER_VALUE);

    const refusal = await refusalOf("disputed", change);

    expect(textOf(refusal)).toContain(ATTRIBUTE_KEY);
  });

  it("names the disputed item", async () => {
    const change = removeChange();

    const refusal = await refusalOf("disputed", change);

    expect(textOf(refusal)).toContain(ITEM_ID);
  });

  it("is answered HTTP 409 over REST with the disputed code", async () => {
    const change = setChange(OTHER_VALUE);
    const refusal = await refusalOf("disputed", change);

    const answer = mapErrorToHttpResponse(refusal);

    expect({
      status: answer.statusCode,
      code: answer.envelope.error.code,
    }).toEqual({ status: 409, code: DISPUTED });
  });
});

describe("a change naming a live attribute that is not disputed", () => {
  it.each(["active", "uncertain"])(
    "is not refused as disputed when it sets another value on an %s attribute",
    async (status) => {
      const change = setChange(OTHER_VALUE);

      const outcome = await outcomeOf(status, change);

      expect(outcome).toBe(ACCEPTED);
    }
  );

  it.each(["active", "uncertain"])(
    "is not refused as disputed when it removes an %s attribute",
    async (status) => {
      const change = removeChange();

      const outcome = await outcomeOf(status, change);

      expect(outcome).toBe(ACCEPTED);
    }
  );
});
