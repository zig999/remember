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

import {
  useSendMessage,
  type SendMessageResult,
} from "../useSendMessage";
import { useChatTurnStore } from "../../state/chat-turn";
import { conversationKeys } from "../keys";
import { useAuthStore } from "../../../../state/auth";
import { useGraphStore } from "../../../graph";

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
  useGraphStore.getState().clear();
  useAuthStore.setState({ accessToken: null, claims: null });
  // crypto.randomUUID is available in modern jsdom; sanity-check.
  if (typeof crypto?.randomUUID !== "function") {
    throw new Error("crypto.randomUUID missing — upgrade jsdom or polyfill");
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  useChatTurnStore.getState().reset();
  useGraphStore.getState().clear();
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

/* -------------------------------------------------------------------------
 * TC-FE-04 — graph_delta dispatching, chatStatus state machine, GraphStatus
 * coupling, conversation-change clear. The tests below pin the contract
 * described in the Task Contract's validation criteria + the plan §7.3 / §12.
 *
 * The pure-mapper assertions for `mapWireToGraphDelta` live alongside the
 * function itself at `features/graph/api/__tests__/mapWireToGraphDelta.spec.ts`
 * (dev_tc_001 extraction). The dispatch tests below still exercise the
 * mapper indirectly via the SSE turn.
 * ------------------------------------------------------------------------- */

describe("useSendMessage — graph_delta dispatch (TC-FE-04)", () => {
  it("first graph_delta of a response REPLACES any prior graph (non-cumulative)", async () => {
    // Seed a stale node as if left by a previous response.
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "stale", type: "concept", label: "old", state: "accepted" }],
      links: [],
    });
    expect(useGraphStore.getState().nodes.has("stale")).toBe(true);

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"traverse","args_summary":"id=n1"}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"traverse","nodes":[{"id":"n1","node_type":"person","canonical_name":"R","status":"active"}],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "quem é R?",
        } as never);
      });
      const nodes = useGraphStore.getState().nodes;
      // The response's graph is shown …
      expect(nodes.has("n1")).toBe(true);
      // … and it REPLACED the prior graph — the stale node is gone.
      expect(nodes.has("stale")).toBe(false);
    } finally {
      unmountHarness(h);
    }
  });

  it("composes multiple graph_delta WITHIN one response (later results add, not replace)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"list_nodes","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"list_nodes","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"list_nodes","nodes":[{"id":"n1","node_type":"person","canonical_name":"A","status":"active"}],"links":[]}\n\n',
          'event: tool_start\ndata: {"tool":"traverse","args_summary":"id=n1"}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"traverse","nodes":[{"id":"n2","node_type":"person","canonical_name":"B","status":"active"}],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "explore",
        } as never);
      });
      // The 2nd graph result of the SAME response composed onto the 1st
      // (added, not replaced) — both nodes are present.
      const nodes = useGraphStore.getState().nodes;
      expect(nodes.has("n1")).toBe(true);
      expect(nodes.has("n2")).toBe(true);
    } finally {
      unmountHarness(h);
    }
  });

  it("a new response REPLACES the previous response's graph (non-cumulative across turns)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    // Response 1 — node n1.
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"traverse","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"traverse","nodes":[{"id":"n1","node_type":"person","canonical_name":"A","status":"active"}],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );
    // Response 2 — node n2 only.
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"traverse","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"traverse","nodes":[{"id":"n2","node_type":"person","canonical_name":"B","status":"active"}],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "first",
        } as never);
      });
      expect(useGraphStore.getState().nodes.has("n1")).toBe(true);

      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "second",
        } as never);
      });
      // The second response's graph fully replaces the first's — n1 is gone.
      const nodes = useGraphStore.getState().nodes;
      expect(nodes.has("n2")).toBe(true);
      expect(nodes.has("n1")).toBe(false);
    } finally {
      unmountHarness(h);
    }
  });

  it("a 0-node graph result leaves the existing graph unchanged (UC-CG-05)", async () => {
    // Seed a node, then run a response whose graph result is empty.
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "kept", type: "concept", label: "keep me", state: "accepted" }],
      links: [],
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"search","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"search","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"search","nodes":[],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "nada encontrado",
        } as never);
      });
      // An empty result is not "a new graph" — the prior node survives
      // (the response's one-shot replace was not consumed).
      expect(useGraphStore.getState().nodes.has("kept")).toBe(true);
    } finally {
      unmountHarness(h);
    }
  });

  it("tool_start with graph tool flips GraphStatus to 'loading' (AC-F.8)", async () => {
    // We can't easily snapshot mid-stream (the dispatcher runs synchronously
    // between pulls and we'd race), so spy on `setStatus` and assert the
    // sequence of calls — "loading" must appear before any terminal flip.
    const setStatusCalls: Array<{ s: string; m: string | undefined }> = [];
    const realSetStatus = useGraphStore.getState().setStatus;
    useGraphStore.setState({
      setStatus: (status, message) => {
        setStatusCalls.push({ s: status, m: message });
        realSetStatus(status, message);
      },
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"traverse","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
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
      // Restore for downstream tests in the file (afterEach also clears).
      useGraphStore.setState({ setStatus: realSetStatus });
      // tool_start fired setStatus("loading") — pin the call.
      const loadingCalls = setStatusCalls.filter((c) => c.s === "loading");
      expect(loadingCalls).toHaveLength(1);
    } finally {
      unmountHarness(h);
    }
  });

  it("tool_start with NON-graph tool leaves GraphStatus unchanged (AC-F.8)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"list_node_types","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"list_node_types","ok":true}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().status).toBe("empty");
    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      // No graph_delta arrived and no graph tool ran → status remains "empty".
      expect(useGraphStore.getState().status).toBe("empty");
    } finally {
      unmountHarness(h);
    }
  });

  it("done with receivedDeltaThisTurn=false leaves GraphStatus 'empty' (AC-F.21)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: llm_start\ndata: {"iteration":1}\n\n',
          'event: text_delta\ndata: {"delta":"olá"}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().status).toBe("empty");
    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "olá",
        } as never);
      });
      // Chat-only turn — no graph delta, status must NOT flip to "ready".
      expect(useGraphStore.getState().status).toBe("empty");
    } finally {
      unmountHarness(h);
    }
  });

  it("error with no graph tool in flight leaves GraphStatus untouched (AC-F.21, I-7)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: error\ndata: {"code":"BUSINESS_CHAT_PROVIDER_UNAVAILABLE","message":"boom"}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().status).toBe("empty");
    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "x",
        } as never);
      });
      // No graph tool was in flight → GraphStatus stays "empty" (not "error").
      expect(useGraphStore.getState().status).toBe("empty");
    } finally {
      unmountHarness(h);
    }
  });

  it("done with a graph delta promotes GraphStatus to 'ready'", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"traverse","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"traverse","nodes":[{"id":"n1","node_type":"person","canonical_name":"R","status":"active"}],"links":[]}\n\n',
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
      expect(useGraphStore.getState().status).toBe("ready");
    } finally {
      unmountHarness(h);
    }
  });
});

