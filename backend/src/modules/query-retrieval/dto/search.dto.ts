// Request-side DTOs for the searchKnowledge endpoint (UC-01).
//
// Zod is applied at the route boundary (CLAUDE.md "DTO Pattern" / BR-04).
// Out-of-range values produce ZodError -> 422 `VALIDATION_INVALID_FORMAT` /
// `VALIDATION_OUT_OF_RANGE` through the global error handler.

import { z } from "zod";

/** Booleans surface as "true"/"false" strings on the wire — coerce. */
const BooleanQuery = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => (typeof v === "boolean" ? v : v === "true"));

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

const IsoDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

/**
 * `layers` arrives as either a single string (Fastify collapses one
 * occurrence to a scalar) or an array (multiple `?layers=` entries).
 * Normalize to `string[]` BEFORE enum validation — non-enum elements raise
 * a ZodError that the service translates to BUSINESS_INVALID_SEARCH_LAYER.
 */
const LayersArray = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((v) => (Array.isArray(v) ? v : [v]));

/**
 * Same shape for `expand_link_types`.
 */
const ExpandLinkTypesArray = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((v) => (Array.isArray(v) ? v : [v]));

/**
 * `query` validation per BR-04 of the back spec:
 *   - min 1 char (raw)
 *   - max 1000 chars (raw)
 *   - btrim non-empty after transform (rejects whitespace-only input)
 *
 * Empty-after-btrim raises a Zod custom issue with message
 * `BUSINESS_INVALID_SEARCH_QUERY` so the route can branch on it (we keep the
 * Zod path for "garbage input" and reserve the service-layer
 * `InvalidSearchQueryError` for the parsed-empty case BR-05).
 */
const QueryString = z
  .string()
  .min(1, { message: "query must be at least 1 character" })
  .max(1000, { message: "query exceeds 1000 characters" })
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, {
    message: "query is empty after trim",
  });

export const SearchQuerySchema = z
  .object({
    query: QueryString,
    layers: LayersArray.optional(),
    as_of: IsoDateOnly.optional(),
    in_effect_only: BooleanQuery.optional().default(false),
    include_uncertain: BooleanQuery.optional().default(true),
    expand: BooleanQuery.optional().default(true),
    expand_depth: IntegerQuery.pipe(z.number().int().min(1).max(3))
      .optional()
      .default(1),
    expand_link_types: ExpandLinkTypesArray.optional(),
    limit: IntegerQuery.pipe(z.number().int().min(1).max(100))
      .optional()
      .default(20),
    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),
  })
  .strict();

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ---------------------------------------------------------------------------
// Path params (provenance endpoints)
// ---------------------------------------------------------------------------

export const LinkIdParamSchema = z.object({
  link_id: z.string().uuid(),
});
export type LinkIdParam = z.infer<typeof LinkIdParamSchema>;

export const AttributeIdParamSchema = z.object({
  attribute_id: z.string().uuid(),
});
export type AttributeIdParam = z.infer<typeof AttributeIdParamSchema>;

export const FragmentIdParamSchema = z.object({
  fragment_id: z.string().uuid(),
});
export type FragmentIdParam = z.infer<typeof FragmentIdParamSchema>;

// ---------------------------------------------------------------------------
// Closed sets — used by the service to validate `layers[]` (BR-04).
// ---------------------------------------------------------------------------

export const ALLOWED_LAYERS = ["fragment", "node", "chunk"] as const;
export type SearchLayer = (typeof ALLOWED_LAYERS)[number];
