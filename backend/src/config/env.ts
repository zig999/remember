// Loads and validates BFF environment variables.
//
// TC-01 acceptance criterion: missing required env vars must crash startup
// with a clear, actionable message. Validation runs once at process start
// (called from `server.ts`) and the parsed result is exported as a frozen
// singleton — never re-read at runtime, never mutated.
//
// References:
//   CLAUDE.md "Security": service key never hardcoded, never logged.
//   ingestion.back.md §1: pino, pg pool min=2/max=10, statement timeout 10 s.
//   knowledge-graph.back.md §1: JWKS cached in-process for 10 min.

import { z } from "zod";

/**
 * Schema for the BFF process environment.
 *
 * Required vars are explicit; optional ones carry safe defaults. We never
 * fall back silently on a required secret — missing one is a fatal config
 * error and the process must refuse to start.
 */
const envSchema = z.object({
  // HTTP / runtime
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // PostgreSQL
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (Supabase Cloud connection string).")
    .refine(
      (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
      "DATABASE_URL must start with `postgres://` or `postgresql://`."
    ),
  PG_POOL_MIN: z.coerce.number().int().min(0).default(2),
  PG_POOL_MAX: z.coerce.number().int().min(1).default(10),
  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(0).default(10_000),

  // Supabase Auth
  SUPABASE_URL: z
    .string()
    .min(1, "SUPABASE_URL is required (e.g. https://<ref>.supabase.co).")
    .refine((v) => /^https?:\/\//.test(v), "SUPABASE_URL must be a URL."),
  SUPABASE_SERVICE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_KEY is required (kept inside the BFF only)."),
  SUPABASE_JWKS_TTL_S: z.coerce.number().int().min(60).default(600),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate `process.env`. Throws a `ZodError` on failure.
 *
 * The caller (server bootstrap) should catch the error, render a readable
 * report, and exit non-zero. Tests pass an explicit source to avoid touching
 * the real process environment.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvValidationError(parsed.error);
  }
  return Object.freeze(parsed.data);
}

/**
 * Wraps a Zod error with a human-readable message and a structured field list.
 * The error is intentionally thrown before any logger or DB client is ready,
 * so the message goes to stderr unredacted (still excluding secret VALUES,
 * only their keys are surfaced).
 */
export class EnvValidationError extends Error {
  public readonly issues: Array<{ path: string; message: string }>;

  constructor(zodError: z.ZodError) {
    const issues = zodError.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    }));
    const lines = issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n");
    super(
      `Invalid backend environment configuration.\n` +
        `Fix the following variables in your .env (see backend/.env.example):\n${lines}`
    );
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}
