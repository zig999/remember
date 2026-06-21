/**
 * http — Remember BFF fetch wrapper.
 *
 * Spec references:
 *  - front.md §5 (envelope) + front.back.md BR-03 (envelope-first parsing)
 *  - front.back.md BR-17 (single error map — consumers see EnvelopeError)
 *  - front.back.md §6 External integrations (AbortController 30 s for
 *    non-ingest; ingest skips the cutoff per CLAUDE.md
 *    "ingest_document client timeout ≠ failure")
 *  - TC-01 plan §6: DC silent refresh — on a BFF 401 we re-mint the JWT via
 *    `fetchAccessToken()` once and retry the original request.
 *
 * Contract:
 *  - Reads `VITE_BFF_URL` via `lib/env.ts` (no hardcoded base — BR-02).
 *  - Parses the logical envelope `{ ok, result?, error? }`.
 *      ok === true   → returns `result`.
 *      ok === false  → throws `EnvelopeError`.
 *  - HTTP status ≥ 500 OR 0 (network) are mapped to `SYSTEM_*` codes even
 *    when the body is not JSON.
 *  - Non-ingest calls are wrapped in a 30 s `AbortController`. Ingest calls
 *    (`ingest: true`) skip the client-side cutoff (server-side extraction
 *    can take minutes).
 *  - On HTTP 401 from the BFF: call `fetchAccessToken()` once to mint a fresh
 *    JWT from the still-valid session cookie; on success update the auth
 *    store and retry the original request once; on failure clear the store
 *    and redirect to `/sign-in?reason=session_expired`. The retry attempt
 *    SKIPS the silent-refresh branch (`__retried` guard) so a 401 → 401 loop
 *    is impossible.
 *
 * This module is the **only** place the envelope is parsed AND the only place
 * silent refresh is wired. Feature hooks import `http<T>(...)` and surface
 * the typed `result` directly.
 */

import { getEnv } from "./env";
import { useAuthStore } from "@/state/auth";
import { fetchAccessToken, AuthError } from "@/features/auth/api/neon-auth";

/* ---------- envelope ---------- */

