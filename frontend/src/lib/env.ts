import { z } from "zod";

const EnvSchema = z.object({
  VITE_BFF_URL: z.url("VITE_BFF_URL must be a valid URL"),
  VITE_NEON_AUTH_URL: z.url("VITE_NEON_AUTH_URL must be a valid URL"),
});

export type Env = Readonly<z.infer<typeof EnvSchema>>;

export class EnvInvalidError extends Error {
  override readonly name = "EnvInvalidError";
  readonly issues: z.core.$ZodIssue[];

  constructor(issues: z.core.$ZodIssue[]) {
    super(
      "Frontend env invalid — fix VITE_BFF_URL / VITE_NEON_AUTH_URL: " +
        issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
    );
    this.issues = issues;
  }
}

let cached: Env | null = null;

export function getEnv(source: ImportMetaEnv = import.meta.env): Env {
  if (cached !== null) return cached;

  const parsed = EnvSchema.safeParse({
    VITE_BFF_URL: source.VITE_BFF_URL,
    VITE_NEON_AUTH_URL: source.VITE_NEON_AUTH_URL,
  });

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("[env] Frontend env validation failed:", parsed.error.issues);
    throw new EnvInvalidError(parsed.error.issues);
  }

  cached = Object.freeze(parsed.data);
  return cached;
}

export function __resetEnvCacheForTests(): void {
  cached = null;
}
