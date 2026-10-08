import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const urls = vi.hoisted(() => ({ bff: "https://bff.test", auth: "https://auth.test" }));

vi.mock("../../../lib/env", () => ({
  getEnv: () => ({ VITE_BFF_URL: urls.bff, VITE_NEON_AUTH_URL: urls.auth }),
}));

import { useAuthStore } from "../../../state/auth";
import { useCurationCount, useHealth } from "../use-shell-status";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const STALE = "stale.token";
const FRESH = "fresh.token";
const PENDING_URL = `${urls.bff}/api/v1/curation/queue?limit=1`;

type Kind = "health" | "pending" | "token";

interface Sent {
  readonly kind: Kind;
  readonly url: string;
  readonly authorization: string | null;
  readonly credentials: RequestCredentials | undefined;
}

type Answer = Response | Error;

interface Script {
  health?: (attempt: number) => Answer;
  pending?: (authorization: string | null, attempt: number) => Answer;
  token?: (attempt: number) => Answer;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly client: QueryClient;
}

const placements: Placement[] = [];

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
  const attempts: Record<Kind, number> = { health: 0, pending: 0, token: 0 };
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    const kind = kindOf(url);
    const authorization = new Headers(init?.headers).get("Authorization");
    sent.push({ kind, url, authorization, credentials: init?.credentials });
    attempts[kind] += 1;
    const attempt = attempts[kind];
    let answer: Answer;
    if (kind === "health") {
      answer = script.health ? script.health(attempt) : reply(200, { database: "ok" });
    } else if (kind === "pending") {
      answer = script.pending
        ? script.pending(authorization, attempt)
        : reply(200, { total: 0 });
    } else {
      answer = script.token ? script.token(attempt) : reply(200, { token: FRESH });
    }
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  });
  return sent;
}

function count(sent: Sent[], kind: Kind): number {
  return sent.filter((s) => s.kind === kind).length;
}

function counts(sent: Sent[]): { health: number; pending: number; token: number } {
  return {
    health: count(sent, "health"),
    pending: count(sent, "pending"),
    token: count(sent, "token"),
  };
}

function hold(token: string): void {
  useAuthStore.getState().setToken(token);
}

function useBoth() {
  return { health: useHealth(), count: useCurationCount() };
}

function mount<T>(useHook: () => T): () => T {
  const box: { current?: T } = {};
  function Probe(): null {
    const value = useHook();
    useEffect(() => {
      box.current = value;
    });
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Probe)));
  });
  placements.push({ root, container, client });
  return () => box.current as T;
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
});

