/**
 * GraphEdgeAdapter — public type contract (TC-FE-06).
 *
 * The React Flow custom edge that renders solid/dashed strokes per
 * `tokens.md §7`. The `data` payload on each `Edge` instance is the
 * `GraphLinkData` surface shape (declared in `features/graph/types.ts`).
 *
 * React Flow's `Edge<EdgeData, …>` constrains `EdgeData extends
 * Record<string, unknown>`; interfaces don't satisfy that index-signature
 * by themselves in TypeScript strict mode, so we intersect with
 * `Record<string, unknown>` here. Consumers keep working with the original
 * `GraphLinkData` interface.
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphEdge.component.spec.md §2
 *  - docs/specs/front/components/GraphSpace.component.spec.md §7
 *  - docs/specs/front/design-system/tokens.md §7
 */
import type { Edge, EdgeProps } from "@xyflow/react";
import type { GraphLinkData } from "../../types";

/** Bag-of-properties form satisfying React Flow's index-signature constraint. */
export type GraphLinkDataRF = GraphLinkData & Record<string, unknown>;

/** The closed Edge shape the adapter registers under `edgeTypes.graphEdge`. */
export type GraphEdge = Edge<GraphLinkDataRF, "graphEdge">;

/** Props React Flow injects on every render. `data` is `GraphLinkData`. */
export type GraphEdgeAdapterProps = EdgeProps<GraphEdge>;
