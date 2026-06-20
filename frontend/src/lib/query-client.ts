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
import {
  routeError,
  isConversationResourceKey,
  type ErrorAction,
  type ErrorRoutingContext,
} from "./error-routing";
import { reportError } from "./report-error";
import { useAuthStore } from "@/state/auth";
import { router } from "@/router/router";

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
    case "toast-and-navigate":
      // TC-11: composite action used by the chat conversation 404 path.
      // The toast informs the operator and the navigation drops the stale
      // `?conversation=<id>` so the workspace stops querying a ghost id.
      // Router-driven navigation (not `window.location.assign`) preserves
      // the React tree and the TanStack Query cache.
      if (action.tone === "danger") toast.error(action.message);
      else toast.warning(action.message);
      void router.navigate({ to: action.to, search: {} as never });
      return;
    case "redirect":
      // AUTH_* codes: clear the in-memory bearer + sessionStorage before
      // sending the user to /sign-in so a refresh cannot revive the stale
      // token (front.back.md §2 + TC-11 routing rules). We assign via
      // `window.location` to also tear down the React tree — the next
      // route mount picks up the clean store.
      try {
        useAuthStore.getState().clear();
      } catch {
        /* SSR / test envs without the store mount — fail soft. */
      }
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

/**
 * Build the `ErrorRoutingContext` from the failing query (or mutation). Today
 * the only context bit is whether the failure came from a chat conversation
 * resource query — used by `routeError` to swap the default inline-empty
 * surface for a toast + navigate (TC-11).
 *
 * Exported so the equivalent mutation path can reuse it.
 */
export function contextFromQuery(query: { queryKey: readonly unknown[] } | undefined): ErrorRoutingContext {
  if (!query) return {};
  return { isConversationResource: isConversationResourceKey(query.queryKey) };
}

/**
 * Mutations don't carry a `queryKey` — but the chat domain uses scoped
 * mutation keys that mirror `conversationKeys` shape (e.g.
 * `["conversations", id, "send"]`). When present, we treat them the same
 * as queries. Otherwise the context is empty and `routeError` falls back
 * to the default `RESOURCE_NOT_FOUND` → inline-empty action.
 */
export function contextFromMutation(mutation: { options?: { mutationKey?: readonly unknown[] } } | undefined): ErrorRoutingContext {
  const key = mutation?.options?.mutationKey;
  if (!key) return {};
  return { isConversationResource: isConversationResourceKey(key) };
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
      onError: (err, query) => {
        if (err instanceof EnvelopeError) {
          applyErrorAction(routeError(err, contextFromQuery(query)));
          return;
        }
        // Non-envelope error — log and toast danger as a safety net.
        reportError(err);
        toast.error("Algo deu errado. Tente novamente.");
      },
    }),
    mutationCache: new MutationCache({
      onError: (err, _vars, _ctx, mutation) => {
        if (err instanceof EnvelopeError) {
          applyErrorAction(routeError(err, contextFromMutation(mutation)));
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
