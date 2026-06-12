// DTO schemas for the curation_action audit endpoints (UC-04, UC-05).
//
// Mirrors the openapi.yaml shapes. The `action` filter is validated at the API
// layer ONLY (BR-10) — the underlying DB column is plain `text` (schema line
// 454).

import { z } from "zod";

import { UuidSchema } from "./compliance-delete.dto.js";

/** 7 curation-tool names of §14.4 (BR-10). */
export const CurationActionNameSchema = z.enum([
  "resolve_entity_match",
  "merge_nodes",
  "resolve_dispute",
  "confirm_item",
  "reject_item",
  "correct_item",
  "compliance_delete",
]);
export type CurationActionName = z.infer<typeof CurationActionNameSchema>;

/** Allowed target_kind values (mirrors openapi.yaml). */
export const TargetKindSchema = z.enum([
  "node",
  "link",
  "attribute",
  "fragment",
  "raw_information",
]);
export type TargetKind = z.infer<typeof TargetKindSchema>;

/**
 * Query string for GET /api/v1/audit/curation-actions (UC-04). BR-09 semi-open
 * time-range honored (`from` inclusive, `to` exclusive); BR-10 action enum
 * validated here.
 */
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

/** Shape of one CurationAction row as returned by the API. */
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

/** Paginated envelope of the list endpoint. */
export const CurationActionListSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  items: z.array(CurationActionSchema),
});
export type CurationActionList = z.infer<typeof CurationActionListSchema>;

/** Path param schema for /audit/curation-actions/{curationActionId}. */
export const CurationActionIdParamSchema = z.object({
  curationActionId: UuidSchema,
});
