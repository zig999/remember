// DTO schemas for the compliance-audit module.
//
// Mirrors the openapi.yaml schema definitions verbatim. The same schemas are
// reused by both transports (REST + MCP) so a single source of truth governs
// input/output shape (BR-14 of `compliance-audit.back.md`).

import { z } from "zod";

/** UUID v4 (or any UUID format). */
export const UuidSchema = z.string().uuid();

/**
 * `reason` — non-empty after trim, ≤ 1000 chars (BR-01).
 *
 * Implementation note: `z.string().trim().min(1).max(1000)` runs `trim()` then
 * checks the length AFTER the trim. We want to reject `"   "` as well as
 * strings > 1000 chars (counting the original chars, the trim never lengthens
 * a string). The Zod chain is sufficient.
 */
export const ReasonSchema = z.string().trim().min(1).max(1000);

/** Body schema for POST /api/v1/compliance/deletions (BR-01). */
export const ComplianceDeleteRequestSchema = z.object({
  raw_information_id: UuidSchema,
  reason: ReasonSchema,
});
export type ComplianceDeleteRequest = z.infer<
  typeof ComplianceDeleteRequestSchema
>;

/** Outcome enum exposed by the service-layer discriminated union. */
export const ComplianceDeleteOutcomeSchema = z.enum([
  "deleted",
  "noop_already_deleted",
]);
export type ComplianceDeleteOutcome = z.infer<
  typeof ComplianceDeleteOutcomeSchema
>;

/** `affected` jsonb shape persisted on compliance_deletion.affected. */
export const ComplianceDeletionAffectedSchema = z.object({
  chunks: z.number().int().min(0),
  fragments: z.number().int().min(0),
  links: z.number().int().min(0),
  attributes: z.number().int().min(0),
});
export type ComplianceDeletionAffected = z.infer<
  typeof ComplianceDeletionAffectedSchema
>;

/** Shape of one ComplianceDeletion row as returned by the API. */
export const ComplianceDeletionSchema = z.object({
  id: UuidSchema,
  raw_information_id: UuidSchema,
  reason: ReasonSchema,
  executed_at: z.string(), // ISO timestamp (date-time) per openapi.yaml
  affected: ComplianceDeletionAffectedSchema,
});
export type ComplianceDeletion = z.infer<typeof ComplianceDeletionSchema>;

/** Response envelope of POST /compliance/deletions + MCP `compliance_delete`. */
export const ComplianceDeleteResponseSchema = z.object({
  outcome: ComplianceDeleteOutcomeSchema,
  deletion: ComplianceDeletionSchema,
});
export type ComplianceDeleteResponse = z.infer<
  typeof ComplianceDeleteResponseSchema
>;

// ---------------------------------------------------------------------------
// List endpoints — UC-02 / UC-04
// ---------------------------------------------------------------------------

/**
 * Query-string schema for GET /api/v1/compliance/deletions (UC-02).
 *
 * Time-range filters honor BR-09 (`from` inclusive, `to` exclusive). When both
 * bounds are supplied, the parser rejects `from >= to` with `VALIDATION_OUT_OF_RANGE`.
 */
export const ListComplianceDeletionsQuerySchema = z
  .object({
    raw_information_id: UuidSchema.optional(),
    executed_from: z.string().datetime({ offset: true }).optional(),
    executed_to: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.executed_from && value.executed_to) {
      if (Date.parse(value.executed_from) >= Date.parse(value.executed_to)) {
        ctx.addIssue({
          code: "custom",
          path: ["executed_to"],
          message: "VALIDATION_OUT_OF_RANGE",
        });
      }
    }
  });
export type ListComplianceDeletionsQuery = z.infer<
  typeof ListComplianceDeletionsQuerySchema
>;

/** Paginated envelope for the list endpoint. */
export const ComplianceDeletionListSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  items: z.array(ComplianceDeletionSchema),
});
export type ComplianceDeletionList = z.infer<
  typeof ComplianceDeletionListSchema
>;

/** Path param schema for /compliance/deletions/{complianceDeletionId}. */
export const ComplianceDeletionIdParamSchema = z.object({
  complianceDeletionId: UuidSchema,
});
