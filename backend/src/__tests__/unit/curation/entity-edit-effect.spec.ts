import { expect, it } from "vitest";

import {
  AttributeChangeKindSchema,
  EditEffectSchema,
  type AttributeChange,
} from "../../../modules/curation/dto/edit-entity.dto.js";
import { AssertionStatusSchema } from "../../../modules/curation/dto/enums.dto.js";
import type { ItemLockedRow } from "../../../modules/curation/repository/curation.repository.js";
import { LIVE_STATUSES } from "../../../modules/curation/service/entity-edit-attributes.js";
import { decideChangeEffect } from "../../../modules/curation/service/entity-edit-effect.js";
import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";

const OWN_VALUE = "Acme Ltda";
const OTHER_VALUE = "Beta SA";
const OWN_VALUE_OTHER_CASE = "ACME LTDA";
const ENDED_AT = "2026-06-30";
const OTHER_VALID_FROM = "2027-01-01";
const SUPERSEDED_AT = new Date("2026-10-05T10:00:00.000Z");

const NAMED_ID = "99999999-0000-4000-8000-000000000001";
const SIBLING_ID = "99999999-0000-4000-8000-000000000002";
const THIRD_ID = "99999999-0000-4000-8000-000000000003";

const NODE_TYPE_ID = "99999999-0000-4000-8000-0000000000f1";

const TEMPORAL_KEY: AttributeKeyRow = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  node_type_id: NODE_TYPE_ID,
  key: "deadline",
  value_type: "text",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
};

const TEMPORAL_MULTI_KEY: AttributeKeyRow = {
  ...TEMPORAL_KEY,
  id: "aaaaaaaa-0000-4000-8000-000000000002",
  key: "stakeholder",
  allows_multiple_current: true,
};

const STABLE_KEY: AttributeKeyRow = {
  ...TEMPORAL_KEY,
  id: "aaaaaaaa-0000-4000-8000-000000000003",
  key: "cnpj",
  is_temporal: false,
  requires_valid_from: false,
};

const MULTI_KEY: AttributeKeyRow = {
  ...STABLE_KEY,
  id: "aaaaaaaa-0000-4000-8000-000000000004",
  key: "email",
  allows_multiple_current: true,
};

function held(overrides: Partial<ItemLockedRow>): ItemLockedRow {
  return {
    id: NAMED_ID,
    value: OWN_VALUE,
    valid_from: null,
    valid_to: null,
    status: "active",
    confidence: "0.9000",
    valid_from_source: null,
    superseded_at: null,
    ...overrides,
  };
}

function setChange(overrides: Partial<AttributeChange>): AttributeChange {
  return {
    attribute_key: "any",
    kind: "set",
    value: OTHER_VALUE,
    item_id: undefined,
    valid_from: undefined,
    valid_to: undefined,
    ...overrides,
  };
}

it("gives first-value to a set change naming no attribute when the key holds no attribute", () => {
  const change = setChange({ value: OWN_VALUE });

  const effect = decideChangeEffect(STABLE_KEY, change, []);

  expect(effect).toBe("first-value");
});

it("gives first-value to a set change naming no attribute when the key holds only superseded and deleted attributes", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [
    held({ id: NAMED_ID, status: "superseded", superseded_at: SUPERSEDED_AT }),
    held({ id: SIBLING_ID, status: "deleted", superseded_at: SUPERSEDED_AT }),
  ];

  const effect = decideChangeEffect(STABLE_KEY, change, attributes);

  expect(effect).toBe("first-value");
});

it("gives addition to a set change naming no attribute whose value no live attribute holds, on a multi-current key holding a live attribute", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [held({ id: SIBLING_ID, value: OTHER_VALUE })];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("addition");
});

it("gives addition when the only holder of the stated value is a deleted attribute and another attribute is live", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [
    held({ id: SIBLING_ID, value: OTHER_VALUE }),
    held({ id: THIRD_ID, status: "deleted", superseded_at: SUPERSEDED_AT }),
  ];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("addition");
});

it("gives addition when only a disputed attribute of a multi-current key holds the stated value", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [held({ id: SIBLING_ID, status: "disputed" })];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("addition");
});

it("gives unchanged when an active attribute of a multi-current key holds the stated value and no attribute is named", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [held({ id: SIBLING_ID, status: "active" })];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("unchanged");
});

