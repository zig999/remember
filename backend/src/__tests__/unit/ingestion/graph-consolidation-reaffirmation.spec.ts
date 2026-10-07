import { isDeepStrictEqual } from "node:util";

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

const PARTICIPATES: LinkTypeRow = {
  id: "00000000-0000-4000-8000-000000000011",
  name: "participates_in",
  is_temporal: true,
  allows_multiple_current: true,
  requires_valid_from: true,
  requires_valid_to_on_change: false,
};
const OTHER_NODE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_TYPE = "00000000-0000-4000-8000-000000000099";
const OTHER_TAG_VALUE = "beta";
const LATER_START = "2030-06-01";
const SUCCESSION_TEXTS = ["Ada passou a liderar o projeto"];
const CARRIED_COLUMNS: readonly string[] = [
  "confidence",
  "valid_to",
  "valid_from_source",
];

const HELD_PARTICIPATION: HeldRow = {
  ...HELD_LINK,
  link_type_id: PARTICIPATES.id,
};
const HELD_TAG: HeldRow = {
  ...HELD_ATTRIBUTE,
  attribute_key_id: TAGS.id,
  value: TAG_VALUE,
};
const SUCCESSION_LINK: ConsolidateLinkArgs = {
  ...SCENARIO_LINK,
  change_hint: "succession",
};
const SUCCESSION_OTHER_FIELDS_LINK: ConsolidateLinkArgs = {
  ...OTHER_START_LINK,
  change_hint: "succession",
};
const SUCCESSION_ATTRIBUTE: ConsolidateAttributeArgs = {
  ...SCENARIO_ATTRIBUTE,
  change_hint: "succession",
};
const SUCCESSION_OTHER_FIELDS_ATTRIBUTE: ConsolidateAttributeArgs = {
  ...OTHER_START_ATTRIBUTE,
  change_hint: "succession",
};
const SUCCESSION_TAG: ConsolidateAttributeArgs = {
  ...SCENARIO_ATTRIBUTE,
  attribute_key_id: TAGS.id,
  value_type: "text",
  value: TAG_VALUE,
  change_hint: "succession",
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

function assignedColumns(world: World, table: Write["table"]): string[] {
  return writesTo(world, table, "update").flatMap((w) => Object.keys(w.values));
}

function assignedStatuses(world: World, table: Write["table"]): unknown[] {
  return writesTo(world, table, "update").flatMap((w) =>
    "status" in w.values ? [w.values["status"]] : []
  );
}

function recorded(world: World, table: Write["table"]): Write["values"][] {
  return writesTo(world, table, "insert").map((w) => w.values);
}

function overwritten(world: World, table: Write["table"]): string[] {
  return assignedColumns(world, table).filter((column) =>
    CARRIED_COLUMNS.includes(column)
  );
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

  it("answers a proposal with change hint succession and the held target as consolidated, carrying the identity of the held link", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, SUCCESSION_LINK);

    expect(result).toMatchObject({
      outcome: "consolidated",
      link_id: HELD_LINK_ID,
    });
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

  it("answers a proposal with change hint succession and the held value as consolidated, carrying the identity of the held attribute", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    const result = await runAttribute(world, SUCCESSION_ATTRIBUTE);

    expect(result).toMatchObject({
      outcome: "consolidated",
      attribute_id: HELD_ATTRIBUTE_ID,
    });
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

describe("a link proposal with change hint succession that re-affirms the current link", () => {
  it("records no new link", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, SUCCESSION_LINK);

    expect(writesTo(world, "knowledge_link", "insert")).toHaveLength(0);
  });

  it("leaves that link in the status it holds", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, SUCCESSION_LINK);

    expect(assignedColumns(world, "knowledge_link")).not.toContain("status");
  });

  it("adds its provenance to that link", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, SUCCESSION_LINK);

    expect(fragmentsOn(world, HELD_LINK_ID)).toEqual([FRAGMENT_ONE]);
  });

  it("leaves the validity start the link holds when the proposal states another", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, SUCCESSION_LINK);

    expect(assignedColumns(world, "knowledge_link")).not.toContain("valid_from");
  });
});

