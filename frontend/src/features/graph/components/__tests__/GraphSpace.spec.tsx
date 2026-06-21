/**
 * GraphSpace — unit tests (TC-FE-07).
 *
 * Validation criteria (from the Task Contract):
 *  V1 — status='empty' → GraphEmptyState visible, no canvas overlay (AC-F.13).
 *  V2 — status='loading' → GraphStatusOverlay 'Buscando na memória…' + spinner.
 *  V3 — status='error' → GraphStatusOverlay error msg, no retry button.
 *  V4 — status='ready'/'revealing' → canvas visible with nodes and edges.
 *  V5 — ref exposes fitView and recenter operations.
 *  V6 — No import of useChatTurnStore in GraphSpace or subcomponents (AC-U.3).
 *  V7 — aria-label on section; overlay has aria-live='polite' (AC-A.1).
 *
 * Notes on the test rig:
 *  - We use the project's existing test scaffold (createRoot + act). React
 *    Flow renders fine in jsdom AS LONG AS the parent container has a
 *    measurable size; if it doesn't, the canvas falls back to 0×0 and the
 *    `react-flow__renderer` div still mounts, which is enough for our
 *    structural assertions.
 *  - We DO populate `useGraphStore` for the ready/revealing case so the
 *    inner `useForceLayout` produces real positions (jsdom's ResizeObserver
 *    polyfill is good enough — see vitest.setup).
 *  - The ref test exercises the imperative handle via a callback ref, but
 *    we only assert the handle SHAPE (function existence + arity). Calling
 *    them through requires a real DOM viewport which jsdom doesn't fake —
 *    that's an integration concern.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { GraphLinkData, GraphNodeData } from "../../types";
import { useGraphStore } from "../../state/graph-store";
import { GraphSpace } from "../GraphSpace";
import type { GraphSpaceHandle } from "../GraphSpace";

// jsdom does not implement ResizeObserver, which React Flow installs on
// the canvas root to measure its container. Install a no-op shim before
// any test in this file mounts the canvas. Local to this file — does
// not touch the shared `vitest.setup.ts` (foundation file).
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class NoopResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    // Assign via index to bypass the `globalThis` typing for the missing
    // global. The runtime constructor signature matches the spec we use.
    (globalThis as unknown as { ResizeObserver: typeof NoopResizeObserver })
      .ResizeObserver = NoopResizeObserver;
  }
});

/** Helpers — minimal surface-shape factories. */
function makeNode(id: string, label = `Node ${id}`): GraphNodeData {
  return { id, type: "concept", label };
}

function makeLink(
  id: string,
  source: string,
  target: string,
): GraphLinkData {
  return {
    id,
    source,
    target,
    label: "related_to",
    isTemporal: true,
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  // Give the container a measurable size so React Flow's internal
  // measurement logic doesn't bail out — without this jsdom returns
  // {width:0, height:0} and the canvas may not mount its renderer div.
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset the singleton store between tests — clearing inside the test
  // would race with React's commit cycle.
  useGraphStore.getState().clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useGraphStore.getState().clear();
});

/* ------------------------------------------------------------- *
 * V1 — status="empty"                                            *
 * ------------------------------------------------------------- */
describe("GraphSpace — status='empty'", () => {
  it("renders GraphEmptyState and no overlay (V1, AC-F.13, Scenario 1)", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="empty" />,
      ),
    );
    // pt-BR copy from the spec.
    expect(container.textContent).toContain(
      "A memória aparecerá aqui conforme você conversa.",
    );
    // No overlay should be mounted.
    expect(
      container.querySelector('[data-testid="graph-status-overlay"]'),
    ).toBeNull();
    // No aria-busy when empty (spec §8).
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("aria-busy")).toBeNull();
    expect(region?.getAttribute("data-status")).toBe("empty");
  });

  it("does NOT mount the React Flow canvas when empty (no canvas overlay)", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="empty" />,
      ),
    );
    // React Flow renders a `.react-flow` root div when GraphCanvas mounts.
    // Empty state must short-circuit and NOT mount it (spec §3 rule).
    expect(container.querySelector(".react-flow")).toBeNull();
  });
});