export interface Envelope<T> {
  readonly ok: boolean;
  readonly result?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface EnvelopeErrorPayload {
  readonly code: string;
  readonly httpStatus: number;
  readonly message: string;
  readonly details?: unknown;
}

export class EnvelopeError extends Error {
  override readonly name = "EnvelopeError";
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(payload: EnvelopeErrorPayload) {
    super(payload.message);
    this.code = payload.code;
    this.httpStatus = payload.httpStatus;
    if (payload.details !== undefined) {
      this.details = payload.details;
    }
  }
}

/* ---------- request options ---------- */

export interface HttpOptions extends Omit<RequestInit, "signal"> {
  /**
   * When true, skip the client-side AbortController cutoff. Required for
   * ingest endpoints — see CLAUDE.md "ingest_document client timeout ≠
   * failure". Default false (30 s cutoff applies).
   */
  ingest?: boolean;
  /**
   * Optional caller-supplied signal — composed with the internal timeout
   * signal when applicable. If `ingest` is true, the caller's signal is
   * forwarded as-is.
   */
  signal?: AbortSignal;
  /**
   * INTERNAL — set by the 401 silent-refresh path to mark a retried request
   * so the second attempt cannot re-enter the refresh loop. Callers must
   * NOT set this; the type is exposed only because the field travels through
   * `http<T>()` recursion.
   */
  __retried?: boolean;
}

/* ---------- constants ---------- */

/** Non-ingest cutoff. front.back.md §6. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Silent-refresh test hook — overridable redirect call so unit tests can
 *  assert the redirect was triggered without standing up jsdom navigation.
 *  Default delegates to `window.location.replace` (best-effort, no-op on
 *  Node). Internal — not exported through `lib/index.ts`. */
let redirectImpl: (url: string) => void = (url) => {
  if (typeof window !== "undefined" && typeof window.location?.replace === "function") {
    window.location.replace(url);
  }
};

/** Test-only seam — replace the redirect implementation for assertions. */
export function __setRedirectForTests(fn: ((url: string) => void) | null): void {
  redirectImpl = fn ?? ((url) => {
    if (typeof window !== "undefined" && typeof window.location?.replace === "function") {
      window.location.replace(url);
    }
  });
}

/* ---------- helpers ---------- */

function joinUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function composeSignals(signals: ReadonlyArray<AbortSignal | undefined>): AbortSignal | undefined {
  const real = signals.filter((s): s is AbortSignal => s !== undefined);
  if (real.length === 0) return undefined;
  if (real.length === 1) return real[0];
  // AbortSignal.any is available in modern runtimes; the browser target
  // (Vite + ES2022) supports it. Fall back to a manual relay if absent.
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === "function") return anyFn(real);
  const controller = new AbortController();
  for (const s of real) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

/**
 * Build a fetch signal honouring the ingest carve-out.
 *  - ingest: no client-side cutoff; caller signal forwarded (if any).
 *  - non-ingest: 30 s AbortController, composed with caller signal if any.
 *
 * Returns { signal, cleanup } — call cleanup() once the response settles to
 * release the internal timer (no-op for ingest).
 */
function buildSignal(opts: HttpOptions): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (opts.ingest === true) {
    return { signal: opts.signal, cleanup: () => undefined };
  }
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new DOMException("Request timed out after 30s", "TimeoutError"));
  }, DEFAULT_TIMEOUT_MS);
  const signal = composeSignals([timeoutController.signal, opts.signal]);
  return {
    signal,
    cleanup: () => clearTimeout(timer),
  };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function isTimeoutError(err: unknown): boolean {
  // Either AbortError caused by our timeout, or a TimeoutError-named DOMException.
  if (err instanceof DOMException && err.name === "TimeoutError") return true;
  if (err instanceof Error && err.name === "TimeoutError") return true;
  return false;
}

/* ---------- silent refresh helper ---------- */

/**
 * Attempt the DC silent refresh: mint a fresh JWT from the still-valid
 * session cookie via `fetchAccessToken()`. On success, mirrors the new token
 * into the auth store and returns true. On failure, clears the store +
 * redirects to /sign-in?reason=session_expired and returns false.
 *
 * The caller (the 401 branch of `http<T>()`) uses the return value to decide
 * whether to retry the original request once with the new bearer.
 */
async function trySilentRefresh(): Promise<boolean> {
  try {
    const newJwt = await fetchAccessToken();
    useAuthStore.getState().setToken(newJwt);
    return true;
  } catch (err) {
    // AuthError("NO_SESSION") or any other failure → session is dead.
    void err; // we don't surface the message; the redirect explains
    useAuthStore.getState().clear();
    redirectImpl("/sign-in?reason=session_expired");
    return false;
  }
}

/* ---------- main ---------- */

/**
 * Issue a request to the BFF and return the typed `result`.
 *
 * Throws `EnvelopeError` for any non-success envelope OR for transport-level
 * failures (network, HTTP ≥ 500, timeout). Callers route the error via the
 * global `QueryCache.onError` → `lib/error-routing.ts`.
 */
