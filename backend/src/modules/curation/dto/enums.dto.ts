// Shared enums used by curation DTOs. Mirrors the openapi.yaml component
// schemas (`ItemKind`, `ReviewQueueKind`, `EntityMatchDecision`,
// `DisputeDecision`, `AssertionStatus`, `NodeStatus`, `ValidFromSource`).

import { z } from "zod";

export const ItemKindSchema = z.enum(["link", "attribute"]);
export type ItemKind = z.infer<typeof ItemKindSchema>;

export const ReviewQueueKindSchema = z.enum(["entity_match", "disputed"]);
export type ReviewQueueKind = z.infer<typeof ReviewQueueKindSchema>;

export const EntityMatchDecisionSchema = z.enum(["merge_into", "keep_separate"]);
export type EntityMatchDecision = z.infer<typeof EntityMatchDecisionSchema>;

export const DisputeDecisionSchema = z.enum([
  "prefer_one",
  "adjust_periods",
  "keep_disputed",
]);
export type DisputeDecision = z.infer<typeof DisputeDecisionSchema>;

export const NodeStatusSchema = z.enum([
  "active",
  "needs_review",
  "merged",
  "deleted",
]);
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

export const AssertionStatusSchema = z.enum([
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
]);
export type AssertionStatus = z.infer<typeof AssertionStatusSchema>;

export const ValidFromSourceSchema = z.enum(["stated", "document", "received"]);
export type ValidFromSource = z.infer<typeof ValidFromSourceSchema>;

/** UUID + ISO date string (YYYY-MM-DD) primitives shared across DTOs. */
export const UuidSchema = z.string().uuid();
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO date `YYYY-MM-DD`");

/** Reason — trim + min(1) ensures whitespace-only strings are rejected. */
export const ReasonRequiredSchema = z.string().trim().min(1);
export const ReasonOptionalSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .nullable();