/* ------------------------------------------------------------- *
 * V2 — status="loading"                                          *
 * ------------------------------------------------------------- */
describe("GraphSpace — status='loading'", () => {
  it("renders the overlay with spinner + 'Buscando na memória…' (V2, AC-F.13)", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="loading" />,
      ),
    );
    const overlay = container.querySelector(
      '[data-testid="graph-status-overlay"]',
    );
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("data-variant")).toBe("loading");
    expect(container.textContent).toContain("Buscando na memória…");
    // Spinner — animate-spin class on the lucide Loader2.
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("sets aria-busy='true' on the region (V7, AC-A.1)", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="loading" />,
      ),
    );
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("aria-busy")).toBe("true");
  });

  it("keeps existing nodes visible behind the overlay (Scenario 2)", () => {
    // Seed the store so useForceLayout produces positions.
    useGraphStore
      .getState()
      .addNodes({ sourceTool: "test", nodes: [makeNode("n1")], links: [] });
    act(() =>
      root.render(
        <GraphSpace
          nodes={[makeNode("n1")]}
          links={[]}
          status="loading"
        />,
      ),
    );
    // Canvas mounts BEHIND the overlay (spec §3 rule — overlay never
    // hides existing nodes). Both elements exist simultaneously.
    expect(container.querySelector(".react-flow")).not.toBeNull();
    expect(
      container.querySelector('[data-testid="graph-status-overlay"]'),
    ).not.toBeNull();
  });
});

/* ------------------------------------------------------------- *
 * V3 — status="error"                                            *
 * ------------------------------------------------------------- */
describe("GraphSpace — status='error'", () => {
  it("renders the overlay with the error message, no retry (V3, AC-F.13, I-6)", () => {
    act(() =>
      root.render(
        <GraphSpace
          nodes={[]}
          links={[]}
          status="error"
          errorMessage="Ferramenta falhou."
        />,
      ),
    );
    const overlay = container.querySelector(
      '[data-testid="graph-status-overlay"]',
    );
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("data-variant")).toBe("error");
    expect(container.textContent).toContain("Ferramenta falhou.");
    // No retry button anywhere.
    expect(container.querySelector("button")).toBeNull();
  });

  it("preserves prior canvas when error occurs with existing nodes (Scenario 5)", () => {
    useGraphStore
      .getState()
      .addNodes({ sourceTool: "test", nodes: [makeNode("n1")], links: [] });
    act(() =>
      root.render(
        <GraphSpace
          nodes={[makeNode("n1")]}
          links={[]}
          status="error"
          errorMessage="x"
        />,
      ),
    );
    expect(container.querySelector(".react-flow")).not.toBeNull();
  });

  it("falls back to default error copy when no errorMessage given", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="error" />,
      ),
    );
    expect(container.textContent).toContain(
      "Não foi possível carregar o grafo agora.",
    );
  });

  it("does NOT set aria-busy on error (busy is for in-flight only)", () => {
    act(() =>
      root.render(
        <GraphSpace nodes={[]} links={[]} status="error" errorMessage="x" />,
      ),
    );
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("aria-busy")).toBeNull();
  });
});

/* ------------------------------------------------------------- *
 * V4 — status="ready" / "revealing"                              *
 * ------------------------------------------------------------- */
