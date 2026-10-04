/**
 * neon-auth — Better Auth (Neon Auth native provider) raw-fetch client (TC-01).
 *
 * Spec references:
 *  - docs/specs/front/features/sign-in.feature.spec.md §4 (request sequence),
 *    §6 (error mapping), §9 (BDD scenarios).
 *  - temp/login-better-auth-plan.md §0 (proven Better Auth contract),
 *    §2 (architecture — DA: raw fetch only, no SDK dependency).
 *
 * Why raw fetch (not an SDK):
 *  - DA decision: no new npm dependency. The contract is small (2 endpoints,
 *    JSON in / JSON out) and the Stack Auth SDK was removed in this TC because
 *    its surface (UI kit + providers + page handlers) was an order of
 *    magnitude larger than what we need.
 *
 * Silent refresh (DC, see `lib/http.ts`):
 *  - The session cookie lives 7 days; the JWT only 15 minutes. When the BFF
 *    returns 401, `lib/http.ts` calls `fetchAccessToken()` once to mint a new
 *    JWT from the still-valid session, then retries the original BFF request.
 *
 * Error envelope:
 *  - `AuthError` carries a stable `code` string (see plan §0 / spec §6). The
 *    caller (`useSignIn`) maps these codes into the `SignInError` discriminant
 *    that `SignInForm` already displays — preserving the existing UI/a11y
 *    wiring without touching the form component.
 */

import { getEnv } from "@/lib/env";

/**
 * Tagged auth-layer error. `code` is one of the strings below — pick by tag,
 * never by message (messages may be locale-specific and we don't parse them
 * for control flow).
 */
export class AuthError extends Error {
  override readonly name = "AuthError";
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Resolve the Better Auth base URL from validated env, stripping any trailing
 * slash so route joins below produce exactly one `/`.
 */
function base(): string {
  return getEnv().VITE_NEON_AUTH_URL.replace(/\/$/, "");
}

/**
 * Best-effort extraction of `{ code, message }` from a non-2xx response.
 * Better Auth replies with JSON (`{ code, message }`) on all error paths we've
 * seen, but we defend against HTML / empty bodies — clone() so a downstream
 * consumer could still read the body if it ever wanted to.
 */
async function readErrorBody(res: Response): Promise<{ code?: string; message?: string }> {
  try {
    const raw = (await res.json()) as unknown;
    if (raw !== null && typeof raw === "object") {
      const obj = raw as { code?: unknown; message?: unknown };
      const out: { code?: string; message?: string } = {};
      if (typeof obj.code === "string") out.code = obj.code;
      if (typeof obj.message === "string") out.message = obj.message;
      return out;
    }
  } catch {
    /* not JSON — fall through */
  }
  return {};
}

/**
 * Wrap a `fetch` invocation, translating native rejections (`TypeError`, abort)
 * into `AuthError("NETWORK", ...)`. Any non-fetch throw is re-raised verbatim.
 */
async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    // fetch rejects with TypeError on offline / DNS / CORS / mixed-content;
    // DOMException("AbortError") when the caller aborts. We treat all of these
    // as a single network-class failure so the UI can render one message.
    if (err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError")) {
      throw new AuthError("NETWORK", `Network error contacting auth: ${String(err.message ?? err)}`);
    }
    throw err;
  }
}

/**
 * Step 1 — credential exchange.
 *
 * On success the browser silently stores the session cookie; we return `void`
 * because the body's token is opaque (not the JWT — see header).
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const url = `${base()}/sign-in/email`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) return;

  const body = await readErrorBody(res);
  // Prefer Better Auth's `code` when present; fall back to status-derived
  // mapping so a misbehaving server still produces a typed error.
  if (body.code === "INVALID_EMAIL_OR_PASSWORD") {
    throw new AuthError("INVALID_EMAIL_OR_PASSWORD", body.message ?? "E-mail ou senha incorretos.");
  }
  if (res.status === 401) {
    throw new AuthError(
      "INVALID_EMAIL_OR_PASSWORD",
      body.message ?? "E-mail ou senha incorretos.",
    );
  }
  throw new AuthError(
    body.code ?? "UNKNOWN",
    body.message ?? `Falha na autenticação (HTTP ${res.status}).`,
  );
}

/**
 * Step 2 — JWT minting from the active session cookie.
 *
 * Returns the JWT string.
 */
export async function fetchAccessToken(): Promise<string> {
  const url = `${base()}/token`;
  const res = await safeFetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    const body = await readErrorBody(res);
    throw new AuthError("NO_SESSION", body.message ?? "Sessão expirada ou ausente.");
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new AuthError(
      body.code ?? "UNKNOWN",
      body.message ?? `Falha ao obter token (HTTP ${res.status}).`,
    );
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não é JSON válido.");
  }

  if (parsed === null || typeof parsed !== "object") {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não contém token.");
  }
  const token = (parsed as { token?: unknown }).token;
  if (typeof token !== "string" || token.length === 0) {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não contém token.");
  }
  return token;
}
