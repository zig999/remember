import { toEntityEditWire } from "../api/_transforms";
import type {
  AttributeChange,
  AttributeChangeKind,
  AttributeKey,
  EntityEdit,
  EntityEditWire,
  NodeAttribute,
} from "../types";
import { changeOfField } from "./entity-change-effect";
import type {
  AttributeFieldValues,
  EntityFormValues,
} from "./entity-form-schema";
import { removedFieldsOf } from "./entity-review-entries";
import { trimmedReason } from "./entity-review-reason";

export interface FieldToSend {
  readonly field: AttributeFieldValues;
  readonly removed: boolean;
}

export interface FieldValidity {
  readonly validFrom: string | null;
  readonly validTo: string | null;
}

const NO_VALIDITY: FieldValidity = { validFrom: null, validTo: null };

export function memberOf(text: string): string | null {
  return text === "" ? null : text;
}

export function changeKindOf(
  { field, removed }: FieldToSend,
  attributeKey: AttributeKey,
  attributes: readonly NodeAttribute[],
): AttributeChangeKind {
  const subject = removed ? { ...field, value: "" } : field;
  return changeOfField(subject, attributeKey, attributes)?.kind ?? "set";
}

export function validityStatedBy(
  field: AttributeFieldValues,
  attributeKey: AttributeKey,
): FieldValidity {
  if (!attributeKey.isTemporal) return NO_VALIDITY;
  return {
    validFrom: memberOf(field.validFrom),
    validTo: memberOf(field.validTo),
  };
}

function removeChangeOf(field: AttributeFieldValues): AttributeChange {
  return {
    attributeKey: field.attributeKey,
    kind: "remove",
    value: null,
    itemId: field.itemId,
    ...NO_VALIDITY,
  };
}

function setChangeOf(
  field: AttributeFieldValues,
  attributeKey: AttributeKey,
): AttributeChange {
  return {
    attributeKey: field.attributeKey,
    kind: "set",
    value: memberOf(field.value),
    itemId: field.itemId,
    ...validityStatedBy(field, attributeKey),
  };
}

export function changeOf(
  item: FieldToSend,
  attributeKey: AttributeKey,
  attributes: readonly NodeAttribute[],
): AttributeChange {
  return changeKindOf(item, attributeKey, attributes) === "remove"
    ? removeChangeOf(item.field)
    : setChangeOf(item.field, attributeKey);
}

export function fieldsToSend(
  held: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  baseline: EntityFormValues,
): readonly FieldToSend[] {
  return [
    ...held.flatMap((field, index) =>
      changed[index] === true ? [{ field, removed: false }] : [],
    ),
    ...removedFieldsOf(held, baseline).map((field) => ({
      field,
      removed: true,
    })),
  ];
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
  const changes = fieldsToSend(held, changed, baseline)
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

export function buildEntityEditBody(
  ...args: Parameters<typeof buildEntityEdit>
): EntityEditWire {
  return toEntityEditWire(buildEntityEdit(...args));
}
