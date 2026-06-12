// Read DTOs for graph traversal (UC-06).
//
// Mirrors `openapi.yaml` components.schemas.TraversalLink and
// components.schemas.TraversalResult. The `TraversalLink` is a
// `LinkDetail` extended with `hop` and `score` (BR-14 of back spec).

import { z } from "zod";

import { LinkDetailResponseSchema } from "./link.dto.js";
import { NodeSummaryResponseSchema } from "./node.dto.js";
import {
  TRAVERSAL_DEPTH_MAX,
  TRAVERSAL_DEPTH_MIN,
} from "../traversal/config.js";

export const TraversalLinkResponseSchema = LinkDetailResponseSchema.extend({
  hop: z.number().int().min(TRAVERSAL_DEPTH_MIN).max(TRAVERSAL_DEPTH_MAX),
  score: z.number().min(0).max(1),
});
export type TraversalLinkResponse = z.infer<typeof TraversalLinkResponseSchema>;

export const TraversalResultResponseSchema = z.object({
  starting_node_id: z.string().uuid(),
  nodes: z.array(NodeSummaryResponseSchema),
  links: z.array(TraversalLinkResponseSchema),
});
export type TraversalResultResponse = z.infer<
  typeof TraversalResultResponseSchema
>;
