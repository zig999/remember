// Request / response DTOs for `POST /api/v1/ingest/raw-information`.
//
// Schema mirrors `openapi.yaml#/components/schemas/IngestRawInformationRequest`
// and `IngestRawInformationResponse`. The Zod schema is the structural
// validation gate (§13 layer 1 of `ingestion.back.md` BR-13). A failed parse
// becomes a `ZodError` and the global error handler maps it to
// `422 VALIDATION_INVALID_FORMAT`.

import { z } from "zod";

import { SourceTypeSchema } from "./source-type.js";

/**
 * Body of `POST /api/v1/ingest/raw-information`.
 *
 * - `content`: minLength 1 (empty document is meaningless), maxLength 10 MiB
 *    in code points — the Fastify `bodyLimit` of 11 MiB on the route is a
 *    coarser pre-filter; this Zod check is the precise contract from A5.
 * - `storage_ref`: nullable; must be `null` in v1.0.0 (BR carve-out, A5).
 * - `metadata`: free-form bag; `document_date` (if present) is consumed by
 *    future temporal validation (A14 / §6.5).
 * - `model` and `prompt_version`: parts of the `llm_run.idempotency_key`
 *    composition (BR-08, A18).
 */
export const IngestRawInformationRequestSchema = z.object({
  source_type: SourceTypeSchema,
  content: z
    .string()
    .min(1, "content must not be empty")
    .max(10 * 1024 * 1024, "content must not exceed 10 MiB"),
  storage_ref: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  model: z.string().min(1, "model is required"),
  prompt_version: z.string().min(1, "prompt_version is required"),
});

export type IngestRawInformationRequest = z.infer<
  typeof IngestRawInformationRequestSchema
>;

/** Closed enum for the response `outcome` field. */
export const IngestOutcomeSchema = z.enum(["created", "noop_existing"]);
export type IngestOutcome = z.infer<typeof IngestOutcomeSchema>;

/** Minimal chunk descriptor returned in the create path. */
export const ChunkRefSchema = z.object({
  id: z.string().uuid(),
  chunk_index: z.number().int().nonnegative(),
  offset_start: z.number().int().nonnegative(),
  offset_end: z.number().int().positive(),
});
export type ChunkRef = z.infer<typeof ChunkRefSchema>;

/** Response of `POST /api/v1/ingest/raw-information` (both 201 and 200). */
export const IngestRawInformationResponseSchema = z.object({
  outcome: IngestOutcomeSchema,
  raw_information_id: z.string().uuid(),
  content_hash: z.string().regex(/^[0-9a-f]{64}$/),
  chunk_count: z.number().int().positive(),
  chunks: z.array(ChunkRefSchema),
  llm_run_id: z.string().uuid(),
  idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),
});
export type IngestRawInformationResponse = z.infer<
  typeof IngestRawInformationResponseSchema
>;
