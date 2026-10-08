import { describe, expect, it } from "vitest";

import {
  NODE_ID,
  REASON,
  buildWorld,
  mixedEdit,
  mixedEditEntries,
  onlyRow,
  plainRow,
} from "./edit-entity-world.js";

const FIRST_VALUE_SPELLED_WITH_UNDERSCORE = "first_value";
const EFFECTS_IN_THE_ORDER_GIVEN = [
  FIRST_VALUE_SPELLED_WITH_UNDERSCORE,
  "unchanged",
  "succession",
  "removal",
  "addition",
  "correction",
];

describe("the answer to an accepted entity edit", () => {
  it("names the edited node's identity as node_id", async () => {
    const world = buildWorld();

    const answer = await world.edit(mixedEdit());

    expect(answer.node_id).toBe(NODE_ID);
  });

  it("names the identity of the curation action the edit recorded as action_id", async () => {
    const world = buildWorld();

    const answer = await world.edit(mixedEdit());

    expect(answer.action_id).toBe(onlyRow(world.store.curationAction).id);
  });

  it("writes every effect with an underscore for each hyphen of its enumeration value", async () => {
    const world = buildWorld();

    const answer = await world.edit(mixedEdit());

    expect(answer.applied.map((entry) => entry.effect)).toEqual(
      EFFECTS_IN_THE_ORDER_GIVEN
    );
  });

  it("lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected", async () => {
    const world = buildWorld();

    const answer = await world.edit(mixedEdit());

    expect(answer.applied).toEqual(mixedEditEntries(world));
  });
});

describe("the curation action an accepted entity edit records", () => {
  it("is one edit_entity action on the edited node carrying the reason and every applied entry in the order given", async () => {
    const world = buildWorld();

    await world.edit(mixedEdit());

    expect(plainRow(onlyRow(world.store.curationAction))).toEqual({
      action: "edit_entity",
      target_kind: "node",
      target_id: NODE_ID,
      payload: { applied: mixedEditEntries(world) },
      reason: REASON,
    });
  });
});
