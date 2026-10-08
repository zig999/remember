import type { AttributeKeyRow } from "../../ingestion/catalog/catalog.js";
import type { AttributeChange } from "../dto/edit-entity.dto.js";
import { BusinessError } from "./errors.js";

const TEMPORAL_INCOHERENT_CODE = "BUSINESS_TEMPORAL_INCOHERENT";
const ISO_DATE_LENGTH = 10;

function utcCalendarDateOf(moment: Date): string {
  return moment.toISOString().slice(0, ISO_DATE_LENGTH);
}

function incoherentChange(
  message: string,
  change: AttributeChange
): BusinessError {
  return new BusinessError(TEMPORAL_INCOHERENT_CODE, message, {
    attribute_key: change.attribute_key,
    valid_from: change.valid_from ?? null,
    valid_to: change.valid_to ?? null,
  });
}

function assertStableKeyStatesNoValidity(
  attributeKey: AttributeKeyRow,
  change: AttributeChange
): void {
  const statesValidity =
    change.valid_from !== undefined || change.valid_to !== undefined;
  if (!attributeKey.is_temporal && statesValidity) {
    throw incoherentChange(
      `Attribute key '${attributeKey.key}' is not temporal and its change must state no validity start and no validity end.`,
      change
    );
  }
}

function assertStartBeforeEnd(change: AttributeChange): void {
  if (change.valid_from === undefined || change.valid_to === undefined) {
    return;
  }
  if (change.valid_from >= change.valid_to) {
    throw incoherentChange(
      "The validity start must be strictly before the validity end.",
      change
    );
  }
}

function assertDefaultedStartPrecedesEnd(
  change: AttributeChange,
  today: string
): void {
  const startsAtDefault =
    change.kind === "set" && change.valid_from === undefined;
  if (
    startsAtDefault &&
    change.valid_to !== undefined &&
    change.valid_to <= today
  ) {
    throw incoherentChange(
      "A set change that states a validity end and no validity start must state an end after today.",
      change
    );
  }
}

export function checkChangeValidity(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  editedAt: Date
): void {
  assertStableKeyStatesNoValidity(attributeKey, change);
  assertStartBeforeEnd(change);
  assertDefaultedStartPrecedesEnd(change, utcCalendarDateOf(editedAt));
}
