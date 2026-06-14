// MCP `ingest.propose_node` input/output contract (UC-09).
//
// Entity resolution belongs to a future domain (`entity-resolution`) — this TC
// implements the structural layer plus the create-with-advisory-lock path
// (BR-20). When that future domain is wired in, the handler delegates to it
// from inside this same transaction.

import { z } from "zod";

export const ProposeNodeInputSchema = z.object({
  node_type: z
    .string()
    .min(1)
    .describe(
      "The entity's type — must be one of the catalog NodeTypes (e.g. Person, Project, Document)."
    ),
  name: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "The canonical name of the entity as referred to in the text (max 500 characters)."
    ),
  aliases: z
    .array(z.string().min(1).max(500))
    .optional()
    .describe(
      "Optional alternative names or spellings for the same entity; attached without duplicating."
    ),
});
export type ProposeNodeInput = z.infer<typeof ProposeNodeInputSchema>;

export type ProposeNodeResolution = "matched_existing" | "created_new" | "needs_review";

export interface ProposeNodeResult {
  readonly node_id: string;
  readonly resolution: ProposeNodeResolution;
}
