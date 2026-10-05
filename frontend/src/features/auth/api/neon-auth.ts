import { getEnv } from "@/lib/env";

export class AuthError extends Error {
  override readonly name = "AuthError";
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function base(): string {
  return getEnv().VITE_NEON_AUTH_URL.replace(/\/$/, "");
}

async function readErrorBody(res: Response): Promise<{ code?: string; message?: string }> {
  try {
    const raw = (await res.json()) as unknown;
    if (raw !== null && typeof raw === "object") {
      const obj = raw as { code?: unknown; message?: unknown };
      const out: { code?: string; message?: string } = {};
      if (typeof obj.code === "string") out.code = obj.code;
      if (typeof obj.message === "string") out.message = obj.message;
      return out;
    }
  } catch {
  }
  return {};
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError")) {
      throw new AuthError("NETWORK", `Network error contacting auth: ${String(err.message ?? err)}`);
    }
    throw err;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const url = `${base()}/sign-in/email`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) return;

  const body = await readErrorBody(res);
  if (body.code === "INVALID_EMAIL_OR_PASSWORD") {
    throw new AuthError("INVALID_EMAIL_OR_PASSWORD", body.message ?? "E-mail ou senha incorretos.");
  }
  if (res.status === 401) {
    throw new AuthError(
      "INVALID_EMAIL_OR_PASSWORD",
      body.message ?? "E-mail ou senha incorretos.",
    );
  }
  throw new AuthError(
    body.code ?? "UNKNOWN",
    body.message ?? `Falha na autenticação (HTTP ${res.status}).`,
  );
}

export async function fetchAccessToken(): Promise<string> {
  const url = `${base()}/token`;
  const res = await safeFetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    const body = await readErrorBody(res);
    throw new AuthError("NO_SESSION", body.message ?? "Sessão expirada ou ausente.");
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new AuthError(
      body.code ?? "UNKNOWN",
      body.message ?? `Falha ao obter token (HTTP ${res.status}).`,
    );
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não é JSON válido.");
  }

  if (parsed === null || typeof parsed !== "object") {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não contém token.");
  }
  const token = (parsed as { token?: unknown }).token;
  if (typeof token !== "string" || token.length === 0) {
    throw new AuthError("NO_TOKEN", "Resposta do servidor de auth não contém token.");
  }
  return token;
}