describe("useSendMessage — chatStatus state machine (TC-FE-04)", () => {
  /**
   * Helper — wrap `setChatStatus` with a recording proxy. The dispatcher
   * resolves actions through a ref captured at mount time (see
   * `useSendMessage.ts` `actionsRef`), so the wrap MUST happen BEFORE the
   * harness mounts. Returns the call list and a cleanup that restores the
   * original. We use this rather than mid-stream pull snapshots because the
   * pull callback runs BEFORE the dispatcher consumes the chunk, leaving a
   * race window where snapshots arrive too early.
   */
  function recordChatStatusCalls(): {
    calls: string[];
    restore: () => void;
  } {
    const calls: string[] = [];
    const realSet = useChatTurnStore.getState().setChatStatus;
    useChatTurnStore.setState({
      setChatStatus: (next) => {
        calls.push(next);
        realSet(next);
      },
    });
    return { calls, restore: () => useChatTurnStore.setState({ setChatStatus: realSet }) };
  }

  it("llm_start → 'thinking', text_delta → 'streaming', done → 'idle'", async () => {
    const rec = recordChatStatusCalls();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: llm_start\ndata: {"iteration":1}\n\n',
          'event: text_delta\ndata: {"delta":"a"}\n\n',
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
      rec.restore();
      // Each frame records exactly one setChatStatus call in order.
      expect(rec.calls).toEqual(["thinking", "streaming", "idle"]);
      expect(useChatTurnStore.getState().chatStatus).toBe("idle");
    } finally {
      unmountHarness(h);
    }
  });

  it("tool_start → 'tool_running'; tool_result → back to 'streaming'", async () => {
    const rec = recordChatStatusCalls();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"search","args_summary":""}\n\n',
          'event: tool_result\ndata: {"tool":"search","ok":true}\n\n',
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
      rec.restore();
      expect(rec.calls).toEqual(["tool_running", "streaming", "idle"]);
      expect(useChatTurnStore.getState().chatStatus).toBe("idle");
    } finally {
      unmountHarness(h);
    }
  });

  it("error frame sets chatStatus to 'error' (sticky banner)", async () => {
    const rec = recordChatStatusCalls();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: error\ndata: {"code":"SYSTEM_UPSTREAM","message":"boom"}\n\n',
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
      rec.restore();
      expect(rec.calls).toEqual(["error"]);
      expect(useChatTurnStore.getState().chatStatus).toBe("error");
    } finally {
      unmountHarness(h);
    }
  });
});

