import type { AttributeKey, NodeAttribute } from "../types";
import type { AttributeFieldValues } from "./entity-form-schema";

export const HELD_ATTRIBUTE_STATUSES: readonly string[] = [
  "active",
  "uncertain",
];

function holdsValue(
  attributes: readonly NodeAttribute[],
  key: string,
  value: string,
): boolean {
  return attributes.some(
    (attribute) =>
      attribute.attributeKey === key &&
      HELD_ATTRIBUTE_STATUSES.includes(attribute.status) &&
      attribute.value === value,
  );
}

export function isFieldChanged(
  field: AttributeFieldValues,
  attributes: readonly NodeAttribute[],
  allowsMultiple: boolean,
): boolean {
  if (field.value === field.startedWith) return false;
  if (
    allowsMultiple &&
    field.itemId === null &&
    holdsValue(attributes, field.attributeKey, field.value)
  ) {
    return false;
  }
  return true;
}

export function changedFlags(
  fields: readonly AttributeFieldValues[],
  attributeKeys: readonly AttributeKey[],
  attributes: readonly NodeAttribute[],
): readonly boolean[] {
  const multiple = new Map(
    attributeKeys.map(
      (attributeKey) => [attributeKey.key, attributeKey.allowsMultiple] as const,
    ),
  );
  return fields.map((field) => {
    const allowsMultiple = multiple.get(field.attributeKey);
    return (
      allowsMultiple !== undefined &&
      isFieldChanged(field, attributes, allowsMultiple)
    );
  });
}
