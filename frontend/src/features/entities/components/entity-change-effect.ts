import type {
  AttributeChangeKind,
  AttributeKey,
  NodeAttribute,
} from "../types";
import { holdsValue } from "./entity-field-changed";
import {
  heldAttributesOf,
  type AttributeFieldValues,
} from "./entity-form-schema";

export type EditEffect =
  | "first-value"
  | "addition"
  | "succession"
  | "correction"
  | "removal";

export const EDIT_EFFECT_WORDING: Readonly<Record<EditEffect, string>> = {
  "first-value": "Primeiro valor",
  addition: "Adição",
  succession: "Sucessão",
  correction: "Correção",
  removal: "Remoção",
};

export interface FieldChange {
  readonly kind: AttributeChangeKind;
  readonly effect: EditEffect;
  readonly itemId: string | null;
}

export type ChangeSubject = Pick<
  AttributeFieldValues,
  "attributeKey" | "itemId" | "startedWith" | "value"
>;

export function changeOfField(
  field: ChangeSubject,
  attributeKey: AttributeKey,
  attributes: readonly NodeAttribute[],
): FieldChange | null {
  const itemId = field.itemId;
  if (itemId !== null) {
    if (field.value === field.startedWith) return null;
    if (field.value === "") {
      return { kind: "remove", effect: "removal", itemId };
    }
    return {
      kind: "set",
      effect: attributeKey.isTemporal ? "succession" : "correction",
      itemId,
    };
  }
  if (field.value === "") return null;
  if (heldAttributesOf(attributes, field.attributeKey).length === 0) {
    return { kind: "set", effect: "first-value", itemId: null };
  }
  if (
    attributeKey.allowsMultiple &&
    !holdsValue(attributes, field.attributeKey, field.value)
  ) {
    return { kind: "set", effect: "addition", itemId: null };
  }
  return null;
}