/* -------------------------------------------------------------------------
 * TC-FE-01 — Ingestion tools are non-graph (BDD Scenario 6, FEAT-01 §9).
 *
 * `start_async_ingestion` and `get_ingestion_status` are server-side tool
 * dispatches inside the chat agentic loop, gated by `CHAT_INGEST_ENABLED=true`
 * at the BFF (`chat.back.md` v2.4 / BR-43 / BR-44). On the SPA they MUST be
 * handled by the SAME generic ToolCallChip path as any other non-graph tool:
 *   1. `tool_start` → addToolChip pending; chatStatus → "tool_running"
 *   2. `tool_result` → resolve chip ok/err; chatStatus → "streaming"
 *   3. NO `graph_delta` is emitted for these tools (they don't read the graph)
 *   4. `useGraphStore.status` MUST NOT flip to "loading" — they are not in
 *      the GRAPH_TOOLS set ({ traverse, get_node, list_nodes, search }).
 *
 * Why this matters (Rule 9 — intent, not behavior): if a future refactor
 * accidentally adds `start_async_ingestion` to GRAPH_TOOLS, the right pane
 * would flicker into "loading" and stay there (no graph_delta ever lands →
 * `settleTurn("done")` would still flip it to "ready" / "empty", but the
 * intermediate "loading" state is wrong UX for an ingestion call). These
 * tests fail loudly if the GRAPH_TOOLS invariant is broken for ingestion.
 * ------------------------------------------------------------------------- */

