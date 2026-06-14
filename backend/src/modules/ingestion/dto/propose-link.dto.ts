// MCP `ingest.propose_link` input/output contract (UC-10).

import { z } from "zod";

/**
 * Closed enum for the caller-supplied `valid_from_basis` (§6.5 / A14).
 *
 * Only `stated` and `document` are accepted at the API boundary. The third
 * value, `received`, is a backend-only fallback that the temporal validator
 * applies internally when neither `stated` nor `document` can justify the
 * date — it is never sent by an LLM or any external caller, so it MUST NOT
 * appear in this input enum. Internal service / repository / validator
 * types still carry `received` because the resolved value is stored and
 * surfaced on read.
 */
export const ValidFromBasisSchema = z.enum(["stated", "document"]);
export type ValidFromBasis = z.infer<typeof ValidFromBasisSchema>;

/** Closed enum for the optional `change_hint`. */
export const ChangeHintSchema = z.enum(["none", "succession", "correction"]);
export type ChangeHint = z.infer<typeof ChangeHintSchema>;

/** ISO date `YYYY-MM-DD`. */
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD");

export const ProposeLinkInputSchema = z.object({
  source_node_id: z
    .string()
    .uuid()
    .describe(
      "node_id of the source entity (returned by propose_node). Must already exist."
    ),
  link_type: z
    .string()
    .min(1)
    .describe(
      "The relation type — must be a catalog LinkType allowed for the source/target node types (e.g. responsible_for)."
    ),
  target_node_id: z
    .string()
    .uuid()
    .describe(
      "node_id of the target entity (returned by propose_node). Must already exist."
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence 0–1 in this relation. ≥0.75 stored active; 0.40–0.74 kept but flagged uncertain; <0.40 dropped."
    ),
  fragment_ids: z
    .array(z.string().uuid())
    .min(1)
    .describe(
      "Evidence: id(s) of propose_fragment claims from this chunk that state the relation. At least one required."
    ),
  valid_from: IsoDateSchema.optional().describe(
    "Date the relation STARTS holding (YYYY-MM-DD). Omit if the text does not state it — never invent a date."
  ),
  valid_to: IsoDateSchema.optional().describe(
    "Date the relation STOPS holding (YYYY-MM-DD), if stated. Intervals are half-open [from, to)."
  ),
  valid_from_basis: ValidFromBasisSchema.optional().describe(
    "Justification for valid_from: 'stated' (written in the chunk) or 'document' (the document's date). Omit when valid_from is omitted."
  ),
  change_hint: ChangeHintSchema.default("none").describe(
    "'none' = plain assertion (re-affirming an identical fact consolidates, never duplicates); 'succession' = the relation changed; 'correction' = fixes a previously wrong value."
  ),
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
