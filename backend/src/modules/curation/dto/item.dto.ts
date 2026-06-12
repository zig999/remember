// DTOs for UC-08 / UC-09 / UC-10 — confirm_item, reject_item, correct_item.

import { z } from "zod";

import {
  IsoDateSchema,
  ItemKindSchema,
  ReasonRequiredSchema,
  UuidSchema,
  ValidFromSourceSchema,
} from "./enums.dto.js";

/** confirm_item — reason optional. */
export const ConfirmItemBodySchema = z.object({
  item_kind: ItemKindSchema,
  item_id: UuidSchema,
  reason: z.string().trim().min(1).optional().nullable(),
});
export type ConfirmItemBody = z.infer<typeof ConfirmItemBodySchema>;

/** reject_item — reason mandatory (destructive, BR-11). */
export const RejectItemBodySchema = z.object({
  item_kind: ItemKindSchema,
  item_id: UuidSchema,
  reason: ReasonRequiredSchema,
});
export type RejectItemBody = z.infer<typeof RejectItemBodySchema>;

/** CorrectedValues sub-shape — see CorrectItemBodySchema for cross-checks. */
export const CorrectedValuesSchema = z.object({
  value: z.string().min(1).optional().nullable(),
  target_node_id: UuidSchema.optional().nullable(),
  valid_from: IsoDateSchema.optional().nullable(),
  valid_to: IsoDateSchema.optional().nullable(),
  valid_from_source: ValidFromSourceSchema.optional().nullable(),
  valid_from_fragment_id: UuidSchema.optional().nullable(),
});
export type CorrectedValues = z.infer<typeof CorrectedValuesSchema>;

/**
 * CorrectItemRequest — BR-17 cross-field rules.
 */
export const CorrectItemBodySchema = z
  .object({
    item_kind: ItemKindSchema,
    item_id: UuidSchema,
    corrected: CorrectedValuesSchema,
    reason: ReasonRequiredSchema,
  })
  .superRefine((body, ctx) => {
    const c = body.corrected;

    // BR-18: at least one of value/target_node_id/valid_from/valid_to.
    const someProvided =
      (c.value !== undefined && c.value !== null) ||
      (c.target_node_id !== undefined && c.target_node_id !== null) ||
      (c.valid_from !== undefined && c.valid_from !== null) ||
      (c.valid_to !== undefined && c.valid_to !== null);
    if (!someProvided) {
      ctx.addIssue({
        code: "custom",
        path: ["corrected"],
        message: "BUSINESS_CORRECTION_NO_CHANGES",
      });
    }

    // Cross-field: value only on attribute, target_node_id only on link.
    if (body.item_kind === "link" && c.value !== undefined && c.value !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["corrected", "value"],
        message: "VALIDATION_INVALID_FORMAT",
      });
    }
    if (
      body.item_kind === "attribute" &&
      c.target_node_id !== undefined &&
      c.target_node_id !== null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["corrected", "target_node_id"],
        message: "VALIDATION_INVALID_FORMAT",
      });
    }

    // valid_from change requires valid_from_source.
    if (c.valid_from !== undefined && c.valid_from !== null) {
      if (
        c.valid_from_source === undefined ||
        c.valid_from_source === null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["corrected", "valid_from_source"],
          message: "BUSINESS_DATE_UNJUSTIFIED",
        });
      }
      if (
        c.valid_from_source === "stated" &&
        (c.valid_from_fragment_id === undefined ||
          c.valid_from_fragment_id === null)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["corrected", "valid_from_fragment_id"],
          message: "BUSINESS_DATE_UNJUSTIFIED",
        });
      }
    }

    // Semi-open invariant on the new pair when both supplied.
    if (
      c.valid_from !== undefined &&
      c.valid_from !== null &&
      c.valid_to !== undefined &&
      c.valid_to !== null &&
      c.valid_from >= c.valid_to
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["corrected"],
        message: "BUSINESS_TEMPORAL_INCOHERENT",
      });
    }
  });
export type CorrectItemBody = z.infer<typeof CorrectItemBodySchema>;
