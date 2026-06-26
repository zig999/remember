// DTOs for UC-02 (resolveEntityMatch) and UC-04 (mergeNodes).

import { z } from "zod";

import {
  EntityMatchDecisionSchema,
  ReasonRequiredSchema,
  UuidSchema,
} from "./enums.dto.js";

/** Path param `{node_id}` for resolve endpoint. */
export const NodeIdPathSchema = z.object({
  node_id: UuidSchema,
});
export type NodeIdPath = z.infer<typeof NodeIdPathSchema>;

/**
 * ResolveEntityMatchRequest — BR-11 (reason mandatory on merge_into),
 * BR-23 (self-merge forbidden at request shape).
 *
 * Implemented as a single Zod object with `superRefine` rather than a
 * discriminated union because OpenAPI exposes the body with a single
 * `decision` discriminator nested in a flat object.
 */
export const ResolveEntityMatchBodySchema = z
  .object({
    decision: EntityMatchDecisionSchema,
    target_node_id: UuidSchema.optional().nullable(),
    reason: z.string().trim().min(1).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "merge_into") {
      if (
        value.target_node_id === undefined ||
        value.target_node_id === null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["target_node_id"],
          // Surfaced as BUSINESS_TARGET_NODE_REQUIRED downstream.
          message: "BUSINESS_TARGET_NODE_REQUIRED",
        });
      }
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
    }
  });

export type ResolveEntityMatchBody = z.infer<
  typeof ResolveEntityMatchBodySchema
>;

/** MergeNodesRequest — BR-11 (reason required), BR-23 (self-merge forbidden). */
export const MergeNodesBodySchema = z
  .object({
    survivor_id: UuidSchema,
    absorbed_id: UuidSchema,
    reason: ReasonRequiredSchema,
  })
  .superRefine((value, ctx) => {
    if (value.survivor_id === value.absorbed_id) {
      ctx.addIssue({
        code: "custom",
        path: ["absorbed_id"],
        message: "BUSINESS_SELF_MERGE_FORBIDDEN",
      });
    }
  });

export type MergeNodesBody = z.infer<typeof MergeNodesBodySchema>;
