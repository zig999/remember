// @vitest-environment node
import { describe, expect, it, beforeEach, vi } from "vitest";

// `sonner`'s module-load code touches `document.getElementsByTagName` to
// inject its stylesheet — undefined in the bare Node test environment.
// Stub the surface we consume so route imports do not crash.
vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

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
 * Encode a JWT with the given payload (signature segment ignored — JWKS
 * verification happens server-side per front.back.md §6).
 */
function makeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj), "utf8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${enc({ alg: "EdDSA", typ: "JWT" })}.${enc(payload)}.x`;
}

interface RedirectOptions {
  to?: string;
  search?: { reason?: string };
}
interface RedirectShape {
  options?: RedirectOptions;
}
function redirectTarget(state: unknown): RedirectOptions | undefined {
  const s = state as { redirect?: RedirectShape };
  return s.redirect?.options;
}

/**
 * Routing structural tests — no DOM needed.
 *
 * We import the route tree, build a router with an in-memory history, then
 * call `router.load()` to drive `beforeLoad` chains. Redirects land in
 * `router.state.redirect.options`; the post-redirect path lands in
 * `router.state.location.pathname`.
 */
describe("router (TC-04 foundation)", () => {
  beforeEach(() => {
    (globalThis as { sessionStorage?: FakeStorage }).sessionStorage = makeFakeStorage();
    (globalThis as { localStorage?: FakeStorage }).localStorage = makeFakeStorage();
    (globalThis as { document?: unknown }).document = {
      documentElement: {
        _attrs: {} as Record<string, string>,
        getAttribute(name: string): string | null {
          return this._attrs[name] ?? null;
        },
        setAttribute(name: string, value: string): void {
          this._attrs[name] = value;
        },
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    const win = {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      location: { assign: () => undefined, href: "http://localhost/" },
      history: { pushState: () => undefined, replaceState: () => undefined },
    };
    (globalThis as { window?: unknown }).window = win;
    (globalThis as { self?: unknown }).self = win;
    vi.resetModules();
  });

  it("route tree declares the 9 foundation routes (incl. /chat — TC-01)", async () => {
    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    // Building a router materializes the route id index used below.
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/sign-in"] }),
    });
    const ids = new Set<string>(Object.keys(router.routesById));
    // Each declared route id (children of __root) maps to '/path' form.
    expect(ids).toContain("/"); // indexRoute
    expect(ids).toContain("/sign-in");
    expect(ids).toContain("/chat");
    expect(ids).toContain("/graph");
    expect(ids).toContain("/search");
    expect(ids).toContain("/ingest");
    expect(ids).toContain("/curation");
    expect(ids).toContain("/history");
    expect(ids).toContain("/not-found");
  });

  it("unauthenticated visit to /graph redirects to /sign-in?reason=session_expired (BR-04)", async () => {
    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/graph"] }),
    });
    await router.load();
    const target = redirectTarget(router.state);
    expect(target?.to).toBe("/sign-in");
    expect(target?.search?.reason).toBe("session_expired");
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("unauthenticated visit to /sign-in is allowed (public route — no redirect)", async () => {
    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/sign-in"] }),
    });
    await router.load();
    expect(redirectTarget(router.state)).toBeUndefined();
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("visit to / triggers a redirect chain that ends at /sign-in (unauthenticated)", async () => {
    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    // / → /chat (indexRoute, TC-01) → /sign-in (guard). Final location must be /sign-in.
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("authenticated visit to /graph is allowed (no redirect)", async () => {
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));

    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/graph"] }),
    });
    await router.load();
    expect(redirectTarget(router.state)).toBeUndefined();
    expect(router.state.location.pathname).toBe("/graph");
  });

  it("authenticated visit to / lands on /chat (TC-01 indexRoute redirect; guard passes)", async () => {
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));

    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    expect(router.state.location.pathname).toBe("/chat");
  });

  /**
   * Read the validated search payload from the matched /chat route. The
   * route's `validateSearch` is the source of truth for the typed shape
   * (`router.state.location.search` carries the raw parsed bag, before the
   * route-level normalizer runs).
   */
  interface MatchShape {
    routeId: string;
    search: unknown;
  }
  function chatMatchSearch(state: unknown): unknown {
    const s = state as { matches?: MatchShape[] };
    const match = (s.matches ?? []).find((m) => m.routeId === "/chat");
    return match?.search;
  }

  it("authenticated visit to /chat is allowed and exposes empty search (TC-01 UI-01)", async () => {
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));

    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/chat"] }),
    });
    await router.load();
    expect(redirectTarget(router.state)).toBeUndefined();
    expect(router.state.location.pathname).toBe("/chat");
    // No conversation present → validateSearch yields {}.
    expect(chatMatchSearch(router.state)).toEqual({});
  });

  it("authenticated deep-link /chat?conversation=<uuid> parses conversation id (TC-01 FL-02)", async () => {
    const { useAuthStore } = await import("../../state/auth");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    useAuthStore.getState().setToken(makeJwt({ sub: "u1", exp }));

    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const cid = "11111111-1111-1111-1111-111111111111";
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/chat?conversation=${cid}`] }),
    });
    await router.load();
    expect(redirectTarget(router.state)).toBeUndefined();
    expect(router.state.location.pathname).toBe("/chat");
    expect(chatMatchSearch(router.state)).toEqual({ conversation: cid });
  });

  it("chatRoute.validateSearch normalizes empty/missing conversation to {} (TC-01)", async () => {
    // Unit-test the validator directly — TanStack Router's URL parser yields
    // `{conversation: ""}` for `?conversation=`, and `validateSearch` is what
    // strips that empty value to keep the typed shape clean (string | undefined).
    const { chatRoute } = await import("../routes");
    const validate = chatRoute.options.validateSearch as
      | ((s: Record<string, unknown>) => { conversation?: string })
      | undefined;
    expect(validate).toBeTypeOf("function");
    if (!validate) return;
    expect(validate({})).toEqual({});
    expect(validate({ conversation: "" })).toEqual({});
    expect(validate({ conversation: undefined })).toEqual({});
    expect(validate({ conversation: "abc-123" })).toEqual({ conversation: "abc-123" });
    // Non-string values are ignored (defensive — keeps the typed contract).
    expect(validate({ conversation: 42 })).toEqual({});
  });

  it("unknown path: unauthenticated → guard redirects to /sign-in", async () => {
    const { createMemoryHistory, createRouter } = await import("@tanstack/react-router");
    const { routeTree } = await import("../routes");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/some-random-path"] }),
    });
    await router.load();
    // The guard runs before notFound resolution, so the unauth case ends at /sign-in.
    // The authenticated unknown-path case is covered by __root.notFoundComponent
    // (renders in-frame; verified visually via AppShell.spec.tsx).
    expect(router.state.location.pathname).toBe("/sign-in");
  });
});
