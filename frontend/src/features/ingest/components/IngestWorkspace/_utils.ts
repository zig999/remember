/**
 * IngestWorkspace — internal helpers (extracted from IngestWorkspace.tsx
 * during dev_tc_005_r1 to keep the component file ≤ 300 lines, per
 * u-fe-standards "Component size" rule).
 *
 * Both helpers are pure and exhaustively unit-testable; they live here
 * rather than next to the panel because they describe how the workspace
 * interprets backend errors (workspace concern), not how the panel
 * renders them.
 */
import { EnvelopeError } from "@/lib/http";

/** Map an arbitrary error to a `{ code, message }` pair the panel can show.
 *  Keeps the workspace decoupled from `EnvelopeError` internals when other
 *  code paths surface a generic `Error`. */
export function classifyError(err: unknown): {
  readonly code: string;
  readonly message: string;
} {
  if (err instanceof EnvelopeError) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    return { code: "SYSTEM_UNKNOWN", message: err.message };
  }
  return { code: "SYSTEM_UNKNOWN", message: "Erro desconhecido." };
}

/** Decide whether a `runLlmExtraction` error counts as a "connection drop"
 *  (transitions to polling silently) or a real error (shows the error
 *  band). Per the TC contract: anything other than 409/422 is treated as a
 *  drop. */
export function isConnectionDropError(err: unknown): boolean {
  if (err instanceof EnvelopeError) {
    // Definite server-side rejections — surface as error.
    if (err.httpStatus === 409 || err.httpStatus === 422) return false;
    // Network/timeout — definitely a drop.
    if (err.code === "SYSTEM_NETWORK" || err.code === "SYSTEM_TIMEOUT") {
      return true;
    }
    // 5xx with an LLM_PROVIDER_UNAVAILABLE is a real error band per spec §6.
    if (err.code === "SYSTEM_LLM_PROVIDER_UNAVAILABLE") return false;
    if (err.code === "AUTH_SESSION_EXPIRED") return false; // handled globally
    if (err.code === "SYSTEM_ABORTED") return false; // user-driven, no UI
    // Any other code → treat as drop (graceful degradation per spec §4).
    return true;
  }
  // Non-Envelope errors are unknown ground — be conservative and surface
  // as error so they don't hide silently behind a polling spinner.
  return false;
}
