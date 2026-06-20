/**
 * Composer — unit tests (TC-09).
 *
 * Why these tests exist (Golden Rule 9):
 *  - TC-09 declares four modes (Send / Stop / Archived / Disabled) — each is
 *    an observable, user-facing behaviour gate. A regression that silently
 *    drops one (e.g. archived banner stops rendering, stop button no longer
 *    aborts) breaks the chat surface and is invisible to typecheck.
 *  - WCAG 2.2 AA wiring: visually-hidden label, aria-label swap on the action
 *    button, aria-invalid + aria-describedby on the textarea — all are
 *    accessibility promises that must be pinned.
 *  - The keyboard contract (Enter submits, Shift+Enter newlines, Esc aborts
 *    while streaming) is unverifiable by typecheck; the test pins each branch.
 *  - Validation messages (empty / > 32768) are verbatim copy from the TC; a
 *    typo silently degrades the UI.
 *
 * Test strategy:
 *  Mock the two TC-04 dependencies (useSendMessage + useChatTurnStore) so the
 *  tests stay synchronous and don't hit the real fetch path. The store mock
 *  lets us flip into stop-mode without driving a real SSE stream; the
 *  mutation mock lets us assert the call payload and simulate
 *  archived/disabled outcomes via the resolved `errorCode`.
 *
 *  vi.mock paths use the SAME relative form the SUT uses (so Vitest resolves
 *  them to the SAME module entry — test files are excluded from tsconfig.json,
 *  so the `@/` alias would not resolve here, mirroring the trick documented
 *  in ConversationMenu.spec.tsx L37-L45).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";

/* ---------- mocks: TC-04 dependencies (must precede SUT import) ---------- */

// useSendMessage — controllable mutation. The test re-binds the mock impls
// per case via the shared `mockState` object captured below.
interface MockMutationResult {
  errorCode: string | null;
  errorMessage: string | null;
  stopReason: string | null;
  idempotencyKey: string;
}

interface MockState {
  /** Captures every mutateAsync call so tests can assert the payload. */
  calls: Array<{ conversationId: string; content: string }>;
  /** The result mutateAsync resolves with. */
  result: MockMutationResult;
  /** Snapshot of `mutation.data` exposed to the component. */
  data: MockMutationResult | undefined;
}

const mockState: MockState = {
  calls: [],
  result: {
    errorCode: null,
    errorMessage: null,
    stopReason: "end_turn",
    idempotencyKey: "test-uuid",
  },
  data: undefined,
};

vi.mock("../../api/useSendMessage", () => {
  return {
    useSendMessage: () => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(
        async (vars: { conversationId: string; content: string }) => {
          mockState.calls.push(vars);
          mockState.data = mockState.result;
          return mockState.result;
        },
      ),
      // Re-read at hook-call time; React will re-render after mutateAsync
      // resolves (RHF state updates), at which point this is the new value.
      get data(): MockMutationResult | undefined {
        return mockState.data;
      },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: mockState.data?.errorCode === null,
      reset: vi.fn(),
    }),
  };
});

// useChatTurnStore — minimal selector + getState() surface. Tests flip
// `isStreaming` + `abortController` via `setTurnState()` below.
interface MockTurnState {
  isStreaming: boolean;
  abortController: AbortController | null;
}

let turnState: MockTurnState = {
  isStreaming: false,
  abortController: null,
};

function setTurnState(next: Partial<MockTurnState>): void {
  turnState = { ...turnState, ...next };
}

vi.mock("../../state/chat-turn", () => {
  const selectorStore = <T,>(selector: (s: MockTurnState) => T): T =>
    selector(turnState);
  // `useChatTurnStore.getState()` is used by the Esc handler / stop click.
  (selectorStore as unknown as { getState: () => MockTurnState }).getState =
    () => turnState;
  return { useChatTurnStore: selectorStore };
});

/* ---------- now import the SUT ---------- */

import { Composer } from "../Composer";

/* ---------- render harness (mirrors ConversationMenu.spec.tsx pattern) --- */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset per-test state.
  mockState.calls = [];
  mockState.result = {
    errorCode: null,
    errorMessage: null,
    stopReason: "end_turn",
    idempotencyKey: "test-uuid",
  };
  mockState.data = undefined;
  turnState = { isStreaming: false, abortController: null };
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

