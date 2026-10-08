import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sessionToken } from "../../features/entities/components/__tests__/session-token";
import {
  stubFetch,
  waitUntil,
} from "../../features/entities/api/__tests__/support";

const ENTITY_PAGE = "../../features/entities/components/EntityPage";
const ENV = "../../lib/env";
const WORKSPACE = '[data-testid="app-workspace"]';
const SENTINEL = '[data-testid="entity-page-sentinel"]';
const WAIT_MS = 10_000;

const loads = { count: 0 };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  loads.count = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  stubFetch(() => new Promise<Response>(() => undefined));
  sessionStorage.clear();
  vi.resetModules();
  vi.doMock("sonner", () => ({
    Toaster: () => null,
    toast: {
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
    },
  }));
  vi.doMock(ENV, () => ({
    getEnv: () => ({
      VITE_BFF_URL: "https://bff.test",
      VITE_NEON_AUTH_URL: "https://auth.test",
    }),
  }));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("sonner");
  vi.doUnmock(ENV);
  vi.doUnmock(ENTITY_PAGE);
});

function countEntityPageLoads(): void {
  vi.doMock(ENTITY_PAGE, () => {
    loads.count += 1;
    return {
      EntityPage: () => <div data-testid="entity-page-sentinel">página</div>,
    };
  });
}

function holdEntityPageLoad(): void {
  vi.doMock(
    ENTITY_PAGE,
    () => new Promise<{ EntityPage: () => null }>(() => undefined),
  );
}

async function buildApp(path: string, withSession: boolean) {
  const { useAuthStore } = await import("../../state/auth");
  if (withSession) useAuthStore.getState().setToken(sessionToken());
  const { RouterProvider, createMemoryHistory, createRouter } = await import(
    "@tanstack/react-router"
  );
  const { routeTree } = await import("../routes");
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const element = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return { router, element };
}

async function show(element: ReactElement): Promise<void> {
  await act(async () => {
    root.render(element);
  });
}

async function settle(ms: number): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

describe("/entities/{node identity} route", () => {
  it("redirects a visit without a session to /sign-in instead of showing the page", async () => {
    const { router } = await buildApp("/entities/n-1", false);
    await router.load();
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("renders the page in the workspace of the application shell for a visit with a session", async () => {
    countEntityPageLoads();
    const { element } = await buildApp("/entities/n-1", true);
    await show(element);
    await waitUntil(() => container.querySelector(SENTINEL) !== null, WAIT_MS);
    expect(
      container.querySelector(`${WORKSPACE} ${SENTINEL}`),
    ).not.toBeNull();
  });

  it("does not fetch the page's code with the initial load of the application", async () => {
    countEntityPageLoads();
    const { element } = await buildApp("/graph", true);
    await show(element);
    await waitUntil(
      () => container.querySelector('[data-testid="graph-page"]') !== null,
      WAIT_MS,
    );
    await settle(100);
    expect(loads.count).toBe(0);
  });

  it("does not fetch the page's code when its address is preloaded", async () => {
    countEntityPageLoads();
    const { router } = await buildApp("/graph", true);
    await router.load();
    await router.preloadRoute({
      to: "/entities/$nodeId",
      params: { nodeId: "n-1" },
    });
    await settle(100);
    expect(loads.count).toBe(0);
  });

  it("reads the loading indication Carregando formulário… while the page's code is being fetched", async () => {
    holdEntityPageLoad();
    const { element } = await buildApp("/entities/n-1", true);
    await show(element);
    await waitUntil(
      () =>
        container.querySelector(`${WORKSPACE} [role="status"]`) !== null,
      WAIT_MS,
    );
    expect(
      container.querySelector(`${WORKSPACE} [role="status"]`)?.textContent,
    ).toBe("Carregando formulário…");
  });
});