describe("a link proposal with change hint succession that re-affirms the current link and states other fields", () => {
  it("leaves the confidence, the validity end and the basis of the validity start the link holds", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, SUCCESSION_OTHER_FIELDS_LINK);

    expect(overwritten(world, "knowledge_link")).toEqual([]);
  });

  it("holds one provenance for each fragment it cites and none again for a fragment the link already holds", async () => {
    const world = buildWorld({
      links: [HELD_LINK],
      provenance: [{ target_id: HELD_LINK_ID, fragment_id: FRAGMENT_ONE }],
    });

    await runLink(world, {
      ...SUCCESSION_LINK,
      fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
    });

    expect(fragmentsOn(world, HELD_LINK_ID)).toEqual([
      FRAGMENT_ONE,
      FRAGMENT_TWO,
    ]);
  });
});

describe("an attribute proposal with change hint succession that re-affirms the current attribute", () => {
  it("records no new attribute", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, SUCCESSION_ATTRIBUTE);

    expect(writesTo(world, "node_attribute", "insert")).toHaveLength(0);
  });

  it("leaves that attribute in the status it holds", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, SUCCESSION_ATTRIBUTE);

    expect(assignedColumns(world, "node_attribute")).not.toContain("status");
  });

  it("adds its provenance to that attribute", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, SUCCESSION_ATTRIBUTE);

    expect(fragmentsOn(world, HELD_ATTRIBUTE_ID)).toEqual([FRAGMENT_ONE]);
  });

  it("leaves the validity start the attribute holds when the proposal states another", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, SUCCESSION_ATTRIBUTE);

    expect(assignedColumns(world, "node_attribute")).not.toContain(
      "valid_from"
    );
  });
});

describe("an attribute proposal with change hint succession that re-affirms the current attribute and states other fields", () => {
  it("leaves the confidence, the validity end and the basis of the validity start the attribute holds", async () => {
    const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });

    await runAttribute(world, SUCCESSION_OTHER_FIELDS_ATTRIBUTE);

    expect(overwritten(world, "node_attribute")).toEqual([]);
  });

  it("holds one provenance for each fragment it cites and none again for a fragment the attribute already holds", async () => {
    const world = buildWorld({
      attributes: [HELD_ATTRIBUTE],
      provenance: [{ target_id: HELD_ATTRIBUTE_ID, fragment_id: FRAGMENT_ONE }],
    });

    await runAttribute(world, {
      ...SUCCESSION_ATTRIBUTE,
      fragment_ids: [FRAGMENT_ONE, FRAGMENT_TWO],
    });

    expect(fragmentsOn(world, HELD_ATTRIBUTE_ID)).toEqual([
      FRAGMENT_ONE,
      FRAGMENT_TWO,
    ]);
  });
});

describe("an attribute proposal with change hint succession that repeats a value of a key allowing multiple current values", () => {
  it("answers the proposal as consolidated, carrying the identity of the held attribute", async () => {
    const world = buildWorld({ attributes: [HELD_TAG] });

    const result = await runAttribute(world, SUCCESSION_TAG, TAGS);

    expect(result).toMatchObject({
      outcome: "consolidated",
      attribute_id: HELD_ATTRIBUTE_ID,
    });
  });
});

describe("a link proposal that repeats the target of the current link of a type allowing one current link", () => {
  it("supersedes the held link, leaves its validity end and records a new link naming it, when its change hint is correction", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    await runLink(world, { ...SCENARIO_LINK, change_hint: "correction" });

    expect({
      held_statuses: assignedStatuses(world, "knowledge_link"),
      validity_end_assigned: assignedColumns(world, "knowledge_link").includes(
        "valid_to"
      ),
      recorded_supersedes: recorded(world, "knowledge_link").map(
        (row) => row["supersedes_link_id"]
      ),
    }).toEqual({
      held_statuses: ["superseded"],
      validity_end_assigned: false,
      recorded_supersedes: [HELD_LINK_ID],
    });
  });
});

