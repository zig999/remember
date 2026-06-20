/**
 * useChatTurnStore — ephemeral turn state behavior.
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - Persistence regression: a future contributor wrapping the slice in
 *    `persist()` would silently violate front.md §4.3 ("session only"). The
 *    "store is not localStorage-backed" assertion fails loudly in that case.
 *  - The chip "settle the last pending" semantics rely on a wire invariant
 *    (every `tool_start` is followed by exactly one `tool_result`). If a
 *    refactor walks the list by id, that invariant decoupling MUST be
 *    intentional — these tests pin the current contract.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useChatTurnStore } from "../chat-turn";

beforeEach(() => {
  useChatTurnStore.getState().reset();
});

afterEach(() => {
  useChatTurnStore.getState().reset();
});

describe("useChatTurnStore — initial state", () => {
  it("starts empty and not streaming", () => {
    const s = useChatTurnStore.getState();
    expect(s.streamingText).toBe("");
    expect(s.toolChips).toEqual([]);
    expect(s.abortController).toBeNull();
    expect(s.idempotencyKey).toBeNull();
    expect(s.isStreaming).toBe(false);
  });
});

describe("useChatTurnStore — actions", () => {
  it("appendText accumulates deltas in order", () => {
    const { appendText } = useChatTurnStore.getState();
    appendText("hello ");
    appendText("world");
    expect(useChatTurnStore.getState().streamingText).toBe("hello world");
  });

  it("setAbortController stashes and clears the controller", () => {
    const ac = new AbortController();
    useChatTurnStore.getState().setAbortController(ac);
    expect(useChatTurnStore.getState().abortController).toBe(ac);
    useChatTurnStore.getState().setAbortController(null);
    expect(useChatTurnStore.getState().abortController).toBeNull();
  });

  it("setIdempotencyKey stores the per-attempt UUID", () => {
    useChatTurnStore.getState().setIdempotencyKey("uuid-1");
    expect(useChatTurnStore.getState().idempotencyKey).toBe("uuid-1");
  });

  it("setStreaming toggles the flag", () => {
    useChatTurnStore.getState().setStreaming(true);
    expect(useChatTurnStore.getState().isStreaming).toBe(true);
    useChatTurnStore.getState().setStreaming(false);
    expect(useChatTurnStore.getState().isStreaming).toBe(false);
  });

  it("addToolChip appends pending chips (ok=null) in order", () => {
    const { addToolChip } = useChatTurnStore.getState();
    addToolChip({ tool: "search", argsSummary: 'q="a"', ok: null });
    addToolChip({ tool: "list_node_types", argsSummary: "", ok: null });
    expect(useChatTurnStore.getState().toolChips).toEqual([
      { tool: "search", argsSummary: 'q="a"', ok: null },
      { tool: "list_node_types", argsSummary: "", ok: null },
    ]);
  });

  it("updateLastToolChip settles the most recent pending chip", () => {
    const s = useChatTurnStore.getState();
    s.addToolChip({ tool: "search", argsSummary: 'q="a"', ok: null });
    s.addToolChip({ tool: "search", argsSummary: 'q="b"', ok: null });
    s.updateLastToolChip(true);
    const chips = useChatTurnStore.getState().toolChips;
    expect(chips[0]?.ok).toBeNull(); // first remains pending
    expect(chips[1]?.ok).toBe(true); // last settled
  });

  it("updateLastToolChip is a no-op when there are no chips", () => {
    useChatTurnStore.getState().updateLastToolChip(true);
    expect(useChatTurnStore.getState().toolChips).toEqual([]);
  });

  it("reset clears every field back to initial", () => {
    const s = useChatTurnStore.getState();
    s.setIdempotencyKey("x");
    s.setAbortController(new AbortController());
    s.setStreaming(true);
    s.appendText("hi");
    s.addToolChip({ tool: "search", argsSummary: "", ok: null });
    s.reset();
    const after = useChatTurnStore.getState();
    expect(after.streamingText).toBe("");
    expect(after.toolChips).toEqual([]);
    expect(after.abortController).toBeNull();
    expect(after.idempotencyKey).toBeNull();
    expect(after.isStreaming).toBe(false);
  });
});

describe("useChatTurnStore — persistence policy (front.md §4.3)", () => {
  it("does NOT mirror to localStorage", () => {
    const before = window.localStorage.length;
    const s = useChatTurnStore.getState();
    s.setIdempotencyKey("x");
    s.appendText("hi");
    s.addToolChip({ tool: "search", argsSummary: "", ok: null });
    expect(window.localStorage.length).toBe(before);
  });

  it("does NOT mirror to sessionStorage", () => {
    const before = window.sessionStorage.length;
    const s = useChatTurnStore.getState();
    s.setIdempotencyKey("x");
    s.appendText("hi");
    s.addToolChip({ tool: "search", argsSummary: "", ok: null });
    expect(window.sessionStorage.length).toBe(before);
  });
});
