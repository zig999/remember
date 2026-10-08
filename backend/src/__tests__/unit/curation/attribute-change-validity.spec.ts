import { afterEach, describe, expect, it, vi } from "vitest";

import type { AttributeKeyRow } from "../../../modules/ingestion/catalog/catalog.js";
import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import { mapErrorToHttpResponse } from "../../../modules/curation/mcp/error-envelope.js";
import { checkChangeValidity } from "../../../modules/curation/service/attribute-change-validity.js";
import { BusinessError } from "../../../modules/curation/service/errors.js";

const ACCEPTED = "accepted";
const UNEXPECTED = "unexpected";
const INCOHERENT = "BUSINESS_TEMPORAL_INCOHERENT";
const HTTP_UNPROCESSABLE = 422;
const KEY_NAME = "born";
const ITEM_ID = "00000000-0000-4000-8000-000000000001";
const EDITED_AT = new Date("2026-06-15T12:00:00.000Z");
const UTC_TODAY = "2026-06-15";
const UTC_YESTERDAY = "2026-06-14";
const UTC_TOMORROW = "2026-06-16";
const FIRST_MOMENT_OF_UTC_DAY = new Date("2026-06-15T00:00:00.000Z");
const LAST_MOMENT_OF_UTC_PREVIOUS_DAY = new Date("2026-06-14T23:59:59.000Z");
const ZONE_BEHIND_UTC = "America/Sao_Paulo";
const ZONE_AHEAD_OF_UTC = "Pacific/Kiritimati";

interface Validity {
  readonly valid_from?: string;
  readonly valid_to?: string;
}

function isAttributeKeyRow(candidate: object): candidate is AttributeKeyRow {
  return "key" in candidate && typeof candidate.key === "string";
}

function keyWithTemporality(isTemporal: boolean | null): AttributeKeyRow {
  const row: object = {
    id: "key-born",
    node_type_id: "node-type-person",
    key: KEY_NAME,
    value_type: "date",
    is_temporal: isTemporal,
    allows_multiple_current: false,
    requires_valid_from: false,
  };
  if (!isAttributeKeyRow(row)) {
    throw new Error("the fixture is not an attribute key row");
  }
  return row;
}

const TEMPORAL_KEY = keyWithTemporality(true);
const NOT_TEMPORAL_KEY = keyWithTemporality(false);
const UNRECORDED_TEMPORALITY_KEY = keyWithTemporality(null);

function setChange(validity: Validity): AttributeChange {
  return {
    attribute_key: KEY_NAME,
    kind: "set",
    value: "2000-01-01",
    item_id: undefined,
    valid_from: validity.valid_from,
    valid_to: validity.valid_to,
  };
}

function removeChange(validity: Validity): AttributeChange {
  return {
    attribute_key: KEY_NAME,
    kind: "remove",
    value: undefined,
    item_id: ITEM_ID,
    valid_from: validity.valid_from,
    valid_to: validity.valid_to,
  };
}

function refusalOf(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  editedAt: Date = EDITED_AT
): unknown {
  try {
    checkChangeValidity(attributeKey, change, editedAt);
  } catch (err) {
    return err;
  }
  return undefined;
}

