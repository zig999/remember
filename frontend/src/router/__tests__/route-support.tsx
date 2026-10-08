import { act, type ReactElement } from "react";
import type { Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { sessionToken } from "../../features/entities/components/__tests__/session-token";
import { stubFetch } from "../../features/entities/api/__tests__/support";

const ENV = "../../lib/env";

export const WORKSPACE = '[data-testid="app-workspace"]';
export const WAIT_MS = 10_000;

export function installShellMocks(): void {
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
}

export function removeShellMocks(pages: readonly string[]): void {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("sonner");
  vi.doUnmock(ENV);
  for (const page of pages) vi.doUnmock(page);
}

export async function buildApp(path: string, withSession: boolean) {
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

export async function show(root: Root, element: ReactElement): Promise<void> {
  await act(async () => {
    root.render(element);
  });
}

export async function settle(ms: number): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}
