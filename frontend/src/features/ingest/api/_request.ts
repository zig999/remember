/**
 * Ingest api — internal request helper.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (consumed
 *    endpoints), §6 (API Error → UI Mapping).
 *  - docs/specs/domains/ingestion/openapi.yaml — every 2xx response sends
 *    the response schema as a **bare body** (no `{ ok, result }` wrapper);
 *    every 4xx/5xx sends the standard envelope `{ error: { code, message,
 *    details? } }`. See `backend/src/modules/ingestion/routes/ingestion.routes.ts`
 *    where each handler calls `reply.send(body)` on success and
 *    `reply.send({ ok: false, error: { … } })` on failure.
 *  - lib/http.ts contract — `http<T>()` unconditionally parses the BFF
 *    envelope; calling it against the ingestion REST endpoints would surface
 *    `SYSTEM_INVALID_RESPONSE` because `body.ok` is undefined on success.
 *
 * Design:
 *  - Mirrors the carve-out pattern from `features/curation/api/_request.ts`
 *    (the curation REST surface is also bare-body on 2xx). Cross-feature
 *    imports are forbidden (CLAUDE.md "Conventions") so the duplication is
 *    intentional; the auth store IS the shared surface.
 *  - `httpIngest<T>()` is the ingest-specific carve-out:
 *      - On 2xx: parses the bare JSON body and returns it typed as `T`.
 *      - On 4xx/5xx: parses the standard error envelope and throws
 *        `EnvelopeError` so the central `QueryCache.onError` mapper
 *        (`lib/error-routing.ts`) routes the error uniformly.
 *      - On HTTP 401: same DC silent-refresh story as `lib/http.ts` —
 *        mint a new JWT once via `fetchAccessToken()` and retry the
 *        original request once; on failure clears the store and surfaces
 *        `AUTH_SESSION_EXPIRED`. The `__retried` guard prevents infinite
 *        recursion on a second 401.
 *  - The `ingest` option, when true, **skips the client-side 30s cutoff**
 *    — required for `runLlmExtraction` per CLAUDE.md "ingest_document
 *    client timeout ≠ failure". The caller's `signal` is forwarded as-is.
 */

import { getEnv } from "@/lib/env";
import { EnvelopeError } from "@/lib/http";
import { fetchAccessToken } from "@/features/auth/api/neon-auth";
import { useAuthStore } from "@/state/auth";

/** Build the `Authorization: Bearer <jwt>` header when a token is present. */
export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}

/** Ingest REST request options. Mirrors `RequestInit` minus the parts the
 *  helper controls (signal composition, redirect). */
export interface IngestRequestOptions extends Omit<RequestInit, "signal"> {
  readonly signal?: AbortSignal;
  /**
   * When true, skip the client-side 30s cutoff. Required for
   * `runLlmExtraction` (LLM-bound, minutes per document is acceptable —
   * CLAUDE.md "ingest_document client timeout ≠ failure"). Default false.
   */
  readonly ingest?: boolean;
  /** INTERNAL — set by the 401 retry path so the second attempt cannot
   *  re-enter the silent-refresh branch. Callers MUST NOT set this. */
  __retried?: boolean;
}

/** Non-ingest cutoff. Mirrors `lib/http.ts` DEFAULT_TIMEOUT_MS. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Test-only seam — overridable redirect call so unit tests can assert the
 *  session-expired path without standing up jsdom navigation. */
let redirectImpl: (url: string) => void = (url) => {
  if (
    typeof window !== "undefined" &&
    typeof window.location?.replace === "function"
  ) {
    window.location.replace(url);
  }
};

export function __setIngestRedirectForTests(
  fn: ((url: string) => void) | null,
): void {
  redirectImpl =
    fn ??
    ((url) => {
      if (
        typeof window !== "undefined" &&
        typeof window.location?.replace === "function"
      ) {
        window.location.replace(url);
      }
    });
}

function joinUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function composeSignals(
  signals: ReadonlyArray<AbortSignal | undefined>,
): AbortSignal | undefined {
  const real = signals.filter((s): s is AbortSignal => s !== undefined);
  if (real.length === 0) return undefined;
  if (real.length === 1) return real[0];
  const anyFn = (
    AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }
  ).any;
  if (typeof anyFn === "function") return anyFn(real);
  const controller = new AbortController();
  for (const s of real) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), {
      once: true,
    });
  }
  return controller.signal;
}