describe("useSendMessage — ingestion tools are non-graph (TC-FE-01)", () => {
  it("start_async_ingestion: tool_start/tool_result render a generic chip and do NOT flip GraphStatus to 'loading'", async () => {
    // Record every setStatus call on the graph store — assert "loading" is
    // never invoked for ingestion tools (the non-graph branch).
    const setStatusCalls: Array<{ s: string; m: string | undefined }> = [];
    const realSetStatus = useGraphStore.getState().setStatus;
    useGraphStore.setState({
      setStatus: (status, message) => {
        setStatusCalls.push({ s: status, m: message });
        realSetStatus(status, message);
      },
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"start_async_ingestion","args_summary":"source_type=text content_len=42"}\n\n',
          'event: tool_result\ndata: {"tool":"start_async_ingestion","ok":true}\n\n',
          'event: text_delta\ndata: {"delta":"Ingestão iniciada."}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().status).toBe("empty");
    const h = mountHarness();
    try {
      let result: SendMessageResult | undefined;
      await act(async () => {
        result = await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "Ingerir este documento.",
        } as never);
      });
      useGraphStore.setState({ setStatus: realSetStatus });

      // Generic chip path: chip exists with the verbatim tool name and ok=true.
      const s = useChatTurnStore.getState();
      expect(s.toolChips).toEqual([
        {
          tool: "start_async_ingestion",
          argsSummary: "source_type=text content_len=42",
          ok: true,
        },
      ]);

      // GraphStatus invariant: tool_start for a non-graph tool MUST NOT call
      // setStatus("loading"). The store stays in its initial "empty" state.
      const loadingCalls = setStatusCalls.filter((c) => c.s === "loading");
      expect(loadingCalls).toHaveLength(0);
      expect(useGraphStore.getState().status).toBe("empty");

      // Turn completes normally — done frame produced a stop_reason.
      expect(result?.stopReason).toBe("end_turn");
      expect(result?.errorCode).toBeNull();
    } finally {
      unmountHarness(h);
    }
  });

  it("get_ingestion_status: tool_start/tool_result render a generic chip and do NOT flip GraphStatus to 'loading'", async () => {
    const setStatusCalls: Array<{ s: string; m: string | undefined }> = [];
    const realSetStatus = useGraphStore.getState().setStatus;
    useGraphStore.setState({
      setStatus: (status, message) => {
        setStatusCalls.push({ s: status, m: message });
        realSetStatus(status, message);
      },
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"get_ingestion_status","args_summary":"run_id=abc"}\n\n',
          'event: tool_result\ndata: {"tool":"get_ingestion_status","ok":true}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().status).toBe("empty");
    const h = mountHarness();
    try {
      let result: SendMessageResult | undefined;
      await act(async () => {
        result = await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "Como está a ingestão?",
        } as never);
      });
      useGraphStore.setState({ setStatus: realSetStatus });

      const s = useChatTurnStore.getState();
      expect(s.toolChips).toEqual([
        {
          tool: "get_ingestion_status",
          argsSummary: "run_id=abc",
          ok: true,
        },
      ]);

      const loadingCalls = setStatusCalls.filter((c) => c.s === "loading");
      expect(loadingCalls).toHaveLength(0);
      expect(useGraphStore.getState().status).toBe("empty");

      expect(result?.stopReason).toBe("end_turn");
      expect(result?.errorCode).toBeNull();
    } finally {
      unmountHarness(h);
    }
  });

  it("ingestion tools follow the chatStatus tool_running → streaming → idle path (no graph branch)", async () => {
    // Indirect test of the generic dispatch path: the chatStatus sequence
    // for a non-graph tool is identical whether the tool is `search` (graph)
    // or `start_async_ingestion` (non-graph) — only the GraphStatus side
    // effect differs. By pinning the sequence here we prove the dispatcher
    // funnels ingestion tools through the generic addToolChip branch.
    const calls: string[] = [];
    const realSet = useChatTurnStore.getState().setChatStatus;
    useChatTurnStore.setState({
      setChatStatus: (next) => {
        calls.push(next);
        realSet(next);
      },
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"start_async_ingestion","args_summary":"source_type=text content_len=10"}\n\n',
          'event: tool_result\ndata: {"tool":"start_async_ingestion","ok":true}\n\n',
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
      useChatTurnStore.setState({ setChatStatus: realSet });

      // Same sequence as the `search` (graph) tool — see the existing
      // "tool_start → 'tool_running'; tool_result → back to 'streaming'"
      // test above. The dispatcher does NOT special-case ingestion tools.
      expect(calls).toEqual(["tool_running", "streaming", "idle"]);
    } finally {
      unmountHarness(h);
    }
  });

  it("ingestion tools do not emit graph_delta and leave useGraphStore.nodes empty", async () => {
    // A non-graph tool resolving with ok=true must not — by itself — cause
    // the graph pane to mutate. This test pins the invariant for the two
    // RETIRED v2.3 ingestion tools (`start_async_ingestion` /
    // `get_ingestion_status`, retired in chat.spec.md v2.6) — the BFF does
    // not emit `graph_delta` for them, so the SPA nodes Map must stay empty
    // across the turn.
    //
    // NOTE (v1.5.0 revocation — spec §12 / chat.feature.spec.md v1.5.0):
    // the earlier blanket "the `graph_delta` frame is not emitted for
    // ingestion tools" carve-out is REVOKED for the v2.6+ write-bearing
    // tool `ingest_directed`. It IS a graph-producing tool (UC-CG-14) — its
    // own coverage lives in the "ingest_directed as graph-producing tool
    // (v1.5.0)" describe block below.
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"start_async_ingestion","args_summary":"source_type=text content_len=10"}\n\n',
          'event: tool_result\ndata: {"tool":"start_async_ingestion","ok":true}\n\n',
          'event: tool_start\ndata: {"tool":"get_ingestion_status","args_summary":"run_id=abc"}\n\n',
          'event: tool_result\ndata: {"tool":"get_ingestion_status","ok":true}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().nodes.size).toBe(0);
    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "ingerir e checar",
        } as never);
      });
      // No graph_delta was emitted → store remains empty across the whole
      // ingestion turn, even though two tool chips were rendered.
      expect(useGraphStore.getState().nodes.size).toBe(0);
      expect(useChatTurnStore.getState().toolChips).toHaveLength(2);
    } finally {
      unmountHarness(h);
    }
  });
});