export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { ingest: _ingest, signal: _userSignal, __retried, ...init } = opts;
  void _ingest;
  void _userSignal;
  const { VITE_BFF_URL } = getEnv();
  const url = joinUrl(VITE_BFF_URL, path);

  const { signal, cleanup } = buildSignal(opts);

  // `exactOptionalPropertyTypes` rejects `{ signal: undefined }`; only set
  // the property when we actually have a signal.
  const fetchInit: RequestInit = { ...init };
  if (signal !== undefined) fetchInit.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    cleanup();
    if (isTimeoutError(err)) {
      throw new EnvelopeError({
        code: "SYSTEM_TIMEOUT",
        httpStatus: 0,
        message: "Tempo limite excedido na requisição.",
        details: { cause: String(err) },
      });
    }
    if (isAbortError(err)) {
      // Caller-driven abort (component unmount, navigation) — surface as a
      // dedicated code so the error router can ignore it (no toast).
      throw new EnvelopeError({
        code: "SYSTEM_ABORTED",
        httpStatus: 0,
        message: "Requisição cancelada.",
        details: { cause: String(err) },
      });
    }
    throw new EnvelopeError({
      code: "SYSTEM_NETWORK",
      httpStatus: 0,
      message: "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }
  cleanup();

  // ---- DC silent refresh (TC-01) -----------------------------------------
  // 401 from the BFF means our JWT is stale (or absent). Try to mint a new
  // one from the session cookie; if successful, retry the ORIGINAL request
  // exactly once (the `__retried` guard prevents infinite recursion).
  if (response.status === 401 && __retried !== true) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      // Retry with the fresh JWT. The Authorization header is the caller's
      // responsibility (it is set by an `httpAuthorized` wrapper in the
      // feature layer); since we don't know what header shape was used,
      // we simply forward the same options minus our internal markers and
      // let the caller's interceptor re-inject the new bearer on retry.
      //
      // The `__retried: true` guard ensures the second attempt cannot
      // re-enter this branch even if it ALSO returns 401 (which would
      // indicate a server-side bug, not a stale token).
      const retryOpts: HttpOptions = { ...opts, __retried: true };
      return http<T>(path, retryOpts);
    }
    // Refresh failed — the store has been cleared and the redirect was
    // dispatched. Surface a dedicated EnvelopeError so the in-flight caller
    // doesn't blow up with an unhandled rejection while the navigation
    // happens.
    throw new EnvelopeError({
      code: "AUTH_SESSION_EXPIRED",
      httpStatus: 401,
      message: "Sua sessão expirou. Faça login novamente.",
    });
  }

  // HTTP ≥ 500 → SYSTEM_* without requiring a parseable JSON body.
  if (response.status >= 500) {
    let raw: unknown = undefined;
    try {
      raw = await response.clone().json();
    } catch {
      raw = await response.text().catch(() => undefined);
    }
    const envelopeCode = extractEnvelopeCode(raw);
    throw new EnvelopeError({
      code: envelopeCode ?? "SYSTEM_UPSTREAM",
      httpStatus: response.status,
      message:
        extractEnvelopeMessage(raw) ?? "Algo deu errado. Tente novamente.",
      details: raw,
    });
  }

  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch (err) {
    throw new EnvelopeError({
      code: "SYSTEM_INVALID_RESPONSE",
      httpStatus: response.status,
      message: "Resposta do servidor não é JSON válido.",
      details: { cause: String(err) },
    });
  }

  if (body.ok === true) {
    return body.result as T;
  }

  // ok === false — surface the envelope error verbatim.
  const error = body.error;
  throw new EnvelopeError({
    code: error?.code ?? "SYSTEM_UNKNOWN",
    httpStatus: response.status,
    message: error?.message ?? "Erro desconhecido do servidor.",
    details: error?.details,
  });
}

/* ---------- re-export for diagnostics --------------------------------- */

// Re-export AuthError so consumers can `instanceof`-match if needed (e.g.,
// telemetry that wants to discriminate the refresh failure cause).
export { AuthError };

/* ---------- internal: best-effort envelope extraction for 5xx ---------- */

function extractEnvelopeCode(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "error" in raw) {
    const err = (raw as { error?: unknown }).error;
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code?: unknown }).code;
      if (typeof code === "string") return code;
    }
  }
  return undefined;
}

function extractEnvelopeMessage(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "error" in raw) {
    const err = (raw as { error?: unknown }).error;
    if (err && typeof err === "object" && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}
