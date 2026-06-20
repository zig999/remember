/**
 * UsageBadge — unit tests (TC-10).
 *
 * Why these tests exist (Golden Rule 9):
 *  - The "hidden while loading" contract (TC-10 known-context: badge is lazy)
 *    is the only thing keeping the Composer footer from rendering a stub
 *    `Uso: 0 tokens…` row before the first usage fetch resolves. A regression
 *    that drops the gate silently degrades the chat surface and is invisible
 *    to typecheck.
 *  - The aria-label format (pt-BR, all three metric values) is a WCAG 2.2 AA
 *    promise. A swap of order ("entrada" ↔ "saída") silently misinforms
 *    screen-reader users and is invisible to a snapshot diff.
 *  - The three numeric counts must render verbatim from the hook's
 *    `UsageData` (no formatting, no rounding) — pinning each value rules out
 *    a regression that swaps tokens_in / tokens_out at the JSX level.
 *
 * Test strategy:
 *  Mock `use-get-conversation-usage` so the test stays synchronous and
 *  doesn't hit the real fetch + QueryClient path. The vi.mock path uses the
 *  SAME relative form the SUT uses, mirroring the trick documented in
 *  Composer.spec.tsx (test files excluded from tsconfig.json — the `@/`
 *  alias does NOT resolve here).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

/* ---------- mock: useGetConversationUsage (must precede SUT import) ---------- */

interface MockUsageState {
  isLoading: boolean;
  data:
    | {
        messageCount: number;
        tokens_in: number;
        tokens_out: number;
        tool_calls: number;
      }
    | null
    | undefined;
}

const mockState: MockUsageState = {
  isLoading: false,
  data: undefined,
};

vi.mock("../../api/use-get-conversation-usage", () => ({
  useGetConversationUsage: () => ({
    get isLoading(): boolean {
      return mockState.isLoading;
    },
    get data(): MockUsageState["data"] {
      return mockState.data;
    },
    // The real hook returns a UseQueryResult — UsageBadge only reads the two
    // fields above. Leaving the rest off keeps the mock tight (we'd notice
    // immediately if the SUT started reading more).
  }),
}));

/* ---------- now import the SUT ---------- */

import { UsageBadge } from "../UsageBadge";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset per-test state.
  mockState.isLoading = false;
  mockState.data = undefined;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

function maybeFind<T extends Element = Element>(testId: string): T | null {
  return container.querySelector(`[data-testid="${testId}"]`) as T | null;
}

function find<T extends Element = Element>(testId: string): T {
  const el = maybeFind<T>(testId);
  if (el === null) throw new Error(`testId not found: ${testId}`);
  return el;
}

/* ========================= HIDDEN-WHILE-LOADING ========================== */

describe("UsageBadge — hidden while loading", () => {
  it("renders nothing when the query is loading", () => {
    mockState.isLoading = true;
    mockState.data = undefined;

    act(() => root.render(<UsageBadge conversationId="c1" />));

    expect(maybeFind("usage-badge")).toBeNull();
    // No children at all — the component must return null, not a wrapper.
    expect(container.children.length).toBe(0);
  });

  it("renders nothing when data is still undefined (post-enable, pre-resolve)", () => {
    mockState.isLoading = false;
    mockState.data = undefined;

    act(() => root.render(<UsageBadge conversationId="c1" />));

    expect(maybeFind("usage-badge")).toBeNull();
  });

  it("renders nothing when data is explicitly null", () => {
    mockState.isLoading = false;
    mockState.data = null;

    act(() => root.render(<UsageBadge conversationId="c1" />));

    expect(maybeFind("usage-badge")).toBeNull();
  });
});

/* ========================= RESOLVED DATA ================================== */

describe("UsageBadge — resolved data", () => {
  it("renders the three counters and the pt-BR aria-label with all values", () => {
    mockState.isLoading = false;
    mockState.data = {
      messageCount: 4,
      tokens_in: 1200,
      tokens_out: 850,
      tool_calls: 3,
    };

    act(() => root.render(<UsageBadge conversationId="c1" />));

    const badge = find("usage-badge");
    expect(badge.getAttribute("aria-label")).toBe(
      "Uso: 1200 tokens de entrada, 850 tokens de saída, 3 chamadas de ferramenta",
    );

    expect(find("usage-badge-tokens-in").textContent).toContain("1200");
    expect(find("usage-badge-tokens-out").textContent).toContain("850");
    expect(find("usage-badge-tool-calls").textContent).toContain("3");
  });

  it("does NOT render the messageCount value (UsageBadge surfaces only 3 metrics)", () => {
    mockState.isLoading = false;
    mockState.data = {
      messageCount: 999_999,
      tokens_in: 1,
      tokens_out: 2,
      tool_calls: 0,
    };

    act(() => root.render(<UsageBadge conversationId="c1" />));

    const badge = find("usage-badge");
    expect(badge.textContent).not.toContain("999999");
    // aria-label must also omit messageCount (TC-10 §Constraints: aria-label
    // covers tokens_in, tokens_out, tool_calls — not messageCount).
    expect(badge.getAttribute("aria-label")).not.toContain("999999");
  });

  it("renders zero counts verbatim (does not collapse to empty string)", () => {
    mockState.isLoading = false;
    mockState.data = {
      messageCount: 0,
      tokens_in: 0,
      tokens_out: 0,
      tool_calls: 0,
    };

    act(() => root.render(<UsageBadge conversationId="c1" />));

    const badge = find("usage-badge");
    expect(badge.getAttribute("aria-label")).toBe(
      "Uso: 0 tokens de entrada, 0 tokens de saída, 0 chamadas de ferramenta",
    );
    expect(find("usage-badge-tokens-in").textContent).toContain("0");
  });
});

/* ========================= className composition ========================== */

describe("UsageBadge — className composition", () => {
  it("merges a consumer-provided className with the base classes", () => {
    mockState.isLoading = false;
    mockState.data = {
      messageCount: 1,
      tokens_in: 10,
      tokens_out: 20,
      tool_calls: 1,
    };

    act(() =>
      root.render(
        <UsageBadge conversationId="c1" className="extra-class" />,
      ),
    );

    const badge = find("usage-badge");
    expect(badge.classList.contains("extra-class")).toBe(true);
    // Base typography class still present.
    expect(badge.classList.contains("text-caption")).toBe(true);
  });
});
