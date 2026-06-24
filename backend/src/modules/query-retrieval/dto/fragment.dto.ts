// Request- and response-side DTOs for the listAcceptedFragments endpoint
// (`GET /api/v1/fragments/accepted` — openapi v1.3.0).
//
// Zod is applied at the route boundary (CLAUDE.md "DTO Pattern" / BR-04).
// Validation failures surface as 422 `VALIDATION_INVALID_FORMAT` through the
// global error handler (`backend/src/middleware/error-handler.ts`).

import { z } from "zod";

import type { SourceType } from "./response.dto.js";

// ---------------------------------------------------------------------------
// Request DTO
// ---------------------------------------------------------------------------

const IntegerQuery = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    if (typeof v === "number") return v;
    const parsed = Number(v);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "must be an integer",
      });
      return z.NEVER;
    }
    return parsed;
  });

/**
 * `listAcceptedFragments` query schema.
 *
 * - `llm_run_id` / `raw_information_id` are independently optional but at
 *   least one MUST be supplied; otherwise the `.refine` raises a
 *   `VALIDATION_INVALID_FORMAT` with the `requires_one_of` detail keyed off
 *   the openapi v1.3.0 example body. This is enforced HERE (DTO layer) so
 *   the service never sees an unfiltered request.
 * - UUID syntax is enforced at parse time; bad UUID → 422.
 * - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` —
 *   mirrors `SearchQuerySchema`.
 */
export const ListAcceptedFragmentsQuerySchema = z
  .object({
    llm_run_id: z.string().uuid().optional(),
    raw_information_id: z.string().uuid().optional(),
    limit: IntegerQuery.pipe(z.number().int().min(1).max(100))
      .optional()
      .default(20),
    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),
  })
  .strict()
  .refine(
    (v) => v.llm_run_id !== undefined || v.raw_information_id !== undefined,
    {
      message: "at least one of llm_run_id / raw_information_id is required",
      params: { requires_one_of: ["llm_run_id", "raw_information_id"] },
    }
  );

export type ListAcceptedFragmentsQuery = z.infer<
  typeof ListAcceptedFragmentsQuerySchema
>;

// ---------------------------------------------------------------------------
// Response DTO (matches openapi v1.3.0 schemas AcceptedFragment*)
// ---------------------------------------------------------------------------

export interface AcceptedFragmentSourceRef {
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly source_type: SourceType;
  readonly received_at: string; // ISO-8601
  readonly document_title: string | null;
}

export interface AcceptedFragmentItem {
  readonly fragment_id: string;
  readonly text: string;
  readonly confidence: number;
  readonly llm_run_id: string;
  readonly created_at: string; // ISO-8601
  readonly source: AcceptedFragmentSourceRef;
}

export interface AcceptedFragmentList {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly AcceptedFragmentItem[];
}