async function trySilentRefresh(): Promise<boolean> {
  try {
    const newJwt = await fetchAccessToken();
    useAuthStore.getState().setToken(newJwt);
    return true;
  } catch (err) {
    void err;
    useAuthStore.getState().clear();
    redirectImpl("/sign-in?reason=session_expired");
    return false;
  }
}

/**
 * Issue a request to an ingest REST endpoint.
 *
 *  - 2xx → parses the bare JSON body and returns it typed as `T`.
 *  - 4xx/5xx → parses the standard error envelope `{ error: { code,
 *    message, details? } }` and throws `EnvelopeError` so the central
 *    error router (`lib/error-routing.ts`) maps it to UX uniformly. When
 *    the body is not JSON (raw 5xx HTML), `SYSTEM_UPSTREAM` is used.
 *  - HTTP 401 → attempts DC silent refresh once via `fetchAccessToken()`;
 *    on success, retries the original request once with the new JWT.
 *    On failure, clears the auth store + redirects to
 *    `/sign-in?reason=session_expired` and throws `AUTH_SESSION_EXPIRED`.
 *  - `ingest: true` skips the client-side 30s cutoff (LLM-bound).
 */
export async function httpIngest<T>(
  path: string,
  opts: IngestRequestOptions = {},
): Promise<T> {
  const { signal: userSignal, ingest: ingestMode, __retried, ...init } = opts;
  const { VITE_BFF_URL } = getEnv();
  const url = joinUrl(VITE_BFF_URL, path);

  // Compose abort signal: respect `ingest: true` carve-out (no cutoff).
  let signal: AbortSignal | undefined;
  let cleanup: () => void = () => undefined;
  if (ingestMode === true) {
    signal = userSignal;
  } else {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(
        new DOMException("Request timed out after 30s", "TimeoutError"),
      );
    }, DEFAULT_TIMEOUT_MS);
    signal = composeSignals([timeoutController.signal, userSignal]);
    cleanup = () => clearTimeout(timer);
  }

  const fetchInit: RequestInit = { ...init };
  if (signal !== undefined) fetchInit.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    cleanup();
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new EnvelopeError({
      code: isTimeout
        ? "SYSTEM_TIMEOUT"
        : isAbort
          ? "SYSTEM_ABORTED"
          : "SYSTEM_NETWORK",
      httpStatus: 0,
      message: isTimeout
        ? "Tempo limite excedido na requisição."
        : isAbort
          ? "Requisição cancelada."
          : "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }
  cleanup();

  // ---- Silent refresh on 401 ----------------------------------------------
  if (response.status === 401 && __retried !== true) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      // Re-inject the fresh token into the next request's headers.
      const nextHeaders = new Headers(
        (init.headers ?? {}) as HeadersInit,
      );
      const fresh = useAuthStore.getState().accessToken;
      if (fresh !== null) {
        nextHeaders.set("Authorization", `Bearer ${fresh}`);
      }
      return httpIngest<T>(path, {
        ...opts,
        headers: Object.fromEntries(nextHeaders.entries()),
        __retried: true,
      });
    }
    throw new EnvelopeError({
      code: "AUTH_SESSION_EXPIRED",
      httpStatus: 401,
      message: "Sua sessão expirou. Faça login novamente.",
    });
  }

  // ---- 2xx — bare body ----------------------------------------------------
  if (response.status >= 200 && response.status < 300) {
    try {
      if (response.status === 204) return undefined as unknown as T;
      return (await response.json()) as T;
    } catch (err) {
      throw new EnvelopeError({
        code: "SYSTEM_INVALID_RESPONSE",
        httpStatus: response.status,
        message: "Resposta do servidor não é JSON válido.",
        details: { cause: String(err) },
      });
    }
  }

  // ---- 4xx / 5xx — error envelope (no `ok` discriminator on ingest 2xx) --
  let raw: unknown = undefined;
  try {
    raw = await response.json();
  } catch {
    raw = undefined;
  }
  const errObj =
    raw && typeof raw === "object" && "error" in raw
      ? (raw as {
          error?: {
            code?: unknown;
            message?: unknown;
            details?: unknown;
          };
        }).error
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
