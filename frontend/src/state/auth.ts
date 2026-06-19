/**
 * useAuthStore — Neon Auth (Stack Auth) JWT bearer carried by the SPA.
 *
 * Spec references:
 *  - front.md §3 (Protected routes — `__root` runs the JWT guard)
 *  - front.back.md §2 (Auth token storage: in-memory + sessionStorage)
 *  - front.back.md BR-04 (JWT guard — exp <= now()+30s redirects to /sign-in)
 *  - front.back.md ST-01 (boot state machine: bootstrapping → authenticated
 *    | unauthenticated | session_expired)
 *
 * Storage policy: in-memory Zustand store, mirrored to `sessionStorage` key
 * `remember.auth.token`. NOT persisted to `localStorage` (prevents leaking
 * across tabs/contexts the user did not actively start — see front.back.md
 * §2 rationale).
 *
 * No refresh-token logic in this wave — expiry produces a redirect to
 * `/sign-in?reason=session_expired` (front.back.md §7 constraint 5).
 */

import { create } from "zustand";

export interface DecodedClaims {
  /** Subject — typically the Neon Auth user id. */
  readonly sub?: string;
  /** Expiry in seconds since epoch. */
  readonly exp?: number;
  /** Display name (best-effort; never written back). */
  readonly name?: string;
  /** Email (best-effort). */
  readonly email?: string;
}

export interface AuthState {
  /** Raw JWT bearer. `null` when unauthenticated. */
  accessToken: string | null;
  /** Decoded claims — read-only convenience. */
  claims: DecodedClaims | null;

  /** Set the token (e.g., after sign-in). Mirrors to sessionStorage. */
  setToken: (token: string | null) => void;
  /** Clear the token (e.g., on AUTH_UNAUTHORIZED or local exp). */
  clear: () => void;
  /**
   * Returns true if the current token is present AND its decoded `exp` is
   * more than 30 seconds in the future. front.back.md BR-04.
   */
  isFresh: () => boolean;
}

/** Storage key — front.back.md §2. */
export const AUTH_TOKEN_STORAGE_KEY = "remember.auth.token";

/** Safety margin before declaring the token expired (BR-04). */
export const EXPIRY_MARGIN_SECONDS = 30;

/**
 * Decode the payload of a JWT without verifying the signature (verification
 * happens server-side via JWKS — front.back.md §6). Returns null on any
 * parse failure; callers treat null as "no claims available".
 */
export function decodeJwtClaims(token: string): DecodedClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (typeof payload !== "string" || payload.length === 0) return null;
    // base64url → base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const claims: DecodedClaims = {};
    if (typeof parsed["sub"] === "string") (claims as { sub?: string }).sub = parsed["sub"] as string;
    if (typeof parsed["exp"] === "number") (claims as { exp?: number }).exp = parsed["exp"] as number;
    if (typeof parsed["name"] === "string") (claims as { name?: string }).name = parsed["name"] as string;
    if (typeof parsed["email"] === "string") (claims as { email?: string }).email = parsed["email"] as string;
    return claims;
  } catch {
    return null;
  }
}

function readInitialToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (token === null) sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    else sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    /* fail soft — token stays in memory only */
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = readInitialToken();
  return {
    accessToken: initialToken,
    claims: initialToken !== null ? decodeJwtClaims(initialToken) : null,
    setToken: (token) => {
      writeToken(token);
      set({ accessToken: token, claims: token !== null ? decodeJwtClaims(token) : null });
    },
    clear: () => {
      writeToken(null);
      set({ accessToken: null, claims: null });
    },
    isFresh: () => {
      const { accessToken, claims } = get();
      if (accessToken === null) return false;
      // Without exp we conservatively trust the token (BFF will reject via 401).
      if (!claims || claims.exp === undefined) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      return claims.exp > nowSec + EXPIRY_MARGIN_SECONDS;
    },
  };
});
