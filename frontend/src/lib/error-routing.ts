import { EnvelopeError } from "./http";

export type ToastTone = "warning" | "danger";

export type ErrorAction =
  | { kind: "redirect"; to: string }
  | { kind: "toast-and-navigate"; tone: ToastTone; message: string; to: string }
  | { kind: "boundary"; message: string }
  | { kind: "set-error"; message: string; details?: unknown }
  | { kind: "inline-empty"; message: string }
  | { kind: "inline-gone"; message: string }
  | { kind: "toast"; tone: ToastTone; message: string }
  | { kind: "silent" };

export interface ErrorRoutingContext {
  readonly isConversationResource?: boolean;
}

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

export function routeError(
  err: EnvelopeError | { code: string; message?: string; details?: unknown },
  context?: ErrorRoutingContext,
): ErrorAction {
  const code = err.code;
  const fallbackMessage = "message" in err && typeof err.message === "string" && err.message.length > 0 ? err.message : null;

  switch (code) {
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
      return { kind: "silent" };

    default:
      if (code.startsWith("BUSINESS_")) {
        return { kind: "toast", tone: "warning", message: fallbackMessage ?? MSG.business };
      }
      if (code.startsWith("SYSTEM_")) {
        return { kind: "toast", tone: "danger", message: MSG.system };
      }
      return { kind: "toast", tone: "danger", message: fallbackMessage ?? MSG.system };
  }
}

export function isConversationResourceKey(queryKey: readonly unknown[]): boolean {
  if (queryKey.length < 2) return false;
  if (queryKey[0] !== "conversations") return false;
  const second = queryKey[1];
  if (typeof second !== "string") return false;
  if (second === "list") return false;
  return second.length > 0;
}
