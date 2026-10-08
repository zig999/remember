import { describe, expect, it } from "vitest";

import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import {
  ABSENT_NODE_ID,
  ACCEPTED,
  DEADLINE_HELD_ID,
  DEADLINE_SUPERSEDED_ID,
  HELD_STAKEHOLDER,
  NEEDS_REVIEW_NODE_ID,
  NEW_DEADLINE,
  PHASE_SUPERSEDED_ID,
  PHASE_VALUE,
  STORE_UNAVAILABLE_CODE,
  buildWorld,
  editOf,
  mixedEdit,
  setChange,
  settledCode,
} from "./edit-entity-world.js";

const NO_CHANGES = "BUSINESS_ENTITY_EDIT_NO_CHANGES";
const CONFLICT = "BUSINESS_ENTITY_EDIT_CONFLICT";
const UNKNOWN_KEY = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";
const INVALID_VALUE = "BUSINESS_INVALID_ATTRIBUTE_VALUE";
const INCOHERENT = "BUSINESS_TEMPORAL_INCOHERENT";
const NOT_FOUND = "RESOURCE_NOT_FOUND";
const NOT_ACTIVE = "BUSINESS_NODE_NOT_ACTIVE";
const UNIQUE_VIOLATION = "23505";

const UNCATALOGUED_KEY = "nonexistent";
const OUTSIDE_THE_DOMAIN = "inexistente";
const ANY_VALUE = "x";
const INCOHERENT_VALIDITY = { valid_from: "2026-09-01", valid_to: "2026-08-01" };

interface PrecedenceCase {
  readonly nodeId?: string;
  readonly changes: readonly AttributeChange[];
  readonly expected: string;
}

const UNCHANGED = setChange("stakeholder", HELD_STAKEHOLDER);
const FIRST_VALUE = setChange("phase", PHASE_VALUE);
const INCOHERENT_DEADLINE = setChange("deadline", NEW_DEADLINE, INCOHERENT_VALIDITY);
const UNKNOWN_KEY_CHANGE = setChange(UNCATALOGUED_KEY, ANY_VALUE);

const CHANGES_SOMETHING_EDITS: Readonly<Record<string, readonly AttributeChange[]>> = {
  allUnchanged: [UNCHANGED],
  emptyList: [],
  unchangedAndFirstValue: [UNCHANGED, FIRST_VALUE],
};

const PRECEDENCE_CASES: ReadonlyArray<readonly [string, PrecedenceCase]> = [
  [
    "an unknown key and a validity start after its end",
    {
      changes: [setChange(UNCATALOGUED_KEY, ANY_VALUE, INCOHERENT_VALIDITY)],
      expected: UNKNOWN_KEY,
    },
  ],
  [
    "an unknown key and a superseded attribute",
    {
      changes: [
        setChange(UNCATALOGUED_KEY, ANY_VALUE, { item_id: DEADLINE_SUPERSEDED_ID }),
      ],
      expected: UNKNOWN_KEY,
    },
  ],
  [
    "a value that does not read as its type and a validity start after its end",
    {
      changes: [setChange("deadline", "not-a-date", INCOHERENT_VALIDITY)],
      expected: INVALID_VALUE,
    },
  ],
  [
    "a value outside the allowed values and a superseded attribute",
    {
      changes: [
        setChange("phase", OUTSIDE_THE_DOMAIN, { item_id: PHASE_SUPERSEDED_ID }),
      ],
      expected: INVALID_VALUE,
    },
  ],
  [
    "a value outside the allowed values and a validity stated on a stable key",
    {
      changes: [
        setChange("phase", OUTSIDE_THE_DOMAIN, { valid_from: "2026-09-01" }),
      ],
      expected: INVALID_VALUE,
    },
  ],
  [
    "a validity start after its end and a superseded attribute",
    {
      changes: [
        setChange("deadline", NEW_DEADLINE, {
          ...INCOHERENT_VALIDITY,
          item_id: DEADLINE_SUPERSEDED_ID,
        }),
      ],
      expected: INCOHERENT,
    },
  ],
  [
    "an unheld node and a validity start after its end",
    {
      nodeId: ABSENT_NODE_ID,
      changes: [INCOHERENT_DEADLINE],
      expected: NOT_FOUND,
    },
  ],
  [
    "a node in needs_review and an unknown key",
    {
      nodeId: NEEDS_REVIEW_NODE_ID,
      changes: [UNKNOWN_KEY_CHANGE],
      expected: NOT_ACTIVE,
    },
  ],
  [
    "an unknown key in the first change and a validity start after its end in the second",
    { changes: [UNKNOWN_KEY_CHANGE, INCOHERENT_DEADLINE], expected: UNKNOWN_KEY },
  ],
  [
    "a validity start after its end in the first change and an unknown key in the second",
    { changes: [INCOHERENT_DEADLINE, UNKNOWN_KEY_CHANGE], expected: INCOHERENT },
  ],
];

