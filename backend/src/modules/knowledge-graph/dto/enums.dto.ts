// Shared enum DTOs for the knowledge-graph domain.
//
// Mirrors `openapi.yaml` components.schemas (sections "Enums") and the DB
// enums of `migrations/0001_init.sql` (section 3).
//
// Kept in a single file so every route/service that surfaces these enums
// imports the same instance — no per-route divergence.

import { z } from "zod";

/** Mirrors DB enum `node_status`. */
export const NodeStatusSchema = z.enum([
  "active",
  "needs_review",
  "merged",
  "deleted",
]);
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

/** Mirrors DB enum `assertion_status` (links + attributes). */
export const AssertionStatusSchema = z.enum([
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
]);
export type AssertionStatus = z.infer<typeof AssertionStatusSchema>;

/**
 * Derived `effective_status` computed inside the resolved views (§5.4 / A9).
 * Includes the read-only `inactive` projection that is never stored.
 */
export const EffectiveStatusSchema = z.enum([
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
  "inactive",
]);
export type EffectiveStatus = z.infer<typeof EffectiveStatusSchema>;

/** Display flags surfaced in read responses (§7.3, A26). */
export const AssertionFlagSchema = z.enum([
  "uncertain",
  "disputed",
  "low_confidence",
]);
export type AssertionFlag = z.infer<typeof AssertionFlagSchema>;

/** Justification source for `valid_from` (§6.5, A14). */
export const ValidFromSourceSchema = z.enum(["stated", "document", "received"]);
export type ValidFromSource = z.infer<typeof ValidFromSourceSchema>;

/** Mirrors DB enum `attribute_value_type` (§3.4). */
export const AttributeValueTypeSchema = z.enum([
  "date",
  "number",
  "text",
  "bool",
]);
export type AttributeValueType = z.infer<typeof AttributeValueTypeSchema>;

/** Mirrors DB enum `alias_kind`. */
export const AliasKindSchema = z.enum(["canonical", "alias"]);
export type AliasKind = z.infer<typeof AliasKindSchema>;

/** Mirrors DB enum `source_type` for provenance entries. */
export const SourceTypeSchema = z.enum([
  "pdf",
  "email",
  "ata",
  "chat",
  "artigo",
  "transcricao",
  "outro",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;
