import type { FC } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useForceLayout } from "../../hooks/useForceLayout";
import { useGraphStore } from "../../state/graph-store";
import {
  useGraphReveal,
  DEFAULT_REVEAL_STAGGER_MS,
} from "../../hooks/useGraphReveal";
import { GraphCanvas } from "../GraphCanvas";
import { GraphEmptyState } from "../GraphEmptyState";
import { GraphStatusOverlay } from "../GraphStatusOverlay";
import type { GraphSpaceProps } from "./GraphSpace.types";

interface GraphCanvasRegionProps {
  nodes: GraphSpaceProps["nodes"];
  links: GraphSpaceProps["links"];
  status: GraphSpaceProps["status"];
  errorMessage?: GraphSpaceProps["errorMessage"];
  revealStaggerMs: number;
  onNodeSelect?: GraphSpaceProps["onNodeSelect"];
  spaceRef?: GraphSpaceProps["ref"];
}

const GraphCanvasRegion: FC<GraphCanvasRegionProps> = ({
  nodes,
  links,
  status,
  errorMessage,
  revealStaggerMs,
  onNodeSelect,
  spaceRef,
}) => {
  const positions = useForceLayout();

  const setNodePosition = useGraphStore((s) => s.setNodePosition);
  const resetLayout = useGraphStore((s) => s.resetLayout);
  const layoutAlgorithm = useGraphStore((s) => s.layoutAlgorithm);
  const setLayoutAlgorithm = useGraphStore((s) => s.setLayoutAlgorithm);

  const revealedIds = useGraphReveal(revealStaggerMs);

  const overlayVariant =
    status === "loading" ? "loading" : status === "error" ? "error" : null;

  const overlayErrorProp =
    errorMessage !== undefined ? { errorMessage } : {};

  const canvasNodeSelectProp =
    onNodeSelect !== undefined ? { onNodeSelect } : {};
  const canvasRefProp = spaceRef !== undefined ? { ref: spaceRef } : {};

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GraphCanvas
        nodes={nodes}
        links={links}
        positions={positions}
        revealedIds={revealedIds}
        onNodePositionCommit={setNodePosition}
        onResetLayout={resetLayout}
        layoutAlgorithm={layoutAlgorithm}
        onLayoutAlgorithmChange={setLayoutAlgorithm}
        {...canvasNodeSelectProp}
        {...canvasRefProp}
      />
      {overlayVariant !== null && (
        <GraphStatusOverlay variant={overlayVariant} {...overlayErrorProp} />
      )}
    </div>
  );
};

export const GraphSpace: FC<GraphSpaceProps> = ({
  nodes,
  links,
  status,
  errorMessage,
  revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS,
  onNodeSelect,
  ref,
  className,
}) => {
  const showEmptyState = status === "empty" && nodes.length === 0;

  const isBusy = status === "loading" || status === "revealing";

  const regionRefProp = ref !== undefined ? { spaceRef: ref } : {};

  return (
    <section
      role="region"
      aria-label="Grafo de conhecimento"
      {...(isBusy ? { "aria-busy": true } : {})}
      data-status={status}
      data-testid="graph-space"
      className={cn(
        "relative flex h-full w-full flex-col min-h-0",
        className,
      )}
    >
      {showEmptyState ? (
        <GraphEmptyState />
      ) : (
        <ReactFlowProvider>
          <GraphCanvasRegion
            nodes={nodes}
            links={links}
            status={status}
            errorMessage={errorMessage}
            revealStaggerMs={revealStaggerMs}
            onNodeSelect={onNodeSelect}
            {...regionRefProp}
          />
        </ReactFlowProvider>
      )}
    </section>
  );
};
