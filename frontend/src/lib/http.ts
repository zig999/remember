import { getEnv } from "./env";
import { useAuthStore } from "@/state/auth";
import { fetchAccessToken, AuthError } from "@/features/auth/api/neon-auth";

export interface Envelope<T> {
  readonly ok: boolean;
  readonly result?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface EnvelopeErrorPayload {
  readonly code: string;
  readonly httpStatus: number;
  readonly message: string;
  readonly details?: unknown;
}

export class EnvelopeError extends Error {
  override readonly name = "EnvelopeError";
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(payload: EnvelopeErrorPayload) {
    super(payload.message);
    this.code = payload.code;
    this.httpStatus = payload.httpStatus;
    if (payload.details !== undefined) {
      this.details = payload.details;
    }
  }
}

export interface HttpOptions extends Omit<RequestInit, "signal"> {
  ingest?: boolean;
  signal?: AbortSignal;
  __retried?: boolean;
}

export const DEFAULT_TIMEOUT_MS = 30_000;

let redirectImpl: (url: string) => void = (url) => {
  if (typeof window !== "undefined" && typeof window.location?.replace === "function") {
    window.location.replace(url);
  }
};

export function __setRedirectForTests(fn: ((url: string) => void) | null): void {
  redirectImpl = fn ?? ((url) => {
    if (typeof window !== "undefined" && typeof window.location?.replace === "function") {
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

function composeSignals(signals: ReadonlyArray<AbortSignal | undefined>): AbortSignal | undefined {
  const real = signals.filter((s): s is AbortSignal => s !== undefined);
  if (real.length === 0) return undefined;
  if (real.length === 1) return real[0];
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === "function") return anyFn(real);
  const controller = new AbortController();
  for (const s of real) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

function buildSignal(opts: HttpOptions): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (opts.ingest === true) {
    return { signal: opts.signal, cleanup: () => undefined };
  }
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new DOMException("Request timed out after 30s", "TimeoutError"));
  }, DEFAULT_TIMEOUT_MS);
  const signal = composeSignals([timeoutController.signal, opts.signal]);
  return {
    signal,
    cleanup: () => clearTimeout(timer),
  };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function isTimeoutError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "TimeoutError") return true;
  if (err instanceof Error && err.name === "TimeoutError") return true;
  return false;
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

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { ingest: _ingest, signal: _userSignal, __retried, ...init } = opts;
  void _ingest;
  void _userSignal;
  const { VITE_BFF_URL } = getEnv();
  const url = joinUrl(VITE_BFF_URL, path);

  const { signal, cleanup } = buildSignal(opts);

  const fetchInit: RequestInit = { ...init };
  if (signal !== undefined) fetchInit.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    cleanup();
    if (isTimeoutError(err)) {
      throw new EnvelopeError({
        code: "SYSTEM_TIMEOUT",
        httpStatus: 0,
        message: "Tempo limite excedido na requisição.",
        details: { cause: String(err) },
      });
    }
    if (isAbortError(err)) {
      throw new EnvelopeError({
        code: "SYSTEM_ABORTED",
        httpStatus: 0,
        message: "Requisição cancelada.",
        details: { cause: String(err) },
      });
    }
    throw new EnvelopeError({
      code: "SYSTEM_NETWORK",
      httpStatus: 0,
      message: "Falha de rede ao contactar o servidor.",
      details: { cause: String(err) },
    });
  }
  cleanup();

  if (response.status === 401 && __retried !== true) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      const retryOpts: HttpOptions = { ...opts, __retried: true };
      return http<T>(path, retryOpts);
    }
    throw new EnvelopeError({
      code: "AUTH_SESSION_EXPIRED",
      httpStatus: 401,
      message: "Sua sessão expirou. Faça login novamente.",
    });
  }

  if (response.status >= 500) {
    let raw: unknown = undefined;
    try {
      raw = await response.clone().json();
    } catch {
      raw = await response.text().catch(() => undefined);
    }
    const envelopeCode = extractEnvelopeCode(raw);
    throw new EnvelopeError({
      code: envelopeCode ?? "SYSTEM_UPSTREAM",
      httpStatus: response.status,
      message:
        extractEnvelopeMessage(raw) ?? "Algo deu errado. Tente novamente.",
      details: raw,
    });
  }

  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch (err) {
    throw new EnvelopeError({
      code: "SYSTEM_INVALID_RESPONSE",
      httpStatus: response.status,
      message: "Resposta do servidor não é JSON válido.",
      details: { cause: String(err) },
    });
  }

  if (body.ok === true) {
    return body.result as T;
  }

  const error = body.error;
  throw new EnvelopeError({
    code: error?.code ?? "SYSTEM_UNKNOWN",
    httpStatus: response.status,
    message: error?.message ?? "Erro desconhecido do servidor.",
    details: error?.details,
  });
}

export { AuthError };

function extractEnvelopeCode(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "error" in raw) {
    const err = (raw as { error?: unknown }).error;
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code?: unknown }).code;
      if (typeof code === "string") return code;
    }
  }
  return undefined;
}

function extractEnvelopeMessage(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "error" in raw) {
    const err = (raw as { error?: unknown }).error;
    if (err && typeof err === "object" && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}