/**
 * TC-02 (EPIC-01) — `ingest_directed` as a graph-producing tool (v1.5.0).
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - `chat.feature.spec.md` v1.5.0 §12 REVOKES the earlier
 *    "the `graph_delta` frame is not emitted for ingestion tools" carve-out
 *    for the write-bearing tool `ingest_directed`. Under v1.5.0:
 *      1. `tool_start { tool: "ingest_directed" }` MUST flip
 *         `useGraphStore.status` to `"loading"` (UI-12 entry — §2 UI-12).
 *      2. A `graph_delta { source_tool: "ingest_directed", nodes, links }`
 *         SSE frame lands after a successful `tool_result` — the SPA merges
 *         it into `useGraphStore` identically to a read-tool result
 *         (replaceNodes on first-of-response, then settleTurn("done") →
 *         status `"ready"`) — §9 Scenario 6, §11 UC-CG-14.
 *  - A regression that drops `ingest_directed` from the dispatcher's
 *    GRAPH_TOOLS set — the exact TC-01 change these tests exist to protect
 *    — would leave the right pane stuck in `"empty"` after a directed
 *    ingestion. The first test below fails LOUDLY in that scenario
 *    (setStatus("loading") count would drop to 0).
 *
 * Wire shape reminder (openapi.yaml v2.9.0, back-spec BR-41):
 *  - `graph_delta.source_tool` = `"ingest_directed"`.
 *  - Each node in `graph_delta.nodes[]` carries `node_type` and
 *    `canonical_name` (NOT `type` / `label`) — matches `GraphNodeWire`.
 *  - Nodes here reflect `run.affected_nodes` (all `status: "active"`).
 */
describe("useSendMessage — ingest_directed as graph-producing tool (v1.5.0)", () => {
  it("ingest_directed tool_start flips GraphStatus to 'loading' (UC-CG-14, §2 UI-12)", async () => {
    // Same spy pattern as "tool_start with graph tool flips GraphStatus to
    // 'loading' (AC-F.8)" above — we can't easily snapshot mid-stream, so
    // record every setStatus call and assert the sequence.
    const setStatusCalls: Array<{ s: string; m: string | undefined }> = [];
    const realSetStatus = useGraphStore.getState().setStatus;
    useGraphStore.setState({
      setStatus: (status, message) => {
        setStatusCalls.push({ s: status, m: message });
        realSetStatus(status, message);
      },
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"ingest_directed","args_summary":"fragments=1 nodes=2 links=1"}\n\n',
          'event: tool_result\ndata: {"tool":"ingest_directed","ok":true}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "crie o Event 'Alinhamento Apollo' ligado ao projeto Apollo",
        } as never);
      });
      // Restore for downstream tests in the file (afterEach also clears).
      useGraphStore.setState({ setStatus: realSetStatus });
      // Regression pin: TC-01 added `ingest_directed` to GRAPH_TOOLS. If a
      // future change drops it, this length becomes 0 — the assertion fails
      // and surfaces the missed spec revocation immediately.
      const loadingCalls = setStatusCalls.filter((c) => c.s === "loading");
      expect(loadingCalls).toHaveLength(1);
    } finally {
      unmountHarness(h);
    }
  });

  it("ingest_directed graph_delta populates graph store and settles to 'ready' (UC-CG-14)", async () => {
    // End-to-end assertion of §11 UC-CG-14: a `tool_start(ingest_directed)`
    // + `tool_result{ok:true}` + `graph_delta { source_tool: "ingest_directed",
    // nodes, links }` + `done` sequence must land the projected node(s) in
    // `useGraphStore.nodes` and flip status to `"ready"`. The wire uses the
    // exact `GraphNodeWire` shape — `node_type` and `canonical_name`, not
    // `type`/`label` — per openapi.yaml v2.9.0.
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve(
        makeSSEResponse([
          'event: tool_start\ndata: {"tool":"ingest_directed","args_summary":"fragments=1 nodes=2 links=1"}\n\n',
          'event: tool_result\ndata: {"tool":"ingest_directed","ok":true}\n\n',
          'event: graph_delta\ndata: {"source_tool":"ingest_directed","nodes":[{"id":"n-apollo","node_type":"project","canonical_name":"Apollo","status":"active"},{"id":"n-event","node_type":"event","canonical_name":"Alinhamento Apollo","status":"active"}],"links":[]}\n\n',
          'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
        ]),
      ),
    );

    expect(useGraphStore.getState().nodes.size).toBe(0);
    const h = mountHarness();
    try {
      await act(async () => {
        await h.mutationRef.current!.mutateAsync({
          conversationId: CONVO_ID,
          content: "crie o Event 'Alinhamento Apollo' ligado ao projeto Apollo",
        } as never);
      });
      const state = useGraphStore.getState();
      // Nodes from `run.affected_nodes` were projected into the store by id.
      expect(state.nodes.has("n-apollo")).toBe(true);
      expect(state.nodes.has("n-event")).toBe(true);
      // `done` reached settleTurn("done") after a graph delta landed this
      // turn → GraphStatus is `"ready"` (§11 UC-CG-14 terminal effect).
      expect(state.status).toBe("ready");
    } finally {
      unmountHarness(h);
    }
  });
});
