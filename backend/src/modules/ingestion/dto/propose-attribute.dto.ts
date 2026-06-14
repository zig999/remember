// MCP `ingest.propose_attribute` input/output contract (UC-11).

import { z } from "zod";

import { ChangeHintSchema, ValidFromBasisSchema } from "./propose-link.dto.js";

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD");

export const ProposeAttributeInputSchema = z.object({
  node_id: z
    .string()
    .uuid()
    .describe(
      "node_id of the entity this value belongs to (returned by propose_node). Must already exist."
    ),
  key: z
    .string()
    .min(1)
    .describe(
      "The attribute name — must be a catalog AttributeKey for this node's type (e.g. deadline)."
    ),
  /**
   * Canonical-serialized value (string form). The structural layer parses
   * this against the `attribute_key.value_type` and rejects on mismatch.
   */
  value: z
    .string()
    .min(1)
    .describe(
      "The literal value, serialized as a string. Must parse as the key's declared type (date, number, or string)."
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence 0–1 in this value. ≥0.75 stored active; 0.40–0.74 kept but flagged uncertain; <0.40 dropped."
    ),
  fragment_ids: z
    .array(z.string().uuid())
    .min(1)
    .describe(
      "Evidence: id(s) of propose_fragment claims from this chunk that state the value. At least one required."
    ),
  valid_from: IsoDateSchema.optional().describe(
    "Date the value STARTS holding (YYYY-MM-DD). Omit if the text does not state it — never invent a date."
  ),
  valid_to: IsoDateSchema.optional().describe(
    "Date the value STOPS holding (YYYY-MM-DD), if stated. Intervals are half-open [from, to)."
  ),
  valid_from_basis: ValidFromBasisSchema.optional().describe(
    "Justification for valid_from: 'stated' (written in the chunk) or 'document' (the document's date). Omit when valid_from is omitted."
  ),
  change_hint: ChangeHintSchema.default("none").describe(
    "'none' = plain assertion (re-affirming an identical fact consolidates, never duplicates); 'succession' = the value changed; 'correction' = fixes a previously wrong value."
  ),
});
export type ProposeAttributeInput = z.infer<typeof ProposeAttributeInputSchema>;

export type ProposeAttributeOutcome =
  | "accepted"
  | "consolidated"
  | "superseded_previous"
  | "disputed"
  | "rejected";

export interface ProposeAttributeResult {
  readonly attribute_id: string | null;
  readonly outcome: ProposeAttributeOutcome;
  readonly superseded_attribute_id?: string;
  readonly reason?: "BELOW_CONFIDENCE_FLOOR";
}
