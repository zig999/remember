import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import {
  copyProvenance,
  supersedeAttributeAtEdit,
} from "../repository/curation.repository.js";
import type { ItemLockedRow } from "../repository/curation.repository.js";
import { recordNewAttribute } from "./entity-edit-new-attribute.js";
import type { NewAttributeInput } from "./entity-edit-new-attribute.js";

export interface CorrectionInput
  extends Omit<NewAttributeInput, "supersedes"> {
  readonly predecessor: ItemLockedRow;
}

export async function recordCorrection(
  client: PoolClient,
  input: CorrectionInput
): Promise<string> {
  const { predecessor, ...recorded } = input;
  const superseded = await supersedeAttributeAtEdit(client, {
    attributeId: predecessor.id,
    validTo: null,
    supersededAt: input.editedAt,
  });
  if (superseded !== 1) {
    throw new InvariantError(
      `recordCorrection: attribute ${predecessor.id} was not live`
    );
  }
  const attributeId = await recordNewAttribute(client, {
    ...recorded,
    supersedes: predecessor.id,
  });
  await copyProvenance(client, "attribute", predecessor.id, attributeId);
  return attributeId;
}
