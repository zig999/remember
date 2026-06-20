/**
 * Chat api — internal request helpers.
 *
 * Spec references:
 *  - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes"
 *    (auth token via `useAuthStore.getState().accessToken`)
 *  - docs/specs/domains/chat/openapi.yaml — `deleteConversation` returns
 *    204 No Content (no envelope body to parse).
 *  - lib/http.ts contract — `http<T>()` parses the `{ ok, result }` envelope
 *    and throws `EnvelopeError`. It DOES NOT cover 204 responses (`json()`
 *    on an empty body throws → `SYSTEM_INVALID_RESPONSE`).
 *
 * Design:
 *  - `authHeader()` reads the JWT from the Zustand store at call time so
 *    every request sees the freshest token after sign-in / refresh.
 *  - `httpVoid()` is a NARROW carve-out for the single 204 endpoint of this
 *    feature (`DELETE /conversations/:id`). It still goes through
 *    `lib/env.ts` and surfaces `EnvelopeError` for 4xx/5xx so the central
 *    `QueryCache.onError` mapper (query-client.ts) handles them uniformly.
 *    Documented as a scoped exception in `dev_tc_003-delivery.md`
 *    "Spec divergences".
 */

import { getEnv } from "@/lib/env";
import { EnvelopeError } from "@/lib/http";
import { useAuthStore } from "@/state/auth";

/** Build the `Authorization: Bearer <jwt>` header when a token is present. */
export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Issue a request whose successful responses carry NO body (HTTP 204).
 *
 *  - 204 → resolves void.
 *  - 4xx with envelope body → throws `EnvelopeError` mirroring lib/http.ts.
 *  - 5xx or network / abort failures → throws `EnvelopeError` with a
 *    `SYSTEM_*` code so the central error router classifies them.
 *
 * Used by `useDeleteConversation` only. All other chat endpoints return a
 * JSON envelope and use `http<T>()` directly.
 */
export async function httpVoid(
  path: string,
  init: RequestInit = {},
): Promise<void> {
  const { VITE_BFF_URL } = getEnv();
  const url = `${VITE_BFF_URL.endsWith("/") ? VITE_BFF_URL.slice(0, -1) : VITE_BFF_URL}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    throw new EnvelopeError({
      code: isAbort ? "SYSTEM_ABORTED" : "SYSTEM_NETWORK",
      httpStatus: 0,
      message: isAbort
        ? "Requisição cancelada."
        : "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }

  if (response.status === 204) return;

  // Any non-204 — including 200 with body — is treated as an error path
  // for this helper (we only call it on the DELETE endpoint).
  let raw: unknown = undefined;
  try {
    raw = await response.json();
  } catch {
    /* body may be empty for some 5xx — fall through with raw=undefined */
  }
  const errObj =
    raw && typeof raw === "object" && "error" in raw
      ? (raw as { error?: { code?: unknown; message?: unknown; details?: unknown } }).error
      : undefined;
  throw new EnvelopeError({
    code:
      typeof errObj?.code === "string"
        ? errObj.code
        : response.status >= 500
          ? "SYSTEM_UPSTREAM"
          : "SYSTEM_UNKNOWN",
    httpStatus: response.status,
    message:
      typeof errObj?.message === "string"
        ? errObj.message
        : response.status >= 500
          ? "Algo deu errado. Tente novamente."
          : "Erro desconhecido do servidor.",
    details: errObj?.details,
  });
}