describe("a link proposal with change hint none and another target than the current link of a type allowing one current link", () => {
  it("is answered as a dispute when no cited fragment signals succession", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, {
      ...SCENARIO_LINK,
      target_node_id: TARGET_NODE_A,
    });

    expect(result.outcome).toBe("disputed");
  });
});

type ChangeHint = ConsolidateLinkArgs["change_hint"];
type Relation =
  | "same target or value"
  | "another target or value"
  | "another node"
  | "another type or key";

interface Proposal {
  readonly hint: ChangeHint;
  readonly differs: boolean;
  readonly start: string | null;
  readonly texts: readonly string[];
}

interface Landed {
  readonly outcome: string;
  readonly id: string;
}

interface Subject {
  readonly name: string;
  readonly multi: boolean;
  readonly table: Write["table"];
  readonly held: HeldRow;
  readonly heldId: string;
  readonly heldStart: string;
  readonly ownerColumn: string;
  readonly typeColumn: string;
  readonly propose: (world: World, proposal: Proposal) => Promise<Landed>;
}

interface AttributeTarget {
  readonly key: AttributeKeyRow;
  readonly held: string;
  readonly other: string;
}

interface Observation {
  readonly outcome: string;
  readonly identity: string;
  readonly provenance: string[];
  readonly new_assertions: number;
  readonly assigned: string[];
}

interface Dispute {
  readonly held_statuses: unknown[];
  readonly marked_disputed: unknown[];
  readonly recorded_statuses: unknown[];
  readonly recorded_supersedes: unknown[];
}

async function landLink(
  world: World,
  proposal: Proposal,
  type: LinkTypeRow
): Promise<Landed> {
  const args: ConsolidateLinkArgs = {
    ...SCENARIO_LINK,
    link_type_id: type.id,
    target_node_id: proposal.differs ? TARGET_NODE_A : TARGET_NODE_B,
    change_hint: proposal.hint,
    valid_from: proposal.start,
  };
  const result = await consolidateLink(
    world.client,
    args,
    type,
    proposal.texts,
    RUN_CONTEXT
  );
  return { outcome: result.outcome, id: result.link_id };
}

async function landAttribute(
  world: World,
  proposal: Proposal,
  target: AttributeTarget
): Promise<Landed> {
  const args: ConsolidateAttributeArgs = {
    ...SCENARIO_ATTRIBUTE,
    attribute_key_id: target.key.id,
    value_type: target.key.value_type,
    value: proposal.differs ? target.other : target.held,
    change_hint: proposal.hint,
    valid_from: proposal.start,
  };
  const result = await consolidateAttribute(
    world.client,
    args,
    target.key,
    proposal.texts,
    RUN_CONTEXT
  );
  return { outcome: result.outcome, id: result.attribute_id };
}

const SUBJECTS: readonly Subject[] = [
  {
    name: "link, one current",
    multi: false,
    table: "knowledge_link",
    held: HELD_LINK,
    heldId: HELD_LINK_ID,
    heldStart: "2024-01-01",
    ownerColumn: "source_node_id",
    typeColumn: "link_type_id",
    propose: (world, proposal) => landLink(world, proposal, LEADS),
  },
  {
    name: "link, multiple current",
    multi: true,
    table: "knowledge_link",
    held: HELD_PARTICIPATION,
    heldId: HELD_LINK_ID,
    heldStart: "2024-01-01",
    ownerColumn: "source_node_id",
    typeColumn: "link_type_id",
    propose: (world, proposal) => landLink(world, proposal, PARTICIPATES),
  },
  {
    name: "attribute, one current",
    multi: false,
    table: "node_attribute",
    held: HELD_ATTRIBUTE,
    heldId: HELD_ATTRIBUTE_ID,
    heldStart: "2026-01-01",
    ownerColumn: "node_id",
    typeColumn: "attribute_key_id",
    propose: (world, proposal) =>
      landAttribute(world, proposal, {
        key: DEADLINE,
        held: HELD_VALUE,
        other: OTHER_VALUE,
      }),
  },
  {
    name: "attribute, multiple current",
    multi: true,
    table: "node_attribute",
    held: HELD_TAG,
    heldId: HELD_ATTRIBUTE_ID,
    heldStart: "2026-01-01",
    ownerColumn: "node_id",
    typeColumn: "attribute_key_id",
    propose: (world, proposal) =>
      landAttribute(world, proposal, {
        key: TAGS,
        held: TAG_VALUE,
        other: OTHER_TAG_VALUE,
      }),
  },
];

