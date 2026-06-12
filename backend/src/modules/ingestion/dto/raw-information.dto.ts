// Response DTOs for the GET endpoints on `raw_information` and `raw_chunk`.
//
// Mirrors `openapi.yaml#/components/schemas/RawInformation` and
// `RawChunk`. Persisted DB rows are reshaped into these types in the
// repository layer.

import { z } from "zod";

import { SourceTypeSchema } from "./source-type.js";

/** Optional readable anchor (page/line/speaker/ts) — shape per A23. */
export const ChunkLocatorSchema = z
  .object({
    page: z.number().int().nullable().optional(),
    line: z.number().int().nullable().optional(),
    speaker: z.string().nullable().optional(),
    ts: z.string().nullable().optional(),
  })
  .nullable();
export type ChunkLocator = z.infer<typeof ChunkLocatorSchema>;

/** Response shape of `GET /api/v1/ingest/raw-information/{id}`. */
export const RawInformationResponseSchema = z.object({
  id: z.string().uuid(),
  source_type: SourceTypeSchema,
  content: z.string(),
  storage_ref: z.string().nullable(),
  content_hash: z.string().regex(/^[0-9a-f]{64}$/),
  received_at: z.string().datetime({ offset: true }),
  metadata: z.record(z.string(), z.unknown()),
});
export type RawInformationResponse = z.infer<
  typeof RawInformationResponseSchema
>;

/** Response shape of `GET /api/v1/ingest/raw-information/{id}/chunks` items. */
export const RawChunkResponseSchema = z.object({
  id: z.string().uuid(),
  raw_information_id: z.string().uuid(),
  chunk_index: z.number().int().nonnegative(),
  text: z.string(),
  offset_start: z.number().int().nonnegative(),
  offset_end: z.number().int().positive(),
  locator: ChunkLocatorSchema,
  chunking_version: z.string(),
});
export type RawChunkResponse = z.infer<typeof RawChunkResponseSchema>;

/** Envelope of `GET .../chunks`. */
export const ListRawChunksResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(RawChunkResponseSchema),
});
export type ListRawChunksResponse = z.infer<typeof ListRawChunksResponseSchema>;
