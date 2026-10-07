import { describe, expect, it } from "vitest";

import type {
  AttributeKeyRow,
  LinkTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  consolidateAttribute,
  consolidateLink,
  type ConsolidateAttributeArgs,
  type ConsolidateAttributeResult,
  type ConsolidateLinkArgs,
  type ConsolidateLinkResult,
} from "../../../modules/ingestion/service/graph-consolidation.service.js";

import {
  buildWorld,
  type HeldRow,
  type World,
  type WorldSeed,
  type Write,
} from "./reaffirm-consolidation-world.js";

const RUN_CONTEXT = {
  llmRunId: "44444444-4444-4444-8444-444444444444",
  rawInformationId: "55555555-5555-4555-8555-555555555555",
};
const SOURCE_NODE = "11111111-1111-4111-8111-111111111111";
const TARGET_NODE_A = "22222222-2222-4222-8222-222222222222";
const TARGET_NODE_B = "33333333-3333-4333-8333-333333333333";
const PROJECT_NODE = "99999999-9999-4999-8999-999999999999";
const FRAGMENT_ONE = "66666666-6666-4666-8666-666666666661";
const FRAGMENT_TWO = "66666666-6666-4666-8666-666666666662";
const HELD_LINK_ID = "77777777-7777-4777-8777-777777777777";
const HELD_ATTRIBUTE_ID = "88888888-8888-4888-8888-888888888888";
const HELD_VALUE = "2026-06-30";
const OTHER_VALUE = "2026-07-31";
const TAG_VALUE = "alpha";
const NEUTRAL_TEXTS = ["plain statement of the current situation"];

const LEADS: LinkTypeRow = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "leads",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
  requires_valid_to_on_change: false,
};
const DEADLINE: AttributeKeyRow = {
  id: "00000000-0000-4000-8000-000000000020",
  node_type_id: "00000000-0000-4000-8000-000000000002",
  key: "deadline",
  value_type: "date",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
};
const TAGS: AttributeKeyRow = {
  id: "00000000-0000-4000-8000-000000000021",
  node_type_id: "00000000-0000-4000-8000-000000000002",
  key: "tag",
  value_type: "text",
  is_temporal: false,
  allows_multiple_current: true,
  requires_valid_from: false,
};

const HELD_LINK: HeldRow = {
  id: HELD_LINK_ID,
  source_node_id: SOURCE_NODE,
  target_node_id: TARGET_NODE_B,
  link_type_id: LEADS.id,
  valid_from: "2024-01-01",
  valid_to: null,
  superseded_at: null,
  status: "active",
};
const HELD_ATTRIBUTE: HeldRow = {
  id: HELD_ATTRIBUTE_ID,
  node_id: PROJECT_NODE,
  attribute_key_id: DEADLINE.id,
  value: HELD_VALUE,
  valid_from: "2026-01-01",
  valid_to: null,
  superseded_at: null,
  status: "active",
};

const SCENARIO_LINK: ConsolidateLinkArgs = {
  source_node_id: SOURCE_NODE,
  target_node_id: TARGET_NODE_B,
  link_type_id: LEADS.id,
  confidence: 0.9,
  valid_from: "2024-06-01",
  valid_to: null,
  valid_from_basis: "stated",
  change_hint: "none",
  fragment_ids: [FRAGMENT_ONE],
  status_for_new_row: "active",
};
const OTHER_START_LINK: ConsolidateLinkArgs = {
  ...SCENARIO_LINK,
  confidence: 0.5,
  valid_to: "2025-12-31",
  valid_from_basis: "received",
  status_for_new_row: "uncertain",
};
const SCENARIO_ATTRIBUTE: ConsolidateAttributeArgs = {
  node_id: PROJECT_NODE,
  attribute_key_id: DEADLINE.id,
  value_type: "date",
  value: HELD_VALUE,
  confidence: 0.9,
  valid_from: "2026-03-01",
  valid_to: null,
  valid_from_basis: "stated",
  change_hint: "none",
  fragment_ids: [FRAGMENT_ONE],
  status_for_new_row: "active",
};
const OTHER_START_ATTRIBUTE: ConsolidateAttributeArgs = {
  ...SCENARIO_ATTRIBUTE,
  confidence: 0.5,
  valid_to: "2026-12-31",
  valid_from_basis: "received",
  status_for_new_row: "uncertain",
};

