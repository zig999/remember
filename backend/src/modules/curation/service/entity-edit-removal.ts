import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import { rejectAttributeAtEdit } from "../repository/curation.repository.js";

export interface RemovalInput {
  readonly attributeId: string;
  readonly editedAt: Date;
}

export async function recordRemoval(
  client: PoolClient,
  input: RemovalInput
): Promise<void> {
  const rejected = await rejectAttributeAtEdit(client, {
    attributeId: input.attributeId,
    rejectedAt: input.editedAt,
  });
  if (rejected !== 1) {
    throw new InvariantError(
      `recordRemoval: attribute ${input.attributeId} was not live`
    );
  }
}
