// Loads and validates BFF environment variables.
//
// TC-01 acceptance criterion: missing required env vars must crash startup
// with a clear, actionable message. Validation runs once at process start
// (called from `server.ts`) and the parsed result is exported as a frozen
// singleton — never re-read at runtime, never mutated.
//
// References:
//   CLAUDE.md "Security": secrets never hardcoded, never logged.
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
  // Browser origins allowed to call the BFF (CORS). The SPA runs on a different
  // origin than the BFF (Vite dev on :5173 vs Fastify on :3000), so without
  // this the browser blocks every cross-origin fetch at the preflight. Comma-
  // separated list; each entry is matched exactly and echoed back in
  // `Access-Control-Allow-Origin`. Default covers the Vite dev server on both
  // localhost and 127.0.0.1; set the real SPA origin(s) in production.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),

  // PostgreSQL (Neon — managed Postgres)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (Neon connection string).")
    .refine(
      (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
      "DATABASE_URL must start with `postgres://` or `postgresql://`."
    ),
  PG_POOL_MIN: z.coerce.number().int().min(0).default(2),
  PG_POOL_MAX: z.coerce.number().int().min(1).default(10),
  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(0).default(10_000),

  // Neon Auth (Stack Auth) — JWT access tokens verified via JWKS.
  NEON_AUTH_URL: z
    .string()
    .min(
      1,
      "NEON_AUTH_URL is required (e.g. https://<endpoint>.neon.tech/<db>/auth)."
    )
    .refine((v) => /^https?:\/\//.test(v), "NEON_AUTH_URL must be a URL."),
  NEON_AUTH_JWKS_TTL_S: z.coerce.number().int().min(60).default(600),

  // DEV-ONLY local operator token — convenience auth for local MCP clients
  // (e.g. Claude Desktop via `mcp-remote`) that cannot run the Neon Auth OAuth
  // flow. When set AND `NODE_ENV=development`, a request carrying
  // `Authorization: Bearer <LOCAL_OPERATOR_TOKEN>` is accepted as the single
  // owner WITHOUT JWKS verification (see middleware/auth.ts). Ignored entirely
  // outside development, so it can never weaken a production deployment. Min
  // length 16 so it is not trivially guessable. Optional: absent => disabled.
  LOCAL_OPERATOR_TOKEN: z
    .string()
    .min(16, "LOCAL_OPERATOR_TOKEN must be at least 16 characters.")
    .optional(),

  // Anthropic SDK (BR-29). The orchestrator (TC-12 / BR-26) is the sole LLM
  // caller of the BFF. Missing key at boot is a fatal config error; absence
  // here causes the process to refuse to start (acceptance criterion of
  // TC-12). The value never appears in logs, responses, or stack traces.
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required (Anthropic SDK secret; BR-29)."),

  // Chat surface (modules/chat). All sanity ceilings, not hard product limits;
  // defaults match chat.back.md §8. All optional — missing values fall back to
  // the defaults below so a deployment can boot without chat-specific config.
  //
  // CHAT_ENABLED: kill-switch (BR-14). When `false`, the chat route short-
  //   circuits with 503 BUSINESS_CHAT_DISABLED before the SSE is opened.
  CHAT_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
  // CHAT_MODEL: default Anthropic model id (per-request `model` field overrides).
  CHAT_MODEL: z.string().min(1).default("claude-opus-4-8"),
  // CHAT_UTILITY_MODEL: Anthropic model for the distillation jobs — rolling
  //   summary (BR-33) + title (BR-34). Smaller / cheaper than the turn model.
  //   chat.back.md v2.0.0 §8. NEW in TC-02.
  CHAT_UTILITY_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  // CHAT_PROMPT_VERSION: prompt module version (BR-18). Unknown value is a boot
  //   error — see modules/chat/prompts/index.ts (UnknownChatPromptVersionError).
  CHAT_PROMPT_VERSION: z.string().min(1).default("v1"),
  // MAX_HISTORY_MESSAGES: legacy stateless-v1 upper bound on `messages.length`
  //   (BR-01 v1). In v2.0 it is functionally superseded by MAX_CONTENT_LENGTH
  //   (the request body now carries ONE `content` string; history is server-
  //   reconstructed via context-builder). Kept here for backward compatibility
  //   so existing deployments do not break on boot; safe to remove in a
  //   follow-up cleanup. See delivery `spec_divergences`.
  MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).default(40),
  // MAX_CONTENT_LENGTH: upper bound on `sendMessage.content` length (BR-01
  //   v2.0). chat.back.md v2.0.0 §8. NEW in TC-02.
  MAX_CONTENT_LENGTH: z.coerce.number().int().min(1).default(32_768),
  // MAX_ITERATIONS: upper bound on agentic-loop iterations (BR-15).
  MAX_ITERATIONS: z.coerce.number().int().min(1).default(8),
  // TURN_TIMEOUT_MS: per-turn wall-clock budget (BR-16).
  TURN_TIMEOUT_MS: z.coerce.number().int().min(1).default(90_000),
  // TOOL_TIMEOUT_MS: per-tool-call wall-clock budget (BR-17).
  TOOL_TIMEOUT_MS: z.coerce.number().int().min(1).default(15_000),
  // TOOL_RESULT_MAX_CHARS: truncation ceiling for tool results fed back to the
  //   model (BR-13). Unicode code points, not bytes.
  TOOL_RESULT_MAX_CHARS: z.coerce.number().int().min(1).default(8000),
  // CHAT_RECENT_WINDOW: number of recent messages used by context-builder
  //   (BR-31). Older messages are summarised into `summary_rolling` (BR-33).
  //   chat.back.md v2.0.0 §8. NEW in TC-02.
  CHAT_RECENT_WINDOW: z.coerce.number().int().min(1).default(10),
  // CHAT_SUMMARY_AFTER_TURNS: after this many USER turns on a conversation,
  //   the rolling-summary policy fires (BR-33). chat.back.md v2.0.0 §8. NEW.
  CHAT_SUMMARY_AFTER_TURNS: z.coerce.number().int().min(1).default(20),
  // CHAT_TITLE_ENABLED: when `false`, the title-distillation job (BR-34) is
  //   skipped. chat.back.md v2.0.0 §8. NEW in TC-02.
  CHAT_TITLE_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
  // CHAT_SUMMARY_ENABLED: when `false`, the rolling-summary job (BR-33) is
  //   skipped — `summary_rolling` stays NULL permanently. chat.back.md v2.0.0
  //   §8. NEW in TC-02.
  CHAT_SUMMARY_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
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

  // Fail-closed guard for the DEV-only auth bypass (see LOCAL_OPERATOR_TOKEN /
  // middleware/auth.ts). The static bearer must NEVER be honored outside
  // development. Because `NODE_ENV` defaults to "development", a production box
  // that *forgets* to set `NODE_ENV` would parse as development and silently
  // enable the bypass — so we check the RAW source: an absent or non-development
  // `NODE_ENV` with a token present refuses startup rather than fail open.
  if (
    parsed.data.LOCAL_OPERATOR_TOKEN !== undefined &&
    source.NODE_ENV !== "development"
  ) {
    throw new EnvValidationError([
      {
        path: "LOCAL_OPERATOR_TOKEN",
        message:
          "is set but NODE_ENV is not explicitly 'development'. The local-operator " +
          "auth bypass is forbidden outside development; refusing to start. Unset " +
          "LOCAL_OPERATOR_TOKEN in this environment, or set NODE_ENV=development.",
      },
    ]);
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

  constructor(
    errorOrIssues: z.ZodError | Array<{ path: string; message: string }>
  ) {
    const issues = Array.isArray(errorOrIssues)
      ? errorOrIssues
      : errorOrIssues.issues.map((i) => ({
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
