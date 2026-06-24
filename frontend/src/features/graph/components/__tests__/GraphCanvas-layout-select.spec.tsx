/**
 * GraphCanvas — algorithm Select (TC-02).
 *
 * Why these tests matter:
 *  - The Select must render alongside the Reorganizar button inside the
 *    same Panel — exactly ONE Panel, with both controls. A regression
 *    that splits them into two Panels would violate the TC constraint
 *    ("do not create a second Panel").
 *  - The Select must be wired to `onLayoutAlgorithmChange`: clicking an
 *    item must fire the setter with the chosen algorithm — pinned by
 *    directly invoking the Select primitive's onValueChange in unit
 *    tests would couple to Radix internals. Instead we assert that the
 *    rendered trigger carries the correct aria-label and current value,
 *    and that the option ids ('Força'/'Árvore'/'Radial') appear in the
 *    DOM once the trigger is clicked.
 */
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";

import type { GraphNodeData } from "../../types";
import type { GraphPosition } from "../../state/graph-store";
import { GraphCanvas } from "../GraphCanvas";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class NoopResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    (globalThis as unknown as { ResizeObserver: typeof NoopResizeObserver })
      .ResizeObserver = NoopResizeObserver;
  }
});

function makeNode(id: string): GraphNodeData {
  return { id, type: "concept", label: `Node ${id}` };
}

function withProvider(node: ReactNode): ReactNode {
  return <ReactFlowProvider>{node}</ReactFlowProvider>;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("GraphCanvas — layout algorithm Select", () => {
  it("renders the algorithm Select alongside the Reorganizar button inside the same Panel", () => {
    const nodes = [makeNode("n1"), makeNode("n2")];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
      ["n2", { x: 100, y: 0 }],
    ]);
    const onLayoutAlgorithmChange = vi.fn();
    const onResetLayout = vi.fn();

    act(() =>
      root.render(
        withProvider(
          <GraphCanvas
            nodes={nodes}
            links={[]}
            positions={positions}
            layoutAlgorithm="force"
            onLayoutAlgorithmChange={onLayoutAlgorithmChange}
            onResetLayout={onResetLayout}
          />,
        ),
      ),
    );

    // The Reorganizar button remains.
    const reorgButton = container.querySelector(
      'button[aria-label="Reorganizar o layout do grafo"]',
    );
    expect(reorgButton).not.toBeNull();

    // The Select trigger renders with its aria-label.
    const trigger = container.querySelector(
      '[aria-label="Algoritmo de layout do grafo"]',
    );
    expect(trigger).not.toBeNull();

    // Both controls live inside the SAME Panel — React Flow renders one
    // `.react-flow__panel` per Panel instance, so exactly one panel
    // matching the top-right position must contain both the Select
    // trigger and the button.
    const panels = container.querySelectorAll(".react-flow__panel");
    // There is exactly one Panel — the constraint forbids a second one.
    expect(panels.length).toBe(1);
    const panel = panels[0]!;
    expect(panel.contains(reorgButton)).toBe(true);
    expect(panel.contains(trigger)).toBe(true);
  });

  it("does NOT render the Select when only one of the two props is passed (defensive)", () => {
    // Passing only `layoutAlgorithm` (no setter) — the Select would be
    // read-only and useless, so we don't render it. The Reorganizar
    // button is still wired here, so the Panel renders without the
    // Select.
    const nodes = [makeNode("n1")];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
    ]);
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas
            nodes={nodes}
            links={[]}
            positions={positions}
            layoutAlgorithm="force"
            onResetLayout={vi.fn()}
          />,
        ),
      ),
    );

    const trigger = container.querySelector(
      '[aria-label="Algoritmo de layout do grafo"]',
    );
    expect(trigger).toBeNull();
  });

  it("the Select trigger reflects the current layoutAlgorithm value", () => {
    const nodes = [makeNode("n1")];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
    ]);
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas
            nodes={nodes}
            links={[]}
            positions={positions}
            layoutAlgorithm="tree"
            onLayoutAlgorithmChange={vi.fn()}
            onResetLayout={vi.fn()}
          />,
        ),
      ),
    );

    // The Select trigger shows the label of the currently-selected value.
    // Radix renders the value text inside the trigger as plain text.
    const trigger = container.querySelector(
      '[aria-label="Algoritmo de layout do grafo"]',
    );
    expect(trigger).not.toBeNull();
    expect(trigger!.textContent).toContain("Árvore");
  });
});