const ONE_CURRENT_SUBJECTS = SUBJECTS.filter((subject) => !subject.multi);
const MANY_CURRENT_SUBJECTS = SUBJECTS.filter((subject) => subject.multi);
const RELATIONS: readonly Relation[] = [
  "same target or value",
  "another target or value",
  "another node",
  "another type or key",
];
const START_CLASSES = ["the held start", "another start", "no start"] as const;
const HINTS_OF_REAFFIRMATION: readonly ChangeHint[] = ["none", "succession"];

function proposing(
  hint: ChangeHint,
  differs: boolean,
  texts: readonly string[]
): Proposal {
  return { hint, differs, start: LATER_START, texts };
}

function seedOf(subject: Subject, held: HeldRow | null): WorldSeed {
  if (held === null) return {};
  return subject.table === "knowledge_link"
    ? { links: [held] }
    : { attributes: [held] };
}

async function branchOf(
  subject: Subject,
  held: HeldRow | null,
  proposal: Proposal
): Promise<string> {
  const world = buildWorld(seedOf(subject, held));
  const landed = await subject.propose(world, proposal);
  return `${landed.outcome}:${assignedStatuses(world, subject.table).join()}`;
}

function startOf(
  subject: Subject,
  startClass: (typeof START_CLASSES)[number]
): string | null {
  if (startClass === "the held start") return subject.heldStart;
  return startClass === "another start" ? LATER_START : null;
}

async function observe(
  subject: Subject,
  proposal: Proposal
): Promise<Observation> {
  const world = buildWorld(seedOf(subject, subject.held));
  const landed = await subject.propose(world, proposal);
  return {
    outcome: landed.outcome,
    identity: landed.id,
    provenance: fragmentsOn(world, subject.heldId),
    new_assertions: writesTo(world, subject.table, "insert").length,
    assigned: assignedColumns(world, subject.table),
  };
}

function reaffirmed(subject: Subject): Observation {
  return {
    outcome: "consolidated",
    identity: subject.heldId,
    provenance: [FRAGMENT_ONE],
    new_assertions: 0,
    assigned: [],
  };
}

async function reaffirmationsMissed(): Promise<string[]> {
  const missed: string[] = [];
  for (const subject of SUBJECTS) {
    for (const hint of HINTS_OF_REAFFIRMATION) {
      for (const startClass of START_CLASSES) {
        const start = startOf(subject, startClass);
        const proposal = { ...proposing(hint, false, NEUTRAL_TEXTS), start };
        const observed = await observe(subject, proposal);
        if (!isDeepStrictEqual(observed, reaffirmed(subject))) {
          missed.push(`${subject.name}, hint ${hint}, ${startClass}`);
        }
      }
    }
  }
  return missed;
}

describe("re-affirmation by a proposal with change hint none or succession", () => {
  it("adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states", async () => {
    const missed = await reaffirmationsMissed();

    expect(missed).toEqual([]);
  });
});

interface Taken {
  readonly outcome: string;
  readonly on_held: boolean;
  readonly held_statuses: unknown[];
  readonly new_assertions: number;
}

const REAFFIRMED_ON_HELD: Taken = {
  outcome: "consolidated",
  on_held: true,
  held_statuses: [],
  new_assertions: 0,
};
const CORRECTED: Taken = {
  outcome: "accepted",
  on_held: false,
  held_statuses: ["superseded"],
  new_assertions: 1,
};
const SUCCEEDED: Taken = {
  outcome: "superseded_previous",
  on_held: false,
  held_statuses: ["superseded"],
  new_assertions: 1,
};
const DISPUTE_TAKEN: Taken = {
  outcome: "disputed",
  on_held: false,
  held_statuses: ["disputed"],
  new_assertions: 1,
};
const NEW_ASSERTION: Taken = {
  outcome: "accepted",
  on_held: false,
  held_statuses: [],
  new_assertions: 1,
};

