import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADDED_STAKEHOLDER,
  DEADLINE_HELD_ID,
  DEADLINE_KEY_ID,
  EDITED_AT,
  EMAIL_HELD_ID,
  NEW_DEADLINE,
  NODE_ID,
  PHASE_KEY_ID,
  PHASE_VALUE,
  REASON,
  buildWorld,
  editOf,
  freezeClock,
  mixedEdit,
  onlyRow,
  recordedAttributes,
  removeChange,
  restoreClock,
  setChange,
  transactionShapeOf,
} from "./edit-entity-world.js";
import type { EditWorld, Row } from "./edit-entity-world.js";

const EDITED_DATE = "2026-10-07";
const EDITED_TIME = "14:35:09";
const OTHER_STAKEHOLDER = "Cris";
const PADDING = "\t\t";
const ACTIVE = "active";
const OPERATOR_RUN = {
  model: "operator",
  prompt_version: "operator-edit-v1",
  status: "completed",
};

function stateOf(row: Row): Row {
  return {
    node_id: row.node_id,
    attribute_key_id: row.attribute_key_id,
    value: row.value,
    status: row.status,
    supersedes_attribute_id: row.supersedes_attribute_id,
  };
}

function heldRow(world: EditWorld, id: string): Row {
  return onlyRow(world.store.attributes.filter((row) => row.id === id));
}

function effectOf(answer: { applied: readonly { effect: string }[] }): string | undefined {
  return answer.applied[0]?.effect;
}

afterEach(() => {
  restoreClock();
  vi.unstubAllGlobals();
});

describe("a set change naming no attribute on a key whose node holds no live attribute", () => {
  it("is recorded as a new active attribute that names no predecessor, with the effect first_value", async () => {
    const world = buildWorld();

    const answer = await world.edit(editOf([setChange("phase", PHASE_VALUE)]));

    expect({
      effect: effectOf(answer),
      recorded: stateOf(onlyRow(recordedAttributes(world))),
    }).toEqual({
      effect: "first_value",
      recorded: {
        node_id: NODE_ID,
        attribute_key_id: PHASE_KEY_ID,
        value: PHASE_VALUE,
        status: ACTIVE,
        supersedes_attribute_id: null,
      },
    });
  });
});

describe("a remove change naming a live attribute", () => {
  it("marks that attribute deleted with the moment of the edit as its supersession time, records no attribute, and has the effect removal", async () => {
    freezeClock();
    const world = buildWorld();

    const answer = await world.edit(
      editOf([removeChange("email", EMAIL_HELD_ID)])
    );

    const held = heldRow(world, EMAIL_HELD_ID);
    expect({
      effect: effectOf(answer),
      held: { status: held.status, superseded_at: held.superseded_at },
      recorded: recordedAttributes(world).length,
    }).toEqual({
      effect: "removal",
      held: { status: "deleted", superseded_at: EDITED_AT },
      recorded: 0,
    });
  });
});

describe("a set change stating another value for a current attribute of a temporal key", () => {
  it("supersedes that attribute and records a new active attribute that names it as the one it supersedes, with the effect succession", async () => {
    const world = buildWorld();
    const change = setChange("deadline", NEW_DEADLINE, {
      item_id: DEADLINE_HELD_ID,
    });

    const answer = await world.edit(editOf([change]));

    expect({
      effect: effectOf(answer),
      predecessor: heldRow(world, DEADLINE_HELD_ID).status,
      recorded: stateOf(onlyRow(recordedAttributes(world))),
    }).toEqual({
      effect: "succession",
      predecessor: "superseded",
      recorded: {
        node_id: NODE_ID,
        attribute_key_id: DEADLINE_KEY_ID,
        value: NEW_DEADLINE,
        status: ACTIVE,
        supersedes_attribute_id: DEADLINE_HELD_ID,
      },
    });
  });
});

describe("what an accepted entity edit of several changes records as its note", () => {
  it("is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason", async () => {
    const world = buildWorld();

    await world.edit(mixedEdit());

    const raw = onlyRow(world.store.rawInformation);
    const chunk = onlyRow(world.store.rawChunk);
    const fragment = onlyRow(world.store.fragment);
    expect({
      chunkOf: chunk.raw_information_id,
      chunkText: chunk.text,
      fragmentStatus: fragment.status,
      fragmentText: fragment.text,
      anchors: world.store.fragmentSource.map((source) => [
        source.fragment_id,
        source.raw_chunk_id,
      ]),
    }).toEqual({
      chunkOf: raw.id,
      chunkText: raw.content,
      fragmentStatus: "accepted",
      fragmentText: REASON,
      anchors: [[fragment.id, chunk.id]],
    });
  });
});

describe("the LLM run an accepted entity edit of several changes opens", () => {
  it("is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const world = buildWorld();

    await world.edit(mixedEdit());

    expect({
      runs: world.store.llmRun.map((run) => ({
        model: run.model,
        prompt_version: run.prompt_version,
        status: run.status,
      })),
      networkCalls: fetchSpy.mock.calls.length,
    }).toEqual({ runs: [OPERATOR_RUN], networkCalls: 0 });
  });
});

describe("the raw information of two edits with one reason made at one moment", () => {
  it("holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own", async () => {
    freezeClock();
    const world = buildWorld();

    await world.edit(editOf([setChange("stakeholder", ADDED_STAKEHOLDER)]));
    await world.edit(editOf([setChange("stakeholder", OTHER_STAKEHOLDER)]));

    const contents = world.store.rawInformation.map((raw) => String(raw.content));
    expect({
      notes: contents.length,
      holdingReason: contents.filter((c) => c.includes(REASON)).length,
      holdingDate: contents.filter((c) => c.includes(EDITED_DATE)).length,
      holdingTime: contents.filter((c) => c.includes(EDITED_TIME)).length,
      distinctContents: new Set(contents).size,
    }).toEqual({
      notes: 2,
      holdingReason: 2,
      holdingDate: 2,
      holdingTime: 2,
      distinctContents: 2,
    });
  });
});

describe("an accepted entity edit whose reason was sent surrounded by whitespace", () => {
  it("records its action's reason, its fragment's text and its note's content with the reason trimmed of that whitespace", async () => {
    const world = buildWorld();
    const body = editOf(
      [setChange("phase", PHASE_VALUE)],
      `${PADDING}${REASON}${PADDING}`
    );

    await world.edit(body);

    const content = String(onlyRow(world.store.rawInformation).content);
    expect({
      actionReason: onlyRow(world.store.curationAction).reason,
      fragmentText: onlyRow(world.store.fragment).text,
      paddingBeforeReason: content.includes(`${PADDING}${REASON}`),
      paddingAfterReason: content.includes(`${REASON}${PADDING}`),
      reasonInContent: content.includes(REASON),
    }).toEqual({
      actionReason: REASON,
      fragmentText: REASON,
      paddingBeforeReason: false,
      paddingAfterReason: false,
      reasonInContent: true,
    });
  });
});

describe("the writes of an accepted entity edit of several changes", () => {
  it("run on one connection inside one transaction that commits, with no statement outside it", async () => {
    const world = buildWorld();

    await world.edit(mixedEdit());

    expect(transactionShapeOf(world.events)).toEqual({
      connections: 1,
      begins: 1,
      commits: 1,
      rollbacks: 0,
      outside: 0,
      wrote: true,
    });
  });
});
