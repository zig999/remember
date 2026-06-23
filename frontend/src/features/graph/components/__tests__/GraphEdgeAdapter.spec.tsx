/**
 * GraphEdgeAdapter — unit tests (TC-FE-06).
 *
 * What these tests pin (intent — Golden Rule 9, AC-F.11 + AC-U.3):
 *  - `isTemporal=true`  → solid stroke (`stroke-dasharray="0"`) — visual cue
 *     for temporal relations (tokens.md §7). A regression that drops the
 *     dash distinction would make ALL edges look the same, silently
 *     collapsing the spec's primary visual contract.
 *  - `isTemporal=false` → dashed stroke (`stroke-dasharray="4 4"`).
 *  - `state="uncertain"` overrides to dashed regardless of `isTemporal`
 *     (GraphEdge.spec §3 — uncertainty wins the visual signal). This
 *     prevents a user mistaking an uncertain temporal claim for an
 *     accepted one.
 *  - The link-type slug renders as the edge's visible label.
 *  - Confidence-state colour override classes are applied for uncertain /
 *     disputed / superseded (the StateBadge palette family — tokens.md §6).
 *  - `inEffect=false` dims the edge to 40 % opacity (and so does
 *     `state="superseded"`), preserving the edge in the React Flow graph
 *     instead of hiding it (a11y + layout invariant).
 *  - No import of `useChatTurnStore` — structural unidirectionality
 *     (AC-U.3). Verified by source-file regex.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Position, ReactFlowProvider } from "@xyflow/react";
import { GraphEdgeAdapter } from "../GraphEdgeAdapter";
import type { GraphEdgeAdapterProps } from "../GraphEdgeAdapter";

// TC-01 floating-edge harness — GraphEdgeAdapter now reads node geometry
// via `useInternalNode(source/target)`. In this unit harness we don't
// bring up a full `<ReactFlow>` instance (no nodes are registered in the
// store), so `useInternalNode` would return `undefined` and the edge
// would render nothing — defeating the existing dasharray/colour/a11y
// assertions which are independent of path geometry.
//
// We stub the hook to return a synthetic, measured `InternalNode` for any
// id. The two endpoints sit at distinct positions so `getEdgeParams`
// returns a valid (non-null) bezier path; the actual coordinates are
// irrelevant — the existing tests inspect the path's `class` /
// `stroke-dasharray` / `aria-hidden` attributes, not the `d` value.
vi.mock("@xyflow/react", async () => {
  const actual =
    await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    useInternalNode: (id: string) => ({
      id,
      data: {},
      position: { x: 0, y: 0 },
      measured: { width: 100, height: 50 },
      internals: {
        positionAbsolute:
          id === "n2" ? { x: 200, y: 200 } : { x: 0, y: 0 },
        z: 0,
        userNode: {} as never,
      },
    }),
  };
});

// React Flow's `<EdgeLabelRenderer>` reads from the ReactFlow zustand
// store. Outside a `<ReactFlowProvider>` it throws — so we wrap every
// render in this helper.
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
 * Build a minimal `EdgeProps<GraphEdge>` payload. We provide the geometry
 * fields (`sourceX/Y`, `targetX/Y`, `*Position`) so `getBezierPath` works,
 * plus the `data` shape the adapter reads. Casting via `unknown` keeps the
 * harness honest — we do NOT mock the full ReactFlow store.
 */
function makeProps(
  overrides: Partial<GraphEdgeAdapterProps> & {
    data?: GraphEdgeAdapterProps["data"];
  } = {},
): GraphEdgeAdapterProps {
  return {
    id: "edge-1",
    source: "n1",
    target: "n2",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: overrides.data ?? {
      id: "edge-1",
      source: "n1",
      target: "n2",
      label: "responsible_for",
      isTemporal: true,
    },
    selected: false,
    type: "graphEdge",
    ...overrides,
  } as unknown as GraphEdgeAdapterProps;
}

/** Helper — get the rendered SVG path. ReactFlow's `BaseEdge` renders
 *  a `<path>` element with the edge's `id`. */
function getPath(): SVGPathElement | null {
  return container.querySelector("path");
}

describe("GraphEdgeAdapter — temporal/stable stroke (AC-F.11)", () => {
  it("isTemporal=true → solid stroke (dasharray='0')", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    const path = getPath();
    expect(path).not.toBeNull();
    // The SVG attribute name is `stroke-dasharray` on the DOM (React
    // converts the JSX `strokeDasharray` to the spec-cased attribute).
    expect(path?.getAttribute("stroke-dasharray")).toBe("0");
  });

  it("isTemporal=false → dashed stroke (dasharray='4 4')", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "part_of",
                  isTemporal: false,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("stroke-dasharray")).toBe("4 4");
  });

  it("uncertain overrides isTemporal=true → dashed (uncertainty wins)", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  state: "uncertain",
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("stroke-dasharray")).toBe("4 4");
  });
});

