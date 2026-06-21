/**
 * NodeDetailPanel — public type contract (TC-FE-08).
 *
 * Canonical source: docs/specs/front/components/NodeDetailPanel.component.spec.md §2.
 *
 * `ref` follows the React 19 ref-as-prop pattern (project convention — no
 * `forwardRef`). `onClose` is required because the parent (`ChatWorkspace`)
 * unmounts the panel and must restore focus to the originating graph node.
 *
 * Out of v1 scope (kept here for documentation, not exposed): provenance
 * drilldown, alias-click traversal, attribute edit. Adding any of these
 * would require widening the props contract via a spec CR.
 */
import type { Ref } from "react";

export interface NodeDetailPanelProps {
  /** UUID of the `KnowledgeNode` to load via `getNodeById`. */
  nodeId: string;
  /**
   * Canonical name already known from `GraphNodeData` — displayed
   * immediately in the loading skeleton to reduce perceived latency
   * (spec §2 + §3 Loading row).
   */
  nodeLabel?: string;
  /**
   * Callback fired when the user dismisses the panel (× button or
   * Escape). `ChatWorkspace` unmounts the panel and restores graph view.
   */
  onClose: () => void;
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
  /** React 19 ref-as-prop — attached to the root `<section>`. */
  ref?: Ref<HTMLElement>;
}
