/**
 * Curation api — internal request helpers.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §6 — "Curation
 *    domain não usa envelope `{ ok, result }` — retorna body direto em 2xx,
 *    error envelope em 4xx/5xx. Knowledge-graph e query-retrieval usam
 *    envelope `{ ok: true/false, result/error }`."
 *  - docs/specs/domains/curation/openapi.yaml — every 2xx response schema is
 *    declared without an `ok`/`result` wrapper (e.g.
 *    `ReviewQueueList`, `ResolveEntityMatchResponse`). Error bodies DO use
 *    the standard `{ error: { code, message, details? } }` envelope.
 *  - lib/http.ts contract — `http<T>()` unconditionally parses the BFF
 *    envelope; calling it against the curation REST endpoints would surface
 *    `SYSTEM_INVALID_RESPONSE` because `body.ok` is undefined.
 *
 * Design:
 *  - `authHeader()` mirrors the chat/graph feature-local helper. Cross-feature
 *    imports are forbidden (CLAUDE.md "Conventions") so the two-line helper
 *    is intentionally duplicated rather than promoted to a shared module;
 *    the auth store IS the shared surface.
 *  - `httpCuration<T>()` is the curation-specific carve-out:
 *      - On 2xx: parses the bare JSON body and returns it typed as `T`.
 *      - On 4xx/5xx: parses the standard error envelope and throws
 *        `EnvelopeError` so the central `QueryCache.onError` mapper
 *        (`lib/error-routing.ts`) routes the error uniformly.
 *      - On HTTP 401: leverages the same DC silent-refresh story as
 *        `lib/http.ts` would, by re-using `fetchAccessToken()` once and
 *        retrying the request once; on failure clears the store and
 *        surfaces `AUTH_SESSION_EXPIRED`. The `__retried` guard prevents
 *        infinite recursion on a second 401.
 *
 * Why a feature-local helper instead of extending `lib/http.ts`?
 *  - The bare-body shape is a property of the curation REST surface only;
 *    KG/QR remain enveloped. Adding a "skipEnvelope" flag to the global
 *    wrapper would invite drift across features. Keeping the carve-out
 *    scoped to this feature makes the contract visible at the call site
 *    and avoids churn in other features that consume the standard
 *    envelope.
 *  - Documented as a scoped exception in `dev_tc_003-delivery.md`
 *    "Spec divergences" (it is not a divergence — it matches the spec).
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

/** Curation REST request options. Mirrors `RequestInit` minus the parts the
 *  helper controls (signal composition, redirect). */
export interface CurationRequestOptions extends Omit<RequestInit, "signal"> {
  readonly signal?: AbortSignal;
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

export function __setCurationRedirectForTests(
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
  const anyFn = (AbortSignal as unknown as {
    any?: (s: AbortSignal[]) => AbortSignal;
  }).any;
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
 * Issue a request to a curation REST endpoint.
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
 */
export async function httpCuration<T>(
  path: string,
  opts: CurationRequestOptions = {},
): Promise<T> {
  const { signal: userSignal, __retried, ...init } = opts;
  const { VITE_BFF_URL } = getEnv();
  const url = joinUrl(VITE_BFF_URL, path);

  // Always wrap in a 30s cutoff (curation calls are sub-second p95 budget;
  // anything longer is a stalled BFF that should surface as a timeout).
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(
      new DOMException("Request timed out after 30s", "TimeoutError"),
    );
  }, DEFAULT_TIMEOUT_MS);
  const signal = composeSignals([timeoutController.signal, userSignal]);

  const fetchInit: RequestInit = { ...init };
  if (signal !== undefined) fetchInit.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    clearTimeout(timer);
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
  clearTimeout(timer);

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
      return httpCuration<T>(path, {
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
      // 204 (no content) doesn't apply to curation 2xx responses today
      // (every endpoint returns a payload) but guard for safety.
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

  // ---- 4xx / 5xx — error envelope (no `ok` discriminator on curation) ----
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
