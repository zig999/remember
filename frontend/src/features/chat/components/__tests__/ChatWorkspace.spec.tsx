/**
 * ChatWorkspace — unit tests (TC-FE-11, supersedes TC-07).
 *
 * Why these tests exist (Golden Rule 9):
 *  - The 40%/60% split MUST come from a Tailwind v4 CONTAINER QUERY (forbidden
 *    by project conventions: custom CSS @media queries). The `@container`
 *    parent class + `@lg:flex-row` / `@lg:w-2/5` / `@lg:w-3/5` modifiers are
 *    pinned: dropping any of them collapses the layout silently in jsdom and
 *    only manifests in production CSS. A token-class assertion is the only
 *    cheap guard.
 *  - Arbitrary values (e.g. `w-[40%]`) are forbidden — we explicitly assert
 *    the class string does NOT contain a bracketed width.
 *  - The `?conversation` URL param drives the empty-state vs. active branch
 *    in ConversationView. We mock `chatRoute.useSearch` to exercise both
 *    branches via the ChatWorkspace surface (integration of the two units).
 *  - TC-FE-11: the right column now hosts `<GraphSpace>` (replacing the
 *    static `GlassSurface` stub). When a node is selected, the column
 *    swaps to `<NodeDetailPanel>` inline (no modal/drawer/route per
 *    AC-F.20 / I-3). The `graph-space-panel` wrapper testid is stable
 *    across both branches so integration tests can anchor against the
 *    slot. The `chat-graph-stub` testid was retired in this TC.
 *  - The empty-state UI-01 still renders inside the right column — only
 *    the COMPOSITION changes (now `GraphSpace status="empty"` →
 *    `GraphEmptyState` with "A memória aparecerá aqui conforme você
 *    conversa." copy). This test pins that the user-visible empty copy
 *    is the GRAPH-EMPTY-STATE one, NOT the legacy "Grafo em breve".
 *  - Conversation change must clear BOTH the graph store AND the
 *    selected-node state (EV-CG-05); a stale id from a previous
 *    conversation must never linger after the user navigates.
 *  - The workspace must not import any chat write action from the graph
 *    callback path — REQ-6 unidirectionality (AC-U.3). Verified via
 *    static source scan (functional contract: `onNodeSelect` only
 *    mutates local UI state, never triggers a message send).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// Mock the chatRoute import — ChatWorkspace pulls `useSearch` off it. The
// route module also imports ChatWorkspace itself (mutual reference), so we
// stub the route surface here to avoid mounting a real RouterProvider just
// to read a search param. `vi.hoisted` is required because the mock factory
// is hoisted ABOVE module-level const declarations; without it the factory
// captures an undefined reference.
const { mockUseSearch } = vi.hoisted(() => ({
  mockUseSearch: vi.fn<() => { conversation?: string }>(),
}));
// vite-tsconfig-paths resolves `@/router/routes` to the actual on-disk path
// during transform; vi.mock matches by resolved id, so we mock BOTH the
// alias spelling and the relative spelling used after resolution. Either
// match is enough; both are harmless if one is unused.
vi.mock("@/router/routes", () => ({
  chatRoute: { useSearch: mockUseSearch },
}));
vi.mock("../../../../router/routes", () => ({
  chatRoute: { useSearch: mockUseSearch },
}));

// ConversationView's active branch fetches the conversation detail + message
// history. Keep the real HTTP layer but stub the network call so those queries
// stay pending (no real request in jsdom) — the active branch still renders.
// The same stub absorbs `GET /api/v1/nodes/:id` (NodeDetailPanel's loader)
// so the detail panel renders its LOADING state synchronously in tests that
// observe the toggle without driving the fetch.
vi.mock("@/lib/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/http")>();
  return { ...actual, http: () => new Promise(() => {}) };
});

// React Flow needs `ResizeObserver` to mount its viewport (the canvas mounts
// inside `<ReactFlowProvider>` whenever the graph is not in the `empty` /
// detail-open branch). jsdom does not ship one; provide a no-op stub. This
// is scoped to this test file only.
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.ResizeObserver = NoopResizeObserver;

// jsdom does not implement `Element.scrollIntoView`; React Flow + MessageStream
// both reach for it. Stub a no-op so the call site doesn't throw.
if (!("scrollIntoView" in Element.prototype)) {
  // @ts-expect-error — augment the jsdom prototype for the test run only.
  Element.prototype.scrollIntoView = () => {};
}

// `@/features/graph` exports the real `GraphSpace` (React Flow + d3-force),
// which does not paint clickable nodes in jsdom (no real layout pass, no
// pointer events on virtualised node elements). For the toggle tests we
// need a deterministic way to fire `onNodeSelect` from outside the
// component. Solution: stub `GraphSpace` with a thin proxy that records
// its received props and exposes a button that invokes `onNodeSelect`
// with a known id. The proxy still asserts ChatWorkspace's PROP contract
// (nodes/links/status reach it, the callback is bound) — which is what
// matters at this integration boundary.
//
// `NodeDetailPanel` is NOT stubbed — we render the real one (its first
// render is the LoadingView, which mounts synchronously). The real panel
// also wires the `data-testid="node-detail-close"` button we click below.
//
// `useGraphStore` is also NOT stubbed — the conversation-change effect
// must still call `clear()` on the real store; we observe it.
import type { GraphSpaceProps } from "@/features/graph";

const lastGraphSpaceProps = vi.hoisted(() => ({
  current: null as GraphSpaceProps | null,
}));

// Factory shared between both spellings of the mock — the alias path and the
// relative path resolved by vite-tsconfig-paths. The exact callsite spelling
// determines which one vitest matches; mocking both is harmless if one is
// unused (same trick as the chatRoute mock above).
async function graphMockFactory(
  importOriginal: () => Promise<typeof import("@/features/graph")>,
): Promise<typeof import("@/features/graph")> {
  const actual = await importOriginal();
  const FakeGraphSpace = (props: GraphSpaceProps) => {
    lastGraphSpaceProps.current = props;
    return (
      <div
        data-testid="graph-space"
        data-status={props.status}
        data-node-count={String(props.nodes.length)}
      >
        <button
          type="button"
          data-testid="fake-graph-space-select-first"
          onClick={() => {
            const first = props.nodes[0];
            if (first !== undefined) props.onNodeSelect?.(first.id);
          }}
        >
          select first node
        </button>
        {/* Render the empty-state copy when status is "empty" so the UI-01
            empty-state assertion can still anchor against the user-visible
            string without the real GraphEmptyState mounting. */}
        {props.status === "empty" && (
          <p>A memória aparecerá aqui conforme você conversa.</p>
        )}
      </div>
    );
  };
  return { ...actual, GraphSpace: FakeGraphSpace } as typeof import("@/features/graph");
}

