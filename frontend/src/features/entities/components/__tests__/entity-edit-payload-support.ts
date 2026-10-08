import type {
  AttributeChangeWire,
  AttributeKey,
  EntityEditWire,
  NodeRead,
} from "../../types";
import { buildEntityEditBody } from "../entity-edit-payload";
import { changedFlags } from "../entity-field-changed";
import {
  buildFormValues,
  emptyField,
  type AttributeFieldValues,
} from "../entity-form-schema";
import { multiKey } from "./entity-form-multi-support";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  staleAttribute,
} from "./entity-form-support";
import { temporalKey } from "./entity-form-validity-support";

export const REASON = "Corrigido após a auditoria";

export const PAYLOAD_KEYS: readonly AttributeKey[] = [
  catalogKey("title"),
  temporalKey("role"),
  temporalKey("deadline"),
  multiKey("tag"),
  catalogKey("owner"),
  catalogKey("note"),
];

export const PAYLOAD_NODE: NodeRead = nodeHolding([
  heldAttribute("title", "Alpha", { id: "at-title" }),
  heldAttribute("role", "Open", { id: "at-role" }),
  heldAttribute("deadline", "Q1", { id: "at-deadline" }),
  heldAttribute("tag", "Red", { id: "at-tag-red" }),
  heldAttribute("tag", "Blue", { id: "at-tag-blue" }),
  heldAttribute("tag", "Green", { id: "at-tag-green", status: "uncertain" }),
  staleAttribute("tag", "Violet"),
  heldAttribute("note", "Gamma", { id: "at-note" }),
]);

export type FieldEdit = (
  fields: readonly AttributeFieldValues[],
) => readonly AttributeFieldValues[];

export const UNCHANGED: FieldEdit = (fields) => fields;

function holds(key: string, value: string) {
  return (field: AttributeFieldValues): boolean =>
    field.attributeKey === key && field.value === value;
}

export function patched(
  key: string,
  value: string,
  patch: Partial<AttributeFieldValues>,
): FieldEdit {
  return (fields) => {
    if (!fields.some(holds(key, value))) {
      throw new Error(`no field of ${key} holds "${value}"`);
    }
    return fields.map((field) =>
      holds(key, value)(field) ? { ...field, ...patch } : field,
    );
  };
}

export function dropped(key: string, value: string): FieldEdit {
  return (fields) => {
    if (!fields.some(holds(key, value))) {
      throw new Error(`no field of ${key} holds "${value}"`);
    }
    return fields.filter((field) => !holds(key, value)(field));
  };
}

export function appended(key: string, value: string): FieldEdit {
  return (fields) => [...fields, { ...emptyField(key), value }];
}

export function inSequence(...edits: readonly FieldEdit[]): FieldEdit {
  return (fields) => edits.reduce((current, edit) => edit(current), fields);
}

export function bodyOf(edit: FieldEdit, reason: string = REASON): EntityEditWire {
  const baseline = buildFormValues(PAYLOAD_NODE, PAYLOAD_KEYS);
  const held = edit(baseline.fields);
  const changed = changedFlags(held, PAYLOAD_KEYS, PAYLOAD_NODE.attributes);
  const body = buildEntityEditBody(
    reason,
    held,
    changed,
    baseline,
    PAYLOAD_KEYS,
    PAYLOAD_NODE.attributes,
  );
  return JSON.parse(JSON.stringify(body)) as EntityEditWire;
}

export function setOf(
  attributeKey: string,
  value: string,
  itemId: string | null,
  validFrom: string | null = null,
  validTo: string | null = null,
): AttributeChangeWire {
  return {
    attribute_key: attributeKey,
    kind: "set",
    value,
    item_id: itemId,
    valid_from: validFrom,
    valid_to: validTo,
  };
}

export function removeOf(
  attributeKey: string,
  itemId: string,
): AttributeChangeWire {
  return {
    attribute_key: attributeKey,
    kind: "remove",
    value: null,
    item_id: itemId,
    valid_from: null,
    valid_to: null,
  };
}

function orderKeyOf(change: AttributeChangeWire): string {
  return [
    change.attribute_key,
    change.item_id ?? "",
    change.kind,
    change.value ?? "",
  ].join("\u0000");
}

export function inAnyOrder(
  changes: readonly AttributeChangeWire[],
): AttributeChangeWire[] {
  return [...changes].sort((first, second) =>
    orderKeyOf(first).localeCompare(orderKeyOf(second)),
  );
}

export function sentInAnyOrder(body: EntityEditWire): EntityEditWire {
  return { ...body, changes: inAnyOrder(body.changes) };
}

export function expectedBody(
  reason: string,
  changes: readonly AttributeChangeWire[],
): EntityEditWire {
  return { reason, changes: inAnyOrder(changes) };
}
