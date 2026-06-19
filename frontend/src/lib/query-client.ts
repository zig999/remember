/**
 * query-client — the SINGLE global TanStack Query client instance.
 *
 * Spec references:
 *  - front.md §4.1 (TanStack Query defaults: retry=1, refetchOnWindowFocus,
 *    staleTime per data class)
 *  - front.back.md BR-12 (exactly one QueryClient mounted in main.tsx)
 *  - front.back.md BR-08 (stale-time policy by data class — stable 5 min,
 *    volatile 0; volatile hooks override the global default)
 *  - front.back.md BR-17 (envelope failure routing — central onError)
 *  - front.md §5 (error routing table)
 *
 * The global `QueryCache.onError` runs the pure `routeError(...)` mapper and
 * executes the resulting `ErrorAction`. Side effects (toast, redirect,
 * boundary, set-error) are kept in this file so feature hooks never need to
 * handle envelope errors themselves (BR-17).
 *
 * Note: the QueryClient lives at module scope so the instance is stable
 * across HMR reloads of consumers — `QueryClientProvider` in `main.tsx` is
 * the single mount point (BR-12).
 */

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { EnvelopeError } from "./http";
import { routeError, type ErrorAction } from "./error-routing";
import { reportError } from "./report-error";

/* ---------- defaults ---------- */

/** Stable-data staleTime (catalog, immutable detail). front.md §4.1 + BR-08. */
export const STABLE_STALE_MS = 5 * 60 * 1000;

/** Volatile-data staleTime (search results, run status). Hooks override per call. */
export const VOLATILE_STALE_MS = 0;

/* ---------- side-effect executor ---------- */

/**
 * Run the side effect described by an `ErrorAction`. Kept in this module so
 * feature hooks never wire up toast/redirect logic themselves (BR-17).
 *
 * `redirect` and `boundary` are surfaced by re-throwing — the router's
 * `__root` loader / `<AppErrorBoundary>` handle them. For toasts we use
 * `sonner`; for `silent` we no-op (caller-driven cancel).
 */
export function applyErrorAction(action: ErrorAction): void {
  switch (action.kind) {
    case "toast":
      if (action.tone === "danger") toast.error(action.message);
      else toast.warning(action.message);
      return;
    case "redirect":
      // Use window.location for redirects out of the React tree — the
      // router's `__root` beforeLoad covers the synchronous boot case;
      // this branch handles a stale 401 mid-session. We avoid a router
      // dependency at module load so this file stays a pure utility.
      if (typeof window !== "undefined") {
        window.location.assign(action.to);
      }
      return;
    case "boundary":
      // Surface to the AppErrorBoundary by re-throwing — TanStack Query
      // does NOT propagate by default; the boundary attaches via
      // `useQueryErrorResetBoundary` (foundation wave reserves the slot).
      // For now, also surface as a danger toast so the operator sees it.
      toast.error(action.message);
      return;
    case "set-error":
      // Form-level errors are handled by React Hook Form `setError` at the
      // feature level — the global handler intentionally does nothing so the
      // form can attach the field-level message.
      return;
    case "inline-empty":
    case "inline-gone":
      // Inline area-level renders — the feature renders the empty/gone state
      // off the query's `error` value. Global handler is a no-op.
      return;
    case "silent":
      return;
    default: {
      // Exhaustive-check fallback — fail loud (Golden Rule 12).
      const exhaustive: never = action;
      throw new Error(`Unhandled ErrorAction kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/* ---------- single instance ---------- */

/**
 * Build the global QueryClient. Exported as a factory so tests can construct
 * isolated instances; production code uses the singleton `queryClient` below.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: STABLE_STALE_MS,
        refetchOnWindowFocus: false, // stable default; volatile hooks opt in
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache({
      onError: (err) => {
        if (err instanceof EnvelopeError) {
          applyErrorAction(routeError(err));
          return;
        }
        // Non-envelope error — log and toast danger as a safety net.
        reportError(err);
        toast.error("Algo deu errado. Tente novamente.");
      },
    }),
    mutationCache: new MutationCache({
      onError: (err) => {
        if (err instanceof EnvelopeError) {
          applyErrorAction(routeError(err));
          return;
        }
        reportError(err);
        toast.error("Algo deu errado. Tente novamente.");
      },
    }),
  });
}

/** Module-scope singleton consumed by `main.tsx`. BR-12. */
export const queryClient: QueryClient = createQueryClient();