function outcomeOf(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  editedAt: Date = EDITED_AT
): string {
  const refusal = refusalOf(attributeKey, change, editedAt);
  if (refusal === undefined) {
    return ACCEPTED;
  }
  return refusal instanceof BusinessError ? refusal.code : UNEXPECTED;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const STABLE_KEY_STATING_VALIDITY = [
  {
    label: "a validity start on a set change",
    change: setChange({ valid_from: "2026-03-01" }),
  },
  {
    label: "a validity end on a set change",
    change: setChange({ valid_to: "2026-09-01" }),
  },
  {
    label: "a validity start before a validity end on a set change",
    change: setChange({ valid_from: "2026-03-01", valid_to: "2026-09-01" }),
  },
  {
    label: "a validity start on a remove change",
    change: removeChange({ valid_from: "2026-03-01" }),
  },
  {
    label: "a validity end on a remove change",
    change: removeChange({ valid_to: "2026-09-01" }),
  },
];

describe("a change to a key that is not temporal", () => {
  it.each(STABLE_KEY_STATING_VALIDITY)(
    "is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label",
    ({ change }) => {
      const attributeKey = NOT_TEMPORAL_KEY;

      const outcome = outcomeOf(attributeKey, change);

      expect(outcome).toBe(INCOHERENT);
    }
  );
});

describe("a change to a key that records no temporality", () => {
  it.each([
    {
      label: "a validity start",
      change: setChange({ valid_from: "2026-03-01" }),
    },
    {
      label: "a validity end",
      change: setChange({ valid_to: "2026-09-01" }),
    },
  ])(
    "is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label",
    ({ change }) => {
      const attributeKey = UNRECORDED_TEMPORALITY_KEY;

      const outcome = outcomeOf(attributeKey, change);

      expect(outcome).toBe(INCOHERENT);
    }
  );
});

describe("a change that states no validity to a key that accepts none", () => {
  it.each([
    { label: "is not temporal", attributeKey: NOT_TEMPORAL_KEY },
    {
      label: "records no temporality",
      attributeKey: UNRECORDED_TEMPORALITY_KEY,
    },
  ])(
    "is not refused when the key $label",
    ({ attributeKey }) => {
      const change = setChange({});

      const outcome = outcomeOf(attributeKey, change);

      expect(outcome).toBe(ACCEPTED);
    }
  );
});

describe("a change that states both a validity start and a validity end", () => {
  it.each([
    {
      label: "equal to its end",
      change: setChange({ valid_from: "2026-09-10", valid_to: "2026-09-10" }),
    },
    {
      label: "one day later than its end",
      change: setChange({ valid_from: "2026-09-11", valid_to: "2026-09-10" }),
    },
    {
      label: "equal to its end on a remove change",
      change: removeChange({
        valid_from: "2026-09-10",
        valid_to: "2026-09-10",
      }),
    },
  ])(
    "is refused with BUSINESS_TEMPORAL_INCOHERENT when its start is $label",
    ({ change }) => {
      const attributeKey = TEMPORAL_KEY;

      const outcome = outcomeOf(attributeKey, change);

      expect(outcome).toBe(INCOHERENT);
    }
  );

  it("is not refused when its start is one day earlier than its end", () => {
    const attributeKey = TEMPORAL_KEY;
    const change = setChange({
      valid_from: "2026-09-09",
      valid_to: "2026-09-10",
    });

    const outcome = outcomeOf(attributeKey, change);

    expect(outcome).toBe(ACCEPTED);
  });

  it("is not held to the defaulted-start rule when its end is not after today", () => {
    const attributeKey = TEMPORAL_KEY;
    const change = setChange({
      valid_from: "2020-01-31",
      valid_to: "2020-02-01",
    });

    const outcome = outcomeOf(attributeKey, change);

    expect(outcome).toBe(ACCEPTED);
  });
});

describe("a set change to a temporal key that states a validity end and no validity start", () => {
  it.each([
    { label: "of today", validTo: UTC_TODAY, expected: INCOHERENT },
    { label: "earlier than today", validTo: UTC_YESTERDAY, expected: INCOHERENT },
    { label: "later than today", validTo: UTC_TOMORROW, expected: ACCEPTED },
  ])(
    "answers $expected when the end is $label",
    ({ validTo, expected }) => {
      const attributeKey = TEMPORAL_KEY;
      const change = setChange({ valid_to: validTo });

      const outcome = outcomeOf(attributeKey, change);

      expect(outcome).toBe(expected);
    }
  );

  it("takes today as the UTC calendar date when the server zone is behind UTC", () => {
    vi.stubEnv("TZ", ZONE_BEHIND_UTC);
    const attributeKey = TEMPORAL_KEY;
    const change = setChange({ valid_to: UTC_TODAY });

    const outcome = outcomeOf(attributeKey, change, FIRST_MOMENT_OF_UTC_DAY);

    expect(outcome).toBe(INCOHERENT);
  });

  it("takes today as the UTC calendar date when the server zone is ahead of UTC", () => {
    vi.stubEnv("TZ", ZONE_AHEAD_OF_UTC);
    const attributeKey = TEMPORAL_KEY;
    const change = setChange({ valid_to: UTC_TODAY });

    const outcome = outcomeOf(
      attributeKey,
      change,
      LAST_MOMENT_OF_UTC_PREVIOUS_DAY
    );

    expect(outcome).toBe(ACCEPTED);
  });

  it("is not refused when it states neither a validity start nor a validity end", () => {
    const attributeKey = TEMPORAL_KEY;
    const change = setChange({});

    const outcome = outcomeOf(attributeKey, change);

    expect(outcome).toBe(ACCEPTED);
  });
});

describe("the refusal of a change over REST", () => {
  it.each([
    {
      label: "a validity on a key that is not temporal",
      attributeKey: NOT_TEMPORAL_KEY,
      change: setChange({ valid_from: "2026-03-01" }),
    },
    {
      label: "a start that is not before its end",
      attributeKey: TEMPORAL_KEY,
      change: setChange({ valid_from: "2026-09-10", valid_to: "2026-09-10" }),
    },
    {
      label: "an end that is not after today with no start",
      attributeKey: TEMPORAL_KEY,
      change: setChange({ valid_to: UTC_TODAY }),
    },
  ])(
    "answers HTTP 422 for the refusal of $label",
    ({ attributeKey, change }) => {
      const refusal = refusalOf(attributeKey, change);

      const mapped = mapErrorToHttpResponse(refusal);

      expect(mapped.statusCode).toBe(HTTP_UNPROCESSABLE);
    }
  );
});
