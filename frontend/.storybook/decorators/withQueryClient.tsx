/**
 * withQueryClient — Storybook decorator providing a fresh QueryClient, optionally
 * seeded with cache data. Used by shell stories whose components call TanStack
 * Query hooks (AppShell footer status) so they render representative data without
 * a real BFF. retry/refetch defaults are tightened so stories don't hit the
 * network on mount.
 */
import type { Decorator } from "@storybook/react-vite";
import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function withQueryClient(seed?: (qc: QueryClient) => void): Decorator {
  return function QueryDecorator(Story) {
    const qc = useMemo(() => {
      const client = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity, refetchOnMount: false },
        },
      });
      seed?.(client);
      return client;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <QueryClientProvider client={qc}>
        <Story />
      </QueryClientProvider>
    );
  };
}

/** Seed the shell footer to a healthy system with a few pending curation items. */
export const seedShellHealthy = (qc: QueryClient): void => {
  qc.setQueryData(["shell", "health"], {
    ok: true,
    service: "remember-bff",
    database: "ok",
    checked_at: "",
  });
  qc.setQueryData(["shell", "curation-count"], {
    total: 3,
    limit: 1,
    offset: 0,
    items: [],
  });
};
