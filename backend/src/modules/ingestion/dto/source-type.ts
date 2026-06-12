// `source_type` enum — mirrors the PostgreSQL enum of the same name.
//
// Keep this in sync with `migrations/0001_schema.sql` (CREATE TYPE source_type)
// and with `openapi.yaml#/components/schemas/SourceType`. The Zod schema is
// the single point that REST request validation uses to decide acceptance.

import { z } from "zod";

/** Closed list — matches `CREATE TYPE source_type` in 0001_schema.sql. */
export const SourceTypeSchema = z.enum([
  "pdf",
  "email",
  "ata",
  "chat",
  "artigo",
  "transcricao",
  "outro",
]);

export type SourceType = z.infer<typeof SourceTypeSchema>;
