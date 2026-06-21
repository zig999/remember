/**
 * graph/api — internal request helpers (TC-FE-08).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9 — the
 *    hook calls `GET /api/v1/nodes/:id` and the response goes through the
 *    standard `{ ok, result }` envelope, so the `lib/http` wrapper handles
 *    parsing + error mapping uniformly.
 *  - lib/http.ts contract — JWT is the caller's responsibility (header
 *    injection happens here, parsing happens in lib/http).
 *
 * Design:
 *  - `authHeader()` mirrors the chat-api helper but lives feature-local.
 *    Cross-feature imports are forbidden (CLAUDE.md "Conventions") so the
 *    two-line helper is intentionally duplicated rather than promoted to a
 *    shared module; the auth store IS the shared surface.
 *  - Reads the JWT from the Zustand store AT CALL TIME — never captures it
 *    at module load — so a sign-in-then-fetch flow uses the fresh token.
 */
import { useAuthStore } from "@/state/auth";

/** Build the `Authorization: Bearer <jwt>` header when a token is present. */
export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}