vi.mock("@/features/graph", (importOriginal) =>
  graphMockFactory(importOriginal as () => Promise<typeof import("@/features/graph")>),
);
vi.mock("../../../graph", (importOriginal) =>
  graphMockFactory(importOriginal as () => Promise<typeof import("@/features/graph")>),
);
vi.mock("../../../graph/index", (importOriginal) =>
  graphMockFactory(importOriginal as () => Promise<typeof import("@/features/graph")>),
);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatWorkspace } from "../ChatWorkspace";
import { useGraphStore } from "../../../graph";
import { GRAPH_EMPTY_STATE_COPY } from "../../../graph/components/GraphEmptyState/GraphEmptyState";

let container: HTMLDivElement;
let root: Root;

// Render inside a QueryClientProvider — the active conversation branch mounts
// data hooks (history, conversation detail). The layout/empty branches take no
// hooks, so the provider is simply inert for them.
function renderWS(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <ChatWorkspace />
      </QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockUseSearch.mockReset();
  // Reset the graph store between tests — it is a module-level singleton
  // (intentional; see graph-store.ts header). Without this reset, nodes
  // seeded by one test would leak into the next.
  useGraphStore.getState().clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ChatWorkspace", () => {
  it("renders the @container parent + container-query split classes (40%/60% via @lg modifiers)", () => {
    mockUseSearch.mockReturnValue({});
    renderWS();

    const workspace = container.querySelector(
      '[data-testid="chat-workspace"]',
    );
    expect(workspace).not.toBeNull();
    const cls = workspace?.getAttribute("class") ?? "";

    // @container parent — the gate that enables @lg:* modifiers on children.
    expect(cls).toContain("@container");

    // CRITICAL: the flex split must NOT sit on the @container element itself.
    // A container-query variant resolves against an ANCESTOR container, so an
    // element cannot query its own inline-size — putting `@lg:flex-row` on the
    // @container would silently never match (the bug this guards against). It
    // belongs on a DESCENDANT.
    expect(cls).not.toContain("@lg:flex-row");
    const split = workspace?.querySelector('[class*="@lg:flex-row"]') ?? null;
    expect(split).not.toBeNull();
    expect(split).not.toBe(workspace);
    const splitCls = split?.getAttribute("class") ?? "";
    // Mobile-first stacked default, container-row at @lg — on the descendant.
    expect(splitCls).toContain("flex-col");
    expect(splitCls).toContain("@lg:flex-row");

    // Columns must use container-aware fractional widths — not media queries,
    // not arbitrary values. Searching the rendered HTML covers both columns.
    const html = container.innerHTML;
    expect(html).toContain("@lg:w-2/5");
    expect(html).toContain("@lg:w-3/5");

    // FORBIDDEN: arbitrary widths like w-[40%]. No bracketed width tokens
    // anywhere in the workspace output.
    expect(html).not.toMatch(/\bw-\[[^\]]+\]/);
  });

  it("shows the UI-01 empty state when no ?conversation is in the URL, and renders GraphSpace with the empty-state copy", () => {
    mockUseSearch.mockReturnValue({});
    renderWS();

    // Left column — ConversationView empty state.
    const empty = container.querySelector(
      '[data-testid="conversation-view-empty"]',
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe(
      "Selecione ou crie uma conversa para começar.",
    );

    // Right column wrapper — the NEW stable testid (TC-FE-11). The legacy
    // `chat-graph-stub` testid was retired in this TC.
    const panel = container.querySelector(
      '[data-testid="graph-space-panel"]',
    );
    expect(panel).not.toBeNull();
    expect(
      container.querySelector('[data-testid="chat-graph-stub"]'),
    ).toBeNull();

    // GraphSpace mounted with status="empty" → GraphEmptyState rendered
    // inside it (no canvas mounts on empty per spec §3). The visible copy
    // is the GraphEmptyState pt-BR string — NOT the legacy stub copy.
    const graphSpace = panel?.querySelector('[data-testid="graph-space"]');
    expect(graphSpace).not.toBeNull();
    expect(graphSpace?.getAttribute("data-status")).toBe("empty");
    expect(panel?.textContent).toContain(GRAPH_EMPTY_STATE_COPY);
    expect(panel?.textContent ?? "").not.toContain("Grafo em breve");
  });

  it("forwards the ?conversation uuid to ConversationView when present", () => {
    const id = "22222222-2222-2222-2222-222222222222";
    mockUseSearch.mockReturnValue({ conversation: id });
    renderWS();

    const view = container.querySelector('[data-testid="conversation-view"]');
    expect(view).not.toBeNull();
    expect(view?.getAttribute("data-conversation-id")).toBe(id);
    // Empty state must NOT be present in this branch.
    expect(
      container.querySelector('[data-testid="conversation-view-empty"]'),
    ).toBeNull();
  });

  it("calls useGraphStore.clear() on mount and on conversation change (TC-FE-04, EV-CG-05)", () => {
    // Seed the store with a node so we can observe `clear()` flush it.
    const id1 = "22222222-2222-2222-2222-222222222222";
    mockUseSearch.mockReturnValue({ conversation: id1 });
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "n-seed", type: "concept", label: "S", state: "accepted" }],
      links: [],
    });
    expect(useGraphStore.getState().nodes.size).toBe(1);

    // Mount once — the effect runs and clears the seed.
    renderWS();
    expect(useGraphStore.getState().nodes.size).toBe(0);

    // Seed again and re-render with a DIFFERENT conversation id; the effect
    // must fire again because `conversation` changed.
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "n-seed-2", type: "concept", label: "S2", state: "accepted" }],
      links: [],
    });
    expect(useGraphStore.getState().nodes.size).toBe(1);
    const id2 = "33333333-3333-3333-3333-333333333333";
    mockUseSearch.mockReturnValue({ conversation: id2 });
    renderWS();
    expect(useGraphStore.getState().nodes.size).toBe(0);
  });

  it("subscribes to useGraphStore and forwards nodes/links/status to GraphSpace via props", () => {
    const id = "44444444-4444-4444-4444-444444444444";
    mockUseSearch.mockReturnValue({ conversation: id });
    renderWS();

    // After mount the clear() effect has fired — the store is empty, so
    // status=`empty` and node-count=0.
    expect(
      container.querySelector('[data-testid="graph-space"]')?.getAttribute(
        "data-status",
      ),
    ).toBe("empty");
    expect(
      container
        .querySelector('[data-testid="graph-space"]')
        ?.getAttribute("data-node-count"),
    ).toBe("0");

    // Add a node + flip status — the workspace must re-render with the
    // fresh array reference (Array.from over the updated Maps).
    act(() => {
      useGraphStore.getState().addNodes({
        sourceTool: "traverse",
        nodes: [
          { id: "n-1", type: "concept", label: "Alpha", state: "accepted" },
        ],
        links: [],
      });
      useGraphStore.getState().setStatus("ready");
    });

    expect(
      container.querySelector('[data-testid="graph-space"]')?.getAttribute(
        "data-status",
      ),
    ).toBe("ready");
    expect(
      container
        .querySelector('[data-testid="graph-space"]')
        ?.getAttribute("data-node-count"),
    ).toBe("1");
  });

  it("swaps the right column from GraphSpace to NodeDetailPanel when a node is selected, and back when the panel closes", () => {
    // Mount inside an active conversation so the right column is populated.
    const seedId = "11111111-1111-1111-1111-111111111111";
    mockUseSearch.mockReturnValue({
      conversation: "44444444-4444-4444-4444-444444444444",
    });
    renderWS();

    // Seed AFTER mount (the conversation-change effect ran on mount and
    // cleared any pre-seeded state).
    act(() => {
      useGraphStore.getState().addNodes({
        sourceTool: "traverse",
        nodes: [{ id: seedId, type: "concept", label: "Alpha", state: "accepted" }],
        links: [],
      });
      useGraphStore.getState().setStatus("ready");
    });

    const panelWrapper = container.querySelector(
      '[data-testid="graph-space-panel"]',
    );
    expect(panelWrapper).not.toBeNull();

    // Initially: GraphSpace is mounted, NodeDetailPanel is NOT.
    expect(
      panelWrapper?.querySelector('[data-testid="graph-space"]'),
    ).not.toBeNull();
    expect(
      panelWrapper?.querySelector('[data-testid="node-detail-panel"]'),
    ).toBeNull();

    // Drive `onNodeSelect` via the fake GraphSpace's test button — the
    // public contract from ChatWorkspace's perspective is "GraphSpace
    // fires onNodeSelect with the clicked id"; the click path inside
    // React Flow is owned by GraphSpace's own tests.
    const selectBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="fake-graph-space-select-first"]',
    );
    expect(selectBtn).not.toBeNull();
    act(() => {
      selectBtn?.click();
    });

    // After the click: NodeDetailPanel mounted, GraphSpace gone (the right
    // column conditionally renders one or the other).
    expect(
      panelWrapper?.querySelector('[data-testid="node-detail-panel"]'),
    ).not.toBeNull();
    expect(
      panelWrapper?.querySelector('[data-testid="graph-space"]'),
    ).toBeNull();

    // The panel reads the click-time label from the workspace (immediate
    // heading while the detail fetch is pending). The fake passes the id
    // through; the workspace looks the label up over the live `nodes` Map.
    const title = panelWrapper?.querySelector(
      '[data-testid="node-detail-title"]',
    );
    expect(title?.textContent).toBe("Alpha");

    // Close the panel via its close button — must restore GraphSpace.
    const closeBtn = panelWrapper?.querySelector<HTMLButtonElement>(
      '[data-testid="node-detail-close"]',
    );
    expect(closeBtn).not.toBeNull();
    act(() => {
      closeBtn?.click();
    });
    expect(
      panelWrapper?.querySelector('[data-testid="node-detail-panel"]'),
    ).toBeNull();
    expect(
      panelWrapper?.querySelector('[data-testid="graph-space"]'),
    ).not.toBeNull();
  });

  it("clears selectedNode when the conversation id changes (no stale detail panel across conversations)", () => {
    const id1 = "55555555-5555-5555-5555-555555555555";
    mockUseSearch.mockReturnValue({ conversation: id1 });
    renderWS();

    // Seed + select inside conversation 1.
    act(() => {
      useGraphStore.getState().addNodes({
        sourceTool: "traverse",
        nodes: [{ id: "n-A", type: "concept", label: "A", state: "accepted" }],
        links: [],
      });
      useGraphStore.getState().setStatus("ready");
    });
    act(() => {
      container
        .querySelector<HTMLButtonElement>(
          '[data-testid="fake-graph-space-select-first"]',
        )
        ?.click();
    });
    // Detail panel is up at this point.
    expect(
      container.querySelector('[data-testid="node-detail-panel"]'),
    ).not.toBeNull();

    // Now switch conversation — the effect must clear the store AND the
    // selected-node state (both side effects live in the same useEffect).
    const id2 = "66666666-6666-6666-6666-666666666666";
    mockUseSearch.mockReturnValue({ conversation: id2 });
    renderWS();

    // Detail panel must NOT be mounted under the new conversation.
    expect(
      container.querySelector('[data-testid="node-detail-panel"]'),
    ).toBeNull();
    // Graph store was cleared too.
    expect(useGraphStore.getState().nodes.size).toBe(0);
    // GraphSpace re-rendered with status="empty" + 0 nodes.
    const graphSpace = container.querySelector('[data-testid="graph-space"]');
    expect(graphSpace?.getAttribute("data-status")).toBe("empty");
    expect(graphSpace?.getAttribute("data-node-count")).toBe("0");
  });

  it("source does not import any chat write action — REQ-6 unidirectionality / AC-U.3", () => {
    // Structural test (mirrors the GraphSpace / NodeDetailPanel ones): scan
    // the file source to confirm ChatWorkspace's graph-side callbacks cannot
    // accidentally trigger a chat mutation. The workspace IS allowed to
    // import from `@/features/chat` (it lives there), but the graph branch
    // must not pull in any of the chat write hooks/actions.
    //
    // We assert the BLACKLIST of identifiers that would denote a chat write:
    //   - `useSendMessage`     — turn mutation hook
    //   - `useUpdateConversation` — conversation write (used elsewhere by
    //     ConversationView, fine as a child import — but not at the
    //     workspace level)
    //   - `useDeleteConversation`
    //   - `useCreateConversation`
    const src = readFileSync(
      resolve(__dirname, "../ChatWorkspace.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\buseSendMessage\b/);
    expect(src).not.toMatch(/\buseUpdateConversation\b/);
    expect(src).not.toMatch(/\buseDeleteConversation\b/);
    expect(src).not.toMatch(/\buseCreateConversation\b/);
    // The chat-turn store has write actions (`setChatStatus`, `setStreaming`,
    // …) — confirm ChatWorkspace does not pull the store at all from the
    // graph side. ConversationView/MessageStream own it.
    expect(src).not.toMatch(/\buseChatTurnStore\b/);
  });
});
