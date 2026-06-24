// @vitest-environment jsdom
/**
 * NodeDetailPanel — unit tests (TC-FE-08).
 *
 * Validation criteria (from the Task Contract + spec §3, §4, §5):
 *  V1 — Loading shows spinner + nodeLabel heading (BDD §7 Scenario 2).
 *  V2 — Success shows canonical name + type + status badge + aliases list +
 *       attributes table (BDD §7 Scenario 1).
 *  V3 — Error 404 shows the pt-BR "Nó não encontrado." copy without
 *       attributes table or aliases list (BDD §7 Scenario 3).
 *  V4 — Error 410 shows the deletion notice.
 *  V5 — Generic error (network / 5xx) shows the generic copy + retry button.
 *  V6 — Close button calls onClose (BDD §7 Scenario 5).
 *  V7 — Escape key calls onClose (BDD §7 Scenario 4).
 *  V8 — Close button is focused on mount (a11y §8).
 *  V9 — No import of `useChatTurnStore` or `@/features/chat` (AC-U.3).
 * V10 — role='complementary' + aria-label='Detalhes do nó: <label>' (§8).
 *
 * Test strategy:
 *  - Mock `useNodeDetail` so we don't stand up MSW for a component test.
 *    Each test sets the mock state directly and re-renders.
 *  - Component-level focus / keyboard behaviour exercised via real DOM
 *    events (no synthetic events) under createRoot + act.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* ---------- mock: useNodeDetail (must precede SUT import) ---------- */

interface MockQueryState {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: unknown;
  error: { code?: string; message?: string } | null;
  refetch: ReturnType<typeof vi.fn>;
}

const mockState: MockQueryState = {
  isPending: true,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  refetch: vi.fn(),
};

vi.mock("../../../api/useNodeDetail", () => ({
  useNodeDetail: (): MockQueryState => mockState,
}));

import { NodeDetailPanel, NODE_DETAIL_COPY } from "../NodeDetailPanel";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset mock state — every test sets exactly what it needs.
  mockState.isPending = true;
  mockState.isError = false;
  mockState.isSuccess = false;
  mockState.data = undefined;
  mockState.error = null;
  mockState.refetch = vi.fn();
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

/* ---------- success-state fixture ---------- */

const SUCCESS_DATA = {
  id: "node-1",
  canonicalName: "Rodrigo",
  nodeType: "Person",
  status: "active" as const,
  badgeState: "accepted" as const,
  mergedIntoNodeId: null,
  aliases: [
    { id: "a1", alias: "Rodrigo", kind: "canonical" as const },
    { id: "a2", alias: "Ro", kind: "alias" as const },
  ],
  attributes: [
    {
      id: "attr-1",
      key: "deadline",
      value: "2026-07-15",
      valueType: "date" as const,
      effectiveStatus: "active" as const,
      isInEffect: true,
      state: "accepted" as const,
      validFromLabel: "10/01/2026",
      validToLabel: null,
    },
    {
      id: "attr-2",
      key: "owner",
      value: "Maria",
      valueType: "text" as const,
      effectiveStatus: "uncertain" as const,
      isInEffect: true,
      state: "uncertain" as const,
      validFromLabel: null,
      validToLabel: null,
    },
  ],
};

/* ============================ V1 loading ============================ */

