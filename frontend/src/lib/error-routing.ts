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
  | { kind: "boundary"; message: string }
  | { kind: "set-error"; message: string; details?: unknown }
  | { kind: "inline-empty"; message: string }
  | { kind: "inline-gone"; message: string }
  | { kind: "toast"; tone: ToastTone; message: string }
  | { kind: "silent" };

/* ---------- canonical messages ---------- */

const MSG = {
  sessionExpired: "Sua sessão expirou. Faça login novamente.",
  accessDenied: "Acesso negado.",
  validationInvalid: "Há campos inválidos no formulário.",
  notFound: "Nenhum resultado encontrado.",
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
export function routeError(err: EnvelopeError | { code: string; message?: string; details?: unknown }): ErrorAction {
  const code = err.code;
  const fallbackMessage = "message" in err && typeof err.message === "string" && err.message.length > 0 ? err.message : null;

  switch (code) {
    case "AUTH_UNAUTHORIZED":
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
