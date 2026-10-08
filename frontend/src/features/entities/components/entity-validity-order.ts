import type { AttributeKey } from "../types";
import type { AttributeFieldValues } from "./entity-form-schema";

export const VALIDITY_ORDER_MESSAGE = "O início deve ser anterior ao fim.";

export function validityOrderMessage(
  validFrom: string,
  validTo: string,
): string | null {
  if (validFrom === "" || validTo === "") return null;
  return validFrom < validTo ? null : VALIDITY_ORDER_MESSAGE;
}

export function validityOrderMessages(
  fields: readonly AttributeFieldValues[],
  changed: readonly boolean[],
  attributeKeys: readonly AttributeKey[],
): readonly (string | null)[] {
  const temporal = new Set(
    attributeKeys
      .filter((attributeKey) => attributeKey.isTemporal)
      .map((attributeKey) => attributeKey.key),
  );
  return fields.map((field, index) =>
    changed[index] === true && temporal.has(field.attributeKey)
      ? validityOrderMessage(field.validFrom, field.validTo)
      : null,
  );
}
