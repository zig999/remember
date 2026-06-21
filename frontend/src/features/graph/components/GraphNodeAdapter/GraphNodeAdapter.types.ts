/**
 * GraphNodeAdapter — public type contract (TC-FE-06).
 *
 * The React Flow custom node that wraps `components/ds/GraphNode`. It maps
 * the `NodeProps<GraphNode>` payload React Flow injects on each render to
 * the presentational `GraphNodeProps` consumed by the design-system node.
 *
 * `GraphNodeData` is the feature-level surface shape (camelCase, declared
 * in `features/graph/types.ts`). React Flow's generic `Node<NodeData, …>`
 * constrains `NodeData extends Record<string, unknown>` — an interface does
 * not satisfy that index-signature constraint by itself in TypeScript, so
 * we wrap `GraphNodeData` with a `& Record<string, unknown>` intersection
 * here. The intersection is the only place we relax the contract; consumers
 * keep working with the unmodified `GraphNodeData` interface.
 *
 * Normative source:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §7
 *    (Components to Create — GraphNodeAdapter)
 */
import type { Node, NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "../../types";

/** Bag-of-properties form satisfying React Flow's index-signature constraint. */
export type GraphNodeDataRF = GraphNodeData & Record<string, unknown>;

/** The closed Node shape the adapter registers under `nodeTypes.graphNode`. */
export type GraphNode = Node<GraphNodeDataRF, "graphNode">;

/** Props React Flow injects on every render. `data` is `GraphNodeData`. */
export type GraphNodeAdapterProps = NodeProps<GraphNode>;
