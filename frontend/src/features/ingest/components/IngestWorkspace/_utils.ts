import { EnvelopeError } from "@/lib/http";

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

export function isConnectionDropError(err: unknown): boolean {
  if (err instanceof EnvelopeError) {
    if (err.httpStatus === 409 || err.httpStatus === 422) return false;
    if (err.code === "SYSTEM_NETWORK" || err.code === "SYSTEM_TIMEOUT") {
      return true;
    }
    if (err.code === "SYSTEM_LLM_PROVIDER_UNAVAILABLE") return false;
    if (err.code === "AUTH_SESSION_EXPIRED") return false;
    if (err.code === "SYSTEM_ABORTED") return false;
    return true;
  }
  return false;
}
