import {
  attributeKeyCacheKey,
  domainOf,
} from "../../ingestion/catalog/catalog.js";
import type {
  AttributeKeyRow,
  CatalogSnapshot,
  NodeTypeRow,
} from "../../ingestion/catalog/catalog.js";
import { isValidationFailure } from "../../ingestion/validation/errors.js";
import type { ValidationFailure } from "../../ingestion/validation/errors.js";
import {
  assertValueInDomain,
  parseAttributeValue,
} from "../../ingestion/validation/structural.js";
import type { AttributeChange } from "../dto/edit-entity.dto.js";
import { BusinessError } from "./errors.js";

const UNKNOWN_ATTRIBUTE_KEY_CODE = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";
const INVALID_ATTRIBUTE_VALUE_CODE = "BUSINESS_INVALID_ATTRIBUTE_VALUE";
const ALLOWED_VALUES_SEPARATOR = ", ";

export function resolveAttributeKey(
  catalog: CatalogSnapshot,
  nodeType: NodeTypeRow,
  attributeKeyName: string
): AttributeKeyRow {
  const attributeKey = catalog.attributeKeyByNodeTypeAndKey.get(
    attributeKeyCacheKey(nodeType.id, attributeKeyName)
  );
  if (attributeKey === undefined) {
    throw new BusinessError(
      UNKNOWN_ATTRIBUTE_KEY_CODE,
      `Attribute key '${attributeKeyName}' is not held by the catalog for node type '${nodeType.name}'.`,
      { attribute_key: attributeKeyName, node_type: nodeType.name }
    );
  }
  return attributeKey;
}

function refuseOnValidationFailure(
  check: () => void,
  refusal: (failure: ValidationFailure) => BusinessError
): void {
  try {
    check();
  } catch (err) {
    if (isValidationFailure(err)) {
      throw refusal(err);
    }
    throw new Error("An attribute value check failed unexpectedly.", {
      cause: err,
    });
  }
}

function allowedValuesOf(failure: ValidationFailure): string[] {
  const allowed = failure.details.allowed_values;
  return Array.isArray(allowed)
    ? allowed.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function assertValueReadsAsType(
  value: string,
  attributeKey: AttributeKeyRow
): void {
  refuseOnValidationFailure(
    () =>
      parseAttributeValue({ value, value_type: attributeKey.value_type }),
    () =>
      new BusinessError(
        INVALID_ATTRIBUTE_VALUE_CODE,
        `Value '${value}' does not read as value type '${attributeKey.value_type}'.`,
        { value_type: attributeKey.value_type, value }
      )
  );
}

function assertValueAllowed(
  catalog: CatalogSnapshot,
  value: string,
  attributeKey: AttributeKeyRow
): void {
  const domain = domainOf(catalog, attributeKey.id);
  if (domain === null) {
    return;
  }
  refuseOnValidationFailure(
    () => assertValueInDomain(value, domain),
    (failure) => {
      const allowedValues = allowedValuesOf(failure);
      return new BusinessError(
        INVALID_ATTRIBUTE_VALUE_CODE,
        `Value '${value}' is not an allowed value of attribute key '${attributeKey.key}'; allowed values: ${allowedValues.join(ALLOWED_VALUES_SEPARATOR)}.`,
        {
          attribute_key: attributeKey.key,
          value,
          allowed_values: allowedValues,
        }
      );
    }
  );
}

export function checkChangeAgainstCatalog(
  catalog: CatalogSnapshot,
  nodeType: NodeTypeRow,
  change: AttributeChange
): void {
  const attributeKey = resolveAttributeKey(
    catalog,
    nodeType,
    change.attribute_key
  );
  if (change.kind !== "set" || change.value === undefined) {
    return;
  }
  assertValueReadsAsType(change.value, attributeKey);
  assertValueAllowed(catalog, change.value, attributeKey);
}
