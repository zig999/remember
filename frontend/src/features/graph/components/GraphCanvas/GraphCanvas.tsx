import { useCallback, useImperativeHandle, useMemo } from "react";
import type { FC, MouseEvent as ReactMouseEvent } from "react";
import {
  ReactFlow,
  Panel,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnNodesChange,
} from "@xyflow/react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import type { GraphLayoutAlgorithm } from "../../state/graph-store";
import {
  GraphNodeAdapter,
  type GraphNode,
} from "../GraphNodeAdapter";
import {
  GraphEdgeAdapter,
  type GraphEdge,
} from "../GraphEdgeAdapter";
import type { GraphCanvasProps } from "./GraphCanvas.types";

const LAYOUT_ALGORITHM_LABELS: Record<GraphLayoutAlgorithm, string> = {
  force: "Força",
  tree: "Árvore",
  radial: "Radial",
};
const LAYOUT_ALGORITHM_ORDER: readonly GraphLayoutAlgorithm[] = [
  "force",
  "tree",
  "radial",
];

const NODE_TYPES = { graphNode: GraphNodeAdapter } as const;
const EDGE_TYPES = { graphEdge: GraphEdgeAdapter } as const;

const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 0.75 } as const;

function toRfNodes(
  nodes: readonly GraphCanvasProps["nodes"][number][],
  positions: ReadonlyMap<string, { readonly x: number; readonly y: number }>,
): GraphNode[] {
  return nodes.map<GraphNode>((n) => {
    const pos = positions.get(n.id);
    return {
      id: n.id,
      type: "graphNode",
      position: pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },
      data: n as unknown as NonNullable<GraphNode["data"]>,
    };
  });
}

function toRfEdges(
  links: readonly GraphCanvasProps["links"][number][],
): GraphEdge[] {
  return links.map<GraphEdge>((l) => {
    return {
      id: l.id,
      type: "graphEdge",
      source: l.source,
      target: l.target,
      data: l as unknown as NonNullable<GraphEdge["data"]>,
    };
  });
}

export const GraphCanvas: FC<GraphCanvasProps> = ({
  nodes,
  links,
  positions,
  revealedIds,
  onNodeSelect,
  onNodePositionCommit,
  onResetLayout,
  layoutAlgorithm,
  onLayoutAlgorithmChange,
  ref,
  className,
}) => {
  const rfApi = useReactFlow();

  const visibleNodes = useMemo(
    () =>
      revealedIds === undefined
        ? nodes
        : nodes.filter((n) => revealedIds.has(n.id)),
    [nodes, revealedIds],
  );
  const visibleLinks = useMemo(
    () =>
      revealedIds === undefined
        ? links
        : links.filter(
            (l) => revealedIds.has(l.source) && revealedIds.has(l.target),
          ),
    [links, revealedIds],
  );

  const rfNodes = useMemo<Node[]>(
    () => toRfNodes(visibleNodes, positions),
    [visibleNodes, positions],
  );
  const rfEdges = useMemo<Edge[]>(() => toRfEdges(visibleLinks), [visibleLinks]);

  useImperativeHandle(
    ref,
    () => ({
      focusNode: (id: string) => {
        const node = rfApi.getNode(id);
        if (!node) return;
        const measured = node.measured;
        const cx = node.position.x + (measured?.width ?? 0) / 2;
        const cy = node.position.y + (measured?.height ?? 0) / 2;
        rfApi.setCenter(cx, cy, { zoom: 1, duration: 300 });
      },
      fitView: () => {
        rfApi.fitView({ duration: 300, padding: 0.1 });
      },
      recenter: () => {
        rfApi.setViewport(
          { x: DEFAULT_VIEWPORT.x, y: DEFAULT_VIEWPORT.y, zoom: DEFAULT_VIEWPORT.zoom },
          { duration: 300 },
        );
      },
    }),
    [rfApi],
  );

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_event: ReactMouseEvent, node: Node) => {
      if (!onNodeSelect) return;
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      if (!onNodePositionCommit) return;
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          onNodePositionCommit(change.id, {
            x: change.position.x,
            y: change.position.y,
          });
        }
      }
    },
    [onNodePositionCommit],
  );

  const nodesChangeProp = onNodePositionCommit
    ? { onNodesChange: handleNodesChange }
    : {};

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      defaultViewport={DEFAULT_VIEWPORT}
      onNodeClick={handleNodeClick}
      {...nodesChangeProp}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={onNodePositionCommit !== undefined}
      nodesConnectable={false}
      elementsSelectable={true}
      panOnDrag
      zoomOnScroll
      className={cn("h-full w-full", className)}
    >
      {visibleNodes.length > 0 &&
        (onResetLayout || (layoutAlgorithm && onLayoutAlgorithmChange)) && (
          <Panel position="top-right">
            <div className="flex items-center gap-sm">
              {layoutAlgorithm && onLayoutAlgorithmChange && (
                <Select
                  value={layoutAlgorithm}
                  onChange={(v) =>
                    onLayoutAlgorithmChange(v as GraphLayoutAlgorithm)
                  }
                  options={LAYOUT_ALGORITHM_ORDER.map((algo) => ({
                    value: algo,
                    label: LAYOUT_ALGORITHM_LABELS[algo],
                  }))}
                  aria-label="Algoritmo de layout do grafo"
                  className="w-auto min-w-3xs"
                />
              )}
              {onResetLayout && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onResetLayout}
                  aria-label="Reorganizar o layout do grafo"
                >
                  <Shuffle aria-hidden="true" className="size-4" />
                  Reorganizar
                </Button>
              )}
            </div>
          </Panel>
        )}
    </ReactFlow>
  );
};