function runLink(
  world: World,
  args: ConsolidateLinkArgs
): Promise<ConsolidateLinkResult> {
  return consolidateLink(world.client, args, LEADS, NEUTRAL_TEXTS, RUN_CONTEXT);
}

function runAttribute(
  world: World,
  args: ConsolidateAttributeArgs,
  key: AttributeKeyRow = DEADLINE
): Promise<ConsolidateAttributeResult> {
  return consolidateAttribute(
    world.client,
    args,
    key,
    NEUTRAL_TEXTS,
    RUN_CONTEXT
  );
}

function writesTo(
  world: World,
  table: Write["table"],
  kind: Write["kind"]
): Write[] {
  return world.writes.filter((w) => w.table === table && w.kind === kind);
}

function fragmentsOn(world: World, targetId: string): string[] {
  return world.provenance
    .filter((p) => p.target_id === targetId)
    .map((p) => p.fragment_id)
    .sort();
}

describe("re-affirmation of the current link by a proposal with another validity start", () => {
  it("answers a same-target proposal with change hint none and another start as consolidated on the held link", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, OTHER_START_LINK);

    expect(result).toMatchObject({
      outcome: "consolidated",
      link_id: HELD_LINK_ID,
    });
  });

  it("records no new link when the proposal re-affirms the held link with another start", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, OTHER_START_LINK);

    expect(writesTo(world, "knowledge_link", "insert")).toHaveLength(0);
  });

  it("adds the provenance of the proposal to the held link", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, OTHER_START_LINK);

    expect(fragmentsOn(world, HELD_LINK_ID)).toEqual([FRAGMENT_ONE]);
  });

  it("leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, OTHER_START_LINK);

    expect(writesTo(world, "knowledge_link", "update")).toHaveLength(0);
  });

  it("does not answer a proposal with change hint succession and the held target as a re-affirmation", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, {
      ...SCENARIO_LINK,
      change_hint: "succession",
    });

    expect(result.outcome).not.toBe("consolidated");
  });

  it("does not answer a proposal with change hint correction and the held target as a re-affirmation", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, {
      ...SCENARIO_LINK,
      change_hint: "correction",
    });

    expect(result.outcome).not.toBe("consolidated");
  });

  it("adds a second cited fragment once and the already-held one not again when the held link is re-cited", async () => {
    const world = buildWorld({
      links: [HELD_LINK],
      provenance: [{ target_id: HELD_LINK_ID, fragment_id: FRAGMENT_ONE }],
    });

    await runLink(world, {
      ...OTHER_START_LINK,
      fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
    });

    expect(fragmentsOn(world, HELD_LINK_ID)).toEqual([
      FRAGMENT_ONE,
      FRAGMENT_TWO,
    ]);
  });
});

