/**
 * GraphNodeAdapter — unit tests (TC-FE-06).
 *
 * What these tests pin (intent, per Golden Rule 9):
 *  - The adapter REUSES `ds/GraphNode` — it does not re-implement node
 *    styling. The aria-label "{type-pt-BR}: {label}" is the contract; the
 *    icon colour class is the visual signal. If the adapter ever stopped
 *    rendering the design-system node, both assertions would fail loud.
 *  - React Flow `<Handle>` elements MUST exist for source AND target so
 *    edges can wire through this node (validation criterion #2).
 *  - The `selected` flag must reach `ds/GraphNode` so the focus ring
 *    appears when React Flow marks the node selected.
 *  - No import of `useChatTurnStore` — structural unidirectionality
 *    (AC-U.3). We verify the structural property by static source
 *    inspection in a sibling test (the structural rule applies to the
 *    feature directory; this spec inspects the adapter source string).
 *
 * The adapter is a tiny mapping shim; the bulk of visual behaviour is
 * covered by `GraphNode.spec.tsx`. We pin the mapping, not the visual.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphNodeAdapter } from "../GraphNodeAdapter";
import type { GraphNodeAdapterProps } from "../GraphNodeAdapter";

// React Flow's `<Handle>` reads from the ReactFlow zustand store via
// `useStoreApi`. Outside a `<ReactFlowProvider>` it throws — even a
// stub mount needs the provider. We wrap every render in this helper
// so the Handle DOM is reachable for assertions without needing a full
// `<ReactFlow>` instance (the canvas adds layout we don't need in the
// adapter unit tests).
function withProvider(node: ReactNode): ReactNode {
  return <ReactFlowProvider>{node}</ReactFlowProvider>;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/**
 * Build a minimal `NodeProps<GraphNode>` payload. React Flow injects many
 * fields; we set only the ones the adapter reads + a few required by the
 * type system. Casting via `unknown` keeps the harness honest — we are NOT
 * pretending to provide the full ReactFlow internal state.
 */
function makeProps(overrides: {
  data: GraphNodeAdapterProps["data"];
  selected?: boolean;
}): GraphNodeAdapterProps {
  return {
    id: "node-1",
    type: "graphNode",
    data: overrides.data,
    selected: overrides.selected ?? false,
    dragging: false,
    isConnectable: false,
    zIndex: 0,
    selectable: false,
    deletable: false,
    draggable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as unknown as GraphNodeAdapterProps;
}

describe("GraphNodeAdapter", () => {
  it("renders ds/GraphNode with mapped label + pt-BR subtitle (validation #1)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: { id: "node-1", type: "project", label: "Apollo" },
            })}
          />,
        ),
      ),
    );
    // The aria-label is owned by ds/GraphNode. If it appears here, the
    // adapter passed `type=project, label=Apollo` through correctly.
    const node = container.querySelector('[role="group"]');
    expect(node?.getAttribute("aria-label")).toBe("Projeto: Apollo");
    expect(node?.textContent).toContain("Apollo");
    expect(node?.textContent).toContain("Projeto");
  });

  it("forwards `state` prop so the StateBadge appears (validation #1)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: {
                id: "node-1",
                type: "person",
                label: "Rodrigo",
                state: "uncertain",
              },
            })}
          />,
        ),
      ),
    );
    // ds/GraphNode renders the StateBadge with `data-state="uncertain"` on
    // the badge root — if the adapter dropped the prop, the badge would be
    // absent. We pin the existence, not the visual styling.
    expect(container.querySelector('[data-state="uncertain"]')).not.toBeNull();
  });

  it("omits StateBadge when `state` is not provided (negative — confirms exactOptional spread)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: { id: "node-1", type: "person", label: "Rodrigo" },
            })}
          />,
        ),
      ),
    );
    expect(container.querySelector("[data-state]")).toBeNull();
  });

  it("forwards `selected` so the focus ring renders (validation #1)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: { id: "node-1", type: "task", label: "x" },
              selected: true,
            })}
          />,
        ),
      ),
    );
    // ds/GraphNode adds `ring-2 ring-border-focus` when selected=true.
    expect(container.innerHTML).toContain("ring-border-focus");
  });

  it("renders React Flow Handle for both source AND target (validation #2)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: { id: "node-1", type: "person", label: "Rodrigo" },
            })}
          />,
        ),
      ),
    );
    // React Flow's `<Handle>` renders a div with `data-handlepos` and
    // `data-handleid` attributes (plus a `react-flow__handle` class). We
    // pin both halves of the contract — without them, edges cannot wire.
    const handles = container.querySelectorAll(".react-flow__handle");
    expect(handles.length).toBe(2);
    // One target at Top, one source at Bottom — the standard top-down flow
    // for a knowledge subgraph.
    const positions = Array.from(handles).map(
      (h) => (h as HTMLElement).dataset["handlepos"],
    );
    expect(positions).toContain("top");
    expect(positions).toContain("bottom");
  });

  it("subtitle override reaches ds/GraphNode (preserves prop pass-through)", () => {
    act(() =>
      root.render(
        withProvider(
          <GraphNodeAdapter
            {...makeProps({
              data: {
                id: "node-1",
                type: "person",
                label: "Rodrigo",
                subtitle: "a 2 saltos",
              },
            })}
          />,
        ),
      ),
    );
    const node = container.querySelector('[role="group"]');
    expect(node?.textContent).toContain("a 2 saltos");
    expect(node?.textContent).not.toContain("Pessoa");
  });

  it("does not import useChatTurnStore — structural unidirectionality (AC-U.3)", () => {
    // Structural assertion: the adapter source must not IMPORT the chat
    // turn store nor anything else from `@/features/chat`. We narrow the
    // regex to import statements only so the prose in this file's own
    // documentation (which legitimately references the store name) does
    // not falsely fail the test.
    const src = readFileSync(
      resolve(__dirname, "../GraphNodeAdapter/GraphNodeAdapter.tsx"),
      "utf-8",
    );
    // Match `import { … useChatTurnStore … } from "…"` patterns.
    expect(src).not.toMatch(/import\s+[^;]*\buseChatTurnStore\b[^;]*from\s+/);
    // Match any import from the chat feature root or a subpath.
    expect(src).not.toMatch(/from\s+["']@\/features\/chat(?:\/[^"']+)?["']/);
  });
});
