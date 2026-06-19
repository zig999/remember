/**
 * env — Zod v4 validation of the frontend's `import.meta.env` surface
 * (front.back.md BR-02, front.md §3.3).
 *
 * Contract:
 *  - VITE_BFF_URL        : valid URL — base URL of the Remember BFF.
 *  - VITE_NEON_AUTH_URL  : valid URL — base URL of Neon Auth (Stack Auth).
 *
 * Behaviour:
 *  - On a valid pair, `getEnv()` returns a frozen `Env` object cached for
 *    subsequent reads (read-once at boot).
 *  - On any rejection (missing or non-URL value), `getEnv()` throws an
 *    `EnvInvalidError`. The bootstrap in `main.tsx` is responsible for
 *    surfacing this as a visible in-frame fallback ("Configuração inválida —
 *    contate o operador.") per `front.md §3.3` + BR-02. The error is *loud* —
 *    `console.error` is invoked at construction so the failure is visible in
 *    every environment, including production builds.
 *
 * Why Zod v4 top-level `z.url()`:
 *  - Per CLAUDE.md Zod v4 note, `z.url()` is top-level (not
 *    `z.string().url()`). Using v3-style syntax silently masks runtime
 *    rejections in v4.
 */

import { z } from "zod";

/* ---------- schema ---------- */

const EnvSchema = z.object({
  VITE_BFF_URL: z.url("VITE_BFF_URL must be a valid URL"),
  VITE_NEON_AUTH_URL: z.url("VITE_NEON_AUTH_URL must be a valid URL"),
});

export type Env = Readonly<z.infer<typeof EnvSchema>>;

/* ---------- error type ---------- */

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

/* ---------- cached read ---------- */

let cached: Env | null = null;

/**
 * Read + validate the frontend env. Caches the result; throws
 * `EnvInvalidError` on rejection. Designed to be called once at boot, then
 * re-read by `lib/http.ts` and any other consumer.
 */
export function getEnv(source: ImportMetaEnv = import.meta.env): Env {
  if (cached !== null) return cached;

  const parsed = EnvSchema.safeParse({
    VITE_BFF_URL: source.VITE_BFF_URL,
    VITE_NEON_AUTH_URL: source.VITE_NEON_AUTH_URL,
  });

  if (!parsed.success) {
    // Fail loud (Golden Rule 12) — surface even before React renders.
    // eslint-disable-next-line no-console
    console.error("[env] Frontend env validation failed:", parsed.error.issues);
    throw new EnvInvalidError(parsed.error.issues);
  }

  cached = Object.freeze(parsed.data);
  return cached;
}

/**
 * Test-only: drop the cached env so a fresh `getEnv(...)` call can validate
 * a different source. Not exported from `lib/index.ts` — internal seam.
 */
export function __resetEnvCacheForTests(): void {
  cached = null;
}
