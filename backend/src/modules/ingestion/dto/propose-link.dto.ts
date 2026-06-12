// MCP `ingest.propose_link` input/output contract (UC-10).

import { z } from "zod";

/** Closed enum for `valid_from_basis` (§6.5 / A14). */
export const ValidFromBasisSchema = z.enum(["stated", "document", "received"]);
export type ValidFromBasis = z.infer<typeof ValidFromBasisSchema>;

/** Closed enum for the optional `change_hint`. */
export const ChangeHintSchema = z.enum(["none", "succession", "correction"]);
export type ChangeHint = z.infer<typeof ChangeHintSchema>;

/** ISO date `YYYY-MM-DD`. */
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD");

export const ProposeLinkInputSchema = z.object({
  source_node_id: z.string().uuid(),
  link_type: z.string().min(1),
  target_node_id: z.string().uuid(),
  confidence: z.number().min(0).max(1),
  fragment_ids: z.array(z.string().uuid()).min(1),
  valid_from: IsoDateSchema.optional(),
  valid_to: IsoDateSchema.optional(),
  valid_from_basis: ValidFromBasisSchema.optional(),
  change_hint: ChangeHintSchema.default("none"),
});
export type ProposeLinkInput = z.infer<typeof ProposeLinkInputSchema>;

/** Closed list of business outcomes returned in `ok:true` envelopes. */
export type ProposeLinkOutcome =
  | "accepted"
  | "consolidated"
  | "superseded_previous"
  | "disputed"
  | "rejected";

export interface ProposeLinkResult {
  readonly link_id: string | null;
  readonly outcome: ProposeLinkOutcome;
  readonly superseded_link_id?: string;
  readonly reason?: "BELOW_CONFIDENCE_FLOOR";
}