function render(el: ReactElement): void {
  act(() => root.render(el));
}

function find<T extends Element = Element>(testId: string): T {
  const el = container.querySelector(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`testId not found: ${testId}`);
  return el as T;
}

function maybeFind<T extends Element = Element>(testId: string): T | null {
  return container.querySelector(`[data-testid="${testId}"]`) as T | null;
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
}

function changeTextarea(el: HTMLTextAreaElement, value: string): void {
  // React's value tracker — same trick as ConversationMenu.spec.tsx.
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function keyDown(
  el: Element | Document,
  init: KeyboardEventInit & { key: string },
): void {
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );
  });
}

function submitForm(form: HTMLFormElement): void {
  // The Enter handler calls requestSubmit(); in tests we dispatch the submit
  // event directly because requestSubmit() isn't always implemented in jsdom
  // for arbitrary form contents (the send button is type="submit" so the
  // event triggers RHF's handleSubmit normally).
  act(() => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

const noop = (): void => {};

/* ========================= ARCHIVED MODE (UI-08) ========================= */

describe("Composer — archived mode (UI-08)", () => {
  it("renders the archived banner and hides the send band", () => {
    render(
      <Composer
        conversationId="c1"
        isArchived={true}
        onUnarchive={noop}
      />,
    );
    expect(maybeFind("composer-archived-banner")).not.toBeNull();
    expect(maybeFind("composer-send-band")).toBeNull();
    expect(maybeFind("composer-textarea")).toBeNull();
  });

  it("invokes onUnarchive when the 'Reativar' button is clicked", () => {
    const onUnarchive = vi.fn();
    render(
      <Composer
        conversationId="c1"
        isArchived={true}
        onUnarchive={onUnarchive}
      />,
    );
    click(find("composer-unarchive-button"));
    expect(onUnarchive).toHaveBeenCalledTimes(1);
  });
});

/* ========================= SEND MODE (UI-03) ============================= */

describe("Composer — send mode (UI-03)", () => {
  it("renders the textarea with a visually-hidden 'Mensagem para o assistente' label", () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    const labelFor = container.querySelector(`label[for="${ta.id}"]`);
    expect(labelFor).not.toBeNull();
    expect(labelFor?.textContent).toBe("Mensagem para o assistente");
    // `sr-only` keeps it visually hidden while still in the accessibility tree.
    expect(labelFor?.className).toContain("sr-only");
  });

  it("send button carries aria-label 'Enviar mensagem' in send mode", () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    expect(find("composer-send-button").getAttribute("aria-label")).toBe(
      "Enviar mensagem",
    );
    expect(maybeFind("composer-stop-button")).toBeNull();
  });

  it("submits the content via useSendMessage and clears the textarea on success", async () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "olá mundo");

    const form = ta.closest("form") as HTMLFormElement;
    submitForm(form);

    // RHF runs the (async) safeZodResolver, then handleSubmit dispatches
    // onSubmit; flush microtasks so the mutation queues and resolves.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockState.calls).toEqual([
      { conversationId: "c1", content: "olá mundo" },
    ]);
    // Cleared on success (errorCode === null).
    expect(ta.value).toBe("");
  });

  it("does NOT clear the textarea when the mutation resolves with an errorCode", async () => {
    mockState.result = {
      errorCode: "BUSINESS_CONVERSATION_ARCHIVED",
      errorMessage: "archived",
      stopReason: null,
      idempotencyKey: "k",
    };
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "rascunho");
    const form = ta.closest("form") as HTMLFormElement;
    submitForm(form);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(ta.value).toBe("rascunho");
  });
});

/* ========================= VALIDATION (§5) =============================== */

describe("Composer — validation", () => {
  it("blocks empty submit and renders 'Digite uma mensagem antes de enviar.' inline", async () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    const form = ta.closest("form") as HTMLFormElement;
    submitForm(form);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const msg = find("composer-message");
    expect(msg.textContent).toBe("Digite uma mensagem antes de enviar.");
    expect(ta.getAttribute("aria-invalid")).toBe("true");
    expect(ta.getAttribute("aria-describedby")).toBe(msg.id);
    expect(mockState.calls).toHaveLength(0);
  });

  it("renders 'A mensagem é muito longa. Reduza o texto.' live when content > 32768", async () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    // 32769 chars — one over the boundary.
    changeTextarea(ta, "a".repeat(32769));
    // mode: 'onChange' — flush microtasks for Zod resolver.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const msg = find("composer-message");
    expect(msg.textContent).toBe("A mensagem é muito longa. Reduza o texto.");
    expect(ta.getAttribute("aria-invalid")).toBe("true");
  });
});

