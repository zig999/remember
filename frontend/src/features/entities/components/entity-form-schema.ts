import { z } from "zod";
import type { AttributeKey, NodeAttribute, NodeRead } from "../types";
import { valueTypeMessage } from "./entity-value-types";

export const DISPUTED_ATTRIBUTE_STATUS = "disputed";

export const attributeFieldSchema = z.object({
  attributeKey: z.string().min(1),
  itemId: z.string().nullable(),
  startedWith: z.string(),
  value: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
});

export const entityFormSchema = z.object({
  fields: z.array(attributeFieldSchema),
});

export function buildEntityFormSchema(attributeKeys: readonly AttributeKey[]) {
  const valueTypes = new Map(
    attributeKeys.map(
      (attributeKey) => [attributeKey.key, attributeKey.valueType] as const,
    ),
  );
  return z.object({
    fields: z.array(attributeFieldSchema).superRefine((fields, ctx) => {
      fields.forEach((field, index) => {
        const valueType = valueTypes.get(field.attributeKey);
        if (valueType === undefined) return;
        const message = valueTypeMessage(valueType, field.value);
        if (message === null) return;
        ctx.addIssue({ code: "custom", message, path: [index, "value"] });
      });
    }),
  });
}

export type AttributeFieldValues = z.infer<typeof attributeFieldSchema>;
export type EntityFormValues = z.infer<typeof entityFormSchema>;

export interface IdentifiedFieldValues extends AttributeFieldValues {
  readonly id: string;
}

export interface GroupField {
  readonly index: number;
  readonly id: string;
}

export interface FieldGroup {
  readonly attributeKey: AttributeKey;
  readonly disputed: boolean;
  readonly heldValues: readonly NodeAttribute[];
  readonly fields: readonly GroupField[];
}

const HELD_ATTRIBUTE_STATUSES: readonly string[] = [
  "active",
  "uncertain",
  DISPUTED_ATTRIBUTE_STATUS,
];

export function heldAttributesOf(
  attributes: readonly NodeAttribute[],
  key: string,
): NodeAttribute[] {
  return attributes.filter(
    (attribute) =>
      attribute.attributeKey === key &&
      HELD_ATTRIBUTE_STATUSES.includes(attribute.status),
  );
}

export function isDisputedKey(
  attributes: readonly NodeAttribute[],
  key: string,
): boolean {
  return attributes.some(
    (attribute) =>
      attribute.attributeKey === key &&
      attribute.status === DISPUTED_ATTRIBUTE_STATUS,
  );
}

export function currentAttributeOf(
  attributes: readonly NodeAttribute[],
  key: string,
): NodeAttribute | undefined {
  return attributes.find(
    (attribute) => attribute.attributeKey === key && attribute.isCurrent,
  );
}

export function currentAttributesOf(
  attributes: readonly NodeAttribute[],
  key: string,
): NodeAttribute[] {
  return attributes.filter(
    (attribute) => attribute.attributeKey === key && attribute.isCurrent,
  );
}

export function emptyField(key: string): AttributeFieldValues {
  return {
    attributeKey: key,
    itemId: null,
    startedWith: "",
    value: "",
    validFrom: "",
    validTo: "",
  };
}

function fieldStartingFrom(attribute: NodeAttribute): AttributeFieldValues {
  return {
    attributeKey: attribute.attributeKey,
    itemId: attribute.id,
    startedWith: attribute.value,
    value: attribute.value,
    validFrom: "",
    validTo: "",
  };
}

function startingFieldsOf(
  node: NodeRead,
  attributeKey: AttributeKey,
): AttributeFieldValues[] {
  const key = attributeKey.key;
  if (isDisputedKey(node.attributes, key)) return [];
  if (attributeKey.allowsMultiple) {
    const held = currentAttributesOf(node.attributes, key);
    return held.length > 0 ? held.map(fieldStartingFrom) : [emptyField(key)];
  }
  const current = currentAttributeOf(node.attributes, key);
  return [current === undefined ? emptyField(key) : fieldStartingFrom(current)];
}

export function buildFormValues(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): EntityFormValues {
  return {
    fields: attributeKeys.flatMap((attributeKey) =>
      startingFieldsOf(node, attributeKey),
    ),
  };
}

export function buildFieldGroups(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
  fields: readonly IdentifiedFieldValues[],
): readonly FieldGroup[] {
  return attributeKeys.map((attributeKey) => {
    const disputed = isDisputedKey(node.attributes, attributeKey.key);
    return {
      attributeKey,
      disputed,
      heldValues: disputed
        ? heldAttributesOf(node.attributes, attributeKey.key)
        : [],
      fields: fields.flatMap((field, index) =>
        field.attributeKey === attributeKey.key
          ? [{ index, id: field.id }]
          : [],
      ),
    };
  });
}
