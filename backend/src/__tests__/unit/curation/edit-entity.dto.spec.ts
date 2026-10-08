import { describe, expect, it } from "vitest";
import { z } from "zod";

import { EditEntityBodySchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import { mapZodError } from "../../../modules/curation/mcp/error-envelope.js";

const ACCEPTED = "accepted";
const REFUSED = "VALIDATION_INVALID_FORMAT";
const REFUSAL_MESSAGE = "Request payload failed validation.";
const REASON_LIMIT = 1000;
const ASTRAL = "\u{1F600}";
const ASTRAL_COUNT_AT_LIMIT = 500;
const VALID_REASON = "Correcao solicitada pelo dono.";
const ITEM_ID = "00000000-0000-4000-8000-000000000001";
const KEY = "status_text";

const IssueDetailsSchema = z.object({
  issues: z.array(z.object({ path: z.string() })),
});

function outcomeOf(body: unknown): string {
  const result = EditEntityBodySchema.safeParse(body);
  if (result.success) {
    return ACCEPTED;
  }
  return mapZodError(result.error).envelope.error.code;
}

function outcomesOf(bodies: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(bodies).map(([label, body]) => [label, outcomeOf(body)])
  );
}

function bodyWithReason(reason: unknown): Record<string, unknown> {
  return { reason, changes: [] };
}

function bodyWithChange(change: unknown): Record<string, unknown> {
  return { reason: VALID_REASON, changes: [change] };
}

function issuePaths(body: unknown): string[] {
  const result = EditEntityBodySchema.safeParse(body);
  if (result.success) {
    return [];
  }
  const details = mapZodError(result.error).envelope.error.details;
  return IssueDetailsSchema.parse(details).issues.map((issue) => issue.path);
}

