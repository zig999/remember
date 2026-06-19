// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FakeStorage {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  clear: () => void;
  readonly length: number;
  key: (i: number) => string | null;
}

function makeFakeStorage(): FakeStorage {
  const store: Record<string, string> = {};
  return {
    getItem: (k) => (k in store ? (store[k] ?? null) : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] ?? null,
  };
}

/**
 * Build a JWT with the given payload. Signature segment is "x" (unverified
 * here — verification happens server-side via JWKS, front.back.md §6).
 */
function makeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj);
    const b64 = Buffer.from(json, "utf8").toString("base64");
    return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  };
  return `${enc({ alg: "EdDSA", typ: "JWT" })}.${enc(payload)}.x`;
}

describe("useAuthStore", () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = makeFakeStorage();
    (globalThis as { sessionStorage?: FakeStorage }).sessionStorage = storage;
    (globalThis as { localStorage?: FakeStorage }).localStorage = makeFakeStorage();
    vi.resetModules();
  });

  afterEach(() => {
    storage.clear();
  });

  it("storage key is 'remember.auth.token' and not persisted to localStorage", async () => {
    const { useAuthStore, AUTH_TOKEN_STORAGE_KEY } = await import("../auth");
    expect(AUTH_TOKEN_STORAGE_KEY).toBe("remember.auth.token");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).not.toBeNull();
    expect(
      (globalThis as { localStorage: FakeStorage }).localStorage.getItem(
        AUTH_TOKEN_STORAGE_KEY,
      ),
    ).toBeNull();
  });

  it("initial token is null when sessionStorage is empty", async () => {
    const { useAuthStore } = await import("../auth");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isFresh()).toBe(false);
  });

  it("decodes 'sub'/'exp'/'name'/'email' claims from a JWT", async () => {
    const { useAuthStore } = await import("../auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(
      makeJwt({ sub: "u1", exp, name: "Alice", email: "a@b.com" }),
    );
    const claims = useAuthStore.getState().claims;
    expect(claims?.sub).toBe("u1");
    expect(claims?.exp).toBe(exp);
    expect(claims?.name).toBe("Alice");
    expect(claims?.email).toBe("a@b.com");
  });

  it("isFresh() returns true when exp > now() + 30s", async () => {
    const { useAuthStore } = await import("../auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));
    expect(useAuthStore.getState().isFresh()).toBe(true);
  });

  it("isFresh() returns false when exp <= now() + 30s (BR-04)", async () => {
    const { useAuthStore } = await import("../auth");
    const exp = Math.floor(Date.now() / 1000) + 10; // within margin
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));
    expect(useAuthStore.getState().isFresh()).toBe(false);
  });

  it("isFresh() trusts a token without exp (server will reject if invalid)", async () => {
    const { useAuthStore } = await import("../auth");
    useAuthStore.getState().setToken(makeJwt({ sub: "u1" }));
    expect(useAuthStore.getState().isFresh()).toBe(true);
  });

  it("clear() removes the token from memory and sessionStorage", async () => {
    const { useAuthStore, AUTH_TOKEN_STORAGE_KEY } = await import("../auth");
    useAuthStore.getState().setToken(
      makeJwt({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).not.toBeNull();
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().claims).toBeNull();
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("decodeJwtClaims returns null for malformed tokens", async () => {
    const { decodeJwtClaims } = await import("../auth");
    // 3 segments but the middle is not valid base64+JSON → parse fails → null.
    expect(decodeJwtClaims("not.a.jwt")).toBeNull();
    // Wrong segment count → null.
    expect(decodeJwtClaims("only-one-segment")).toBeNull();
    // Empty payload segment → null.
    expect(decodeJwtClaims("a..c")).toBeNull();
  });
});