async function outcomesOf(
  edits: Readonly<Record<string, readonly AttributeChange[]>>
): Promise<Record<string, string>> {
  const outcomes: Record<string, string> = {};
  for (const [label, changes] of Object.entries(edits)) {
    outcomes[label] = await settledCode(buildWorld(), editOf(changes));
  }
  return outcomes;
}

describe("an entity edit that changes nothing", () => {
  it("is refused exactly when no change has an effect other than unchanged, whether every change is unchanged or the list is empty", async () => {
    const outcomes = await outcomesOf(CHANGES_SOMETHING_EDITS);

    expect(outcomes).toEqual({
      allUnchanged: NO_CHANGES,
      emptyList: NO_CHANGES,
      unchangedAndFirstValue: ACCEPTED,
    });
  });

  it("records nothing when every one of its changes is unchanged", async () => {
    const world = buildWorld();

    const code = await settledCode(world, editOf([UNCHANGED]));

    expect({ code, store: world.store }).toEqual({
      code: NO_CHANGES,
      store: world.untouched,
    });
  });

  it("is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes", async () => {
    const world = buildWorld();

    const code = await settledCode(world, editOf([]));

    expect({ code, store: world.store }).toEqual({
      code: NO_CHANGES,
      store: world.untouched,
    });
  });
});

describe("an entity edit refused after an earlier change would have been recorded", () => {
  it("leaves no attribute, raw information, LLM run or curation action of the earlier change", async () => {
    const world = buildWorld();

    const code = await settledCode(world, editOf([FIRST_VALUE, UNKNOWN_KEY_CHANGE]));

    expect({ code, store: world.store }).toEqual({
      code: UNKNOWN_KEY,
      store: world.untouched,
    });
  });
});

describe("an entity edit whose set change names a superseded deadline attribute", () => {
  it("is refused as a conflict and records nothing of the edit", async () => {
    const world = buildWorld();
    const change = setChange("deadline", NEW_DEADLINE, {
      item_id: DEADLINE_SUPERSEDED_ID,
    });

    const code = await settledCode(world, editOf([change]));

    expect({ code, store: world.store }).toEqual({
      code: CONFLICT,
      store: world.untouched,
    });
  });
});

describe("a change naming an attribute that another operation superseded while the edit waited for its lock", () => {
  it("is refused as a conflict", async () => {
    const world = buildWorld({ supersedeWhileWaiting: DEADLINE_HELD_ID });
    const change = setChange("deadline", NEW_DEADLINE, {
      item_id: DEADLINE_HELD_ID,
    });

    const code = await settledCode(world, editOf([change]));

    expect(code).toBe(CONFLICT);
  });
});

describe("a write that a uniqueness guard of the store refuses", () => {
  it("is answered as a temporal incoherence", async () => {
    const world = buildWorld({
      failInsert: { table: "node_attribute", code: UNIQUE_VIOLATION },
    });

    const code = await settledCode(world, editOf([FIRST_VALUE]));

    expect(code).toBe(INCOHERENT);
  });
});

describe("an entity edit whose last write fails after every other record was written", () => {
  it("leaves no raw information, chunk, fragment, run, attribute, provenance or action, and restores every superseded attribute", async () => {
    const world = buildWorld({ failInsert: { table: "curation_action" } });

    const code = await settledCode(world, mixedEdit());

    expect({ code, store: world.store }).toEqual({
      code: STORE_UNAVAILABLE_CODE,
      store: world.untouched,
    });
  });
});

describe("an entity edit failing more than one check", () => {
  it.each(PRECEDENCE_CASES)(
    "failing %s is refused by the check that comes first",
    async (_label, scenario) => {
      const world = buildWorld();

      const code = await settledCode(
        world,
        editOf(scenario.changes),
        scenario.nodeId
      );

      expect(code).toBe(scenario.expected);
    }
  );
});
