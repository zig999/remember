// Read-nested provenance entry — surfaced inside LinkDetail.provenance[]
// and AttributeDetail.provenance[].
//
// Assembled by ONE batched SQL per request (BR-16): a single JOIN across
// `provenance -> information_fragment -> fragment_source -> raw_chunk ->
// raw_information`. The excerpt is computed in SQL using 1-based
// `substring` with `offset_start + 1` to compensate for the 0-based
// semi-open offset convention (CLAUDE.md "Known Gotchas" / A22).

import { z } from "zod";

import { SourceTypeSchema } from "./enums.dto.js";

export const ProvenanceEntryResponseSchema = z.object({
  fragment_id: z.string().uuid(),
  fragment_text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  raw_information_id: z.string().uuid().optional(),
  source_type: SourceTypeSchema.optional(),
  received_at: z.string().datetime({ offset: true }).optional(),
  excerpt: z.string().optional(),
});
export type ProvenanceEntryResponse = z.infer<
  typeof ProvenanceEntryResponseSchema
>;
