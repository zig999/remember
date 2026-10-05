import { getEnv } from "@/lib/env";
import { EnvelopeError } from "@/lib/http";
import { useAuthStore } from "@/state/auth";

export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}

export async function httpVoid(
  path: string,
  init: RequestInit = {},
): Promise<void> {
  const { VITE_BFF_URL } = getEnv();
  const url = `${VITE_BFF_URL.endsWith("/") ? VITE_BFF_URL.slice(0, -1) : VITE_BFF_URL}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    throw new EnvelopeError({
      code: isAbort ? "SYSTEM_ABORTED" : "SYSTEM_NETWORK",
      httpStatus: 0,
      message: isAbort
        ? "Requisição cancelada."
        : "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }

  if (response.status === 204) return;

  let raw: unknown = undefined;
  try {
    raw = await response.json();
  } catch {
  }
  const errObj =
    raw && typeof raw === "object" && "error" in raw
      ? (raw as { error?: { code?: unknown; message?: unknown; details?: unknown } }).error
      : undefined;
  throw new EnvelopeError({
    code:
      typeof errObj?.code === "string"
        ? errObj.code
        : response.status >= 500
          ? "SYSTEM_UPSTREAM"
          : "SYSTEM_UNKNOWN",
    httpStatus: response.status,
    message:
      typeof errObj?.message === "string"
        ? errObj.message
        : response.status >= 500
          ? "Algo deu errado. Tente novamente."
          : "Erro desconhecido do servidor.",
    details: errObj?.details,
  });
}
