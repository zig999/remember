// Structural validation layer (Layer 1 of BR-13 / BR-14).
//
// This is the second pass on top of the Zod parse done at the MCP transport
// edge. Zod already covers: field presence, primitive types, length/range,
// enum membership. THIS layer covers:
//
//   - Type-catalog membership (UNKNOWN_TYPE):
//       node_type, link_type, attribute_key all live in the seeded catalog.
//   - Cross-table compatibility (STRUCTURAL_INVALID):
//       * `propose_attribute`: key.node_type_id == node.node_type_id;
//       * `propose_attribute`: value parseable as key.value_type;
//       * `propose_fragment`: every chunk_id belongs to the run's source.
//   - Existence of referenced rows (NOT_FOUND):
//       chunk_id / fragment_id / node_id resolve to real rows.
//
// Anti-hallucination (Layer 5) — that every fragment_id is anchored in a chunk
// of the run's source — lives in its own module so the order matters: this
// layer only confirms a fragment EXISTS; layer 5 confirms its PROVENANCE.

import { ValidationFailure } from "./errors.js";

/**
 * Parse a `value` string against its declared `value_type`. The DB stores the
 * canonical serialized form (string column with generated typed columns).
 * Rejects "tomorrow" for `date`, "abc" for `number`, etc.
 */
export function parseAttributeValue(args: {
  value: string;
  value_type: "date" | "number" | "text" | "bool";
}): void {
  const v = args.value;
  switch (args.value_type) {
    case "text":
      // Empty already rejected by Zod min(1); anything else is valid text.
      return;
    case "date": {
      // Strict ISO YYYY-MM-DD; not free-form.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "value does not parse as a date (YYYY-MM-DD expected).",
          { value: v, value_type: args.value_type }
        );
      }
      // Validate it's a real calendar date by parsing.
      const ts = Date.parse(`${v}T00:00:00Z`);
      if (Number.isNaN(ts)) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "value is not a calendar-valid date.",
          { value: v }
        );
      }
      return;
    }
    case "number": {
      // Strict: must be a finite numeric literal (no NaN, no Infinity).
      if (!/^-?\d+(?:\.\d+)?$/.test(v)) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "value does not parse as a number.",
          { value: v, value_type: args.value_type }
        );
      }
      const n = Number.parseFloat(v);
      if (!Number.isFinite(n)) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "value is not a finite number.",
          { value: v }
        );
      }
      return;
    }
    case "bool": {
      if (v !== "true" && v !== "false") {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "value does not parse as a bool (expected 'true' or 'false').",
          { value: v }
        );
      }
      return;
    }
  }
}

/**
 * Assert a referenced entity exists, raising `NOT_FOUND` on miss. Used to map
 * missing chunk_id / fragment_id / node_id to a typed envelope code.
 */
export function assertFound(args: {
  entity: string;
  id: string;
  found: boolean;
}): void {
  if (!args.found) {
    throw new ValidationFailure(
      "NOT_FOUND",
      `${args.entity} ${args.id} not found.`,
      { entity: args.entity, id: args.id }
    );
  }
}

/** Assert a catalog membership; raise `UNKNOWN_TYPE` on miss. */
export function assertKnownType(args: {
  kind: "node_type" | "link_type" | "attribute_key";
  name: string;
  found: boolean;
}): void {
  if (!args.found) {
    throw new ValidationFailure(
      "UNKNOWN_TYPE",
      `${args.kind} '${args.name}' is not in the seeded catalog.`,
      { kind: args.kind, name: args.name }
    );
  }
}
