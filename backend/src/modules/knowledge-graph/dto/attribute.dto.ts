// Read DTOs for NodeAttribute (AttributeDetail). Mirrors `openapi.yaml`
// components.schemas.AttributeDetail.

import { z } from "zod";

import {
  AssertionFlagSchema,
  AssertionStatusSchema,
  AttributeValueTypeSchema,
  EffectiveStatusSchema,
  ValidFromSourceSchema,
} from "./enums.dto.js";
import { ProvenanceEntryResponseSchema } from "./provenance.dto.js";

export const AttributeDetailResponseSchema = z.object({
  id: z.string().uuid(),
  node_id: z.string().uuid(),
  attribute_key: z.string(),
  value_type: AttributeValueTypeSchema,
  value: z.string(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  recorded_at: z.string().datetime({ offset: true }),
  superseded_at: z.string().datetime({ offset: true }).nullable().optional(),
  status: AssertionStatusSchema,
  effective_status: EffectiveStatusSchema,
  is_current: z.boolean(),
  is_in_effect: z.boolean(),
  confidence: z.number().min(0).max(1),
  valid_from_source: ValidFromSourceSchema.nullable().optional(),
  flags: z.array(AssertionFlagSchema).default([]),
  supersedes_attribute_id: z.string().uuid().nullable().optional(),
  provenance: z.array(ProvenanceEntryResponseSchema),
});
export type AttributeDetailResponse = z.infer<
  typeof AttributeDetailResponseSchema
>;
