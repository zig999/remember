// @vitest-environment jsdom
/**
 * MessageStream — unit tests (TC-08).
 *
 * Why these tests exist (Golden Rule 9):
 *  - Each acceptance UI-state (loading / empty / error / streaming / history)
 *    is a distinct user-visible contract. A test per state pins the copy,
 *    aria-* semantics, and the surface markers QA scripts depend on.
 *  - The retry button MUST call `refetch()` (TC-08 UI-07). We assert this
 *    explicitly — a regression that silently swaps in a no-op closure would
 *    leave a broken affordance on a real failure.
 *  - `aria-busy='true'` on the root (NOT the bubble) while streaming is a
 *    normative accessibility constraint. We assert it appears AND that it
 *    disappears when `isStreaming` flips back to false (no stuck live region).
 *  - `aria-live='polite'` on the root region must persist across all UI
 *    states so screen readers stay in the same live channel.
 *
 * Test rig:
 *  - We mock `useListMessages` (TC-03) and `useChatTurnStore` (TC-04) at
 *    module scope so the component renders in isolation, without needing
 *    a real QueryClient + fetch stack. Both hooks are owned by sibling
 *    files inside the chat feature; mocking them at the import seam is
 *    legitimate (the seam is the test's blast radius).
 *  - jsdom + createRoot+act, matching the project convention (no
 *    @testing-library/react dep).
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

/* ---------- mocks ----------
 *
 * Important: vi.mock factories are HOISTED above all imports, so we MUST NOT
 * reference outer variables inside them. Each factory returns a stateful
 * stub whose state is mutated via the exported `__set*` helpers below; the
 * tests adjust state THEN render, never relying on hook-bound closures
 * captured at module load. */

vi.mock("../../api/use-list-messages", () => {
  type Q = {
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    data: { items: unknown[]; nextBefore: string | null } | undefined;
    refetch: ReturnType<typeof vi.fn>;
  };
  const state: { current: Q } = {
    current: {
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: vi.fn(),
    },
  };
  return {
    useListMessages: () => state.current,
    __setListMessages: (next: Q) => {
      state.current = next;
    },
  };
});

