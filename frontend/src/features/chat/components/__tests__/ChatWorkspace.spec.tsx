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

// Framer Motion in jsdom — keep the real lib (GlassSurface uses motion.div +
// useReducedMotion). No mock needed; jsdom + framer-motion render fine for
// a static (animate=false) panel, which is what ChatWorkspace passes.

import { ChatWorkspace } from "../ChatWorkspace";

let container: HTMLDivElement;
let root: Root;

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
    act(() => {
      root.render(<ChatWorkspace />);
    });

    const workspace = container.querySelector(
      '[data-testid="chat-workspace"]',
    );
    expect(workspace).not.toBeNull();
    const cls = workspace?.getAttribute("class") ?? "";

    // @container parent — the gate that enables @lg:* modifiers on children.
    expect(cls).toContain("@container");
    // Mobile-first stacked default, container-row at @lg.
    expect(cls).toContain("flex-col");
    expect(cls).toContain("@lg:flex-row");

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
    act(() => {
      root.render(<ChatWorkspace />);
    });

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
    act(() => {
      root.render(<ChatWorkspace />);
    });

    const view = container.querySelector('[data-testid="conversation-view"]');
    expect(view).not.toBeNull();
    expect(view?.getAttribute("data-conversation-id")).toBe(id);
    // Empty state must NOT be present in this branch.
    expect(
      container.querySelector('[data-testid="conversation-view-empty"]'),
    ).toBeNull();
  });
});
