// MCP `ingest.propose_attribute` input/output contract (UC-11).

import { z } from "zod";

import { ChangeHintSchema, ValidFromBasisSchema } from "./propose-link.dto.js";

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD");

export const ProposeAttributeInputSchema = z.object({
  node_id: z.string().uuid(),
  key: z.string().min(1),
  /**
   * Canonical-serialized value (string form). The structural layer parses
   * this against the `attribute_key.value_type` and rejects on mismatch.
   */
  value: z.string().min(1),
  confidence: z.number().min(0).max(1),
  fragment_ids: z.array(z.string().uuid()).min(1),
  valid_from: IsoDateSchema.optional(),
  valid_to: IsoDateSchema.optional(),
  valid_from_basis: ValidFromBasisSchema.optional(),
  change_hint: ChangeHintSchema.default("none"),
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
