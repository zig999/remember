import { InvariantError } from "../../../shared/invariant-error.js";
import type { AttributeKeyRow } from "../../ingestion/catalog/catalog.js";
import type { AttributeChange, EditEffect } from "../dto/edit-entity.dto.js";
import type { AssertionStatus } from "../dto/enums.dto.js";
import type { ItemLockedRow } from "../repository/curation.repository.js";
import { LIVE_STATUSES } from "./entity-edit-attributes.js";

const VALUE_HOLDING_STATUSES: readonly AssertionStatus[] = [
  "active",
  "uncertain",
];

function isLive(held: ItemLockedRow): boolean {
  return LIVE_STATUSES.includes(held.status);
}

function holdsValue(live: readonly ItemLockedRow[], value: string): boolean {
  return live.some(
    (held) =>
      VALUE_HOLDING_STATUSES.includes(held.status) && held.value === value
  );
}

function hasEndWithoutSupersession(held: ItemLockedRow): boolean {
  return held.valid_to !== null && held.superseded_at === null;
}

function isCurrent(held: ItemLockedRow): boolean {
  return held.valid_to === null && held.superseded_at === null;
}

function effectOfUnnamedSet(
  attributeKey: AttributeKeyRow,
  value: string,
  live: readonly ItemLockedRow[]
): EditEffect {
  if (live.length === 0) {
    return "first-value";
  }
  if (!attributeKey.allows_multiple_current) {
    throw new InvariantError(
      `decideChangeEffect: key '${attributeKey.key}' allows one current value and an attribute is already live`
    );
  }
  return holdsValue(live, value) ? "unchanged" : "addition";
}

function effectOfNamedSet(
  attributeKey: AttributeKeyRow,
  value: string,
  named: ItemLockedRow
): EditEffect {
  if (value === named.value) {
    return "unchanged";
  }
  if (hasEndWithoutSupersession(named)) {
    return "correction";
  }
  if (isCurrent(named)) {
    return attributeKey.is_temporal ? "succession" : "correction";
  }
  throw new InvariantError(
    `decideChangeEffect: attribute '${named.id}' carries a supersession time and its value cannot be changed`
  );
}

export function decideChangeEffect(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  attributesOfKey: readonly ItemLockedRow[]
): EditEffect {
  if (change.kind === "remove") {
    return "removal";
  }
  if (change.value === undefined) {
    throw new InvariantError("decideChangeEffect: a set change states no value");
  }
  const live = attributesOfKey.filter(isLive);
  if (change.item_id === undefined) {
    return effectOfUnnamedSet(attributeKey, change.value, live);
  }
  const named = live.find((held) => held.id === change.item_id);
  if (named === undefined) {
    throw new InvariantError(
      `decideChangeEffect: attribute '${change.item_id}' is not a live attribute of key '${attributeKey.key}'`
    );
  }
  return effectOfNamedSet(attributeKey, change.value, named);
}