describe("NodeDetailPanel — loading state (V1)", () => {
  it("shows the loading copy + spinner with the nodeLabel heading", () => {
    mockState.isPending = true;
    act(() =>
      root.render(
        <NodeDetailPanel
          nodeId="node-1"
          nodeLabel="Apollo"
          onClose={() => undefined}
        />,
      ),
    );
    // Heading shows the prop label immediately (no blank skeleton).
    expect(find("node-detail-title").textContent).toBe("Apollo");
    // Spinner — Loader2 + animate-spin.
    expect(find("node-detail-loading").querySelector(".animate-spin")).not.toBeNull();
    // Live region carries the pt-BR copy.
    expect(container.textContent).toContain(NODE_DETAIL_COPY.loading);
  });

  it("close button remains accessible during loading", () => {
    mockState.isPending = true;
    const onClose = vi.fn();
    act(() =>
      root.render(
        <NodeDetailPanel
          nodeId="node-1"
          nodeLabel="Apollo"
          onClose={onClose}
        />,
      ),
    );
    const btn = find<HTMLButtonElement>("node-detail-close");
    btn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* ============================ V2 success ============================ */

describe("NodeDetailPanel — success state (V2)", () => {
  beforeEach(() => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
  });

  it("renders canonical name, type, and status badge in the header", () => {
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(find("node-detail-title").textContent).toBe("Rodrigo");
    expect(find("node-detail-type").textContent).toBe("Person");
    expect(find("node-detail-status")).not.toBeNull();
  });

  it("renders the aliases list (canonical + alias)", () => {
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const aliases = find("node-detail-aliases");
    const items = aliases.querySelectorAll("li");
    expect(items.length).toBe(2);
    expect(items[0]?.textContent).toContain("Rodrigo");
    expect(items[0]?.textContent).toContain("canônico");
    expect(items[1]?.textContent).toContain("Ro");
  });

  it("renders the attributes table with one row per attribute (V2.1)", () => {
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const table = find("node-detail-attributes");
    const rows = table.querySelectorAll('[data-testid="node-detail-attribute-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0]?.textContent).toContain("deadline");
    expect(rows[0]?.textContent).toContain("2026-07-15");
    expect(rows[1]?.textContent).toContain("owner");
  });

  it("table headers use scope='col' (a11y §8)", () => {
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const ths = container.querySelectorAll("th");
    expect(ths.length).toBe(3);
    ths.forEach((th) => expect(th.getAttribute("scope")).toBe("col"));
  });

  it("aliases list carries aria-label='Aliases' (a11y §8)", () => {
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(find("node-detail-aliases").getAttribute("aria-label")).toBe(
      "Aliases",
    );
  });

  it("renders 'Nenhum alias adicional.' when aliases list is empty", () => {
    mockState.data = { ...SUCCESS_DATA, aliases: [] };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(container.textContent).toContain(NODE_DETAIL_COPY.noAliases);
    expect(maybeFind("node-detail-aliases")).toBeNull();
  });

  it("renders 'Nenhum atributo registrado.' when attributes list is empty", () => {
    mockState.data = { ...SUCCESS_DATA, attributes: [] };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(container.textContent).toContain(NODE_DETAIL_COPY.noAttributes);
    expect(maybeFind("node-detail-attributes")).toBeNull();
  });
});

/* =========================== V3 error 404 =========================== */

describe("NodeDetailPanel — error 404 (V3)", () => {
  it("shows 'Nó não encontrado.' and hides attributes/aliases lists", () => {
    mockState.isPending = false;
    mockState.isError = true;
    mockState.error = { code: "RESOURCE_NOT_FOUND", message: "irrelevant" };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(container.textContent).toContain(NODE_DETAIL_COPY.errorNotFound);
    expect(maybeFind("node-detail-attributes")).toBeNull();
    expect(maybeFind("node-detail-aliases")).toBeNull();
    // Error region has role='alert' (a11y §8).
    expect(find("node-detail-error").getAttribute("role")).toBe("alert");
    // No retry button on 404 — the node won't reappear by clicking.
    expect(maybeFind("node-detail-retry")).toBeNull();
  });

  it("close button is still accessible on the 404 error (BDD §7 Scenario 3)", () => {
    mockState.isPending = false;
    mockState.isError = true;
    mockState.error = { code: "RESOURCE_NOT_FOUND" };
    const onClose = vi.fn();
    act(() =>
      root.render(<NodeDetailPanel nodeId="node-1" onClose={onClose} />),
    );
    find<HTMLButtonElement>("node-detail-close").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* =========================== V4 error 410 =========================== */

describe("NodeDetailPanel — error 410 (V4)", () => {
  it("shows the deletion notice for BUSINESS_NODE_DELETED", () => {
    mockState.isPending = false;
    mockState.isError = true;
    mockState.error = { code: "BUSINESS_NODE_DELETED" };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(container.textContent).toContain(NODE_DETAIL_COPY.errorDeleted);
    expect(find("node-detail-error").getAttribute("data-variant")).toBe(
      "deleted",
    );
    // No retry — deletion is terminal.
    expect(maybeFind("node-detail-retry")).toBeNull();
  });
});

/* ============= V5 generic error (network / 5xx) ===================== */

describe("NodeDetailPanel — generic error (V5)", () => {
  it("shows the generic copy + retry button when error code is SYSTEM_*", () => {
    mockState.isPending = false;
    mockState.isError = true;
    mockState.error = { code: "SYSTEM_NETWORK" };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(container.textContent).toContain(NODE_DETAIL_COPY.errorGeneric);
    const retry = find<HTMLButtonElement>("node-detail-retry");
    expect(retry.textContent).toContain(NODE_DETAIL_COPY.retry);
  });

  it("retry button calls refetch (no chat side-effect)", () => {
    mockState.isPending = false;
    mockState.isError = true;
    mockState.error = { code: "SYSTEM_NETWORK" };
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockState.refetch = refetch;
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    find<HTMLButtonElement>("node-detail-retry").click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

/* ============================ V6 close ============================== */

describe("NodeDetailPanel — close (V6)", () => {
  it("close button fires onClose exactly once", () => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    const onClose = vi.fn();
    act(() =>
      root.render(<NodeDetailPanel nodeId="node-1" onClose={onClose} />),
    );
    find<HTMLButtonElement>("node-detail-close").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* ============================ V7 escape ============================== */

describe("NodeDetailPanel — Escape key (V7, BDD §7 Scenario 4)", () => {
  it("pressing Escape fires onClose", () => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    const onClose = vi.fn();
    act(() =>
      root.render(<NodeDetailPanel nodeId="node-1" onClose={onClose} />),
    );
    // Dispatch a real keydown event so the React handler fires.
    const panel = find("node-detail-panel");
    const evt = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      panel.dispatchEvent(evt);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* ============================ V8 focus =============================== */

describe("NodeDetailPanel — focus on mount (V8, a11y §8)", () => {
  it("focuses the close button when the panel mounts", () => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const closeBtn = find<HTMLButtonElement>("node-detail-close");
    expect(document.activeElement).toBe(closeBtn);
  });
});

/* ========================== V9 structural ============================ */

describe("NodeDetailPanel — unidirectionality (V9, AC-U.3)", () => {
  it("does NOT import useChatTurnStore or anything from @/features/chat", () => {
    // Structural source scan: a future regression that adds a chat write
    // surface import fails this test loudly. The same pattern is used by
    // GraphSpace.spec.tsx to guard the right-pane unidirectionality rule.
    const files = [
      "../NodeDetailPanel.tsx",
      "../NodeDetailPanel.types.ts",
      "../../../api/useNodeDetail.ts",
      "../../../api/_transforms.ts",
      "../../../api/_request.ts",
      "../../../api/keys.ts",
    ];
    for (const rel of files) {
      const src = readFileSync(resolve(__dirname, rel), "utf-8");
      // Only catch REAL import statements (jsdoc prose excluded — see
      // GraphSpace.spec.tsx for the explanation of the regex anchor).
      expect(src).not.toMatch(
        /^\s*import\s+[^;`*]*\buseChatTurnStore\b[^;]*from\s+/m,
      );
      expect(src).not.toMatch(
        /^\s*import\s+[^;]*from\s+["']@\/features\/chat(?:\/[^"']+)?["']/m,
      );
    }
  });
});

/* ==================== V10 ARIA region + label ======================== */

describe("NodeDetailPanel — accessibility (V10, a11y §8)", () => {
  it("has role='complementary' and aria-label with the node label", () => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const panel = find("node-detail-panel");
    expect(panel.getAttribute("role")).toBe("complementary");
    expect(panel.getAttribute("aria-label")).toBe(
      "Detalhes do nó: Rodrigo",
    );
  });

  it("uses the prop nodeLabel in the aria-label while loading (no data yet)", () => {
    mockState.isPending = true;
    act(() =>
      root.render(
        <NodeDetailPanel
          nodeId="node-1"
          nodeLabel="Apollo"
          onClose={() => undefined}
        />,
      ),
    );
    expect(find("node-detail-panel").getAttribute("aria-label")).toBe(
      "Detalhes do nó: Apollo",
    );
  });
});

/* ==================== V11 Curar affordance (TC-07) ===================== */

import { deriveCurationTarget } from "../NodeDetailPanel";

describe("deriveCurationTarget (TC-07 — pure)", () => {
  it("returns entity_match kind for needs_review nodes", () => {
    const target = deriveCurationTarget({
      ...SUCCESS_DATA,
      status: "needs_review",
    });
    expect(target).toEqual({ kind: "entity_match", itemId: "node-1" });
  });

  it("returns disputed kind for the first uncertain/disputed attribute when node is active", () => {
    const target = deriveCurationTarget({
      ...SUCCESS_DATA,
      status: "active",
      // attr-2 is `effectiveStatus: "uncertain"` in SUCCESS_DATA — the
      // derivation must walk attributes and pick that id.
    });
    expect(target).toEqual({ kind: "disputed", itemId: "attr-2" });
  });

  it("returns null when no attribute is uncertain/disputed and node is active", () => {
    const target = deriveCurationTarget({
      ...SUCCESS_DATA,
      status: "active",
      attributes: [
        {
          ...SUCCESS_DATA.attributes[0]!,
          effectiveStatus: "active" as const,
          state: "accepted" as const,
        },
      ],
    });
    expect(target).toBeNull();
  });

  it("prefers needs_review (entity_match) over per-attribute disputed", () => {
    const target = deriveCurationTarget({
      ...SUCCESS_DATA,
      status: "needs_review",
      // Even with an uncertain attribute the node-level review wins.
    });
    expect(target?.kind).toBe("entity_match");
  });
});

describe("NodeDetailPanel — Curar button (TC-07)", () => {
  it("renders the Curar button when the node has a curation target", () => {
    // SUCCESS_DATA already has attr-2 in `uncertain` state → derives
    // a disputed target, so the button must be present.
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const btn = find("node-detail-curate");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("data-curate-kind")).toBe("disputed");
    expect(btn.textContent).toContain(NODE_DETAIL_COPY.curate);
  });

  it("hides the Curar button when no attribute is uncertain/disputed and node is active", () => {
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = {
      ...SUCCESS_DATA,
      status: "active",
      attributes: [
        {
          ...SUCCESS_DATA.attributes[0]!,
          effectiveStatus: "active" as const,
          state: "accepted" as const,
        },
      ],
    };
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    expect(maybeFind("node-detail-curate")).toBeNull();
  });

  it("Curar button hit-target ≥ 32px (WCAG 2.2 SC 2.5.8)", () => {
    // Asserts the Tailwind utility, not the rendered pixel size (jsdom
    // does not compute layout). `min-h-8` resolves to 32px in the v4
    // spacing scale; a regression that switches to `min-h-7` would fail.
    mockState.isPending = false;
    mockState.isSuccess = true;
    mockState.data = SUCCESS_DATA;
    act(() =>
      root.render(
        <NodeDetailPanel nodeId="node-1" onClose={() => undefined} />,
      ),
    );
    const btn = find("node-detail-curate");
    const cls = btn.className;
    expect(cls).toMatch(/\bmin-h-8\b/);
  });
});
