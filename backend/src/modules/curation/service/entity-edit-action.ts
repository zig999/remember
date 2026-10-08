import type { PoolClient } from "pg";

import type { EditEffect } from "../dto/edit-entity.dto.js";
import { insertCurationAction } from "../repository/curation.repository.js";

export const ENTITY_EDIT_ACTION_KIND = "edit_entity";
export const ENTITY_EDIT_ACTION_TARGET_KIND = "node";

const ENUMERATION_HYPHEN = /-/g;
const STORED_SEPARATOR = "_";

export interface AppliedChange {
  readonly attribute_key: string;
  readonly effect: EditEffect;
  readonly item_id: string | null;
  readonly predecessor_id: string | null;
}

export interface EditActionInput {
  readonly nodeId: string;
  readonly reason: string;
  readonly applied: readonly AppliedChange[];
}

interface AppliedEntry {
  readonly attribute_key: string;
  readonly effect: string;
  readonly item_id: string | null;
  readonly predecessor_id: string | null;
}

function storedEffect(effect: EditEffect): string {
  return effect.replace(ENUMERATION_HYPHEN, STORED_SEPARATOR);
}

function appliedEntry(change: AppliedChange): AppliedEntry {
  return {
    attribute_key: change.attribute_key,
    effect: storedEffect(change.effect),
    item_id: change.item_id,
    predecessor_id: change.predecessor_id,
  };
}

export async function recordEditAction(
  client: PoolClient,
  input: EditActionInput
): Promise<string> {
  const action = await insertCurationAction(client, {
    action: ENTITY_EDIT_ACTION_KIND,
    target_kind: ENTITY_EDIT_ACTION_TARGET_KIND,
    target_id: input.nodeId,
    payload: { applied: input.applied.map(appliedEntry) },
    reason: input.reason.trim(),
  });
  return action.id;
}
