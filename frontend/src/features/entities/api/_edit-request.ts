import { getEnv } from "@/lib/env";
import { DEFAULT_TIMEOUT_MS, EnvelopeError } from "@/lib/http";
import { fetchAccessToken } from "@/features/auth/api/neon-auth";
import { authHeader } from "@/features/curation/api/_request";
import { useAuthStore } from "@/state/auth";
import type { EditAcceptedWire, EntityEditWire } from "../types";

const SIGN_IN_EXPIRED = "/sign-in?reason=session_expired";

function replaceLocation(url: string): void {
  if (
    typeof window !== "undefined" &&
    typeof window.location?.replace === "function"
  ) {
    window.location.replace(url);
  }
}

let redirectImpl: (url: string) => void = replaceLocation;

export function __setEditRedirectForTests(
  fn: ((url: string) => void) | null,
): void {
  redirectImpl = fn ?? replaceLocation;
}

function editUrl(nodeId: string): string {
  const base = getEnv().VITE_BFF_URL.replace(/\/$/, "");
  return `${base}/api/v1/nodes/${encodeURIComponent(nodeId)}/edit`;
}

function namedAs(err: unknown, name: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === name
  );
}

function noAnswer(
  err: unknown,
  timedOut: boolean,
  callerAborted: boolean,
): EnvelopeError {
  if (timedOut || namedAs(err, "TimeoutError")) {
    return new EnvelopeError({
      code: "SYSTEM_TIMEOUT",
      httpStatus: 0,
      message: "Tempo limite excedido na requisição.",
      details: { cause: String(err) },
    });
  }
  if (callerAborted || namedAs(err, "AbortError")) {
    return new EnvelopeError({
      code: "SYSTEM_ABORTED",
      httpStatus: 0,
      message: "Requisição cancelada.",
      details: { cause: String(err) },
    });
  }
  return new EnvelopeError({
    code: "SYSTEM_NETWORK",
    httpStatus: 0,
    message: "Falha de rede ao contactar o servidor.",
    details: { cause: String(err) },
  });
}

async function sendOnce(
  url: string,
  body: string,
  callerSignal: AbortSignal | undefined,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(
      new DOMException("Request timed out after 30s", "TimeoutError"),
    );
  }, DEFAULT_TIMEOUT_MS);
  const relay = (): void => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted === true) relay();
  else callerSignal?.addEventListener("abort", relay, { once: true });
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    throw noAnswer(err, timedOut, callerSignal?.aborted === true);
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", relay);
  }
}

async function refreshSession(): Promise<boolean> {
  try {
    useAuthStore.getState().setToken(await fetchAccessToken());
    return true;
  } catch {
    useAuthStore.getState().clear();
    redirectImpl(SIGN_IN_EXPIRED);
    return false;
  }
}

interface ErrorMember {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly details?: unknown;
}

function errorMemberOf(raw: unknown): ErrorMember | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const error = (raw as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return undefined;
  return error as ErrorMember;
}

async function refusalOf(response: Response): Promise<EnvelopeError> {
  let raw: unknown = undefined;
  try {
    raw = await response.json();
  } catch {
    raw = undefined;
  }
  const error = errorMemberOf(raw);
  const upstream = response.status >= 500;
  const fallbackMessage = upstream
    ? "Algo deu errado. Tente novamente."
    : "Erro desconhecido do servidor.";
  const readableCode = typeof error?.code === "string" ? error.code : undefined;
  return new EnvelopeError({
    code: readableCode ?? (upstream ? "SYSTEM_UPSTREAM" : "SYSTEM_UNKNOWN"),
    httpStatus: response.status,
    message:
      readableCode !== undefined && typeof error?.message === "string"
        ? error.message
        : fallbackMessage,
    details: readableCode === undefined ? undefined : error?.details,
  });
}

async function answerOf(response: Response): Promise<EditAcceptedWire> {
  if (!response.ok) throw await refusalOf(response);
  try {
    return (await response.json()) as EditAcceptedWire;
  } catch (err) {
    throw new EnvelopeError({
      code: "SYSTEM_INVALID_RESPONSE",
      httpStatus: response.status,
      message: "Resposta do servidor não é JSON válido.",
      details: { cause: String(err) },
    });
  }
}

export async function entityEdit(
  nodeId: string,
  edit: EntityEditWire,
  signal?: AbortSignal,
): Promise<EditAcceptedWire> {
  const url = editUrl(nodeId);
  const body = JSON.stringify(edit);
  let response = await sendOnce(url, body, signal);
  if (response.status === 401) {
    if (!(await refreshSession())) {
      throw new EnvelopeError({
        code: "AUTH_SESSION_EXPIRED",
        httpStatus: 401,
        message: "Sua sessão expirou. Faça login novamente.",
      });
    }
    response = await sendOnce(url, body, signal);
  }
  return answerOf(response);
}