describe("GraphSpace — status='ready' / 'revealing'", () => {
  it("renders the canvas with no overlay when status='ready' (V4, AC-F.10)", () => {
    const nodes = [makeNode("n1"), makeNode("n2")];
    const links = [makeLink("l1", "n1", "n2")];
    useGraphStore.getState().addNodes({ sourceTool: "test", nodes, links });

    act(() =>
      root.render(
        <GraphSpace nodes={nodes} links={links} status="ready" />,
      ),
    );
    // Canvas mounted, no overlay.
    expect(container.querySelector(".react-flow")).not.toBeNull();
    expect(
      container.querySelector('[data-testid="graph-status-overlay"]'),
    ).toBeNull();
    // No aria-busy on ready (spec §8 — busy only for loading/revealing).
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("aria-busy")).toBeNull();
  });

  it("sets aria-busy='true' during status='revealing' (Scenario 6)", () => {
    const nodes = [makeNode("n1")];
    useGraphStore.getState().addNodes({ sourceTool: "test", nodes, links: [] });

    act(() =>
      root.render(
        <GraphSpace nodes={nodes} links={[]} status="revealing" />,
      ),
    );
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("aria-busy")).toBe("true");
    // No overlay during revealing (overlay only for loading/error).
    expect(
      container.querySelector('[data-testid="graph-status-overlay"]'),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------- *
 * V5 — ref exposes the GraphSpaceHandle                          *
 * ------------------------------------------------------------- */
describe("GraphSpace — ref handle", () => {
  it("exposes focusNode / fitView / recenter on the ref (V5)", () => {
    // Seed the store so the canvas mounts (only mounted branches receive
    // the imperative handle).
    const nodes = [makeNode("n1")];
    useGraphStore.getState().addNodes({ sourceTool: "test", nodes, links: [] });

    let captured: GraphSpaceHandle | null = null;
    const refCallback = (h: GraphSpaceHandle | null) => {
      // React invokes the callback with `null` during cleanup; only
      // keep the populated one.
      if (h) captured = h;
    };

    act(() =>
      root.render(
        <GraphSpace
          nodes={nodes}
          links={[]}
          status="ready"
          ref={refCallback}
        />,
      ),
    );

    expect(captured).not.toBeNull();
    // Re-read through a cast so TS narrows correctly inside expect().
    const handle = captured as unknown as GraphSpaceHandle;
    expect(typeof handle.focusNode).toBe("function");
    expect(typeof handle.fitView).toBe("function");
    expect(typeof handle.recenter).toBe("function");
    // Arities — focusNode takes one arg, the others none.
    expect(handle.focusNode.length).toBe(1);
    expect(handle.fitView.length).toBe(0);
    expect(handle.recenter.length).toBe(0);
  });
});

/* ------------------------------------------------------------- *
 * V6 — No import of useChatTurnStore (AC-U.3)                    *
 * ------------------------------------------------------------- */
describe("GraphSpace — unidirectionality (V6, AC-U.3)", () => {
  it("does NOT import useChatTurnStore or anything from @/features/chat", () => {
    // The structural rule scans EVERY component file we authored in this
    // TC. If any of them ever imports a chat write surface, the rule
    // fails LOUDLY here (Golden Rule 12).
    const files = [
      "GraphSpace/GraphSpace.tsx",
      "GraphCanvas/GraphCanvas.tsx",
      "GraphStatusOverlay/GraphStatusOverlay.tsx",
      "GraphEmptyState/GraphEmptyState.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(resolve(__dirname, "..", rel), "utf-8");
      // Match REAL import statements only — i.e. lines beginning (modulo
      // indentation) with `import`. JSDoc prose that happens to contain
      // the substring "import `useChatTurnStore`" must NOT trip the rule.
      expect(src).not.toMatch(
        /^\s*import\s+[^;`*]*\buseChatTurnStore\b[^;]*from\s+/m,
      );
      expect(src).not.toMatch(
        /^\s*import\s+[^;]*from\s+["']@\/features\/chat(?:\/[^"']+)?["']/m,
      );
    }
  });
});

/* ------------------------------------------------------------- *
 * V7 — accessibility region + label                              *
 * ------------------------------------------------------------- */
describe("GraphSpace — accessibility (V7, AC-A.1)", () => {
  it("has role='region' and aria-label='Grafo de conhecimento'", () => {
    act(() =>
      root.render(<GraphSpace nodes={[]} links={[]} status="empty" />),
    );
    const region = container.querySelector('[data-testid="graph-space"]');
    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Grafo de conhecimento");
  });
});