interface Precedence {
  readonly name: string;
  readonly subjects: readonly Subject[];
  readonly held: boolean;
  readonly proposal: Proposal;
  readonly taken: Taken;
}

const PRECEDENCE: readonly Precedence[] = [
  {
    name: "re-affirmation before succession by hint",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("succession", false, NEUTRAL_TEXTS),
    taken: REAFFIRMED_ON_HELD,
  },
  {
    name: "re-affirmation before succession by signal",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("none", false, SUCCESSION_TEXTS),
    taken: REAFFIRMED_ON_HELD,
  },
  {
    name: "re-affirmation before new assertion",
    subjects: MANY_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("none", false, NEUTRAL_TEXTS),
    taken: REAFFIRMED_ON_HELD,
  },
  {
    name: "correction before succession",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("correction", true, SUCCESSION_TEXTS),
    taken: CORRECTED,
  },
  {
    name: "correction before dispute",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("correction", true, NEUTRAL_TEXTS),
    taken: CORRECTED,
  },
  {
    name: "correction before new assertion on a type allowing multiple current assertions",
    subjects: MANY_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("correction", false, NEUTRAL_TEXTS),
    taken: CORRECTED,
  },
  {
    name: "succession by signal before dispute",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("none", true, SUCCESSION_TEXTS),
    taken: SUCCEEDED,
  },
  {
    name: "succession by hint before dispute",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("succession", true, NEUTRAL_TEXTS),
    taken: SUCCEEDED,
  },
  {
    name: "dispute before new assertion",
    subjects: ONE_CURRENT_SUBJECTS,
    held: true,
    proposal: proposing("none", true, NEUTRAL_TEXTS),
    taken: DISPUTE_TAKEN,
  },
  {
    name: "new assertion when no assertion is current",
    subjects: SUBJECTS,
    held: false,
    proposal: proposing("none", true, NEUTRAL_TEXTS),
    taken: NEW_ASSERTION,
  },
];

async function takenOf(
  subject: Subject,
  held: HeldRow | null,
  proposal: Proposal
): Promise<Taken> {
  const world = buildWorld(seedOf(subject, held));
  const landed = await subject.propose(world, proposal);
  return {
    outcome: landed.outcome,
    on_held: landed.id === subject.heldId,
    held_statuses: assignedStatuses(world, subject.table),
    new_assertions: writesTo(world, subject.table, "insert").length,
  };
}

async function precedenceBroken(): Promise<string[]> {
  const broken: string[] = [];
  for (const row of PRECEDENCE) {
    for (const subject of row.subjects) {
      const held = row.held ? subject.held : null;
      const taken = await takenOf(subject, held, row.proposal);
      if (!isDeepStrictEqual(taken, row.taken)) {
        broken.push(`${row.name}, ${subject.name}: ${JSON.stringify(taken)}`);
      }
    }
  }
  return broken;
}

describe("order of the consolidation of a link or attribute proposal", () => {
  it("takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets", async () => {
    const broken = await precedenceBroken();

    expect(broken).toEqual([]);
  });
});

function heldFor(subject: Subject, relation: Relation): HeldRow {
  if (relation === "another node") {
    return { ...subject.held, [subject.ownerColumn]: OTHER_NODE };
  }
  if (relation === "another type or key") {
    return { ...subject.held, [subject.typeColumn]: OTHER_TYPE };
  }
  return subject.held;
}

function expectedMeeting(subject: Subject, relation: Relation): string {
  if (relation === "same target or value") return "consolidated:";
  if (relation === "another target or value" && !subject.multi) {
    return "disputed:disputed";
  }
  return "accepted:";
}

async function meetingsMisjudged(): Promise<string[]> {
  const misjudged: string[] = [];
  for (const subject of SUBJECTS) {
    for (const relation of RELATIONS) {
      const differs = relation === "another target or value";
      const proposal = proposing("none", differs, NEUTRAL_TEXTS);
      const branch = await branchOf(subject, heldFor(subject, relation), proposal);
      if (branch !== expectedMeeting(subject, relation)) {
        misjudged.push(`${subject.name}, ${relation}: ${branch}`);
      }
    }
  }
  return misjudged;
}

