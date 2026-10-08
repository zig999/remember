import { describe, expect, it } from "vitest";

import type { AttributeChange } from "../../../modules/curation/dto/edit-entity.dto.js";
import {
  ADDED_STAKEHOLDER,
  EMAIL_HELD_ID,
  EMAIL_KEY_ID,
  HELD_EMAIL,
  HELD_STAKEHOLDER,
  PHASE_VALUE,
  STAKEHOLDER_HELD_ID,
  STAKEHOLDER_KEY_ID,
  buildWorld,
  codeOf,
  editOf,
  heldAttribute,
  recordedAttributes,
  setChange,
} from "./edit-entity-world.js";
import type { Row } from "./edit-entity-world.js";

const CONFLICT = "BUSINESS_ENTITY_EDIT_CONFLICT";
const SUPERSEDED_AT = new Date("2026-09-01T10:00:00.000Z");
const ACCENTED_EMAIL = "josé@exemplo.com";
const UNACCENTED_EMAIL = "jose@exemplo.com";

interface Probe {
  readonly held: Row;
  readonly change: AttributeChange;
  readonly expected: string;
}

function emailHeld(overrides: Row = {}): Row {
  return heldAttribute({
    id: EMAIL_HELD_ID,
    attribute_key_id: EMAIL_KEY_ID,
    value: HELD_EMAIL,
    ...overrides,
  });
}

function stakeholderHeld(overrides: Row = {}): Row {
  return heldAttribute({
    id: STAKEHOLDER_HELD_ID,
    attribute_key_id: STAKEHOLDER_KEY_ID,
    value: HELD_STAKEHOLDER,
    ...overrides,
  });
}

function namingEmail(value: string): AttributeChange {
  return setChange("email", value, { item_id: EMAIL_HELD_ID });
}

function namingNothing(value: string): AttributeChange {
  return setChange("stakeholder", value);
}

const NO_LONGER_LIVE = { status: "superseded", superseded_at: SUPERSEDED_AT };

const PROBES: Readonly<Record<string, Probe>> = {
  "a named active attribute, the same value": {
    held: emailHeld(),
    change: namingEmail(HELD_EMAIL),
    expected: "unchanged/0",
  },
  "a named uncertain attribute, the same value": {
    held: emailHeld({ status: "uncertain" }),
    change: namingEmail(HELD_EMAIL),
    expected: "unchanged/0",
  },
  "a named disputed attribute, the same value": {
    held: emailHeld({ status: "disputed" }),
    change: namingEmail(HELD_EMAIL),
    expected: "unchanged/0",
  },
  "a named superseded attribute, the same value": {
    held: emailHeld(NO_LONGER_LIVE),
    change: namingEmail(HELD_EMAIL),
    expected: CONFLICT,
  },
  "a named deleted attribute, the same value": {
    held: emailHeld({ status: "deleted" }),
    change: namingEmail(HELD_EMAIL),
    expected: CONFLICT,
  },
  "a named active attribute, a value differing only in case": {
    held: emailHeld(),
    change: namingEmail(HELD_EMAIL.toUpperCase()),
    expected: "correction/1",
  },
  "a named active attribute, a value differing only in accents": {
    held: emailHeld({ value: UNACCENTED_EMAIL }),
    change: namingEmail(ACCENTED_EMAIL),
    expected: "correction/1",
  },
  "no attribute named, a multiple-current key holding the same value as active": {
    held: stakeholderHeld(),
    change: namingNothing(HELD_STAKEHOLDER),
    expected: "unchanged/0",
  },
  "no attribute named, a multiple-current key holding the same value as uncertain": {
    held: stakeholderHeld({ status: "uncertain" }),
    change: namingNothing(HELD_STAKEHOLDER),
    expected: "unchanged/0",
  },
  "no attribute named, a multiple-current key holding the same value as disputed": {
    held: stakeholderHeld({ status: "disputed" }),
    change: namingNothing(HELD_STAKEHOLDER),
    expected: "addition/1",
  },
  "no attribute named, a multiple-current key holding the same value as superseded": {
    held: stakeholderHeld(NO_LONGER_LIVE),
    change: namingNothing(HELD_STAKEHOLDER),
    expected: "first_value/1",
  },
  "no attribute named, a multiple-current key holding another value": {
    held: stakeholderHeld(),
    change: namingNothing(ADDED_STAKEHOLDER),
    expected: "addition/1",
  },
  "no attribute named, a multiple-current key holding a value differing only in case": {
    held: stakeholderHeld(),
    change: namingNothing(HELD_STAKEHOLDER.toLowerCase()),
    expected: "addition/1",
  },
};

async function outcomeOf(probe: Probe): Promise<string> {
  const world = buildWorld({ attributes: [probe.held] });
  const body = editOf([probe.change, setChange("phase", PHASE_VALUE)]);
  try {
    const answer = await world.edit(body);
    const probed = recordedAttributes(world).filter(
      (row) => row.value !== PHASE_VALUE
    );
    return `${answer.applied[0]?.effect}/${probed.length}`;
  } catch (error) {
    return codeOf(error);
  }
}

async function outcomesOfAll(): Promise<Record<string, string>> {
  const outcomes: Record<string, string> = {};
  for (const [label, probe] of Object.entries(PROBES)) {
    outcomes[label] = await outcomeOf(probe);
  }
  return outcomes;
}

describe("a set change whose value is the value the node already holds", () => {
  it("is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key", async () => {
    const outcomes = await outcomesOfAll();

    expect(outcomes).toEqual(
      Object.fromEntries(
        Object.entries(PROBES).map(([label, probe]) => [label, probe.expected])
      )
    );
  });
});
