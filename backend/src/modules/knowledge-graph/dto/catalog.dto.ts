// Catalog response DTOs — mirror `openapi.yaml` components.schemas:
//   - NodeType / NodeTypeList
//   - LinkType / LinkTypeRule / LinkTypeList
//   - AttributeKey / AttributeKeyList
//
// Catalog data is migration-only (BR-10). Read endpoints (UC-01..UC-03)
// bypass the in-memory cache and read fresh rows — the cache is reserved
// for query-parameter validation (BR-03, BR-04).

import { z } from "zod";

import { AttributeValueTypeSchema } from "./enums.dto.js";

// ---------------------------------------------------------------------------
// NodeType
// ---------------------------------------------------------------------------

export const NodeTypeResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  version: z.number().int().min(1),
});
export type NodeTypeResponse = z.infer<typeof NodeTypeResponseSchema>;

export const NodeTypeListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(NodeTypeResponseSchema),
});
export type NodeTypeListResponse = z.infer<typeof NodeTypeListResponseSchema>;

// ---------------------------------------------------------------------------
// LinkType + LinkTypeRule
// ---------------------------------------------------------------------------

export const LinkTypeRuleResponseSchema = z.object({
  id: z.string().uuid(),
  source_node_type: z.string(),
  target_node_type: z.string(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type LinkTypeRuleResponse = z.infer<typeof LinkTypeRuleResponseSchema>;

export const LinkTypeResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  label: z.string(),
  description: z.string(),
  inverse_name: z.string(),
  is_temporal: z.boolean(),
  allows_multiple_current: z.boolean(),
  requires_valid_from: z.boolean(),
  requires_valid_to_on_change: z.boolean(),
  version: z.number().int().min(1),
  rules: z.array(LinkTypeRuleResponseSchema).optional(),
});
export type LinkTypeResponse = z.infer<typeof LinkTypeResponseSchema>;

export const LinkTypeListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(LinkTypeResponseSchema),
});
export type LinkTypeListResponse = z.infer<typeof LinkTypeListResponseSchema>;

// ---------------------------------------------------------------------------
// AttributeKey
// ---------------------------------------------------------------------------

export const AttributeKeyResponseSchema = z.object({
  id: z.string().uuid(),
  node_type: z.string(),
  key: z.string(),
  value_type: AttributeValueTypeSchema,
  is_temporal: z.boolean(),
  allows_multiple_current: z.boolean(),
  requires_valid_from: z.boolean(),
  description: z.string(),
  version: z.number().int().min(1),
});
export type AttributeKeyResponse = z.infer<typeof AttributeKeyResponseSchema>;

export const AttributeKeyListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(AttributeKeyResponseSchema),
});
export type AttributeKeyListResponse = z.infer<
  typeof AttributeKeyListResponseSchema
>;
