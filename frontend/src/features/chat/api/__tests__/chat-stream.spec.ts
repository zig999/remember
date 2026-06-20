/**
 * chat-stream — SSE parser + streamer behavior.
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - The frame parser is the only thing between the wire and the UI. A
 *    silent regression (e.g. wrong field cast, dropped frame) would either
 *    freeze a turn (no more deltas) or render garbled text. Each test pins
 *    one invariant from openapi.yaml `sendMessage` so a refactor that
 *    breaks it fails loudly.
 *  - Abort handling is the difference between "stop button clears UI" and
 *    "stop button leaves a ghost streaming pill forever".
 */

import { describe, expect, it, vi } from "vitest";
import { parseSSEFrame, streamChat, type ChatSSEFrame } from "../chat-stream";

/* ---------- parseSSEFrame ---------- */

describe("parseSSEFrame", () => {
  it("parses an llm_start frame", () => {
    const out = parseSSEFrame('event: llm_start\ndata: {"iteration":1}');
    expect(out).toEqual({ type: "llm_start" });
  });

  it("parses a text_delta frame with the delta payload", () => {
    const out = parseSSEFrame(
      'event: text_delta\ndata: {"delta":"Rodrigo aparece "}',
    );
    expect(out).toEqual({ type: "text_delta", delta: "Rodrigo aparece " });
  });

  it("renames tool_start.args_summary (wire snake) to argsSummary (camel)", () => {
    const out = parseSSEFrame(
      'event: tool_start\ndata: {"tool":"search","args_summary":"q=\\"Rodrigo\\""}',
    );
    expect(out).toEqual({
      type: "tool_start",
      tool: "search",
      argsSummary: 'q="Rodrigo"',
    });
  });

  it("parses a tool_result frame with ok=true", () => {
    const out = parseSSEFrame(
      'event: tool_result\ndata: {"tool":"search","ok":true}',
    );
    expect(out).toEqual({ type: "tool_result", ok: true });
  });

  it("parses a done frame with stop_reason", () => {
    const out = parseSSEFrame(
      'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}',
    );
    expect(out).toEqual({ type: "done", stop_reason: "end_turn" });
  });

  it("parses an error frame with code + message", () => {
    const out = parseSSEFrame(
      'event: error\ndata: {"code":"BUSINESS_CHAT_PROVIDER_UNAVAILABLE","message":"boom"}',
    );
    expect(out).toEqual({
      type: "error",
      code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE",
      message: "boom",
    });
  });

  it("tolerates CRLF line endings (some proxies upgrade \\n to \\r\\n)", () => {
    const out = parseSSEFrame(
      'event: text_delta\r\ndata: {"delta":"hi"}',
    );
    expect(out).toEqual({ type: "text_delta", delta: "hi" });
  });

  it("strips the optional single space after `data:` (SSE spec)", () => {
    const out = parseSSEFrame('event: llm_start\ndata: {"iteration":2}');
    expect(out).toEqual({ type: "llm_start" });
  });

  it("returns null for a frame missing the event line", () => {
    expect(parseSSEFrame('data: {"delta":"x"}')).toBeNull();
  });

  it("returns null for a frame missing the data line", () => {
    expect(parseSSEFrame("event: text_delta")).toBeNull();
  });

  it("returns null for malformed JSON in data", () => {
    expect(parseSSEFrame("event: text_delta\ndata: {not json")).toBeNull();
  });

  it("returns null for an unknown event name", () => {
    expect(
      parseSSEFrame('event: pong\ndata: {"ts":1}'),
    ).toBeNull();
  });

  it("returns null when text_delta lacks a string delta", () => {
    expect(
      parseSSEFrame('event: text_delta\ndata: {"delta":123}'),
    ).toBeNull();
  });

  it("returns null when tool_start lacks args_summary", () => {
    expect(
      parseSSEFrame('event: tool_start\ndata: {"tool":"search"}'),
    ).toBeNull();
  });

  it("skips SSE comment lines (`:keep-alive`)", () => {
    const out = parseSSEFrame(
      ':keep-alive\nevent: llm_start\ndata: {"iteration":1}',
    );
    expect(out).toEqual({ type: "llm_start" });
  });
});

/* ---------- streamChat ---------- */

/**
 * Build a `Response` whose body streams the given chunks one at a time.
 * Mirrors the BFF behaviour (small chunk granularity = exercises buffering).
 */
function makeSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        const chunk = chunks[i] as string;
        controller.enqueue(encoder.encode(chunk));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

describe("streamChat", () => {
  it("yields all frames from a happy-path turn", async () => {
    const sse = [
      'event: llm_start\ndata: {"iteration":1}\n\n',
      'event: text_delta\ndata: {"delta":"hello "}\n\n',
      'event: text_delta\ndata: {"delta":"world"}\n\n',
      'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
    ];
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeSSEResponse(sse));

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames).toEqual<ChatSSEFrame[]>([
      { type: "llm_start" },
      { type: "text_delta", delta: "hello " },
      { type: "text_delta", delta: "world" },
      { type: "done", stop_reason: "end_turn" },
    ]);
    fetchSpy.mockRestore();
  });

  it("re-assembles a frame split across chunks (the parser MUST buffer on \\n\\n)", async () => {
    // Split the text_delta frame mid-payload.
    const sse = [
      "event: text_delta\n",
      'data: {"delta":"',
      'streamed"}\n\n',
      'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
    ];
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeSSEResponse(sse));

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames).toEqual<ChatSSEFrame[]>([
      { type: "text_delta", delta: "streamed" },
      { type: "done", stop_reason: "end_turn" },
    ]);
    fetchSpy.mockRestore();
  });

  it("skips a malformed frame without aborting the stream", async () => {
    const sse = [
      'event: text_delta\ndata: {"delta":"a"}\n\n',
      "event: text_delta\ndata: {bad json\n\n",
      'event: text_delta\ndata: {"delta":"b"}\n\n',
      'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
    ];
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeSSEResponse(sse));

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames.map((f) => f.type)).toEqual([
      "text_delta",
      "text_delta",
      "done",
    ]);
    fetchSpy.mockRestore();
  });

  it("returns cleanly on AbortController.abort() (no throw)", async () => {
    // The browser contract: when AbortController.abort() fires DURING an
    // in-flight fetch read, `reader.read()` rejects with an AbortError. We
    // simulate that by building a stream whose `pull()` waits on the abort
    // signal and then errors the controller with an AbortError — the same
    // shape `getReader().read()` would surface in a real browser.
    const encoder = new TextEncoder();
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        // Push one frame so the generator yields once before we abort.
        c.enqueue(
          encoder.encode('event: text_delta\ndata: {"delta":"a"}\n\n'),
        );
      },
      pull(c) {
        // Block until abort, then surface AbortError to the reader.
        return new Promise<void>((resolve) => {
          if (controller.signal.aborted) {
            c.error(new DOMException("aborted", "AbortError"));
            resolve();
            return;
          }
          controller.signal.addEventListener(
            "abort",
            () => {
              c.error(new DOMException("aborted", "AbortError"));
              resolve();
            },
            { once: true },
          );
        });
      },
    });
    const response = new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response);

    const gen = streamChat(
      "https://bff/x",
      { content: "hi" },
      { signal: controller.signal },
    );
    // Pull the first frame, then abort.
    const first = await gen.next();
    expect(first.value).toEqual({ type: "text_delta", delta: "a" });
    controller.abort();
    const second = await gen.next();
    expect(second.done).toBe(true);
    fetchSpy.mockRestore();
  });

  it("emits a single error frame for a pre-stream 4xx envelope", async () => {
    const body = JSON.stringify({
      ok: false,
      error: {
        code: "BUSINESS_CONVERSATION_ARCHIVED",
        message: "Conversa arquivada.",
      },
    });
    const response = new Response(body, {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response);

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames).toEqual<ChatSSEFrame[]>([
      {
        type: "error",
        code: "BUSINESS_CONVERSATION_ARCHIVED",
        message: "Conversa arquivada.",
      },
    ]);
    fetchSpy.mockRestore();
  });

  it("emits a SYSTEM_NETWORK error frame when fetch rejects (non-abort)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("net down"));

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames).toEqual<ChatSSEFrame[]>([
      {
        type: "error",
        code: "SYSTEM_NETWORK",
        message: "Falha de rede ao contactar o servidor.",
      },
    ]);
    fetchSpy.mockRestore();
  });

  it("returns cleanly (no error frame) when fetch rejects with AbortError", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    const frames = await collect(streamChat("https://bff/x", { content: "hi" }));
    expect(frames).toEqual([]);
    fetchSpy.mockRestore();
  });
});
