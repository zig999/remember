import { getEnv } from "@/lib/env";
import { EnvelopeError } from "@/lib/http";
import { fetchAccessToken } from "@/features/auth/api/neon-auth";
import { useAuthStore } from "@/state/auth";

export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}

export interface IngestRequestOptions extends Omit<RequestInit, "signal"> {
  readonly signal?: AbortSignal;
  readonly ingest?: boolean;
  __retried?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

let redirectImpl: (url: string) => void = (url) => {
  if (
    typeof window !== "undefined" &&
    typeof window.location?.replace === "function"
  ) {
    window.location.replace(url);
  }
};

export function __setIngestRedirectForTests(
  fn: ((url: string) => void) | null,
): void {
  redirectImpl =
    fn ??
    ((url) => {
      if (
        typeof window !== "undefined" &&
        typeof window.location?.replace === "function"
      ) {
        window.location.replace(url);
      }
    });
}

function joinUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function composeSignals(
  signals: ReadonlyArray<AbortSignal | undefined>,
): AbortSignal | undefined {
  const real = signals.filter((s): s is AbortSignal => s !== undefined);
  if (real.length === 0) return undefined;
  if (real.length === 1) return real[0];
  const anyFn = (
    AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }
  ).any;
  if (typeof anyFn === "function") return anyFn(real);
  const controller = new AbortController();
  for (const s of real) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), {
      once: true,
    });
  }
  return controller.signal;
}

async function trySilentRefresh(): Promise<boolean> {
  try {
    const newJwt = await fetchAccessToken();
    useAuthStore.getState().setToken(newJwt);
    return true;
  } catch (err) {
    void err;
    useAuthStore.getState().clear();
    redirectImpl("/sign-in?reason=session_expired");
    return false;
  }
}

export async function httpIngest<T>(
  path: string,
  opts: IngestRequestOptions = {},
): Promise<T> {
  const { signal: userSignal, ingest: ingestMode, __retried, ...init } = opts;
  const { VITE_BFF_URL } = getEnv();
  const url = joinUrl(VITE_BFF_URL, path);

  let signal: AbortSignal | undefined;
  let cleanup: () => void = () => undefined;
  if (ingestMode === true) {
    signal = userSignal;
  } else {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(
        new DOMException("Request timed out after 30s", "TimeoutError"),
      );
    }, DEFAULT_TIMEOUT_MS);
    signal = composeSignals([timeoutController.signal, userSignal]);
    cleanup = () => clearTimeout(timer);
  }

  const fetchInit: RequestInit = { ...init };
  if (signal !== undefined) fetchInit.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    cleanup();
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new EnvelopeError({
      code: isTimeout
        ? "SYSTEM_TIMEOUT"
        : isAbort
          ? "SYSTEM_ABORTED"
          : "SYSTEM_NETWORK",
      httpStatus: 0,
      message: isTimeout
        ? "Tempo limite excedido na requisição."
        : isAbort
          ? "Requisição cancelada."
          : "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }
  cleanup();

  if (response.status === 401 && __retried !== true) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      const nextHeaders = new Headers(
        (init.headers ?? {}) as HeadersInit,
      );
      const fresh = useAuthStore.getState().accessToken;
      if (fresh !== null) {
        nextHeaders.set("Authorization", `Bearer ${fresh}`);
      }
      return httpIngest<T>(path, {
        ...opts,
        headers: Object.fromEntries(nextHeaders.entries()),
        __retried: true,
      });
    }
    throw new EnvelopeError({
      code: "AUTH_SESSION_EXPIRED",
      httpStatus: 401,
      message: "Sua sessão expirou. Faça login novamente.",
    });
  }

  if (response.status >= 200 && response.status < 300) {
    try {
      if (response.status === 204) return undefined as unknown as T;
      return (await response.json()) as T;
    } catch (err) {
      throw new EnvelopeError({
        code: "SYSTEM_INVALID_RESPONSE",
        httpStatus: response.status,
        message: "Resposta do servidor não é JSON válido.",
        details: { cause: String(err) },
      });
    }
  }

  let raw: unknown = undefined;
  try {
    raw = await response.json();
  } catch {
    raw = undefined;
  }
  const errObj =
    raw && typeof raw === "object" && "error" in raw
      ? (raw as {
          error?: {
            code?: unknown;
            message?: unknown;
            details?: unknown;
          };
        }).error
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
