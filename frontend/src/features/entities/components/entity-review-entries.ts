import type { AttributeKey, NodeAttribute } from "../types";
import { changeOfField, type EditEffect } from "./entity-change-effect";
import type {
  AttributeFieldValues,
  EntityFormValues,
} from "./entity-form-schema";

export interface ReviewValidity {
  readonly from: string;
  readonly to: string;
}

export interface ReviewEntry {
  readonly id: string;
  readonly attributeKey: string;
  readonly startedWith: string;
  readonly value: string;
  readonly validity: ReviewValidity | null;
  readonly effect: EditEffect | null;
}

type KeysByName = ReadonlyMap<string, AttributeKey>;

function effectOf(
  field: AttributeFieldValues,
  keys: KeysByName,
  attributes: readonly NodeAttribute[],
): EditEffect | null {
  const attributeKey = keys.get(field.attributeKey);
  if (attributeKey === undefined) return null;
  return changeOfField(field, attributeKey, attributes)?.effect ?? null;
}

function heldEntry(
  field: AttributeFieldValues,
  index: number,
  keys: KeysByName,
  attributes: readonly NodeAttribute[],
): ReviewEntry {
  return {
    id: `field-${index}`,
    attributeKey: field.attributeKey,
    startedWith: field.startedWith,
    value: field.value,
    validity:
      keys.get(field.attributeKey)?.isTemporal === true
        ? { from: field.validFrom, to: field.validTo }
        : null,
    effect: effectOf(field, keys, attributes),
  };
}

function removedEntry(
  field: AttributeFieldValues,
  keys: KeysByName,
  attributes: readonly NodeAttribute[],
): ReviewEntry {
  return {
    id: `removed-${field.itemId ?? ""}`,
    attributeKey: field.attributeKey,
    startedWith: field.startedWith,
    value: "",
    validity: null,
    effect: effectOf({ ...field, value: "" }, keys, attributes),
  };
}

export function reviewEntriesOf(
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
  attributeKeys: readonly AttributeKey[],
  attributes: readonly NodeAttribute[],
): readonly ReviewEntry[] {
  const keys: KeysByName = new Map(
    attributeKeys.map((attributeKey) => [attributeKey.key, attributeKey] as const),
  );
  const order = new Map(
    attributeKeys.map(
      (attributeKey, position) => [attributeKey.key, position] as const,
    ),
  );
  const kept = new Set(
    held.flatMap((field) => (field.itemId === null ? [] : [field.itemId])),
  );

  const changedEntries = held.flatMap((field, index) =>
    changed[index] === true
      ? [heldEntry(field, index, keys, attributes)]
      : [],
  );
  const removedEntries = baseline.fields.flatMap((field) =>
    field.itemId !== null && field.startedWith !== "" && !kept.has(field.itemId)
      ? [removedEntry(field, keys, attributes)]
      : [],
  );

  const rank = (entry: ReviewEntry): number =>
    order.get(entry.attributeKey) ?? order.size;
  return [...changedEntries, ...removedEntries].sort(
    (first, second) => rank(first) - rank(second),
  );
}
