import { z } from "zod";

import {
  IsoDateSchema,
  ReasonRequiredSchema,
  UuidSchema,
} from "./enums.dto.js";

export const ENTITY_EDIT_REASON_MAX_LENGTH = 1000;

export const AttributeChangeKindSchema = z.enum(["set", "remove"]);
export type AttributeChangeKind = z.infer<typeof AttributeChangeKindSchema>;

function nullAsNotStated<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export const AttributeChangeSchema = z
  .object({
    attribute_key: z.string(),
    kind: AttributeChangeKindSchema,
    value: z.string().nullish().transform(nullAsNotStated),
    item_id: UuidSchema.nullish().transform(nullAsNotStated),
    valid_from: IsoDateSchema.nullish().transform(nullAsNotStated),
    valid_to: IsoDateSchema.nullish().transform(nullAsNotStated),
  })
  .superRefine((change, ctx) => {
    const statesValue = change.value !== undefined;
    if (change.kind === "set" && !statesValue) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "A set change must state a value.",
      });
    }
    if (change.kind === "remove" && statesValue) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "A remove change must not state a value.",
      });
    }
    if (change.kind === "remove" && change.item_id === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["item_id"],
        message: "A remove change must name the attribute it removes.",
      });
    }
  });
export type AttributeChange = z.infer<typeof AttributeChangeSchema>;

export const EditEntityBodySchema = z.object({
  reason: ReasonRequiredSchema.max(ENTITY_EDIT_REASON_MAX_LENGTH),
  changes: z.array(AttributeChangeSchema),
});
export type EditEntityBody = z.infer<typeof EditEntityBodySchema>;