describe("the current assertion a proposal meets", () => {
  it("is the one of its node and type, or the one of its node, type and target or value where the type allows multiple current assertions, and no other", async () => {
    const misjudged = await meetingsMisjudged();

    expect(misjudged).toEqual([]);
  });
});

function disputeOf(world: World, table: Write["table"]): Dispute {
  const supersedes =
    table === "knowledge_link" ? "supersedes_link_id" : "supersedes_attribute_id";
  const rows = recorded(world, table);
  return {
    held_statuses: assignedStatuses(world, table),
    marked_disputed: writesTo(world, table, "update")
      .filter((w) => w.values["status"] === "disputed")
      .map((w) => w.addressed),
    recorded_statuses: rows.map((row) => row["status"]),
    recorded_supersedes: rows.map((row) => row[supersedes]),
  };
}

function disputedOn(heldId: string): Dispute {
  return {
    held_statuses: ["disputed"],
    marked_disputed: [heldId],
    recorded_statuses: ["disputed"],
    recorded_supersedes: [null],
  };
}

async function disputedLink(): Promise<World> {
  const world = buildWorld({ links: [HELD_LINK] });
  await runLink(world, { ...SCENARIO_LINK, target_node_id: TARGET_NODE_A });
  return world;
}

async function disputedAttribute(): Promise<World> {
  const world = buildWorld({ attributes: [HELD_ATTRIBUTE] });
  await runAttribute(world, { ...SCENARIO_ATTRIBUTE, value: OTHER_VALUE });
  return world;
}

describe("scenarios of a succession proposal repeating the target of the current link", () => {
  it("re-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept", async () => {
    const world = buildWorld({ links: [HELD_LINK] });

    const result = await runLink(world, SUCCESSION_LINK);

    expect({
      outcome: result.outcome,
      link_id: result.link_id,
      provenance: fragmentsOn(world, HELD_LINK_ID),
      new_links: writesTo(world, "knowledge_link", "insert").length,
      held_statuses: assignedStatuses(world, "knowledge_link"),
      validity_start_assigned: assignedColumns(
        world,
        "knowledge_link"
      ).includes("valid_from"),
    }).toEqual({
      outcome: "consolidated",
      link_id: HELD_LINK_ID,
      provenance: [FRAGMENT_ONE],
      new_links: 0,
      held_statuses: [],
      validity_start_assigned: false,
    });
  });
});

describe("scenario of a proposal for another target without a signal of succession", () => {
  it("marks the current link disputed and records the new link from A to C in status disputed, superseding nothing", async () => {
    const world = await disputedLink();

    expect({
      ...disputeOf(world, "knowledge_link"),
      recorded_sources: recorded(world, "knowledge_link").map(
        (row) => row["source_node_id"]
      ),
      recorded_targets: recorded(world, "knowledge_link").map(
        (row) => row["target_node_id"]
      ),
    }).toEqual({
      ...disputedOn(HELD_LINK_ID),
      recorded_sources: [SOURCE_NODE],
      recorded_targets: [TARGET_NODE_A],
    });
  });
});

describe("a proposal for a type allowing one current assertion that meets the current assertion as a dispute", () => {
  it("marks that assertion disputed and records a new assertion in status disputed that supersedes nothing, for a link and for an attribute", async () => {
    const link = disputeOf(await disputedLink(), "knowledge_link");
    const attribute = disputeOf(await disputedAttribute(), "node_attribute");

    expect({ link, attribute }).toEqual({
      link: disputedOn(HELD_LINK_ID),
      attribute: disputedOn(HELD_ATTRIBUTE_ID),
    });
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
  linkLanding("link, re-affirmation by succession", HOLDING_LINK, {
    change_hint: "succession",
  }),
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
  attributeLanding("attribute, re-affirmation by succession", HOLDING_ATTRIBUTE, {
    change_hint: "succession",
  }),
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
