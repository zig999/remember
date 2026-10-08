import type { PoolClient } from "pg";

import type { AttributeKeyRow } from "../../ingestion/catalog/catalog.js";
import type { AttributeChange } from "../dto/edit-entity.dto.js";
import type { AssertionStatus } from "../dto/enums.dto.js";
import {
  loadAttributeIdsOfKeyForUpdate,
  loadItemsForUpdate,
} from "../repository/curation.repository.js";
import type {
  ItemLockedRow,
  KnowledgeNodeLockedRow,
} from "../repository/curation.repository.js";
import { ConflictError } from "./errors.js";

const ENTITY_EDIT_CONFLICT_CODE = "BUSINESS_ENTITY_EDIT_CONFLICT";
const ENTITY_EDIT_DISPUTED_CODE = "BUSINESS_ENTITY_EDIT_DISPUTED";
const DISPUTED_STATUS: AssertionStatus = "disputed";
const LIVE_STATUSES: readonly AssertionStatus[] = [
  "active",
  "uncertain",
  "disputed",
];
const SUPERSESSION_TIME_STATUSES: readonly AssertionStatus[] = [
  "active",
  "uncertain",
];

export interface EditedKey {
  readonly node: KnowledgeNodeLockedRow;
  readonly attributeKey: AttributeKeyRow;
}

function conflictOf(message: string, change: AttributeChange): ConflictError {
  const named =
    change.item_id === undefined ? {} : { item_id: change.item_id };
  return new ConflictError(ENTITY_EDIT_CONFLICT_CODE, message, {
    attribute_key: change.attribute_key,
    ...named,
  });
}

function isLiveAttributeOf(held: ItemLockedRow, target: EditedKey): boolean {
  return (
    held.node_id === target.node.id &&
    held.attribute_key_id === target.attributeKey.id &&
    LIVE_STATUSES.includes(held.status)
  );
}

function disputedOf(
  held: ItemLockedRow,
  change: AttributeChange
): ConflictError {
  return new ConflictError(
    ENTITY_EDIT_DISPUTED_CODE,
    `Attribute '${held.id}' of key '${change.attribute_key}' is disputed and is settled through curation, not through an entity edit.`,
    { attribute_key: change.attribute_key, item_id: held.id }
  );
}

function statesOtherValueThan(
  held: ItemLockedRow,
  change: AttributeChange
): boolean {
  return (
    change.kind === "set" &&
    change.value !== undefined &&
    change.value !== held.value
  );
}

function assertDisputeLeftToCuration(
  held: ItemLockedRow,
  change: AttributeChange
): void {
  const changesHeld =
    change.kind === "remove" || statesOtherValueThan(held, change);
  if (held.status === DISPUTED_STATUS && changesHeld) {
    throw disputedOf(held, change);
  }
}

function assertSupersessionTimeLeavesValue(
  held: ItemLockedRow,
  change: AttributeChange
): void {
  const carriesSupersessionTime =
    held.superseded_at !== null &&
    SUPERSESSION_TIME_STATUSES.includes(held.status);
  if (carriesSupersessionTime && statesOtherValueThan(held, change)) {
    throw conflictOf(
      `Attribute '${held.id}' of key '${change.attribute_key}' carries a supersession time and its value cannot be changed.`,
      change
    );
  }
}

type NamingChange = AttributeChange & { readonly item_id: string };

function namesAttribute(change: AttributeChange): change is NamingChange {
  return change.item_id !== undefined;
}

async function checkNamedAttribute(
  client: PoolClient,
  target: EditedKey,
  change: NamingChange
): Promise<void> {
  const itemId = change.item_id;
  const [held] = await loadItemsForUpdate(client, "attribute", [itemId]);
  if (held === undefined || !isLiveAttributeOf(held, target)) {
    throw conflictOf(
      `Node '${target.node.id}' holds no live attribute '${itemId}' of key '${target.attributeKey.key}'.`,
      change
    );
  }
  assertDisputeLeftToCuration(held, change);
  assertSupersessionTimeLeavesValue(held, change);
}

async function assertNoSecondCurrentValue(
  client: PoolClient,
  target: EditedKey,
  change: AttributeChange
): Promise<void> {
  if (target.attributeKey.allows_multiple_current) {
    return;
  }
  const liveIds = await loadAttributeIdsOfKeyForUpdate(client, {
    nodeId: target.node.id,
    attributeKeyId: target.attributeKey.id,
    statuses: LIVE_STATUSES,
  });
  if (liveIds.length > 0) {
    throw conflictOf(
      `Node '${target.node.id}' already holds a current value of key '${target.attributeKey.key}', which allows only one.`,
      change
    );
  }
}

export async function checkChangeAgainstHeldAttributes(
  client: PoolClient,
  target: EditedKey,
  change: AttributeChange
): Promise<void> {
  if (namesAttribute(change)) {
    await checkNamedAttribute(client, target, change);
    return;
  }
  if (change.kind === "set") {
    await assertNoSecondCurrentValue(client, target, change);
  }
}
