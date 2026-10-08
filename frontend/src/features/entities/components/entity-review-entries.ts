import type { AttributeKey } from "../types";
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
}

function heldEntry(
  field: AttributeFieldValues,
  index: number,
  temporal: ReadonlyMap<string, boolean>,
): ReviewEntry {
  return {
    id: `field-${index}`,
    attributeKey: field.attributeKey,
    startedWith: field.startedWith,
    value: field.value,
    validity:
      temporal.get(field.attributeKey) === true
        ? { from: field.validFrom, to: field.validTo }
        : null,
  };
}

function removedEntry(field: AttributeFieldValues): ReviewEntry {
  return {
    id: `removed-${field.itemId ?? ""}`,
    attributeKey: field.attributeKey,
    startedWith: field.startedWith,
    value: "",
    validity: null,
  };
}

export function reviewEntriesOf(
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
  attributeKeys: readonly AttributeKey[],
): readonly ReviewEntry[] {
  const temporal = new Map(
    attributeKeys.map(
      (attributeKey) => [attributeKey.key, attributeKey.isTemporal] as const,
    ),
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
    changed[index] === true ? [heldEntry(field, index, temporal)] : [],
  );
  const removedEntries = baseline.fields.flatMap((field) =>
    field.itemId !== null && field.startedWith !== "" && !kept.has(field.itemId)
      ? [removedEntry(field)]
      : [],
  );

  const rank = (entry: ReviewEntry): number =>
    order.get(entry.attributeKey) ?? order.size;
  return [...changedEntries, ...removedEntries].sort(
    (first, second) => rank(first) - rank(second),
  );
}
