// Request-side DTOs (query/path) for the knowledge-graph REST endpoints.
//
// Zod is applied at the route boundary (CLAUDE.md "DTO Pattern" / BR-02 /
// BR-19). Out-of-range values produce ZodError -> 422
// `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE` through the
// global error handler.

import { z } from "zod";

import { NodeStatusSchema } from "./enums.dto.js";
import {
  TRAVERSAL_DEPTH_DEFAULT,
  TRAVERSAL_DEPTH_MAX,
  TRAVERSAL_DEPTH_MIN,
} from "../traversal/config.js";

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** Booleans surface as "true"/"false" strings on the wire — coerce. */
const BooleanQuery = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => (typeof v === "boolean" ? v : v === "true"));

export const ListLinkTypesQuerySchema = z
  .object({
    include_rules: BooleanQuery.optional().default(false),
  })
  .strict();
export type ListLinkTypesQuery = z.infer<typeof ListLinkTypesQuerySchema>;

export const ListAttributeKeysQuerySchema = z
  .object({
    node_type: z.string().min(1).max(200).optional(),
  })
  .strict();
export type ListAttributeKeysQuery = z.infer<
  typeof ListAttributeKeysQuerySchema
>;

// ---------------------------------------------------------------------------
// Node list (UC-04)
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

export const ListNodesQuerySchema = z
  .object({
    node_type: z.string().min(1).max(200).optional(),
    name_prefix: z.string().min(1).max(200).optional(),
    status: NodeStatusSchema.optional(),
    limit: IntegerQuery.pipe(z.number().int().min(1).max(100))
      .optional()
      .default(20),
    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),
  })
  .strict();
export type ListNodesQuery = z.infer<typeof ListNodesQuerySchema>;

// ---------------------------------------------------------------------------
// Node point read (UC-05)
// ---------------------------------------------------------------------------

const IsoDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const GetNodeByIdQuerySchema = z
  .object({
    as_of: IsoDateOnly.optional(),
    in_effect_only: BooleanQuery.optional().default(false),
    include_uncertain: BooleanQuery.optional().default(true),
  })
  .strict();
export type GetNodeByIdQuery = z.infer<typeof GetNodeByIdQuerySchema>;

// ---------------------------------------------------------------------------
// Path params
// ---------------------------------------------------------------------------

export const NodeIdParamSchema = z.object({
  node_id: z.string().uuid(),
});
export type NodeIdParam = z.infer<typeof NodeIdParamSchema>;

export const LinkIdParamSchema = z.object({
  link_id: z.string().uuid(),
});
export type LinkIdParam = z.infer<typeof LinkIdParamSchema>;

export const AttributeIdParamSchema = z.object({
  attribute_id: z.string().uuid(),
});
export type AttributeIdParam = z.infer<typeof AttributeIdParamSchema>;

// ---------------------------------------------------------------------------
// Traverse (UC-06)
// ---------------------------------------------------------------------------

/**
 * Direction enum mirrors `openapi.yaml` traverseNode `direction` parameter.
 * Default in this schema is `both` (matches OpenAPI).
 */
export const TraverseDirectionSchema = z.enum(["out", "in", "both"]);
export type TraverseDirection = z.infer<typeof TraverseDirectionSchema>;

/**
 * `link_types` arrives as either a single string (Fastify collapses one
 * occurrence to a scalar) or an array (multiple `?link_types=` entries).
 * Normalize to `string[]` and reject empty strings element-wise.
 */
const LinkTypesArray = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((v) => (Array.isArray(v) ? v : [v]));

/**
 * Out-of-range `depth` is detected here AND re-asserted in the service layer
 * (defence in depth, BR-05 of back spec). Zod failure surfaces as Zod parse
 * error (422 VALIDATION_INVALID_FORMAT through the global handler); the
 * service-layer assertion produces BUSINESS_INVALID_TRAVERSE_DEPTH so the
 * route can distinguish the two paths.
 */
const TraverseDepthCoercer = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    if (typeof v === "number") return v;
    const parsed = Number(v);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "must be an integer",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const TraverseQuerySchema = z
  .object({
    direction: TraverseDirectionSchema.optional().default("both"),
    link_types: LinkTypesArray.optional(),
    depth: TraverseDepthCoercer.optional().default(TRAVERSAL_DEPTH_DEFAULT),
    as_of: IsoDateOnly.optional(),
    in_effect_only: BooleanQuery.optional().default(false),
  })
  .strict();
export type TraverseQuery = z.infer<typeof TraverseQuerySchema>;

// ---------------------------------------------------------------------------
// Attribute-key history (UC-11)
// ---------------------------------------------------------------------------

export const NodeIdKeyParamSchema = z.object({
  node_id: z.string().uuid(),
  key: z.string().min(1).max(200),
});
export type NodeIdKeyParam = z.infer<typeof NodeIdKeyParamSchema>;

// Re-export the depth bounds so callers (service layer) can apply the
// secondary range check without importing the traversal config directly.
export const TRAVERSAL_DEPTH_BOUNDS = {
  min: TRAVERSAL_DEPTH_MIN,
  max: TRAVERSAL_DEPTH_MAX,
} as const;