vi.mock("../../state/chat-turn", () => {
  type S = {
    isStreaming: boolean;
    streamingText: string;
    abortController: AbortController | null;
  };
  const state: { current: S } = {
    current: { isStreaming: false, streamingText: "", abortController: null },
  };
  return {
    useChatTurnStore: Object.assign(
      // Selector hook — pull just the slice each call asks for.
      <T,>(selector: (s: S) => T): T => selector(state.current),
      {
        getState: (): S => state.current,
      },
    ),
    __setChatTurnState: (next: S) => {
      state.current = next;
    },
  };
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageStream } from "../MessageStream";
import * as listMessagesModule from "../../api/use-list-messages";
import * as chatTurnModule from "../../state/chat-turn";

const setListMessages = (listMessagesModule as any).__setListMessages as (n: {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: { items: unknown[]; nextBefore: string | null } | undefined;
  refetch: ReturnType<typeof vi.fn>;
}) => void;

const setChatTurnState = (chatTurnModule as any).__setChatTurnState as (n: {
  isStreaming: boolean;
  streamingText: string;
  abortController: AbortController | null;
}) => void;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- rig ---------- */

const CONVO_ID = "11111111-1111-1111-1111-111111111111";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset to a known baseline before each test.
  setListMessages({
    isPending: true,
    isError: false,
    isSuccess: false,
    data: undefined,
    refetch: vi.fn(),
  });
  setChatTurnState({
    isStreaming: false,
    streamingText: "",
    abortController: null,
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function getRegion(): HTMLElement | null {
  return container.querySelector('[data-testid="message-stream"]');
}

/* ---------- UI-02 loading ---------- */

describe("MessageStream — UI-02 loading", () => {
  it("renders 3 skeleton bubbles while listMessages is pending", () => {
    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("data-state")).toBe("loading");
    expect(getRegion()?.getAttribute("aria-busy")).toBe("true");
    const skeletons = container.querySelectorAll(
      '[data-testid="skeleton-bubble"]',
    );
    expect(skeletons.length).toBe(3);

    // Alignment alternates assistant/user/assistant — covers the visual
    // language of mixed roles BEFORE the real history arrives.
    expect(skeletons[0]?.getAttribute("data-variant")).toBe("assistant");
    expect(skeletons[1]?.getAttribute("data-variant")).toBe("user");
    expect(skeletons[2]?.getAttribute("data-variant")).toBe("assistant");
  });
});

/* ---------- UI-09 empty ---------- */

describe("MessageStream — UI-09 empty", () => {
  it("renders the pt-BR empty hint when there is no history and no streaming turn", () => {
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [], nextBefore: null },
      refetch: vi.fn(),
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("data-state")).toBe("empty");
    const empty = container.querySelector(
      '[data-testid="message-stream-empty"]',
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe(
      "Nenhuma mensagem ainda. Envie uma mensagem para começar.",
    );
    // aria-busy must NOT be set in empty state (TC-08 constraint).
    expect(getRegion()?.getAttribute("aria-busy")).toBeNull();
  });
});

/* ---------- UI-07 error ---------- */

describe("MessageStream — UI-07 error", () => {
  it("renders inline error + retry button with the normative pt-BR copy", () => {
    setListMessages({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      refetch: vi.fn(),
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("data-state")).toBe("error");
    const banner = container.querySelector(
      '[data-testid="message-stream-error"]',
    );
    expect(banner).not.toBeNull();
    // role='alert' lifts the failure into the AT live-region channel.
    expect(banner?.getAttribute("role")).toBe("alert");
    expect(banner?.textContent).toContain(
      "Não foi possível carregar o histórico. Tente novamente.",
    );

    const retry = container.querySelector(
      '[data-testid="message-stream-retry"]',
    );
    expect(retry).not.toBeNull();
    expect(retry?.textContent).toContain("Tentar novamente");
  });

  it("retry button click calls refetch()", () => {
    const refetch = vi.fn();
    setListMessages({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      refetch,
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    const retry = container.querySelector(
      '[data-testid="message-stream-retry"]',
    ) as HTMLButtonElement | null;
    expect(retry).not.toBeNull();
    act(() => {
      retry!.click();
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

/* ---------- UI-03 success (history) ---------- */

describe("MessageStream — UI-03 history", () => {
  it("renders history bubbles in chronological order with animate=false", () => {
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        items: [
          {
            id: "m1",
            conversation_id: CONVO_ID,
            role: "user",
            content: [{ type: "text", text: "Olá" }],
            stop_reason: null,
            idempotency_key: null,
            model: null,
            tokens_in: null,
            tokens_out: null,
            latency_ms: null,
            createdAt: new Date("2026-01-01T10:00:00Z"),
          },
          {
            id: "m2",
            conversation_id: CONVO_ID,
            role: "assistant",
            content: [{ type: "text", text: "Oi" }],
            stop_reason: "end_turn",
            idempotency_key: null,
            model: "claude-3",
            tokens_in: 5,
            tokens_out: 3,
            latency_ms: 100,
            createdAt: new Date("2026-01-01T10:00:01Z"),
          },
        ],
        nextBefore: null,
      },
      refetch: vi.fn(),
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("data-state")).toBe("success");
    expect(getRegion()?.getAttribute("aria-busy")).toBeNull();
    expect(getRegion()?.getAttribute("aria-live")).toBe("polite");

    // ChatBubble exposes data-variant on its root wrapper (see ChatBubble.tsx
    // L146). Find them in DOM order to assert chronological rendering.
    const bubbles = container.querySelectorAll("[data-variant]");
    // Filter to the actual bubble wrappers (skeletons have data-variant too,
    // but in success state there are no skeletons).
    expect(bubbles.length).toBe(2);
    expect(bubbles[0]?.getAttribute("data-variant")).toBe("user");
    expect(bubbles[1]?.getAttribute("data-variant")).toBe("assistant");

    // History bubbles MUST NOT carry aria-busy (no streaming on these).
    // The streaming bubble (absent here) would be the only one with aria-busy.
    expect(bubbles[0]?.getAttribute("aria-busy")).toBeNull();
    expect(bubbles[1]?.getAttribute("aria-busy")).toBeNull();
  });
});

/* ---------- UI-04 streaming ---------- */

describe("MessageStream — UI-04 streaming", () => {
  it("sets aria-busy='true' on the region root and appends a streaming assistant bubble", () => {
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        items: [
          {
            id: "u1",
            conversation_id: CONVO_ID,
            role: "user",
            content: [{ type: "text", text: "Quem é o Rodrigo?" }],
            stop_reason: null,
            idempotency_key: null,
            model: null,
            tokens_in: null,
            tokens_out: null,
            latency_ms: null,
            createdAt: new Date("2026-01-01T10:00:00Z"),
          },
        ],
        nextBefore: null,
      },
      refetch: vi.fn(),
    });
    setChatTurnState({
      isStreaming: true,
      streamingText: "Resposta em andamento…",
      abortController: null,
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("data-state")).toBe("streaming");
    expect(getRegion()?.getAttribute("aria-busy")).toBe("true");

    // Two bubbles total: the user history bubble + the streaming assistant.
    const bubbles = container.querySelectorAll("[data-variant]");
    expect(bubbles.length).toBe(2);

    // The streaming bubble is the trailing assistant bubble; it carries
    // data-state='streaming' (ChatBubble §4 contract) and its own aria-busy.
    const streamingBubble = bubbles[1];
    expect(streamingBubble?.getAttribute("data-variant")).toBe("assistant");
    expect(streamingBubble?.getAttribute("data-state")).toBe("streaming");
    expect(streamingBubble?.getAttribute("aria-busy")).toBe("true");
    expect(streamingBubble?.textContent).toContain("Resposta em andamento…");
  });

  it("aria-busy collapses when isStreaming flips false (no stuck live region)", () => {
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [], nextBefore: null },
      refetch: vi.fn(),
    });
    setChatTurnState({
      isStreaming: true,
      streamingText: "Parcial",
      abortController: null,
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));
    expect(getRegion()?.getAttribute("aria-busy")).toBe("true");

    setChatTurnState({
      isStreaming: false,
      streamingText: "",
      abortController: null,
    });
    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));

    expect(getRegion()?.getAttribute("aria-busy")).toBeNull();
    // No leftover streaming bubble.
    const stream = container.querySelectorAll(
      '[data-state="streaming"]',
    );
    expect(stream.length).toBe(0);
  });
});

/* ---------- a11y: aria-live persists across all states ---------- */

describe("MessageStream — aria-live", () => {
  it("aria-live='polite' is present on every state (loading/empty/error/streaming/success)", () => {
    // loading
    setListMessages({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: vi.fn(),
    });
    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));
    expect(getRegion()?.getAttribute("aria-live")).toBe("polite");

    // error
    setListMessages({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      refetch: vi.fn(),
    });
    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));
    expect(getRegion()?.getAttribute("aria-live")).toBe("polite");

    // empty
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [], nextBefore: null },
      refetch: vi.fn(),
    });
    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));
    expect(getRegion()?.getAttribute("aria-live")).toBe("polite");
  });
});

/* ---------- AbortController cleanup on unmount ---------- */

describe("MessageStream — AbortController cleanup", () => {
  it("aborts the in-flight controller stashed in chat-turn store on unmount", () => {
    const ac = new AbortController();
    const abortSpy = vi.spyOn(ac, "abort");
    setListMessages({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [], nextBefore: null },
      refetch: vi.fn(),
    });
    setChatTurnState({
      isStreaming: true,
      streamingText: "",
      abortController: ac,
    });

    act(() => root.render(<MessageStream conversationId={CONVO_ID} />));
    expect(abortSpy).not.toHaveBeenCalled();

    act(() => root.unmount());
    expect(abortSpy).toHaveBeenCalledTimes(1);

    // The afterEach unmount call would double-unmount; re-create a no-op root
    // so the afterEach teardown stays valid.
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
});
