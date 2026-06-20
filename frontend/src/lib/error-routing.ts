/**
 * error-routing — the SINGLE place that maps BFF envelope error codes to
 * concrete UI behaviour (front.md §5, front.back.md BR-17, EV-05).
 *
 * Feature hooks MUST NOT inline `if (err.code === "...")` logic for any of
 * the codes mapped here. They MAY add feature-specific handling for
 * `BUSINESS_*` codes the feature itself defines (front.back.md BR-17).
 *
 * Routing decisions are returned as a typed `ErrorAction`. The caller
 * (typically the global `QueryCache.onError` in `main.tsx`) executes the
 * action — this module has no side effects, which keeps it unit-testable
 * without DOM / router mocks.
 */

import { EnvelopeError } from "./http";

/* ---------- action vocabulary ---------- */

/** Where the consequence should be visible. */
export type ToastTone = "warning" | "danger";

export type ErrorAction =
  | { kind: "redirect"; to: string }
  /**
   * Composite action — show a toast then navigate. Used by the chat
   * conversation-404 path: `RESOURCE_NOT_FOUND` on a conversation query
   * must surface a warning toast AND drop the URL back to `/chat`
   * (TC-11 / chat.feature.spec.md §6).
   */
  | { kind: "toast-and-navigate"; tone: ToastTone; message: string; to: string }
  | { kind: "boundary"; message: string }
  | { kind: "set-error"; message: string; details?: unknown }
  | { kind: "inline-empty"; message: string }
  | { kind: "inline-gone"; message: string }
  | { kind: "toast"; tone: ToastTone; message: string }
  | { kind: "silent" };

/**
 * Optional source-of-error context used to make routing decisions that depend
 * on what produced the failure. Today only the chat conversation query needs
 * it (RESOURCE_NOT_FOUND → toast + navigate; otherwise inline-empty).
 *
 * Pure data — the global QueryCache.onError populates this from the failing
 * query's `queryKey`. Tests construct it directly.
 */
export interface ErrorRoutingContext {
  /** True when the failing query/mutation targets a single chat conversation. */
  readonly isConversationResource?: boolean;
}

/* ---------- canonical messages ---------- */

const MSG = {
  sessionExpired: "Sua sessão expirou. Faça login novamente.",
  accessDenied: "Acesso negado.",
  validationInvalid: "Há campos inválidos no formulário.",
  notFound: "Nenhum resultado encontrado.",
  conversationNotFound: "Conversa não encontrada.",
  gone: "Esta fonte foi removida por conformidade.",
  business: "Operação não pôde ser concluída.",
  system: "Algo deu errado. Tente novamente.",
  offline: "Sem conexão.",
} as const;

/* ---------- mapping ---------- */

/**
 * Route a single error code → action. Pure function. Unknown codes default
 * to a danger toast (fail loud — Golden Rule 12).
 */
export function routeError(
  err: EnvelopeError | { code: string; message?: string; details?: unknown },
  context?: ErrorRoutingContext,
): ErrorAction {
  const code = err.code;
  const fallbackMessage = "message" in err && typeof err.message === "string" && err.message.length > 0 ? err.message : null;

  switch (code) {
    // All three AUTH expiry / invalid codes funnel the operator to /sign-in.
    // TC-11: AUTH_TOKEN_EXPIRED and AUTH_TOKEN_INVALID are session-loss codes
    // emitted by the BFF JWT middleware; behaviour is identical to a fresh 401
    // (front.md §5; chat.feature.spec.md §6).
    case "AUTH_UNAUTHORIZED":
    case "AUTH_TOKEN_EXPIRED":
    case "AUTH_TOKEN_INVALID":
      return { kind: "redirect", to: "/sign-in?reason=session_expired" };

    case "AUTH_FORBIDDEN":
      return { kind: "boundary", message: MSG.accessDenied };

    case "VALIDATION_INVALID_FORMAT":
      return {
        kind: "set-error",
        message: fallbackMessage ?? MSG.validationInvalid,
        ...("details" in err && err.details !== undefined ? { details: err.details } : {}),
      };

    case "RESOURCE_NOT_FOUND":
      // TC-11: a missing conversation must drop the active id from the URL
      // and inform the operator — otherwise the workspace renders forever
      // against a stale id (chat.feature.spec.md §6 + chat.flow.md FL-02).
      if (context?.isConversationResource === true) {
        return {
          kind: "toast-and-navigate",
          tone: "warning",
          message: MSG.conversationNotFound,
          to: "/chat",
        };
      }
      return { kind: "inline-empty", message: fallbackMessage ?? MSG.notFound };

    case "RESOURCE_GONE":
      return { kind: "inline-gone", message: MSG.gone };

    case "SYSTEM_NETWORK":
      return { kind: "toast", tone: "warning", message: MSG.offline };

    case "SYSTEM_ABORTED":
      // Caller-driven cancel (unmount, navigation) — never user-facing.
      return { kind: "silent" };

    default:
      if (code.startsWith("BUSINESS_")) {
        return { kind: "toast", tone: "warning", message: fallbackMessage ?? MSG.business };
      }
      if (code.startsWith("SYSTEM_")) {
        return { kind: "toast", tone: "danger", message: MSG.system };
      }
      // Unknown — fail loud, as a danger toast.
      return { kind: "toast", tone: "danger", message: fallbackMessage ?? MSG.system };
  }
}

/**
 * Inspect a TanStack Query/Mutation `queryKey` and decide whether it points at
 * a single chat conversation resource (detail / messages / usage). The list
 * key `["conversations", "list", …]` deliberately does NOT match — listing
 * never produces a 404 of one specific conversation; only detail/child
 * queries should redirect on RESOURCE_NOT_FOUND.
 *
 * Centralised here so the `QueryCache.onError` in `query-client.ts` stays
 * declarative and the mapping is unit-testable without TanStack mocks.
 *
 * Spec: chat/api/keys.ts `conversationKeys` shape; chat.feature.spec.md §4.
 */
export function isConversationResourceKey(queryKey: readonly unknown[]): boolean {
  if (queryKey.length < 2) return false;
  if (queryKey[0] !== "conversations") return false;
  const second = queryKey[1];
  if (typeof second !== "string") return false;
  // Exclude the list root: `["conversations", "list", filters]`.
  if (second === "list") return false;
  return second.length > 0;
}
