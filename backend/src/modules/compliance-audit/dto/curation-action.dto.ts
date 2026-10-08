import { z } from "zod";

import { UuidSchema } from "./compliance-delete.dto.js";

export const CurationActionNameSchema = z.enum([
  "resolve_entity_match",
  "merge_nodes",
  "resolve_dispute",
  "confirm_item",
  "reject_item",
  "correct_item",
  "compliance_delete",
  "edit_entity",
]);
export type CurationActionName = z.infer<typeof CurationActionNameSchema>;

export const TargetKindSchema = z.enum([
  "node",
  "link",
  "attribute",
  "fragment",
  "raw_information",
]);
export type TargetKind = z.infer<typeof TargetKindSchema>;

export const ListCurationActionsQuerySchema = z
  .object({
    action: CurationActionNameSchema.optional(),
    target_kind: TargetKindSchema.optional(),
    target_id: UuidSchema.optional(),
    created_from: z.string().datetime({ offset: true }).optional(),
    created_to: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.created_from && value.created_to) {
      if (Date.parse(value.created_from) >= Date.parse(value.created_to)) {
        ctx.addIssue({
          code: "custom",
          path: ["created_to"],
          message: "VALIDATION_OUT_OF_RANGE",
        });
      }
    }
  });
export type ListCurationActionsQuery = z.infer<
  typeof ListCurationActionsQuerySchema
>;

export const CurationActionSchema = z.object({
  id: UuidSchema,
  action: z.string(),
  target_kind: z.string(),
  target_id: UuidSchema.nullable(),
  payload: z.record(z.string(), z.unknown()),
  reason: z.string().max(1000).nullable(),
  created_at: z.string(),
});
export type CurationAction = z.infer<typeof CurationActionSchema>;

export const CurationActionListSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  items: z.array(CurationActionSchema),
});
export type CurationActionList = z.infer<typeof CurationActionListSchema>;

export const CurationActionIdParamSchema = z.object({
  curationActionId: UuidSchema,
});