afterEach(() => {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.client.clear();
  }
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("the pending curation read answered 401", () => {
  it("asks the identity provider once with the session cookie and repeats the read with the fresh token", async () => {
    const sent = stubFetch({
      pending: (authorization) =>
        authorization === `Bearer ${STALE}` ? reply(401) : reply(200, { total: 7 }),
    });
    hold(STALE);
    mount(useCurationCount);
    await advance();
    expect(
      sent.map((s) =>
        s.kind === "token" ? `token:${s.credentials}` : `${s.kind}:${s.authorization}`,
      ),
    ).toEqual([`pending:Bearer ${STALE}`, "token:include", `pending:Bearer ${FRESH}`]);
  });

  it("shows the total of the repeated read's answer", async () => {
    stubFetch({
      pending: (authorization) =>
        authorization === `Bearer ${STALE}` ? reply(401) : reply(200, { total: 7 }),
    });
    hold(STALE);
    const shown = mount(useCurationCount);
    await advance();
    expect(shown()).toBe(7);
  });

  it("does not ask the identity provider a second time when the repeated read is also answered 401", async () => {
    const sent = stubFetch({ pending: () => reply(401) });
    hold(STALE);
    mount(useCurationCount);
    await advance();
    expect(count(sent, "token")).toBe(1);
  });

  it("does not send a third pending read before the next interval when the repeated read is also answered 401", async () => {
    const sent = stubFetch({ pending: () => reply(401) });
    hold(STALE);
    mount(useCurationCount);
    await advance();
    await advance(19_999);
    expect(count(sent, "pending")).toBe(2);
  });

  it("asks the repeated read as the queue listing with limit 1", async () => {
    const sent = stubFetch({
      pending: (authorization) =>
        authorization === `Bearer ${STALE}` ? reply(401) : reply(200, { total: 4 }),
    });
    hold(STALE);
    mount(useCurationCount);
    await advance();
    const reads = sent.filter((s) => s.kind === "pending");
    expect(reads[1]?.url).toBe(PENDING_URL);
  });

  it("shows 0 pending, not the total shown before, when the repeated read's answer has no total", async () => {
    const sent = stubFetch({
      pending: (_authorization, attempt) =>
        attempt === 1 ? reply(200, { total: 5 }) : reply(401),
    });
    hold(STALE);
    const shown = mount(useCurationCount);
    await advance();
    expect(shown()).toBe(5);
    await advance(20_000);
    await settle();
    expect({ pendingReads: count(sent, "pending"), shown: shown() }).toEqual({
      pendingReads: 3,
      shown: 0,
    });
  });
});

describe("the pending curation read", () => {
  it("is not asked again before the next 20-second interval when it fails without a 401", async () => {
    const sent = stubFetch({ pending: () => reply(500) });
    hold(STALE);
    mount(useCurationCount);
    await advance();
    await advance(19_999);
    const beforeInterval = count(sent, "pending");
    await advance(1);
    expect({ beforeInterval, atInterval: count(sent, "pending") }).toEqual({
      beforeInterval: 1,
      atInterval: 2,
    });
  });

  it("is not made while no access token is held", async () => {
    const sent = stubFetch();
    mount(useCurationCount);
    await advance();
    await advance(20_000);
    expect(count(sent, "pending")).toBe(0);
  });

  it("is the queue listing with limit 1 and the token as bearer, made only with a token, and an answer without a total counts as 0", async () => {
    const sent = stubFetch({
      pending: (_authorization, attempt) =>
        attempt === 1 ? reply(200, { total: 5 }) : reply(200, {}),
    });
    const shown = mount(useCurationCount);
    await advance();
    await advance(20_000);
    const withoutToken = { requests: count(sent, "pending"), shown: shown() };
    act(() => {
      hold("held.token");
    });
    await advance();
    const read = sent.find((s) => s.kind === "pending");
    const withToken = {
      request: read === undefined ? null : `${read.url} ${read.authorization}`,
      shown: shown(),
    };
    await advance(20_000);
    await settle();
    expect({ withoutToken, withToken, withoutTotal: shown() }).toEqual({
      withoutToken: { requests: 0, shown: 0 },
      withToken: { request: `${PENDING_URL} Bearer held.token`, shown: 5 },
      withoutTotal: 0,
    });
  });
});

describe("the health read", () => {
  it("carries no Authorization header while a token is held", async () => {
    const sent = stubFetch();
    hold(STALE);
    mount(useHealth);
    await advance();
    const read = sent.find((s) => s.kind === "health");
    expect(read?.authorization).toBeNull();
  });

  it("does not ask the identity provider for a token when it is answered 401", async () => {
    const sent = stubFetch({ health: () => reply(401) });
    hold(STALE);
    mount(useHealth);
    await advance();
    expect(count(sent, "token")).toBe(0);
  });

  it("is not repeated at once after the request fails", async () => {
    const sent = stubFetch({ health: () => new Error("unreachable") });
    hold(STALE);
    mount(useHealth);
    await advance();
    await advance(19_999);
    expect(count(sent, "health")).toBe(1);
  });
});

describe("the shell reads", () => {
  it("asks the health and the pending total every 20 seconds when the reads succeed", async () => {
    const sent = stubFetch({ pending: () => reply(200, { total: 3 }) });
    hold(STALE);
    mount(useBoth);
    await advance();
    await advance(19_999);
    const beforeInterval = counts(sent);
    await advance(1);
    expect({ beforeInterval, atInterval: counts(sent) }).toEqual({
      beforeInterval: { health: 1, pending: 1, token: 0 },
      atInterval: { health: 2, pending: 2, token: 0 },
    });
  });

  it("asks each every 20 seconds, retries no failure except the one repeat after a renewed token, and sends the health without the token", async () => {
    const sent = stubFetch({
      health: (attempt) => (attempt === 1 ? reply(200, { database: "ok" }) : new Error("unreachable")),
      pending: (_authorization, attempt) => {
        if (attempt === 1) return reply(401);
        if (attempt === 2) return reply(200, { total: 3 });
        return reply(500);
      },
    });
    hold(STALE);
    mount(useBoth);
    await advance();
    const timeline = [counts(sent)];
    for (const ms of [19_999, 1, 19_999, 1]) {
      await advance(ms);
      timeline.push(counts(sent));
    }
    const healthAuthorizations = sent
      .filter((s) => s.kind === "health")
      .map((s) => s.authorization);
    expect({ timeline, healthAuthorizations }).toEqual({
      timeline: [
        { health: 1, pending: 2, token: 1 },
        { health: 1, pending: 2, token: 1 },
        { health: 2, pending: 3, token: 1 },
        { health: 2, pending: 3, token: 1 },
        { health: 3, pending: 4, token: 1 },
      ],
      healthAuthorizations: [null, null, null],
    });
  });
});
