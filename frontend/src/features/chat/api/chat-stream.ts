import type { GraphLinkWire, GraphNodeWire } from "@/features/graph";

export interface ChatSSEFrameLLMStart {
  readonly type: "llm_start";
}

export interface ChatSSEFrameTextDelta {
  readonly type: "text_delta";
  readonly delta: string;
}

export interface ChatSSEFrameToolStart {
  readonly type: "tool_start";
  readonly tool: string;
  readonly argsSummary: string;
}

export interface ChatSSEFrameToolResult {
  readonly type: "tool_result";
  readonly ok: boolean;
}

export interface ChatSSEFrameDone {
  readonly type: "done";
  readonly stop_reason: string;
}

export interface ChatSSEFrameError {
  readonly type: "error";
  readonly code: string;
  readonly message: string;
}

export interface ChatSSEFrameGraphDelta {
  readonly type: "graph_delta";
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

export type ChatSSEFrame =
  | ChatSSEFrameLLMStart
  | ChatSSEFrameTextDelta
  | ChatSSEFrameToolStart
  | ChatSSEFrameToolResult
  | ChatSSEFrameDone
  | ChatSSEFrameError
  | ChatSSEFrameGraphDelta;

export interface StreamChatOptions {
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

export function parseSSEFrame(block: string): ChatSSEFrame | null {
  let eventName: string | null = null;
  let dataLine: string | null = null;

  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.length === 0) continue;
    if (line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const field = line.slice(0, colon);
    const value = line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") {
      eventName = value;
    } else if (field === "data") {
      dataLine = dataLine === null ? value : `${dataLine}\n${value}`;
    }
  }

  if (eventName === null || dataLine === null) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(dataLine);
  } catch {
    return null;
  }
  if (payload === null || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  switch (eventName) {
    case "llm_start":
      return { type: "llm_start" };
    case "text_delta": {
      const delta = p["delta"];
      if (typeof delta !== "string") return null;
      return { type: "text_delta", delta };
    }
    case "tool_start": {
      const tool = p["tool"];
      const argsSummary = p["args_summary"];
      if (typeof tool !== "string" || typeof argsSummary !== "string") {
        return null;
      }
      return { type: "tool_start", tool, argsSummary };
    }
    case "tool_result": {
      const ok = p["ok"];
      if (typeof ok !== "boolean") return null;
      return { type: "tool_result", ok };
    }
    case "done": {
      const stopReason = p["stop_reason"];
      if (typeof stopReason !== "string") return null;
      return { type: "done", stop_reason: stopReason };
    }
    case "error": {
      const code = p["code"];
      const message = p["message"];
      if (typeof code !== "string" || typeof message !== "string") return null;
      return { type: "error", code, message };
    }
    case "graph_delta": {
      const sourceTool = p["source_tool"];
      const nodes = p["nodes"];
      const links = p["links"];
      if (typeof sourceTool !== "string") return null;
      if (!Array.isArray(nodes)) return null;
      if (!Array.isArray(links)) return null;
      return {
        type: "graph_delta",
        sourceTool,
        nodes: nodes as readonly GraphNodeWire[],
        links: links as readonly GraphLinkWire[],
      };
    }
    default:
      return null;
  }
}

interface PreStreamError {
  readonly code: string;
  readonly message: string;
}

async function extractPreStreamError(
  response: Response,
): Promise<PreStreamError> {
  const fallback: PreStreamError =
    response.status >= 500
      ? {
          code: "SYSTEM_UPSTREAM",
          message: "Algo deu errado. Tente novamente.",
        }
      : {
          code: "SYSTEM_UNKNOWN",
          message: "Erro desconhecido do servidor.",
        };

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return fallback;
  }
  if (!raw || typeof raw !== "object" || !("error" in raw)) return fallback;
  const err = (raw as { error?: unknown }).error;
  if (!err || typeof err !== "object") return fallback;
  const e = err as { code?: unknown; message?: unknown };
  return {
    code: typeof e.code === "string" ? e.code : fallback.code,
    message: typeof e.message === "string" ? e.message : fallback.message,
  };
}

export async function* streamChat(
  url: string,
  body: unknown,
  options: StreamChatOptions = {},
): AsyncGenerator<ChatSSEFrame, void, void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(options.headers ?? {}),
  };

  let response: Response;
  try {
    const init: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
    if (options.signal !== undefined) init.signal = options.signal;
    response = await fetch(url, init);
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    if (isAbort) return;
    yield {
      type: "error",
      code: "SYSTEM_NETWORK",
      message: "Falha de rede ao contactar o servidor.",
    };
    return;
  }

  if (!response.ok || response.body === null) {
    if (response.body === null) {
      yield {
        type: "error",
        code: "SYSTEM_INVALID_RESPONSE",
        message: "Resposta do servidor sem corpo.",
      };
      return;
    }
    const err = await extractPreStreamError(response);
    yield { type: "error", code: err.code, message: err.message };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (isAbort) return;
        yield {
          type: "error",
          code: "SYSTEM_NETWORK",
          message: "Falha de rede durante o streaming.",
        };
        return;
      }
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const frame = parseSSEFrame(block);
        if (frame !== null) yield frame;
        boundary = buffer.indexOf("\n\n");
      }
    }
    const tail = buffer.trim();
    if (tail.length > 0) {
      const frame = parseSSEFrame(tail);
      if (frame !== null) yield frame;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
}
