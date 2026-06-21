/**
 * ChatStatusIndicator — unit tests (TC-FE-10).
 *
 * Why these tests exist (Golden Rule 9 — tests verify intent, not behavior):
 *  - The indicator is the ONLY visible affordance during the "thinking" gap
 *    (between send and the first `text_delta`). A regression that fails to
 *    mount on `chatStatus="thinking"` makes the operator stare at a silent
 *    UI for several seconds — invisible to a snapshot, deadly to UX. The
 *    "renders 'pensando…' when chatStatus='thinking'" test pins this.
 *  - The aria-live="polite" attribute is a WCAG 2.2 AA promise (AC-F.17 /
 *    TC validation criteria). Stripping it silently degrades screen-reader
 *    output and would never be caught by visual inspection. Tested verbatim.
 *  - The "consultando a memória… (tool name)" suffix is the operator's
 *    only hint about WHICH backend tool is in flight. A regression that
 *    drops the tool name misinforms the operator about what the model is
 *    doing. Tested via the toolChips → label derivation.
 *  - The "no useGraphStore import" structural constraint (AC-U.3 / TC
 *    constraints line 48) is enforced by source inspection — a future
 *    contributor wiring graph state into the chat indicator would
 *    silently violate REQ-6 unidirectionality.
 *  - The unmount branch (`idle` | `streaming` | `error` → null) matters
 *    because the indicator MUST disappear on `done` (AC-F.19). A
 *    regression that keeps it mounted leaves a stale "pensando…" line
 *    forever — visually obvious in retrospect, but only if explicitly
 *    tested it triggers a fail.
 *
 * Test strategy:
 *  Direct `createRoot()` + `act()` render — same pattern as
 *  ToolCallChip.spec.tsx (no React Testing Library dependency). Each test
 *  resets `useChatTurnStore` to defaults so leaked state from a prior
 *  test cannot mask a regression.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ChatStatusIndicator } from "../ChatStatusIndicator";
import { useChatTurnStore } from "../../state/chat-turn";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Hermetic store: each test starts from initial (chatStatus="idle",
  // empty toolChips). Without this, a sibling test that flipped to
  // "thinking" would leak into the next render.
  useChatTurnStore.getState().reset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useChatTurnStore.getState().reset();
});

function find<T extends Element = Element>(testId: string): T | null {
  return container.querySelector(`[data-testid="${testId}"]`) as T | null;
}

function findOrThrow<T extends Element = Element>(testId: string): T {
  const el = find<T>(testId);
  if (el === null) throw new Error(`testId not found: ${testId}`);
  return el;
}

describe("ChatStatusIndicator — visibility by chatStatus", () => {
  it("renders nothing when chatStatus='idle' (initial state)", () => {
    // Default reset() → chatStatus="idle". Indicator must NOT mount.
    act(() => root.render(<ChatStatusIndicator />));
    expect(find("chat-status-indicator")).toBeNull();
  });

  it("renders nothing when chatStatus='streaming' (token text takes over)", () => {
    act(() => {
      useChatTurnStore.getState().setChatStatus("streaming");
    });
    act(() => root.render(<ChatStatusIndicator />));
    // The streaming bubble is the affordance during this phase — the
    // indicator would compete for the operator's attention.
    expect(find("chat-status-indicator")).toBeNull();
  });

  it("renders nothing when chatStatus='error' (error banner takes over)", () => {
    act(() => {
      useChatTurnStore.getState().setChatStatus("error");
    });
    act(() => root.render(<ChatStatusIndicator />));
    // The TC explicitly lists 'error' as a phase that hides the
    // indicator — the failure surface is a separate banner.
    expect(find("chat-status-indicator")).toBeNull();
  });
});

describe("ChatStatusIndicator — 'thinking' phase (AC-F.17)", () => {
  it("mounts and displays 'pensando…' when chatStatus='thinking'", () => {
    act(() => {
      useChatTurnStore.getState().setChatStatus("thinking");
    });
    act(() => root.render(<ChatStatusIndicator />));

    const el = findOrThrow("chat-status-indicator");
    // Verbatim pt-BR copy from the TC known_context line 39.
    expect(el.textContent).toBe("pensando…");
    expect(el.getAttribute("data-state")).toBe("thinking");
  });

  it("exposes role='status' and aria-live='polite' (WCAG 2.2 AA)", () => {
    act(() => {
      useChatTurnStore.getState().setChatStatus("thinking");
    });
    act(() => root.render(<ChatStatusIndicator />));

    const el = findOrThrow("chat-status-indicator");
    // The aria-live attribute is mandatory (TC constraint line 49, AC-F.17).
    // A regression that removes it silently breaks screen-reader output.
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("role")).toBe("status");
    // aria-atomic ensures the entire new phrase is read on flip, not the
    // diff. Without it, 'thinking → tool_running' could emit a garbled
    // delta-only utterance on some AT.
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });
});

describe("ChatStatusIndicator — 'tool_running' phase (AC-F.18)", () => {
  it("displays 'consultando a memória… (tool)' with the active tool name", () => {
    act(() => {
      const s = useChatTurnStore.getState();
      // The dispatcher (`useSendMessage`) calls addToolChip BEFORE
      // setChatStatus('tool_running') — we mirror that ordering here so
      // pickActiveToolName sees a pending chip.
      s.addToolChip({ tool: "traverse", argsSummary: "node=…", ok: null });
      s.setChatStatus("tool_running");
    });
    act(() => root.render(<ChatStatusIndicator />));

    const el = findOrThrow("chat-status-indicator");
    expect(el.textContent).toBe("consultando a memória… (traverse)");
    expect(el.getAttribute("data-state")).toBe("tool_running");
  });

  it("falls back to the bare prefix when no pending chip exists (defensive)", () => {
    // Race fallback: chatStatus='tool_running' but no pending chip — the
    // intra-batch race documented in pickActiveToolName. The label still
    // makes sense without the tool suffix.
    act(() => {
      useChatTurnStore.getState().setChatStatus("tool_running");
    });
    act(() => root.render(<ChatStatusIndicator />));

    const el = findOrThrow("chat-status-indicator");
    expect(el.textContent).toBe("consultando a memória…");
  });

  it("picks the MOST RECENT pending chip when several chips exist", () => {
    // Wire invariant: at most one pending chip at any time. But the chips
    // accumulator keeps SETTLED chips too — the active tool name MUST be
    // the latest pending one, not the latest of any state.
    act(() => {
      const s = useChatTurnStore.getState();
      s.addToolChip({ tool: "list_nodes", argsSummary: "", ok: null });
      s.updateLastToolChip(true); // settle to OK
      s.addToolChip({ tool: "get_node", argsSummary: "id=x", ok: null });
      s.setChatStatus("tool_running");
    });
    act(() => root.render(<ChatStatusIndicator />));

    const el = findOrThrow("chat-status-indicator");
    expect(el.textContent).toBe("consultando a memória… (get_node)");
  });
});

describe("ChatStatusIndicator — state transitions (live updates)", () => {
  it("appears, updates, and disappears as chatStatus moves through phases", () => {
    // Mount with idle — no indicator.
    act(() => root.render(<ChatStatusIndicator />));
    expect(find("chat-status-indicator")).toBeNull();

    // → thinking: indicator mounts with 'pensando…'.
    act(() => {
      useChatTurnStore.getState().setChatStatus("thinking");
    });
    expect(findOrThrow("chat-status-indicator").textContent).toBe("pensando…");

    // → tool_running with a chip: phrase flips to memory prefix.
    act(() => {
      const s = useChatTurnStore.getState();
      s.addToolChip({ tool: "search", argsSummary: 'q="x"', ok: null });
      s.setChatStatus("tool_running");
    });
    expect(findOrThrow("chat-status-indicator").textContent).toBe(
      "consultando a memória… (search)",
    );

    // → streaming: indicator unmounts.
    act(() => {
      useChatTurnStore.getState().setChatStatus("streaming");
    });
    expect(find("chat-status-indicator")).toBeNull();

    // → idle (done): still unmounted (AC-F.19).
    act(() => {
      useChatTurnStore.getState().setChatStatus("idle");
    });
    expect(find("chat-status-indicator")).toBeNull();
  });
});

describe("ChatStatusIndicator — structural constraints (AC-U.3 / TC line 48)", () => {
  // Source inspection — the TC explicitly forbids importing useGraphStore
  // from this component (REQ-6 unidirectionality). A regression that wires
  // graph state into the chat indicator would be a structural bug, not a
  // behavioural one — it could pass every render test while violating the
  // architecture. We grep the actual source file.
  it("does NOT import useGraphStore (separation of concerns)", () => {
    const source = readFileSync(
      resolve(
        __dirname,
        "..",
        "ChatStatusIndicator.tsx",
      ),
      "utf8",
    );
    // Strip block comments + line comments so we only inspect EXECUTABLE
    // code (the file's JSDoc legitimately mentions the forbidden symbol
    // when explaining why it is forbidden — we must not penalise that).
    const codeOnly = source
      .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
      .replace(/^\s*\/\/.*$/gm, ""); // line comments
    // 1) No identifier reference (catches `useGraphStore.getState()` etc.).
    expect(codeOnly).not.toMatch(/\buseGraphStore\b/);
    // 2) No import from the graph feature root — belt-and-braces against a
    //    contributor pulling another symbol from the graph barrel.
    expect(codeOnly).not.toMatch(/from\s+["']@\/features\/graph/);
  });
});
