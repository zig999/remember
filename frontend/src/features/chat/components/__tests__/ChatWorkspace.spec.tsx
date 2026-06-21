/**
 * ChatWorkspace — unit tests (TC-07).
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
 *  - The graph stub must be present and show the documented 'em breve' copy
 *    until the real graph ships in a later wave.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("@/lib/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/http")>();
  return { ...actual, http: () => new Promise(() => {}) };
});

// Framer Motion in jsdom — keep the real lib (GlassSurface uses motion.div +
// useReducedMotion). No mock needed; jsdom + framer-motion render fine for
// a static (animate=false) panel, which is what ChatWorkspace passes.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatWorkspace } from "../ChatWorkspace";
import { useGraphStore } from "../../../graph";

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

  it("shows the UI-01 empty state when no ?conversation is in the URL", () => {
    mockUseSearch.mockReturnValue({});
    renderWS();

    const empty = container.querySelector(
      '[data-testid="conversation-view-empty"]',
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe(
      "Selecione ou crie uma conversa para começar.",
    );
    // Graph stub is always present (right column).
    const stub = container.querySelector('[data-testid="chat-graph-stub"]');
    expect(stub).not.toBeNull();
    expect(stub?.textContent).toContain("Grafo em breve");
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
});
