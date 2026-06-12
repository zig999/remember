// DTOs for UC-01 — GET /api/v1/curation/queue.

import { z } from "zod";

import { ReviewQueueKindSchema } from "./enums.dto.js";

/** Query string parsing (BR-03 / BR-04). */
export const ListReviewQueueQuerySchema = z.object({
  kind: ReviewQueueKindSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListReviewQueueQuery = z.infer<typeof ListReviewQueueQuerySchema>;