function nullableProjection(change: Record<string, unknown>): unknown {
  const result = EditEntityBodySchema.safeParse(bodyWithChange(change));
  if (result.success) {
    return { parsed: result.data.changes };
  }
  return {
    refused: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

const SET_WITH_VALUE = { attribute_key: KEY, kind: "set", value: "ativo" };
const REMOVE_WITH_ITEM = { attribute_key: KEY, kind: "remove", item_id: ITEM_ID };

const REASON_BODIES: Record<string, unknown> = {
  "empty string": bodyWithReason(""),
  "spaces only": bodyWithReason("   "),
  "one character": bodyWithReason("x"),
  "1000 characters surrounded by spaces": bodyWithReason(
    ` ${"a".repeat(REASON_LIMIT)} `
  ),
  "1001 characters": bodyWithReason("a".repeat(REASON_LIMIT + 1)),
  "500 characters outside the BMP": bodyWithReason(
    ASTRAL.repeat(ASTRAL_COUNT_AT_LIMIT)
  ),
  "501 characters outside the BMP": bodyWithReason(
    ASTRAL.repeat(ASTRAL_COUNT_AT_LIMIT + 1)
  ),
  "999 inside the BMP and one outside it": bodyWithReason(
    `${"a".repeat(REASON_LIMIT - 1)}${ASTRAL}`
  ),
};

const REASON_OUTCOMES: Record<string, string> = {
  "empty string": REFUSED,
  "spaces only": REFUSED,
  "one character": ACCEPTED,
  "1000 characters surrounded by spaces": ACCEPTED,
  "1001 characters": REFUSED,
  "500 characters outside the BMP": ACCEPTED,
  "501 characters outside the BMP": REFUSED,
  "999 inside the BMP and one outside it": REFUSED,
};

const TOP_LEVEL_BODIES: Record<string, unknown> = {
  "a reason and an empty changes list": { reason: VALID_REASON, changes: [] },
  "no reason": { changes: [] },
  "no changes field": { reason: VALID_REASON },
  "a reason that is a number": bodyWithReason(42),
  "a reason that is null": bodyWithReason(null),
  "changes that is null": { reason: VALID_REASON, changes: null },
  "changes that is one change instead of a list": {
    reason: VALID_REASON,
    changes: SET_WITH_VALUE,
  },
};

const TOP_LEVEL_OUTCOMES: Record<string, string> = {
  "a reason and an empty changes list": ACCEPTED,
  "no reason": REFUSED,
  "no changes field": REFUSED,
  "a reason that is a number": REFUSED,
  "a reason that is null": REFUSED,
  "changes that is null": REFUSED,
  "changes that is one change instead of a list": REFUSED,
};

const CHANGE_BODIES: Record<string, unknown> = {
  "set stating attribute key, kind and value": bodyWithChange(SET_WITH_VALUE),
  "remove stating attribute key, kind and item": bodyWithChange(REMOVE_WITH_ITEM),
  "set stating every field": bodyWithChange({
    ...SET_WITH_VALUE,
    item_id: ITEM_ID,
    valid_from: "2024-01-05",
    valid_to: "2024-12-31",
  }),
  "no attribute key": bodyWithChange({ kind: "set", value: "ativo" }),
  "attribute key that is null": bodyWithChange({
    ...SET_WITH_VALUE,
    attribute_key: null,
  }),
  "attribute key that is a number": bodyWithChange({
    ...SET_WITH_VALUE,
    attribute_key: 7,
  }),
  "no kind": bodyWithChange({ attribute_key: KEY, value: "ativo" }),
  "value that is a boolean": bodyWithChange({ ...SET_WITH_VALUE, value: true }),
  "value that is a number": bodyWithChange({ ...SET_WITH_VALUE, value: 42 }),
  "item that is a number": bodyWithChange({ ...SET_WITH_VALUE, item_id: 42 }),
  "item that is not an identifier": bodyWithChange({
    ...SET_WITH_VALUE,
    item_id: "not-an-identifier",
  }),
  "validity start not written YYYY-MM-DD": bodyWithChange({
    ...SET_WITH_VALUE,
    valid_from: "05/01/2024",
  }),
  "validity start that is a number": bodyWithChange({
    ...SET_WITH_VALUE,
    valid_from: 20240105,
  }),
  "validity end not written YYYY-MM-DD": bodyWithChange({
    ...SET_WITH_VALUE,
    valid_to: "2024-1-5",
  }),
  "validity end that is a number": bodyWithChange({
    ...SET_WITH_VALUE,
    valid_to: 20241231,
  }),
};

const CHANGE_OUTCOMES: Record<string, string> = {
  "set stating attribute key, kind and value": ACCEPTED,
  "remove stating attribute key, kind and item": ACCEPTED,
  "set stating every field": ACCEPTED,
  "no attribute key": REFUSED,
  "attribute key that is null": REFUSED,
  "attribute key that is a number": REFUSED,
  "no kind": REFUSED,
  "value that is a boolean": REFUSED,
  "value that is a number": REFUSED,
  "item that is a number": REFUSED,
  "item that is not an identifier": REFUSED,
  "validity start not written YYYY-MM-DD": REFUSED,
  "validity start that is a number": REFUSED,
  "validity end not written YYYY-MM-DD": REFUSED,
  "validity end that is a number": REFUSED,
};

const KIND_BODIES: Record<string, unknown> = {
  set: bodyWithChange(SET_WITH_VALUE),
  remove: bodyWithChange(REMOVE_WITH_ITEM),
  add: bodyWithChange({ ...SET_WITH_VALUE, kind: "add", item_id: ITEM_ID }),
  "SET in capitals": bodyWithChange({ ...SET_WITH_VALUE, kind: "SET" }),
  "empty string": bodyWithChange({ ...SET_WITH_VALUE, kind: "" }),
  null: bodyWithChange({ ...SET_WITH_VALUE, kind: null }),
  "a number": bodyWithChange({ ...SET_WITH_VALUE, kind: 1 }),
};

const KIND_OUTCOMES: Record<string, string> = {
  set: ACCEPTED,
  remove: ACCEPTED,
  add: REFUSED,
  "SET in capitals": REFUSED,
  "empty string": REFUSED,
  null: REFUSED,
  "a number": REFUSED,
};

const VALUE_KIND_BODIES: Record<string, unknown> = {
  "set stating a value": bodyWithChange(SET_WITH_VALUE),
  "set stating no value": bodyWithChange({ attribute_key: KEY, kind: "set" }),
  "set whose value is null": bodyWithChange({
    attribute_key: KEY,
    kind: "set",
    value: null,
  }),
  "remove stating a value": bodyWithChange({ ...REMOVE_WITH_ITEM, value: "ativo" }),
  "remove stating no value": bodyWithChange(REMOVE_WITH_ITEM),
};

const VALUE_KIND_OUTCOMES: Record<string, string> = {
  "set stating a value": ACCEPTED,
  "set stating no value": REFUSED,
  "set whose value is null": REFUSED,
  "remove stating a value": REFUSED,
  "remove stating no value": ACCEPTED,
};

const REMOVAL_BODIES: Record<string, unknown> = {
  "remove naming an attribute": bodyWithChange(REMOVE_WITH_ITEM),
  "remove naming no attribute": bodyWithChange({
    attribute_key: KEY,
    kind: "remove",
  }),
  "remove whose item is null": bodyWithChange({
    attribute_key: KEY,
    kind: "remove",
    item_id: null,
  }),
  "set naming no attribute": bodyWithChange(SET_WITH_VALUE),
};

const REMOVAL_OUTCOMES: Record<string, string> = {
  "remove naming an attribute": ACCEPTED,
  "remove naming no attribute": REFUSED,
  "remove whose item is null": REFUSED,
  "set naming no attribute": ACCEPTED,
};

const NULLABLE_FIELDS: ReadonlyArray<{
  label: string;
  base: Record<string, unknown>;
  field: string;
}> = [
  { label: "value of a set", base: { attribute_key: KEY, kind: "set" }, field: "value" },
  { label: "value of a remove", base: REMOVE_WITH_ITEM, field: "value" },
  { label: "item of a set", base: SET_WITH_VALUE, field: "item_id" },
  {
    label: "item of a remove",
    base: { attribute_key: KEY, kind: "remove" },
    field: "item_id",
  },
  { label: "validity start", base: SET_WITH_VALUE, field: "valid_from" },
  { label: "validity end", base: SET_WITH_VALUE, field: "valid_to" },
];

describe("EditEntityBodySchema", () => {
  it("holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT", () => {
    const bodies = REASON_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(REASON_OUTCOMES);
  });

  it("requires a reason and a changes list and neither coerces nor accepts null for them", () => {
    const bodies = TOP_LEVEL_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(TOP_LEVEL_OUTCOMES);
  });

  it("requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional", () => {
    const bodies = CHANGE_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(CHANGE_OUTCOMES);
  });

  it("accepts exactly the change kinds set and remove", () => {
    const bodies = KIND_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(KIND_OUTCOMES);
  });

  it("requires a change to state a value exactly when its kind is set", () => {
    const bodies = VALUE_KIND_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(VALUE_KIND_OUTCOMES);
  });

  it("requires a remove change to name an attribute and asks no such thing of a set change", () => {
    const bodies = REMOVAL_BODIES;

    const outcomes = outcomesOf(bodies);

    expect(outcomes).toEqual(REMOVAL_OUTCOMES);
  });

  it("reads a null value, item, validity start or validity end exactly as the same field left out", () => {
    const omitted: Record<string, unknown> = {};
    const nulled: Record<string, unknown> = {};

    for (const { label, base, field } of NULLABLE_FIELDS) {
      omitted[label] = nullableProjection(base);
      nulled[label] = nullableProjection({ ...base, [field]: null });
    }

    expect(nulled).toEqual(omitted);
  });

  it("refuses with the message \"Request payload failed validation.\"", () => {
    const body = bodyWithReason("   ");

    const result = EditEntityBodySchema.safeParse(body);
    const message = result.success
      ? ACCEPTED
      : mapZodError(result.error).envelope.error.message;

    expect(message).toBe(REFUSAL_MESSAGE);
  });

  it("carries each issue's path joined by a dot, for a refinement issue and a field issue alike", () => {
    const refinementIssue = {
      reason: VALID_REASON,
      changes: [SET_WITH_VALUE, { attribute_key: KEY, kind: "set" }],
    };
    const fieldIssue = bodyWithChange({ ...SET_WITH_VALUE, valid_from: "05/01/2024" });

    const paths = {
      refinementIssue: issuePaths(refinementIssue),
      fieldIssue: issuePaths(fieldIssue),
    };

    expect(paths).toEqual({
      refinementIssue: ["changes.1.value"],
      fieldIssue: ["changes.0.valid_from"],
    });
  });
});
