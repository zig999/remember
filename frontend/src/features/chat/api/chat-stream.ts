/**
 * chat-stream — SSE client for `POST /api/v1/conversations/:id/messages`.
 *
 * Spec references:
 *  - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes"
 *    (chat-stream.ts — fetch + getReader, NOT EventSource: EventSource cannot
 *    carry POST + Authorization).
 *  - docs/specs/domains/chat/openapi.yaml — `sendMessage` (SSE wire frames:
 *    `event: <name>\n` + `data: <json>\n\n`; six event names: `llm_start`,
 *    `text_delta`, `tool_start`, `tool_result`, `done`, `error`).
 *  - CLAUDE.md "Stack — Frontend" / "Fixed stack contract": fetch + reader.
 *
 * Surface shape (TC-04 task contract):
 *  - Exposed as an `AsyncGenerator<ChatSSEFrame>`. The frame shape is FLAT,
 *    `{ type, ...payload }`, not the spec's wire-level `{ event, data }`.
 *    The flat shape matches the Zustand store actions
 *    (`appendText(delta)`, `addToolChip({ tool, argsSummary })`) and avoids a
 *    second indirection at every call site.
 *  - The parser maps the wire `args_summary` (snake) to the surface
 *    `argsSummary` (camel) so consumers stay camelCase end-to-end (consistent
 *    with `ToolCallData` in `../types.ts`).
 *
 * Behaviour:
 *  - Streams chunks via `response.body.getReader()` + `TextDecoder`.
 *  - Splits on the SSE frame boundary `\n\n`. A multi-line frame may contain
 *    `event: <name>` + `data: <json>` lines (in either order). `data:` is
 *    JSON-parsed.
 *  - Malformed frames (missing event/data, non-JSON data, unknown event name)
 *    are SKIPPED silently — the spec guarantees the server emits well-formed
 *    frames, but client robustness avoids the generator throwing on a single
 *    bad chunk (which would terminate the entire turn UI).
 *  - Pre-stream HTTP errors (4xx/5xx) emit one terminal `error` frame
 *    constructed from the envelope body when possible, then return.
 *  - Caller-driven abort via `options.signal` propagates to `fetch()` and the
 *    reader; the generator returns cleanly (no throw on abort).
 *
 * What this module deliberately does NOT do:
 *  - It does not build the URL (`features/chat/api/useSendMessage.ts` does).
 *  - It does not attach `Authorization` or `Idempotency-Key` headers — the
 *    caller passes them in `options.headers`. Reading the JWT from the
 *    Zustand store at call time is the orchestrator hook's responsibility,
 *    not the transport's (keeps the transport pure / testable with `vi.fn`
 *    for `fetch`).
 */

/* ---------- public types ---------- */

import type { GraphLinkWire, GraphNodeWire } from "@/features/graph";

/** `llm_start` — emitted at the start of each agentic iteration. */
export interface ChatSSEFrameLLMStart {
  readonly type: "llm_start";
}

/** `text_delta` — incremental assistant text. */
export interface ChatSSEFrameTextDelta {
  readonly type: "text_delta";
  readonly delta: string;
}

/** `tool_start` — a tool call is about to execute. */
export interface ChatSSEFrameToolStart {
  readonly type: "tool_start";
  readonly tool: string;
  readonly argsSummary: string;
}

/** `tool_result` — tool call settled. */
export interface ChatSSEFrameToolResult {
  readonly type: "tool_result";
  readonly ok: boolean;
}

/** `done` — terminal frame on the success path. */
export interface ChatSSEFrameDone {
  readonly type: "done";
  readonly stop_reason: string;
}

/** `error` — terminal frame on the failure path. */
export interface ChatSSEFrameError {
  readonly type: "error";
  readonly code: string;
  readonly message: string;
}

/**
 * `graph_delta` — knowledge-graph slice emitted after each graph-producing
 * `tool_result` (TC-BE-02, plan §4.1). Aditive frame: turns without a graph
 * tool never emit one. The dispatcher in `useSendMessage` maps the wire
 * payload through `mapWireToGraphDelta` and pushes it into `useGraphStore`.
 *
 * Field mapping: the wire field `source_tool` (snake) becomes `sourceTool`
 * (camel), mirroring the `args_summary` → `argsSummary` precedent on
 * `tool_start`. Node/link items keep their snake-case wire shape and are
 * forwarded as-is to the mapping layer (`features/graph/lib/map.ts`) —
 * item-level validation is the dispatcher's responsibility, not the
 * parser's (parser stays lightweight per plan §7.3).
 */
export interface ChatSSEFrameGraphDelta {
  readonly type: "graph_delta";
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

/** Discriminated union of all 7 SSE frame variants. */
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
  /** AbortSignal — stop button calls `AbortController.abort()`. */
  readonly signal?: AbortSignal;
}

/* ---------- internal parser ---------- */

/**
 * Parse one SSE frame block (everything between two `\n\n` separators) into a
 * surface `ChatSSEFrame`. Returns `null` for malformed / unknown frames so
 * the generator can skip them.
 */
export function parseSSEFrame(block: string): ChatSSEFrame | null {
  let eventName: string | null = null;
  let dataLine: string | null = null;

  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.length === 0) continue;
    if (line.startsWith(":")) continue; // SSE comment / keep-alive
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const field = line.slice(0, colon);
    // Per SSE spec, an optional single space follows the colon.
    const value = line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") {
      eventName = value;
    } else if (field === "data") {
      // Multi-line `data:` per SSE spec would concatenate with `\n`; the BFF
      // emits single-line JSON, so the last `data:` wins on malformed input.
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
      // Wire shape (plan §4.1): { source_tool, nodes[], links[] }.
      // We shallow-validate the three top-level fields here. Item-level
      // validation (node_type slug, status enum, link endpoints, …) is the
      // mapping layer's job (`features/graph/lib/map.ts`) — keeping it out of
      // the parser avoids tying the SSE transport to the graph schema.
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

/* ---------- error envelope extraction (pre-stream 4xx/5xx) ---------- */

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

/* ---------- public streamer ---------- */

/**
 * Open an SSE turn and yield each parsed frame.
 *
 * Usage:
 *   const stream = streamChat(url, body, { headers, signal });
 *   for await (const frame of stream) {
 *     switch (frame.type) { ... }
 *   }
 *
 * The generator always returns cleanly (no throws on abort or pre-stream
 * errors). Pre-stream HTTP errors surface as a single `error` frame so the
 * caller has one terminal branch to handle.
 */
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

      // Drain all complete frames (separated by `\n\n`).
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const frame = parseSSEFrame(block);
        if (frame !== null) yield frame;
        boundary = buffer.indexOf("\n\n");
      }
    }
    // Drain a trailing partial frame (rare — well-behaved servers terminate
    // with `\n\n`, but defensive).
    const tail = buffer.trim();
    if (tail.length > 0) {
      const frame = parseSSEFrame(tail);
      if (frame !== null) yield frame;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore — lock may already be released on abort */
    }
  }
}
