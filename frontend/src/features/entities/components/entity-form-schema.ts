import { z } from "zod";
import type { AttributeKey, NodeAttribute, NodeRead } from "../types";

export const DISPUTED_ATTRIBUTE_STATUS = "disputed";

export const attributeFieldSchema = z.object({
  attributeKey: z.string().min(1),
  itemId: z.string().nullable(),
  startedWith: z.string(),
  value: z.string(),
});

export const entityFormSchema = z.object({
  fields: z.array(attributeFieldSchema),
});

export type AttributeFieldValues = z.infer<typeof attributeFieldSchema>;
export type EntityFormValues = z.infer<typeof entityFormSchema>;

export interface FieldGroup {
  readonly attributeKey: AttributeKey;
  readonly disputed: boolean;
  readonly fieldIndexes: readonly number[];
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

export function buildFormValues(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): EntityFormValues {
  const fields = attributeKeys.flatMap((attributeKey): AttributeFieldValues[] => {
    if (isDisputedKey(node.attributes, attributeKey.key)) return [];
    const current = currentAttributeOf(node.attributes, attributeKey.key);
    const startedWith = current?.value ?? "";
    return [
      {
        attributeKey: attributeKey.key,
        itemId: current?.id ?? null,
        startedWith,
        value: startedWith,
      },
    ];
  });
  return { fields };
}

export function buildFieldGroups(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
  values: EntityFormValues,
): readonly FieldGroup[] {
  return attributeKeys.map((attributeKey) => ({
    attributeKey,
    disputed: isDisputedKey(node.attributes, attributeKey.key),
    fieldIndexes: values.fields.flatMap((field, index) =>
      field.attributeKey === attributeKey.key ? [index] : [],
    ),
  }));
}
