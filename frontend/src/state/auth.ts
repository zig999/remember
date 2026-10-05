import { create } from "zustand";

export interface DecodedClaims {
  readonly sub?: string;
  readonly exp?: number;
  readonly name?: string;
  readonly email?: string;
}

export interface AuthState {
  accessToken: string | null;
  claims: DecodedClaims | null;

  setToken: (token: string | null) => void;
  clear: () => void;
  isFresh: () => boolean;
}

export const AUTH_TOKEN_STORAGE_KEY = "remember.auth.token";

export const EXPIRY_MARGIN_SECONDS = 30;

export function decodeJwtClaims(token: string): DecodedClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (typeof payload !== "string" || payload.length === 0) return null;
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
      if (!claims || claims.exp === undefined) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      return claims.exp > nowSec + EXPIRY_MARGIN_SECONDS;
    },
  };
});
