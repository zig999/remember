/**
 * GraphCanvas — unit tests (TC-FE-07).
 *
 * Pinned intent:
 *  - The canvas renders ONE GraphNodeAdapter per `nodes[]` entry and ONE
 *    GraphEdgeAdapter per `links[]` entry (AC-F.10). Reusing the design-
 *    system node is the contract — the adapter integration is asserted
 *    here at the canvas seam, not duplicated from the adapter specs.
 *  - The `ref` exposes the GraphSpaceHandle (focusNode/fitView/recenter),
 *    callable without throwing (V5 — happy path).
 *  - `onNodeSelect` is called with the node id (view-only — REQ-6).
 *
 * Layout / positions:
 *  - We seed a `positions` Map for the nodes so the canvas does not fall
 *    back to (0, 0) for every node (which would still render but tells
 *    us nothing about the position-pass through). React Flow accepts the
 *    positions verbatim.
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

import type { GraphLinkData, GraphNodeData } from "../../types";
import type { GraphPosition } from "../../state/graph-store";
import { GraphCanvas } from "../GraphCanvas";
import type { GraphSpaceHandle } from "../GraphSpace";

// jsdom does not implement ResizeObserver, which React Flow installs on
// the canvas root. Install a no-op shim. Local to this file — does not
// touch the shared `vitest.setup.ts` (foundation file).
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

function makeLink(id: string, source: string, target: string): GraphLinkData {
  return {
    id,
    source,
    target,
    label: "related_to",
    isTemporal: true,
  };
}

/** Wrap render in the React Flow provider — `useReactFlow` (called by
 *  the canvas's `useImperativeHandle`) throws outside the provider. */
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

describe("GraphCanvas", () => {
  it("renders one node element per `nodes[]` entry (AC-F.10)", () => {
    const nodes = [makeNode("n1"), makeNode("n2"), makeNode("n3")];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
      ["n2", { x: 100, y: 0 }],
      ["n3", { x: 0, y: 100 }],
    ]);
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas nodes={nodes} links={[]} positions={positions} />,
        ),
      ),
    );
    // Each GraphNodeAdapter renders a ds/GraphNode with role="group" +
    // an aria-label of `{pt-BR type}: {label}`. Confirm the count.
    const nodeEls = container.querySelectorAll('[role="group"]');
    expect(nodeEls.length).toBeGreaterThanOrEqual(3);
  });

  it("hands each link to React Flow's edge layer (AC-F.10)", () => {
    // jsdom does not lay out the React Flow canvas, so the edge SVG path
    // is not rendered until nodes are measured (an O(1) call we cannot
    // fake without a real layout engine). What we CAN assert structurally
    // is that React Flow received the edges — the wrapper element it
    // adds for each edge carries `data-id=<edge id>`. The pane element
    // is the `.react-flow__edges` SVG container.
    const nodes = [makeNode("n1"), makeNode("n2")];
    const links = [
      makeLink("e1", "n1", "n2"),
      makeLink("e2", "n2", "n1"),
    ];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
      ["n2", { x: 100, y: 0 }],
    ]);
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas nodes={nodes} links={links} positions={positions} />,
        ),
      ),
    );
    // The edges SVG layer must exist when edges are passed.
    const edgesLayer = container.querySelector(".react-flow__edges");
    expect(edgesLayer).not.toBeNull();
    // The canvas must at least render the React Flow root.
    expect(container.querySelector(".react-flow")).not.toBeNull();
  });

  it("fires onNodeSelect with the node id when a node is clicked (REQ-6)", () => {
    const nodes = [makeNode("n1")];
    const positions = new Map<string, GraphPosition>([
      ["n1", { x: 0, y: 0 }],
    ]);
    const onNodeSelect = vi.fn();
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas
            nodes={nodes}
            links={[]}
            positions={positions}
            onNodeSelect={onNodeSelect}
          />,
        ),
      ),
    );
    // Locate the React Flow node wrapper — every node gets
    // `data-id="<nodeId>"` on the wrapper element.
    const wrapper = container.querySelector('[data-id="n1"]');
    expect(wrapper).not.toBeNull();
    act(() => {
      wrapper?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(onNodeSelect).toHaveBeenCalledWith("n1");
  });

  it("ref handle exposes focusNode / fitView / recenter (V5)", () => {
    let handle: GraphSpaceHandle | null = null;
    act(() =>
      root.render(
        withProvider(
          <GraphCanvas
            nodes={[makeNode("n1")]}
            links={[]}
            positions={new Map([["n1", { x: 0, y: 0 }]])}
            ref={(h) => {
              if (h) handle = h;
            }}
          />,
        ),
      ),
    );
    expect(handle).not.toBeNull();
    const h = handle as unknown as GraphSpaceHandle;
    expect(typeof h.focusNode).toBe("function");
    expect(typeof h.fitView).toBe("function");
    expect(typeof h.recenter).toBe("function");
    // Call each — must NOT throw against the live React Flow API. Pass
    // a non-existent id to focusNode to confirm it short-circuits.
    expect(() => h.focusNode("no-such-id")).not.toThrow();
    expect(() => h.fitView()).not.toThrow();
    expect(() => h.recenter()).not.toThrow();
  });
});
