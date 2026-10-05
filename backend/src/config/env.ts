import { z } from "zod";

export const DEFAULT_CONTEXT_MODEL = "claude-haiku-4-5";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),

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

  NEON_AUTH_URL: z
    .string()
    .min(
      1,
      "NEON_AUTH_URL is required (e.g. https://<endpoint>.neon.tech/<db>/auth)."
    )
    .refine((v) => /^https?:\/\//.test(v), "NEON_AUTH_URL must be a URL."),
  NEON_AUTH_JWKS_TTL_S: z.coerce.number().int().min(60).default(600),

  LOCAL_OPERATOR_TOKEN: z
    .string()
    .min(16, "LOCAL_OPERATOR_TOKEN must be at least 16 characters.")
    .optional(),

  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required (Anthropic SDK secret; BR-29)."),

  INGEST_MODEL: z.string().min(1).default("claude-sonnet-4-6"),

  CONTEXT_MODEL: z.string().min(1).default(DEFAULT_CONTEXT_MODEL),

  CHAT_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
  CHAT_MODEL: z.string().min(1).default("claude-opus-4-8"),
  CHAT_UTILITY_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  CHAT_PROMPT_VERSION: z.string().min(1).default("v4"),
  CHAT_INGEST_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(false),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).default(40),
  MAX_CONTENT_LENGTH: z.coerce.number().int().min(1).default(32_768),
  MAX_ITERATIONS: z.coerce.number().int().min(1).default(8),
  TURN_TIMEOUT_MS: z.coerce.number().int().min(1).default(90_000),
  TOOL_TIMEOUT_MS: z.coerce.number().int().min(1).default(15_000),
  TOOL_RESULT_MAX_CHARS: z.coerce.number().int().min(1).default(8000),
  CHAT_RECENT_WINDOW: z.coerce.number().int().min(1).default(6),
  CHAT_SUMMARY_AFTER_TURNS: z.coerce.number().int().min(1).default(20),
  CHAT_SUMMARY_OVERLAP_M: z.coerce.number().int().min(1).default(40),
  CHAT_SUMMARY_PROMPT_VERSION: z.string().min(1).default("v2"),
  CHAT_TITLE_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
  CHAT_SUMMARY_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(true),
  OWNER_TZ: z.string().min(1).default("America/Sao_Paulo"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvValidationError(parsed.error);
  }

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

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: parsed.data.OWNER_TZ });
  } catch (err) {
    throw new InvalidOwnerTimezoneError(parsed.data.OWNER_TZ, err);
  }

  return Object.freeze(parsed.data);
}

export class InvalidOwnerTimezoneError extends Error {
  public readonly timezone: string;

  constructor(timezone: string, cause?: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(
      `Invalid OWNER_TZ: "${timezone}" is not a recognized IANA timezone. ` +
        `Set OWNER_TZ to a valid IANA zone id (e.g. "America/Sao_Paulo"). ` +
        `Underlying cause: ${causeMsg}`
    );
    this.name = "InvalidOwnerTimezoneError";
    this.timezone = timezone;
  }
}

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
