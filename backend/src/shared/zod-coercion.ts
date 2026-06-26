// Shared Zod coercion helpers for query-string DTOs.
//
// Query params arrive as strings on the wire. `IntegerQuery` accepts a number
// or a numeric string and yields an integer, raising a Zod issue ("must be an
// integer") otherwise. Previously this transform was copy-pasted byte-for-byte
// in `query-retrieval/dto/search.dto.ts` and `fragment.dto.ts`; it now lives
// here. Compose with `.pipe(z.number().int().min(...).max(...))` for bounds.

import { z } from "zod";

export const IntegerQuery = z
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
