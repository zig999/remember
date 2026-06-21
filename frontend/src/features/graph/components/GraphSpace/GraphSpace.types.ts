/**
 * GraphSpace — public type contract (TC-FE-07).
 *
 * The knowledge-graph visualization panel mounted in the 60% right pane of
 * `ChatWorkspace`. Receives nodes/links/status as props (caller reads
 * `useGraphStore`) — it is a sink (no writes to the store from here).
 *
 * `ref` follows the React 19 ref-as-prop pattern; the handle exposes
 * view-only operations (`focusNode`, `fitView`, `recenter`).
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §2 (Props
 *    Contract — this file is the literal TypeScript shape of that table).
 *  - temp/chat-graphspace-plan.md §6.2 GraphSpaceProps, §6.3
 *    GraphSpaceHandle.
 */
import type { Ref } from "react";
import type { GraphLinkData, GraphNodeData, GraphStatus } from "../../types";

/** Imperative handle exposed via the `ref` prop — view-only operations
 *  against the React Flow viewport. NEVER affects the data or the chat
 *  (REQ-6 / AC-U.3). */
export interface GraphSpaceHandle {
  /** Centers + highlights the node identified by `id` in the viewport.
   *  No-op when the id is not in the live `nodes` Map. */
  focusNode(id: string): void;
  /** Fits all currently-rendered nodes into the visible viewport. */
  fitView(): void;
  /** Resets zoom to the default and centres the canvas origin. */
  recenter(): void;
}

export interface GraphSpaceProps {
  /** Surface-shape nodes to render. Source: `useGraphStore` via
   *  `ChatWorkspace`. */
  nodes: readonly GraphNodeData[];
  /** Surface-shape links to render. */
  links: readonly GraphLinkData[];
  /** Processing state of the graph pane (REQ-2). Drives overlay /
   *  empty-state rendering. Exactly 5 values — no `"idle"` (I-4). */
  status: GraphStatus;
  /** Optional error message — shown by `GraphStatusOverlay` when
   *  `status === "error"`. */
  errorMessage?: string;
  /** Milliseconds between revealing consecutive nodes — consumed by
   *  `useGraphReveal` (out of TC-FE-07 scope; default plumbed for the
   *  follow-up TC). */
  revealStaggerMs?: number;
  /** View-only callback fired when a node is clicked. Used by parent to
   *  mount `NodeDetailPanel`. Never causes a chat mutation. */
  onNodeSelect?: (nodeId: string) => void;
  /** React 19 ref-as-prop — exposes the view-only handle. */
  ref?: Ref<GraphSpaceHandle>;
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
}
