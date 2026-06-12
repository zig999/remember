// DTOs for UC-05/UC-06/UC-07 — POST /api/v1/curation/disputes/resolve.

import { z } from "zod";

import {
  DisputeDecisionSchema,
  IsoDateSchema,
  ItemKindSchema,
  UuidSchema,
} from "./enums.dto.js";

/** A single (item_id, valid_from, valid_to) entry inside `periods[]`. */
export const AdjustedPeriodSchema = z.object({
  item_id: UuidSchema,
  valid_from: IsoDateSchema.nullable(),
  valid_to: IsoDateSchema.nullable().optional(),
});
export type AdjustedPeriod = z.infer<typeof AdjustedPeriodSchema>;

/**
 * ResolveDisputeRequest — implements BR-11 / BR-15 / BR-16:
 *
 *   - `decision = prefer_one`  -> winner_id required, member of item_ids, reason required
 *   - `decision = adjust_periods` -> periods[] required with one entry per item_id;
 *                                    semi-open invariant (valid_from < valid_to)
 *   - `decision = keep_disputed` -> no winner/periods; reason optional
 *
 * Cross-field validation done in a single `superRefine` so all violations
 * land in one parse pass.
 */
export const ResolveDisputeBodySchema = z
  .object({
    item_kind: ItemKindSchema,
    item_ids: z.array(UuidSchema).min(2),
    decision: DisputeDecisionSchema,
    winner_id: UuidSchema.optional().nullable(),
    periods: z.array(AdjustedPeriodSchema).optional().nullable(),
    reason: z.string().trim().min(1).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    // Item_ids unique
    const uniqueIds = new Set(value.item_ids);
    if (uniqueIds.size !== value.item_ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["item_ids"],
        message: "VALIDATION_INVALID_FORMAT",
      });
    }

    if (value.decision === "prefer_one") {
      if (
        value.reason === undefined ||
        value.reason === null ||
        value.reason.trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["reason"],
          message: "BUSINESS_REASON_REQUIRED",
        });
      }
      if (
        value.winner_id === undefined ||
        value.winner_id === null ||
        !value.item_ids.includes(value.winner_id)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["winner_id"],
          message: "BUSINESS_DISPUTE_WINNER_REQUIRED",
        });
      }
    }

    if (value.decision === "adjust_periods") {
      if (
        value.periods === undefined ||
        value.periods === null ||
        value.periods.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["periods"],
          message: "BUSINESS_DISPUTE_PERIODS_REQUIRED",
        });
        return;
      }
      if (value.periods.length !== value.item_ids.length) {
        ctx.addIssue({
          code: "custom",
          path: ["periods"],
          message: "BUSINESS_DISPUTE_PERIODS_REQUIRED",
        });
      }
      const periodIds = new Set<string>();
      for (const p of value.periods) {
        if (!value.item_ids.includes(p.item_id)) {
          ctx.addIssue({
            code: "custom",
            path: ["periods"],
            message: "BUSINESS_DISPUTE_PERIODS_REQUIRED",
          });
        }
        if (periodIds.has(p.item_id)) {
          ctx.addIssue({
            code: "custom",
            path: ["periods"],
            message: "BUSINESS_DISPUTE_PERIODS_REQUIRED",
          });
        }
        periodIds.add(p.item_id);
        // Semi-open invariant: valid_from < valid_to when both supplied.
        if (
          p.valid_from !== null &&
          p.valid_to !== null &&
          p.valid_to !== undefined &&
          p.valid_from >= p.valid_to
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["periods"],
            message: "BUSINESS_TEMPORAL_INCOHERENT",
          });
        }
      }
    }
  });

export type ResolveDisputeBody = z.infer<typeof ResolveDisputeBodySchema>;