describe("GraphEdgeAdapter — confidence-state colour overrides", () => {
  it("uncertain state applies the uncertain stroke class", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  state: "uncertain",
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("class")).toContain(
      "stroke-state-uncertain",
    );
  });

  it("disputed state applies the disputed stroke class", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  state: "disputed",
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("class")).toContain("stroke-state-disputed");
  });

  it("superseded state applies the superseded stroke class AND dims to 40 %", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  state: "superseded",
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    const cls = getPath()?.getAttribute("class") ?? "";
    expect(cls).toContain("stroke-state-superseded");
    expect(cls).toContain("opacity-40");
  });

  it("accepted state falls through to the LinkType colour class", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  state: "accepted",
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("class")).toContain(
      "stroke-link-responsible-for",
    );
  });

  it("no state → uses LinkType colour from the catalog (slug→token map)", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "part_of",
                  isTemporal: false,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("class")).toContain("stroke-link-part-of");
  });

  it("unknown link slug falls back to a neutral stroke class (open ontology — G-B)", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "totally_invented_slug",
                  isTemporal: true,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    // Falls through to the explicit fallback so a runtime-new slug renders
    // *something* instead of a missing class (silent invisibility).
    expect(getPath()?.getAttribute("class")).toContain(
      "stroke-link-related-to",
    );
  });
});

describe("GraphEdgeAdapter — dimming + label + a11y", () => {
  it("inEffect=false dims the edge to 40 %", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                  inEffect: false,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("class")).toContain("opacity-40");
  });

  it("renders the link-type slug as the visible label via EdgeLabelRenderer (structural)", () => {
    // React Flow's `EdgeLabelRenderer` is a portal — it mounts its
    // children into the `.react-flow__edgelabel-renderer` div that only
    // exists inside a full `<ReactFlow>` instance. We do NOT bring up a
    // full ReactFlow in this unit harness; instead we pin the contract
    // structurally — the source MUST render `{data.label}` inside an
    // `<EdgeLabelRenderer>` block. A regression that drops the label
    // rendering (or moves it outside the portal) fails this test.
    const src = readFileSync(
      resolve(__dirname, "../GraphEdgeAdapter/GraphEdgeAdapter.tsx"),
      "utf-8",
    );
    expect(src).toMatch(/<EdgeLabelRenderer>/);
    // The label expression `{data.label}` must appear between the
    // EdgeLabelRenderer open and close tags. We constrain by `s` flag
    // (dot matches newlines) so the regex spans the multi-line block.
    expect(src).toMatch(
      /<EdgeLabelRenderer>[\s\S]*?\{data\.label\}[\s\S]*?<\/EdgeLabelRenderer>/,
    );
  });

  it("aria-hidden=true on the edge path (a11y §8 — decorative SVG)", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            <GraphEdgeAdapter
              {...makeProps({
                data: {
                  id: "e1",
                  source: "n1",
                  target: "n2",
                  label: "responsible_for",
                  isTemporal: true,
                },
              })}
            />
          </svg>,
        ),
      ),
    );
    expect(getPath()?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders nothing when `data` is missing (defensive — RF mid-reconcile)", () => {
    act(() =>
      root.render(
        withProvider(
          <svg>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <GraphEdgeAdapter
              {...({
                id: "e1",
                source: "n1",
                target: "n2",
                sourceX: 0,
                sourceY: 0,
                targetX: 10,
                targetY: 10,
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                selected: false,
                type: "graphEdge",
                // data omitted on purpose
              } as unknown as GraphEdgeAdapterProps)}
            />
          </svg>,
        ),
      ),
    );
    // No <path> rendered when data is absent.
    expect(getPath()).toBeNull();
  });
});

describe("GraphEdgeAdapter — structural unidirectionality (AC-U.3)", () => {
  it("does not import useChatTurnStore or anything from @/features/chat", () => {
    const src = readFileSync(
      resolve(__dirname, "../GraphEdgeAdapter/GraphEdgeAdapter.tsx"),
      "utf-8",
    );
    // Narrow to import statements — see the GraphNodeAdapter sibling spec
    // for the rationale (this file's own documentation may name the store).
    expect(src).not.toMatch(/import\s+[^;]*\buseChatTurnStore\b[^;]*from\s+/);
    expect(src).not.toMatch(/from\s+["']@\/features\/chat(?:\/[^"']+)?["']/);
  });
});