/* ========================= KEYBOARD (Enter / Shift+Enter / Esc) ========== */

describe("Composer — keyboard", () => {
  it("Enter (no shift) on the textarea submits the form", async () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "olá");
    keyDown(ta, { key: "Enter" });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockState.calls).toEqual([
      { conversationId: "c1", content: "olá" },
    ]);
  });

  it("Shift+Enter on the textarea does NOT submit the form", async () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "linha1");
    keyDown(ta, { key: "Enter", shiftKey: true });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockState.calls).toHaveLength(0);
  });
});

/* ========================= STOP MODE (UI-04) ============================= */

describe("Composer — stop mode (UI-04)", () => {
  it("renders the stop button (not the send button) when isStreaming === true", () => {
    const controller = new AbortController();
    setTurnState({ isStreaming: true, abortController: controller });
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    expect(maybeFind("composer-stop-button")).not.toBeNull();
    expect(maybeFind("composer-send-button")).toBeNull();
    expect(find("composer-stop-button").getAttribute("aria-label")).toBe(
      "Parar geração",
    );
  });

  it("disables the textarea while streaming", () => {
    setTurnState({
      isStreaming: true,
      abortController: new AbortController(),
    });
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    expect((find<HTMLTextAreaElement>("composer-textarea")).disabled).toBe(
      true,
    );
  });

  it("stop button click calls abortController.abort()", () => {
    const controller = new AbortController();
    const spy = vi.spyOn(controller, "abort");
    setTurnState({ isStreaming: true, abortController: controller });
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    click(find("composer-stop-button"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Esc keydown aborts the in-flight controller while streaming", () => {
    const controller = new AbortController();
    const spy = vi.spyOn(controller, "abort");
    setTurnState({ isStreaming: true, abortController: controller });
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    keyDown(document, { key: "Escape" });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Esc keydown does NOT abort when not streaming", () => {
    const controller = new AbortController();
    const spy = vi.spyOn(controller, "abort");
    setTurnState({ isStreaming: false, abortController: controller });
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    keyDown(document, { key: "Escape" });
    expect(spy).not.toHaveBeenCalled();
  });
});

/* ========================= DISABLED INLINE NOTICE (UI-10) ================ */

describe("Composer — disabled inline notice (UI-10)", () => {
  it("renders the CHAT_DISABLED notice and disables the textarea after that errorCode", async () => {
    mockState.result = {
      errorCode: "BUSINESS_CHAT_DISABLED",
      errorMessage: "disabled",
      stopReason: null,
      idempotencyKey: "k",
    };
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "tentativa");
    const form = ta.closest("form") as HTMLFormElement;
    submitForm(form);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const msg = find("composer-message");
    expect(msg.textContent).toBe(
      "O chat está temporariamente indisponível (desativado).",
    );
    expect(ta.disabled).toBe(true);
  });

  it("renders the PROVIDER_UNAVAILABLE notice after that errorCode", async () => {
    mockState.result = {
      errorCode: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE",
      errorMessage: "provider",
      stopReason: null,
      idempotencyKey: "k",
    };
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    const ta = find<HTMLTextAreaElement>("composer-textarea");
    changeTextarea(ta, "tentativa");
    const form = ta.closest("form") as HTMLFormElement;
    submitForm(form);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const msg = find("composer-message");
    expect(msg.textContent).toBe(
      "O provedor do chat está indisponível. Tente novamente em instantes.",
    );
  });
});

/* ========================= USAGE BADGE SLOT (TC-10) ====================== */

describe("Composer — usage badge slot (TC-10 placeholder)", () => {
  it("reserves a usage-slot container for TC-10 to mount UsageBadge", () => {
    render(
      <Composer conversationId="c1" isArchived={false} onUnarchive={noop} />,
    );
    expect(maybeFind("composer-usage-slot")).not.toBeNull();
  });
});
