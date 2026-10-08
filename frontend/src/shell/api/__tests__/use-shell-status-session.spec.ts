import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const urls = vi.hoisted(() => ({ bff: "https://bff.test", auth: "https://auth.test" }));

vi.mock("../../../lib/env", () => ({
  getEnv: () => ({ VITE_BFF_URL: urls.bff, VITE_NEON_AUTH_URL: urls.auth }),
}));

import { useAuthStore } from "../../../state/auth";
import { __setShellRedirectForTests, useCurationCount } from "../use-shell-status";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const STALE = "stale.token";
const FRESH = "fresh.token";
const SIGN_IN_ADDRESS = "/sign-in?reason=session_expired";

type Kind = "health" | "pending" | "token";

interface Sent {
  readonly kind: Kind;
  readonly authorization: string | null;
}

type Answer = Response | Error;

interface Script {
  pending?: (authorization: string | null) => Answer;
  token?: () => Answer;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly client: QueryClient;
}

const placements: Placement[] = [];
const redirects: string[] = [];

function reply(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function kindOf(url: string): Kind {
  if (url === `${urls.auth}/token`) return "token";
  if (url === `${urls.bff}/health`) return "health";
  if (url.startsWith(`${urls.bff}/api/v1/curation/queue`)) return "pending";
  throw new Error(`unexpected request to ${url}`);
}

function stubFetch(script: Script = {}): Sent[] {
  const sent: Sent[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const kind = kindOf(String(input));
    const authorization = new Headers(init?.headers).get("Authorization");
    sent.push({ kind, authorization });
    let answer: Answer;
    if (kind === "health") {
      answer = reply(200, { database: "ok" });
    } else if (kind === "pending") {
      answer = script.pending ? script.pending(authorization) : reply(200, { total: 0 });
    } else {
      answer = script.token ? script.token() : reply(200, { token: FRESH });
    }
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  });
  return sent;
}

function count(sent: Sent[], kind: Kind): number {
  return sent.filter((s) => s.kind === kind).length;
}

function hold(token: string): void {
  useAuthStore.getState().setToken(token);
}

function Probe(): null {
  useCurationCount();
  return null;
}

function mountCount(): void {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Probe)));
  });
  placements.push({ root, container, client });
}

async function advance(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function settle(): Promise<void> {
  await advance(100);
}

beforeEach(() => {
  vi.useFakeTimers();
  useAuthStore.getState().clear();
  redirects.length = 0;
  __setShellRedirectForTests((url) => {
    redirects.push(url);
  });
});

afterEach(() => {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.client.clear();
  }
  __setShellRedirectForTests(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("a failed renewal on the pending curation read", () => {
  it("leaves no access token and replaces the page with the sign-in address when the identity provider holds no session", async () => {
    stubFetch({
      pending: () => reply(401),
      token: () => reply(401, { message: "no session" }),
    });
    hold(STALE);
    mountCount();
    await advance();
    await settle();
    expect({ token: useAuthStore.getState().accessToken, redirects: [...redirects] }).toEqual({
      token: null,
      redirects: [SIGN_IN_ADDRESS],
    });
  });

  it("leaves no access token and replaces the page with the sign-in address when the renewal request itself fails", async () => {
    stubFetch({
      pending: () => reply(401),
      token: () => new TypeError("Failed to fetch"),
    });
    hold(STALE);
    mountCount();
    await advance();
    await settle();
    expect({ token: useAuthStore.getState().accessToken, redirects: [...redirects] }).toEqual({
      token: null,
      redirects: [SIGN_IN_ADDRESS],
    });
  });

  it("is not followed by another pending read or another renewal, at once or at the following intervals", async () => {
    const sent = stubFetch({
      pending: () => reply(401),
      token: () => reply(401, { message: "no session" }),
    });
    hold(STALE);
    mountCount();
    await advance();
    await advance(60_000);
    await settle();
    expect({ pending: count(sent, "pending"), token: count(sent, "token") }).toEqual({
      pending: 1,
      token: 1,
    });
  });
});

describe("a successful renewal on the pending curation read", () => {
  it("keeps the renewed token and does not replace the page", async () => {
    stubFetch({
      pending: (authorization) =>
        authorization === `Bearer ${STALE}` ? reply(401) : reply(200, { total: 7 }),
    });
    hold(STALE);
    mountCount();
    await advance();
    await settle();
    expect({ token: useAuthStore.getState().accessToken, redirects: [...redirects] }).toEqual({
      token: FRESH,
      redirects: [],
    });
  });
});
