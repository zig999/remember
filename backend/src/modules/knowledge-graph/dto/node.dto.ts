// Read DTOs for KnowledgeNode (NodeSummary / NodeDetail / NodeList /
// NodeAlias). Mirror `openapi.yaml` components.schemas.

import { z } from "zod";

import { AliasKindSchema, NodeStatusSchema } from "./enums.dto.js";
import { AttributeDetailResponseSchema } from "./attribute.dto.js";

export const NodeAliasResponseSchema = z.object({
  id: z.string().uuid(),
  alias: z.string(),
  kind: AliasKindSchema,
  created_at: z.string().datetime({ offset: true }),
});
export type NodeAliasResponse = z.infer<typeof NodeAliasResponseSchema>;

export const NodeSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  node_type: z.string(),
  canonical_name: z.string(),
  status: NodeStatusSchema,
  merged_into_node_id: z.string().uuid().nullable(),
});
export type NodeSummaryResponse = z.infer<typeof NodeSummaryResponseSchema>;

export const NodeListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().nonnegative(),
  items: z.array(NodeSummaryResponseSchema),
});
export type NodeListResponse = z.infer<typeof NodeListResponseSchema>;

export const NodeDetailResponseSchema = z.object({
  node: NodeSummaryResponseSchema,
  aliases: z.array(NodeAliasResponseSchema),
  attributes: z.array(AttributeDetailResponseSchema),
});
export type NodeDetailResponse = z.infer<typeof NodeDetailResponseSchema>;
