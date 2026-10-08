import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import { supersedeAttributeAtEdit } from "../repository/curation.repository.js";
import type { ItemLockedRow } from "../repository/curation.repository.js";
import { recordNewAttribute, validityOf } from "./entity-edit-new-attribute.js";
import type { NewAttributeInput } from "./entity-edit-new-attribute.js";

export interface SuccessionInput
  extends Omit<NewAttributeInput, "supersedes"> {
  readonly predecessor: ItemLockedRow;
}

function validityEndGivenTo(
  predecessor: ItemLockedRow,
  newStart: string
): string | null {
  if (predecessor.valid_from === null || newStart > predecessor.valid_from) {
    return newStart;
  }
  return null;
}

export async function recordSuccession(
  client: PoolClient,
  input: SuccessionInput
): Promise<string> {
  const { predecessor, ...recorded } = input;
  const newStart = validityOf(
    input.target.attributeKey,
    input.change,
    input.editedAt
  ).validFrom;
  if (newStart === null) {
    throw new InvariantError(
      `recordSuccession: key '${input.target.attributeKey.key}' is not temporal and has no validity start to succeed at`
    );
  }
  const validTo = validityEndGivenTo(predecessor, newStart);
  const superseded = await supersedeAttributeAtEdit(client, {
    attributeId: predecessor.id,
    validTo,
    supersededAt: validTo === null ? input.editedAt : null,
  });
  if (superseded !== 1) {
    throw new InvariantError(
      `recordSuccession: attribute ${predecessor.id} was not live`
    );
  }
  return recordNewAttribute(client, { ...recorded, supersedes: predecessor.id });
}
