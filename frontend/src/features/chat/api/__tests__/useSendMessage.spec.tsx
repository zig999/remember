// @vitest-environment jsdom
/**
 * useSendMessage — turn orchestrator integration.
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - The whole purpose of this hook is to coordinate five things in order
 *    (idempotency-key, optimistic insert, abort registration, SSE consumption,
 *    invalidation). Each test pins one of those steps against the spec.
 *  - The auth header MUST be read from `useAuthStore.getState()` at send
 *    time (non-reactive) — a regression that captures it at mount would
 *    break sign-in-then-send flows. Test "uses the JWT present at call
 *    time" pins this.
 *
 * Test rig:
 *  - No `@testing-library/react` in this stack — we mount via React DOM
 *    client directly with `act()` from `react-dom/test-utils` and read the
 *    returned mutation via an imperative ref.
 */

import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationResult,
} from "@tanstack/react-query";

// Mock lib/env before any module that reads it loads. `vi.mock` is hoisted
// above all imports; we mock by the relative path that `lib/env` resolves
// to so vite's path alias resolution stays untouched. The chat-stream module
// reads `getEnv()` synchronously at SSE open time — without this mock the
// test would need a real `import.meta.env.VITE_BFF_URL`.
vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useSendMessage, type SendMessageResult } from "../useSendMessage";
import { useChatTurnStore } from "../../state/chat-turn";
import { conversationKeys } from "../keys";
import { useAuthStore } from "../../../../state/auth";

/* ---------- rig ---------- */

interface HarnessHandle {
  mutationRef: { current: UseMutationResult<SendMessageResult, Error, never> | null };
  queryClient: QueryClient;
  container: HTMLDivElement;
  root: Root;
}

function mountHarness(): HarnessHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const mutationRef: HarnessHandle["mutationRef"] = { current: null };

  function Probe(): React.ReactElement {
    const m = useSendMessage();
    mutationRef.current = m as unknown as UseMutationResult<
      SendMessageResult,
      Error,
      never
    >;
    return React.createElement("div");
  }

  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Probe, null),
      ),
    );
  });
  return { mutationRef, queryClient, container, root };
}

function unmountHarness(h: HarnessHandle): void {
  act(() => {
    h.root.unmount();
  });
  h.container.remove();
}

/**
 * Build an SSE Response that streams the given pre-encoded chunks.
 */
function makeSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i] as string));
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

/* ---------- shared ---------- */

const CONVO_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  useChatTurnStore.getState().reset();
  useAuthStore.setState({ accessToken: null, claims: null });
  // crypto.randomUUID is available in modern jsdom; sanity-check.
  if (typeof crypto?.randomUUID !== "function") {
    throw new Error("crypto.randomUUID missing — upgrade jsdom or polyfill");
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  useChatTurnStore.getState().reset();
});

/* ---------- tests ---------- */

