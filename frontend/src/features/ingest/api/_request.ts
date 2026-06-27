/**
 * Ingest api — internal request helpers (dev_tc_005).
 *
 * Mirrors the pattern from `features/chat/api/_request.ts`: a single
 * `authHeader()` reading the JWT from the Zustand store at call time so each
 * request sees the freshest token after silent refresh.
 *
 * No 204 carve-out is needed — every ingest endpoint returns a JSON envelope
 * via `http<T>()` (lib/http.ts owns the envelope parsing and the silent
 * refresh).
 */
import { useAuthStore } from "@/state/auth";

/** Build the `Authorization: Bearer <jwt>` header when a token is present. */
export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}
