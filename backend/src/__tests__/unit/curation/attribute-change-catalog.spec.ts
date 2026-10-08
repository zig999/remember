import { describe, expect, it } from "vitest";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type {
  AttributeKeyRow,
  NodeTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";
import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import { mapErrorToHttpResponse } from "../../../modules/curation/mcp/error-envelope.js";
import { checkChangeAgainstCatalog } from "../../../modules/curation/service/attribute-change-catalog.js";
import { BusinessError } from "../../../modules/curation/service/errors.js";

const ACCEPTED = "accepted";
const UNEXPECTED = "unexpected";
const UNKNOWN_KEY = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";
const INVALID_VALUE = "BUSINESS_INVALID_ATTRIBUTE_VALUE";
const HTTP_UNPROCESSABLE = 422;
const ITEM_ID = "00000000-0000-4000-8000-000000000001";
const HUGE_DIGITS = "9".repeat(400);
const LIFECYCLE_ALLOWED = ["active", "retired"];
const SCORE_ALLOWED = ["100", "200"];

const PERSON: NodeTypeRow = { id: "node-type-person", name: "Person" };
const DOCUMENT: NodeTypeRow = { id: "node-type-document", name: "Document" };

function attributeKey(
  id: string,
  nodeType: NodeTypeRow,
  key: string,
  valueType: AttributeKeyRow["value_type"]
): AttributeKeyRow {
  return {
    id,
    node_type_id: nodeType.id,
    key,
    value_type: valueType,
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
  };
}

function validValues(
  keyId: string,
  values: readonly string[]
): { attribute_key_id: string; value: string }[] {
  return values.map((value) => ({ attribute_key_id: keyId, value }));
}

const CATALOG = buildSnapshot({
  nodeTypes: [PERSON, DOCUMENT],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [
    attributeKey("key-born", PERSON, "born", "date"),
    attributeKey("key-height", PERSON, "height", "number"),
    attributeKey("key-deceased", PERSON, "deceased", "bool"),
    attributeKey("key-nickname", PERSON, "nickname", "text"),
    attributeKey("key-lifecycle", PERSON, "lifecycle_stage", "text"),
    attributeKey("key-score", PERSON, "score", "number"),
    attributeKey("key-published", DOCUMENT, "published_on", "date"),
  ],
  attributeValidValues: [
    ...validValues("key-lifecycle", LIFECYCLE_ALLOWED),
    ...validValues("key-score", SCORE_ALLOWED),
  ],
});

function setChange(attributeKeyName: string, value: string): AttributeChange {
  return {
    attribute_key: attributeKeyName,
    kind: "set",
    value,
    item_id: undefined,
    valid_from: undefined,
    valid_to: undefined,
  };
}

function removeChange(attributeKeyName: string): AttributeChange {
  return {
    attribute_key: attributeKeyName,
    kind: "remove",
    value: undefined,
    item_id: ITEM_ID,
    valid_from: undefined,
    valid_to: undefined,
  };
}

function refusalOf(
  change: AttributeChange,
  nodeType: NodeTypeRow = PERSON
): unknown {
  try {
    checkChangeAgainstCatalog(CATALOG, nodeType, change);
  } catch (err) {
    return err;
  }
  return undefined;
}

function outcomeOf(
  change: AttributeChange,
  nodeType: NodeTypeRow = PERSON
): string {
  const refusal = refusalOf(change, nodeType);
  if (refusal === undefined) {
    return ACCEPTED;
  }
  return refusal instanceof BusinessError ? refusal.code : UNEXPECTED;
}

function namedByRefusal(
  change: AttributeChange,
  nodeType: NodeTypeRow = PERSON
): string {
  const refusal = refusalOf(change, nodeType);
  if (!(refusal instanceof BusinessError)) {
    return "";
  }
  return `${refusal.message} ${JSON.stringify(refusal.details)}`;
}

const UNPARSABLE_CRITERION_CASES = [
  { label: "2024-02-30 for a date key", key: "born", value: "2024-02-30" },
  { label: "1e3 for a number key", key: "height", value: "1e3" },
  { label: "True for a bool key", key: "deceased", value: "True" },
];

const MALFORMED_CASES = [
  { label: "slashes for a date", key: "born", value: "2024/03/15" },
  { label: "day-month-year for a date", key: "born", value: "15-03-2024" },
  { label: "29 February of a common year", key: "born", value: "2023-02-29" },
  { label: "leading plus for a number", key: "height", value: "+5" },
  { label: "no integer part for a number", key: "height", value: ".5" },
  { label: "hexadecimal for a number", key: "height", value: "0x10" },
  { label: "Infinity for a number", key: "height", value: "Infinity" },
  { label: "digits beyond a finite number", key: "height", value: HUGE_DIGITS },
  { label: "1 for a bool", key: "deceased", value: "1" },
  { label: "yes for a bool", key: "deceased", value: "yes" },
];

const WELL_FORMED_CASES = [
  { label: "an ordinary date", key: "born", value: "2024-03-15" },
  { label: "29 February of a leap year", key: "born", value: "2024-02-29" },
  { label: "an integer", key: "height", value: "42" },
  { label: "a negative decimal", key: "height", value: "-12.5" },
  { label: "true", key: "deceased", value: "true" },
  { label: "false", key: "deceased", value: "false" },
];

const OUTSIDE_ALLOWED_CASES = [
  { label: "a value that is none of them", value: "suspended" },
  { label: "a value differing only in letter case", value: "Active" },
];

const OPEN_TEXT_CASES = [
  { label: "ordinary text", value: "Jane Doe" },
  { label: "text shaped like an impossible date", value: "2024-02-30" },
];

const STATUS_CASES = [
  {
    label: "an unknown key",
    change: setChange("favourite_colour", "blue"),
  },
  {
    label: "a value that does not read as its type",
    change: setChange("height", "1e3"),
  },
  {
    label: "a value outside the allowed values",
    change: setChange("lifecycle_stage", "suspended"),
  },
];

describe("checking a change's key against the catalog", () => {
  it("refuses a set change naming a key the catalog does not hold for the node type", () => {
    const change = setChange("favourite_colour", "blue");

    const outcome = outcomeOf(change);

    expect(outcome).toBe(UNKNOWN_KEY);
  });

  it("refuses a remove change naming a key the catalog does not hold for the node type", () => {
    const change = removeChange("favourite_colour");

    const outcome = outcomeOf(change);

    expect(outcome).toBe(UNKNOWN_KEY);
  });

  it("refuses a key the catalog holds only for another node type", () => {
    const change = setChange("published_on", "2024-03-15");

    const outcome = outcomeOf(change);

    expect(outcome).toBe(UNKNOWN_KEY);
  });

  it("refuses an unknown key before reading a value type its name would have under another node type", () => {
    const change = setChange("published_on", "2024-02-30");

    const outcome = outcomeOf(change);

    expect(outcome).toBe(UNKNOWN_KEY);
  });

  it("names the key in an unknown-key refusal", () => {
    const change = setChange("favourite_colour", "blue");

    const named = namedByRefusal(change);

    expect(named).toContain("favourite_colour");
  });

  it("names the node type in an unknown-key refusal", () => {
    const change = setChange("nickname", "Jane");

    const named = namedByRefusal(change, DOCUMENT);

    expect(named).toContain("Document");
  });
});

describe("checking a set change's value against its key's value type", () => {
  it.each(UNPARSABLE_CRITERION_CASES)(
    "refuses $label with the invalid-value code",
    ({ key, value }) => {
      const change = setChange(key, value);

      const outcome = outcomeOf(change);

      expect(outcome).toBe(INVALID_VALUE);
    }
  );

  it.each(MALFORMED_CASES)("refuses $label", ({ key, value }) => {
    const change = setChange(key, value);

    const outcome = outcomeOf(change);

    expect(outcome).toBe(INVALID_VALUE);
  });

  it.each(WELL_FORMED_CASES)("accepts $label", ({ key, value }) => {
    const change = setChange(key, value);

    const outcome = outcomeOf(change);

    expect(outcome).toBe(ACCEPTED);
  });

  it("names the value type in a refusal for a value that does not read as its type", () => {
    const change = setChange("height", "1e3");

    const named = namedByRefusal(change);

    expect(named).toContain("number");
  });

  it("names the value in a refusal for a value that does not read as its type", () => {
    const change = setChange("height", "1e3");

    const named = namedByRefusal(change);

    expect(named).toContain("1e3");
  });

  it("refuses a value that neither reads as its type nor is allowed by naming the value type", () => {
    const change = setChange("score", "abc");

    const named = namedByRefusal(change);

    expect(named).toContain("number");
  });
});

describe("checking a set change's value against its key's allowed values", () => {
  it.each(OUTSIDE_ALLOWED_CASES)(
    "refuses $label with the invalid-value code",
    ({ value }) => {
      const change = setChange("lifecycle_stage", value);

      const outcome = outcomeOf(change);

      expect(outcome).toBe(INVALID_VALUE);
    }
  );

  it("accepts a value equal to an allowed value exactly as written", () => {
    const change = setChange("lifecycle_stage", "active");

    const outcome = outcomeOf(change);

    expect(outcome).toBe(ACCEPTED);
  });

  it("names the attribute key in a refusal for a value outside the allowed values", () => {
    const change = setChange("lifecycle_stage", "suspended");

    const named = namedByRefusal(change);

    expect(named).toContain("lifecycle_stage");
  });

  it("names the value in a refusal for a value outside the allowed values", () => {
    const change = setChange("lifecycle_stage", "suspended");

    const named = namedByRefusal(change);

    expect(named).toContain("suspended");
  });

  it("names every allowed value in a refusal for a value outside the allowed values", () => {
    const change = setChange("lifecycle_stage", "suspended");

    const named = namedByRefusal(change);

    const namedAllowed = LIFECYCLE_ALLOWED.filter((allowed) =>
      named.includes(allowed)
    );
    expect(namedAllowed).toEqual(LIFECYCLE_ALLOWED);
  });

  it.each(OPEN_TEXT_CASES)(
    "does not refuse $label for a text key with no allowed values",
    ({ value }) => {
      const change = setChange("nickname", value);

      const outcome = outcomeOf(change);

      expect(outcome).toBe(ACCEPTED);
    }
  );
});

describe("rendering the catalog refusals over REST", () => {
  it.each(STATUS_CASES)(
    "renders a refusal for $label as HTTP 422",
    ({ change }) => {
      const refusal = refusalOf(change);

      const mapped = mapErrorToHttpResponse(refusal);

      expect(mapped.statusCode).toBe(HTTP_UNPROCESSABLE);
    }
  );
});