describe("useSendMessage — happy path", () => {
  it("optimistically inserts the user bubble before SSE opens", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => {
        // Inspect the cache AT THE MOMENT fetch is called.
        const cache = h.queryClient.getQueryData(
          conversationKeys.messages(CONVO_ID),
        ) as { items: Array<{ role: string; content: Array<{ text?: string }> }> } | undefined;
        expect(cache).toBeDefined();
        expect(cache?.items.length).toBe(1);
        expect(cache?.items[0]?.role).toBe("user");
        expect(cache?.items[0]?.content[0]?.text).toBe("Quem é o Rodrigo?");
        return Promise.resolve(
          makeSSEResponse([
            'event: llm_start\ndata: {"iteration":1}\n\n',
            'event: text_delta\ndata: {"delta":"Resposta"}\n\n',
            'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
          ]),
        );
      });

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "Quem é o Rodrigo?",
        } as never);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      unmountHarness(h);
    }
  });

  it("sends the Idempotency-Key header (UUID) per call", async () => {
    let capturedHeaders: Headers | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce((_url, init) => {
      const i = init as RequestInit;
      capturedHeaders = new Headers(i.headers as HeadersInit);
      return Promise.resolve(
        makeSSEResponse([
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      );
    });

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      expect(capturedHeaders).not.toBeNull();
      const key = capturedHeaders!.get("Idempotency-Key");
      expect(key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    } finally {
      unmountHarness(h);
    }
  });

  it("uses the JWT present in useAuthStore at SEND time (non-reactive)", async () => {
    let capturedAuth: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce((_url, init) => {
      const headers = new Headers((init as RequestInit).headers as HeadersInit);
      capturedAuth = headers.get("Authorization");
      return Promise.resolve(
        makeSSEResponse([
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      );
    });

    const h = mountHarness();
    try {
      // Token was null at mount; set it after mount but before send.
      useAuthStore.setState({ accessToken: "jwt-token", claims: null });
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      expect(capturedAuth).toBe("Bearer jwt-token");
    } finally {
      unmountHarness(h);
    }
  });

  it("registers an AbortController in useChatTurnStore while streaming and clears it on done", async () => {
    // The store ref must be live BEFORE the stream terminates — peek at it
    // mid-fetch (the fetch handler runs while isStreaming is still true).
    let snapshotMidFlight: {
      ac: AbortController | null;
      isStreaming: boolean;
    } | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => {
      const s = useChatTurnStore.getState();
      snapshotMidFlight = { ac: s.abortController, isStreaming: s.isStreaming };
      return Promise.resolve(
        makeSSEResponse([
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      );
    });

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      expect(snapshotMidFlight).not.toBeNull();
      expect(snapshotMidFlight!.ac).toBeInstanceOf(AbortController);
      expect(snapshotMidFlight!.isStreaming).toBe(true);
      // After terminal frame, both clear.
      expect(useChatTurnStore.getState().abortController).toBeNull();
      expect(useChatTurnStore.getState().isStreaming).toBe(false);
    } finally {
      unmountHarness(h);
    }
  });

  it("accumulates text_delta into streamingText and tool frames into chips", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: llm_start\ndata: {"iteration":1}\n\n',
          'event: tool_start\ndata: {"tool":"search","args_summary":"q=\\"x\\""}\n\n',
          'event: tool_result\ndata: {"tool":"search","ok":true}\n\n',
          'event: text_delta\ndata: {"delta":"hello "}\n\n',
          'event: text_delta\ndata: {"delta":"world"}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      const s = useChatTurnStore.getState();
      expect(s.streamingText).toBe("hello world");
      expect(s.toolChips).toEqual([
        { tool: "search", argsSummary: 'q="x"', ok: true },
      ]);
    } finally {
      unmountHarness(h);
    }
  });

  it("invalidates messages + usage keys after the terminal done frame", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      const spy = vi.spyOn(h.queryClient, "invalidateQueries");
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      const calls = spy.mock.calls.map((c) => c[0]);
      const keys = calls.map((c) =>
        JSON.stringify((c as { queryKey?: unknown }).queryKey),
      );
      expect(keys).toContain(
        JSON.stringify(conversationKeys.messages(CONVO_ID)),
      );
      expect(keys).toContain(
        JSON.stringify(conversationKeys.usage(CONVO_ID)),
      );
    } finally {
      unmountHarness(h);
    }
  });

  it("returns the stop_reason on done", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: done\ndata: {"stop_reason":"max_tokens","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      let result: SendMessageResult | undefined;
      await act(async () => {
        result = await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      expect(result?.stopReason).toBe("max_tokens");
      expect(result?.errorCode).toBeNull();
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useSendMessage — error path", () => {
  it("captures the error frame and still invalidates", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: error\ndata: {"code":"BUSINESS_CHAT_PROVIDER_UNAVAILABLE","message":"boom"}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      const spy = vi.spyOn(h.queryClient, "invalidateQueries");
      let result: SendMessageResult | undefined;
      await act(async () => {
        result = await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      expect(result?.errorCode).toBe("BUSINESS_CHAT_PROVIDER_UNAVAILABLE");
      expect(result?.errorMessage).toBe("boom");
      expect(result?.stopReason).toBeNull();
      // Even on error frame, post-turn invalidation runs so usage refetches.
      expect(spy).toHaveBeenCalled();
    } finally {
      unmountHarness(h);
    }
  });
});
