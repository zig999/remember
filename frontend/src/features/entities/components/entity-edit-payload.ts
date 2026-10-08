import type {
  AttributeChange,
  AttributeKey,
  EntityEdit,
  NodeAttribute,
} from "../types";
import { changeOfField } from "./entity-change-effect";
import type {
  AttributeFieldValues,
  EntityFormValues,
} from "./entity-form-schema";
import { removedFieldsOf } from "./entity-review-entries";
import { trimmedReason } from "./entity-review-reason";

interface FieldToSend {
  readonly field: AttributeFieldValues;
  readonly removed: boolean;
}

function memberOf(text: string): string | null {
  return text === "" ? null : text;
}

function changeOf(
  { field, removed }: FieldToSend,
  attributeKey: AttributeKey,
  attributes: readonly NodeAttribute[],
): AttributeChange {
  const subject = removed ? { ...field, value: "" } : field;
  const found = changeOfField(subject, attributeKey, attributes);
  const kind = found?.kind ?? "set";
  const itemId = found === null ? field.itemId : found.itemId;
  if (kind === "remove") {
    return {
      attributeKey: field.attributeKey,
      kind,
      value: null,
      itemId,
      validFrom: null,
      validTo: null,
    };
  }
  return {
    attributeKey: field.attributeKey,
    kind,
    value: memberOf(field.value),
    itemId,
    validFrom: attributeKey.isTemporal ? memberOf(field.validFrom) : null,
    validTo: attributeKey.isTemporal ? memberOf(field.validTo) : null,
  };
}

export function buildEntityEdit(
  reason: string,
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
  attributeKeys: readonly AttributeKey[],
  attributes: readonly NodeAttribute[],
): EntityEdit {
  const keys = new Map(
    attributeKeys.map(
      (attributeKey, position) =>
        [attributeKey.key, { attributeKey, position }] as const,
    ),
  );
  const toSend: readonly FieldToSend[] = [
    ...held.flatMap((field, index) =>
      changed[index] === true ? [{ field, removed: false }] : [],
    ),
    ...removedFieldsOf(held, baseline).map((field) => ({
      field,
      removed: true,
    })),
  ];
  const changes = toSend
    .flatMap((item) => {
      const entry = keys.get(item.field.attributeKey);
      return entry === undefined
        ? []
        : [
            {
              position: entry.position,
              change: changeOf(item, entry.attributeKey, attributes),
            },
          ];
    })
    .sort((first, second) => first.position - second.position)
    .map(({ change }) => change);
  return { reason: trimmedReason(reason), changes };
}