describe("re-affirmation of the current attribute by a proposal with another validity start", () => {
  it("answers a same-value proposal with change hint none and another start as consolidated on the held attribute", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, OTHER_START_ATTRIBUTE);

    expect(result).toMatchObject({
      outcome: "consolidated",
      attribute_id: HELD_ATTRIBUTE_ID,
    });
  });

  it("records no new attribute when the proposal re-affirms the held attribute with another start", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, OTHER_START_ATTRIBUTE);

    expect(writesTo(world, "node_attribute", "insert")).toHaveLength(0);
  });

  it("adds the provenance of the proposal to the held attribute", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, OTHER_START_ATTRIBUTE);

    expect(fragmentsOn(world, HELD_ATTRIBUTE_ID)).toEqual([FRAGMENT_ONE]);
  });

  it("leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, OTHER_START_ATTRIBUTE);

    expect(writesTo(world, "node_attribute", "update")).toHaveLength(0);
  });

  it("answers a same-value proposal with another start as consolidated on an attribute key that allows multiple current values", async () => {
    const world = buildWorld({
      attributes: [
        { ...HELD_ATTRIBUTE, attribute_key_id: TAGS.id, value: TAG_VALUE },
      ],
    });

    const result = await runAttribute(
      world,
      {
        ...OTHER_START_ATTRIBUTE,
        attribute_key_id: TAGS.id,
        value_type: "text",
        value: TAG_VALUE,
      },
      TAGS
    );

    expect(result).toMatchObject({
      outcome: "consolidated",
      attribute_id: HELD_ATTRIBUTE_ID,
    });
  });

  it("does not answer a proposal with change hint none and another value as a re-affirmation", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, {
      ...SCENARIO_ATTRIBUTE,
      value: OTHER_VALUE,
    });

    expect(result.outcome).not.toBe("consolidated");
  });

  it("does not answer a proposal with change hint succession and the held value as a re-affirmation", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, {
      ...SCENARIO_ATTRIBUTE,
      change_hint: "succession",
    });

    expect(result.outcome).not.toBe("consolidated");
  });

  it("does not answer a proposal with change hint correction and the held value as a re-affirmation", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, {
      ...SCENARIO_ATTRIBUTE,
      change_hint: "correction",
    });

    expect(result.outcome).not.toBe("consolidated");
  });

  it("adds a second cited fragment once and the already-held one not again when the held attribute is re-cited", async () => {
    const world = buildWorld({
      attributes: [HELD_ATTRIBUTE],
      provenance: [{ target_id: HELD_ATTRIBUTE_ID, fragment_id: FRAGMENT_ONE }],
    });

    await runAttribute(world, {
      ...OTHER_START_ATTRIBUTE,
      fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
    });

    expect(fragmentsOn(world, HELD_ATTRIBUTE_ID)).toEqual([
      FRAGMENT_ONE,
      FRAGMENT_TWO,
    ]);
  });
});

describe("scenarios of re-affirmation with another validity start", () => {
  it("re-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, SCENARIO_LINK);

    expect(result).toMatchObject({
      outcome: "consolidated",
      link_id: HELD_LINK_ID,
    });
    expect(fragmentsOn(world, HELD_LINK_ID)).toEqual([FRAGMENT_ONE]);
    expect(writesTo(world, "knowledge_link", "insert")).toHaveLength(0);
    expect(writesTo(world, "knowledge_link", "update")).toHaveLength(0);
  });

  it("re-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, SCENARIO_ATTRIBUTE);

    expect(result).toMatchObject({
      outcome: "consolidated",
      attribute_id: HELD_ATTRIBUTE_ID,
    });
    expect(fragmentsOn(world, HELD_ATTRIBUTE_ID)).toEqual([FRAGMENT_ONE]);
    expect(writesTo(world, "node_attribute", "insert")).toHaveLength(0);
    expect(writesTo(world, "node_attribute", "update")).toHaveLength(0);
  });
});

interface Landing {
  readonly name: string;
  readonly seed: WorldSeed;
  readonly run: (world: World) => Promise<string>;
}

const CITING_TWO_LINK: ConsolidateLinkArgs = {
  ...SCENARIO_LINK,
  fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
};
const CITING_TWO_ATTRIBUTE: ConsolidateAttributeArgs = {
  ...SCENARIO_ATTRIBUTE,
  fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
};

function linkLanding(
  name: string,
  seed: WorldSeed,
  overrides: Partial<ConsolidateLinkArgs>
): Landing {
  return {
    name,
    seed,
    run: async (world) =>
      (await runLink(world, { ...CITING_TWO_LINK, ...overrides })).link_id,
  };
}

