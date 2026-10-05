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

export const ALIAS_NOT_IN_SOURCE = "ALIAS_NOT_IN_SOURCE" as const;

export interface AliasNotAdmitted {
  readonly alias: string;
  readonly reason: typeof ALIAS_NOT_IN_SOURCE;
}

export interface ProposeNodeResult {
  readonly node_id: string;
  readonly resolution: ProposeNodeResolution;
  readonly aliases_not_admitted?: readonly AliasNotAdmitted[];
}
