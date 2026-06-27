/**
 * ingest/api — internal request helpers (TC-03).
 *
 * Mirrors `features/graph/api/_request.ts` pattern: the two-line auth-header
 * helper is intentionally feature-local rather than promoted to a shared
 * module because cross-feature imports are forbidden (CLAUDE.md
 * "Conventions") and the auth store IS the shared surface.
 *
 * Reads the JWT from the Zustand store AT CALL TIME — never captures it at
 * module load — so a sign-in-then-fetch flow uses the fresh token.
 */
import { useAuthStore } from "@/state/auth";

/** Build the `Authorization: Bearer <jwt>` header when a token is present. */
export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}
