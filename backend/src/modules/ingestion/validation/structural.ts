import { ValidationFailure } from "./errors.js";

const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_INDEX_OFFSET = 1;

function namesExistingDay(year: number, month: number, day: number): boolean {
  const candidate = new Date(0);
  candidate.setUTCFullYear(year, month - MONTH_INDEX_OFFSET, day);
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - MONTH_INDEX_OFFSET &&
    candidate.getUTCDate() === day
  );
}

export function parseAttributeValue(args: {
  value: string;
  value_type: "date" | "number" | "text" | "bool";
}): void {
  const v = args.value;
  switch (args.value_type) {
    case "text":
      return;
    case "date": {
      const match = DATE_SHAPE.exec(v);
      if (!match) {
        throw new ValidationFailure(
          "VALIDATION_INVALID_FORMAT",
          "value does not parse as a date (YYYY-MM-DD expected).",
          { value: v, value_type: args.value_type }
        );
      }
      if (!namesExistingDay(Number(match[1]), Number(match[2]), Number(match[3]))) {
        throw new ValidationFailure(
          "VALIDATION_INVALID_FORMAT",
          "value is not a calendar-valid date.",
          { value: v, value_type: args.value_type }
        );
      }
      return;
    }
    case "number": {
      if (!/^-?\d+(?:\.\d+)?$/.test(v)) {
        throw new ValidationFailure(
          "VALIDATION_INVALID_FORMAT",
          "value does not parse as a number.",
          { value: v, value_type: args.value_type }
        );
      }
      const n = Number.parseFloat(v);
      if (!Number.isFinite(n)) {
        throw new ValidationFailure(
          "VALIDATION_INVALID_FORMAT",
          "value is not a finite number.",
          { value: v, value_type: args.value_type }
        );
      }
      return;
    }
    case "bool": {
      if (v !== "true" && v !== "false") {
        throw new ValidationFailure(
          "VALIDATION_INVALID_FORMAT",
          "value does not parse as a bool (expected 'true' or 'false').",
          { value: v, value_type: args.value_type }
        );
      }
      return;
    }
  }
}

export function assertValueInDomain(
  value: string,
  domain: ReadonlySet<string>
): void {
  if (domain.has(value)) {
    return;
  }
  const allowed_values = [...domain].sort();
  throw new ValidationFailure(
    "VALIDATION_INVALID_FORMAT",
    "attribute value not in closed domain",
    { value, allowed_values }
  );
}

export function assertFound(args: {
  entity: string;
  id: string;
  found: boolean;
}): void {
  if (!args.found) {
    throw new ValidationFailure(
      "RESOURCE_NOT_FOUND",
      `${args.entity} ${args.id} not found.`,
      { entity: args.entity, id: args.id }
    );
  }
}

export function assertKnownType(args: {
  kind: "node_type" | "link_type" | "attribute_key";
  name: string;
  found: boolean;
}): void {
  if (!args.found) {
    const code =
      args.kind === "node_type"
        ? "BUSINESS_UNKNOWN_NODE_TYPE"
        : args.kind === "link_type"
          ? "BUSINESS_UNKNOWN_LINK_TYPE"
          : "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";
    throw new ValidationFailure(
      code,
      `${args.kind} '${args.name}' is not in the seeded catalog.`,
      { kind: args.kind, name: args.name }
    );
  }
}
