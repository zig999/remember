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

export const STABLE_STALE_MS = 5 * 60 * 1000;

export const VOLATILE_STALE_MS = 0;

export function applyErrorAction(action: ErrorAction): void {
  switch (action.kind) {
    case "toast":
      if (action.tone === "danger") toast.error(action.message);
      else toast.warning(action.message);
      return;
    case "toast-and-navigate":
      if (action.tone === "danger") toast.error(action.message);
      else toast.warning(action.message);
      void router.navigate({ to: action.to, search: {} as never });
      return;
    case "redirect":
      try {
        useAuthStore.getState().clear();
      } catch {
      }
      if (typeof window !== "undefined") {
        window.location.assign(action.to);
      }
      return;
    case "boundary":
      toast.error(action.message);
      return;
    case "set-error":
      return;
    case "inline-empty":
    case "inline-gone":
      return;
    case "silent":
      return;
    default: {
      const exhaustive: never = action;
      throw new Error(`Unhandled ErrorAction kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function contextFromQuery(query: { queryKey: readonly unknown[] } | undefined): ErrorRoutingContext {
  if (!query) return {};
  return { isConversationResource: isConversationResourceKey(query.queryKey) };
}

export function contextFromMutation(mutation: { options?: { mutationKey?: readonly unknown[] } } | undefined): ErrorRoutingContext {
  const key = mutation?.options?.mutationKey;
  if (!key) return {};
  return { isConversationResource: isConversationResourceKey(key) };
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: STABLE_STALE_MS,
        refetchOnWindowFocus: false,
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

export const queryClient: QueryClient = createQueryClient();