function attributeLanding(
  name: string,
  seed: WorldSeed,
  overrides: Partial<ConsolidateAttributeArgs>
): Landing {
  return {
    name,
    seed,
    run: async (world) =>
      (await runAttribute(world, { ...CITING_TWO_ATTRIBUTE, ...overrides }))
        .attribute_id,
  };
}

const HOLDING_LINK: WorldSeed = { links: [HELD_LINK] };
const HOLDING_ATTRIBUTE: WorldSeed = { attributes: [HELD_ATTRIBUTE] };

const LANDINGS: readonly Landing[] = [
  linkLanding("link, new assertion", {}, {}),
  linkLanding("link, re-affirmation", HOLDING_LINK, {}),
  linkLanding("link, correction", HOLDING_LINK, {
    target_node_id: TARGET_NODE_A,
    change_hint: "correction",
  }),
  linkLanding("link, succession", HOLDING_LINK, {
    target_node_id: TARGET_NODE_A,
    change_hint: "succession",
  }),
  linkLanding("link, dispute", HOLDING_LINK, { target_node_id: TARGET_NODE_A }),
  attributeLanding("attribute, new assertion", {}, {}),
  attributeLanding("attribute, re-affirmation", HOLDING_ATTRIBUTE, {}),
  attributeLanding("attribute, correction", HOLDING_ATTRIBUTE, {
    value: OTHER_VALUE,
    change_hint: "correction",
  }),
  attributeLanding("attribute, succession", HOLDING_ATTRIBUTE, {
    value: OTHER_VALUE,
    change_hint: "succession",
  }),
  attributeLanding("attribute, dispute", HOLDING_ATTRIBUTE, {
    value: OTHER_VALUE,
  }),
];

async function landingsMissingACitedFragment(): Promise<string[]> {
  const missing: string[] = [];
  for (const landing of LANDINGS) {
    const world = buildWorld(landing.seed);
    const landedOn = await landing.run(world);
    const held = fragmentsOn(world, landedOn);
    if (held.join() !== [FRAGMENT_ONE, FRAGMENT_TWO].join()) {
      missing.push(`${landing.name}: ${held.join() || "none"}`);
    }
  }
  return missing;
}

describe("provenance of a taken proposal", () => {
  it("records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order", async () => {
    const missing = await landingsMissingACitedFragment();

    expect(missing).toEqual([]);
  });
});

interface Currency {
  readonly valid_to: string | null;
  readonly superseded_at: string | null;
  readonly current: boolean;
}

const CURRENCIES: readonly Currency[] = [
  { valid_to: null, superseded_at: null, current: true },
  { valid_to: "2025-01-01", superseded_at: null, current: false },
  { valid_to: null, superseded_at: "2025-01-01T00:00:00Z", current: false },
  {
    valid_to: "2025-01-01",
    superseded_at: "2025-01-01T00:00:00Z",
    current: false,
  },
];

async function reaffirmedBy(
  kind: "link" | "attribute",
  held: Pick<Currency, "valid_to" | "superseded_at">
): Promise<boolean> {
  if (kind === "link") {
    const world = buildWorld({ links: [{ ...HELD_LINK, ...held }] });
    return (await runLink(world, SCENARIO_LINK)).outcome === "consolidated";
  }
  const world = buildWorld({ attributes: [{ ...HELD_ATTRIBUTE, ...held }] });
  return (
    (await runAttribute(world, SCENARIO_ATTRIBUTE)).outcome === "consolidated"
  );
}

async function currencyMisjudged(): Promise<string[]> {
  const misjudged: string[] = [];
  for (const kind of ["link", "attribute"] as const) {
    for (const held of CURRENCIES) {
      if ((await reaffirmedBy(kind, held)) !== held.current) {
        misjudged.push(
          `${kind} valid_to=${held.valid_to} superseded_at=${held.superseded_at}`
        );
      }
    }
  }
  return misjudged;
}

describe("current assertion", () => {
  it("meets a held link or attribute as current only while it has neither a validity end nor a supersession time", async () => {
    const misjudged = await currencyMisjudged();

    expect(misjudged).toEqual([]);
  });
});