it("gives unchanged when an uncertain attribute of a multi-current key holds the stated value and no attribute is named", () => {
  const change = setChange({ value: OWN_VALUE });
  const attributes = [held({ id: SIBLING_ID, status: "uncertain" })];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("unchanged");
});

it("gives succession to a set change naming a current attribute of a temporal key with another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [held({ id: NAMED_ID })];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("succession");
});

it("gives succession to a set change naming a current attribute of a temporal key that allows multiple current values with another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [held({ id: NAMED_ID }), held({ id: SIBLING_ID })];

  const effect = decideChangeEffect(TEMPORAL_MULTI_KEY, change, attributes);

  expect(effect).toBe("succession");
});

it("gives correction to a set change naming a current attribute of a key that is not temporal with another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [held({ id: NAMED_ID })];

  const effect = decideChangeEffect(STABLE_KEY, change, attributes);

  expect(effect).toBe("correction");
});

it("gives correction to a set change naming an active attribute of a temporal key with a validity end and no supersession time and another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [held({ id: NAMED_ID, valid_to: ENDED_AT })];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("correction");
});

it("gives correction to a set change naming an uncertain attribute of a temporal key with a validity end and no supersession time and another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [
    held({ id: NAMED_ID, status: "uncertain", valid_to: ENDED_AT }),
  ];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("correction");
});

it("gives correction to a set change naming an active attribute of a key that is not temporal with a validity end and no supersession time and another value", () => {
  const change = setChange({ item_id: NAMED_ID, value: OTHER_VALUE });
  const attributes = [held({ id: NAMED_ID, valid_to: ENDED_AT })];

  const effect = decideChangeEffect(STABLE_KEY, change, attributes);

  expect(effect).toBe("correction");
});

it("gives unchanged to a set change whose value is character for character the value of the attribute it names", () => {
  const change = setChange({ item_id: NAMED_ID, value: OWN_VALUE });
  const attributes = [held({ id: NAMED_ID, value: OWN_VALUE })];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("unchanged");
});

it("gives unchanged to a set change stating the own value of a named attribute that has a validity end", () => {
  const change = setChange({ item_id: NAMED_ID, value: OWN_VALUE });
  const attributes = [held({ id: NAMED_ID, valid_to: ENDED_AT })];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("unchanged");
});

it("gives correction when the value differs from the named attribute's own only in letter case on a key that is not temporal", () => {
  const change = setChange({ item_id: NAMED_ID, value: OWN_VALUE_OTHER_CASE });
  const attributes = [held({ id: NAMED_ID, value: OWN_VALUE })];

  const effect = decideChangeEffect(STABLE_KEY, change, attributes);

  expect(effect).toBe("correction");
});

it("gives unchanged to a set change naming an attribute with its own value and another validity start", () => {
  const change = setChange({
    item_id: NAMED_ID,
    value: OWN_VALUE,
    valid_from: OTHER_VALID_FROM,
  });
  const attributes = [held({ id: NAMED_ID, value: OWN_VALUE })];

  const effect = decideChangeEffect(TEMPORAL_KEY, change, attributes);

  expect(effect).toBe("unchanged");
});

it("gives removal to a remove change naming one of several live attributes of the key", () => {
  const change: AttributeChange = {
    attribute_key: "email",
    kind: "remove",
    value: undefined,
    item_id: NAMED_ID,
    valid_from: undefined,
    valid_to: undefined,
  };
  const attributes = [held({ id: NAMED_ID }), held({ id: SIBLING_ID })];

  const effect = decideChangeEffect(MULTI_KEY, change, attributes);

  expect(effect).toBe("removal");
});

it("holds exactly the six edit effects", () => {
  const expected = [
    "addition",
    "correction",
    "first-value",
    "removal",
    "succession",
    "unchanged",
  ];

  const actual = [...EditEffectSchema.options].sort();

  expect(actual).toEqual(expected);
});

it("holds exactly the five assertion statuses", () => {
  const expected = [
    "active",
    "deleted",
    "disputed",
    "superseded",
    "uncertain",
  ];

  const actual = [...AssertionStatusSchema.options].sort();

  expect(actual).toEqual(expected);
});

it("holds exactly active, uncertain and disputed as the live statuses", () => {
  const expected = ["active", "disputed", "uncertain"];

  const actual = [...LIVE_STATUSES].sort();

  expect(actual).toEqual(expected);
});

it("holds exactly set and remove as the change kinds", () => {
  const expected = ["remove", "set"];

  const actual = [...AttributeChangeKindSchema.options].sort();

  expect(actual).toEqual(expected);
});
