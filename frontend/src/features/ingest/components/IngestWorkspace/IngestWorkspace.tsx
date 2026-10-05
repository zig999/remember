import { useCallback, useMemo, useState, type FC } from "react";
import { cn } from "@/lib/cn";
import {
  GraphSpace,
  NodeDetailPanel,
  useGraphStore,
} from "@/features/graph";
import type { IngestSourceType } from "../../api";
import { IngestPanel } from "../IngestPanel";
import type { IngestWorkspaceProps } from "./IngestWorkspace.types";
import { useIngestOrchestration } from "./useIngestOrchestration";

export const IngestWorkspace: FC<IngestWorkspaceProps> = ({ className }) => {
  const [content, setContent] = useState<string>("");
  const [sourceType, setSourceType] = useState<IngestSourceType | "">("");
  const [selectedNode, setSelectedNode] = useState<
    { id: string; label: string | undefined } | null
  >(null);

  const resetForm = useCallback(() => {
    setContent("");
    setSourceType("");
    setSelectedNode(null);
  }, []);

  const {
    phase,
    summary,
    errorCode,
    errorMessage,
    validationMessage,
    handleSubmit,
    handleAssembleExisting,
    handleRetry,
    handleReset,
  } = useIngestOrchestration({ content, sourceType, resetForm });

  const graphStatus = useGraphStore((s) => s.status);
  const graphErrorMessage = useGraphStore((s) => s.errorMessage);
  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const nodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const links = useMemo(() => Array.from(linksMap.values()), [linksMap]);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const node = nodesMap.get(nodeId);
      setSelectedNode({ id: nodeId, label: node?.label });
    },
    [nodesMap],
  );
  const handleDetailClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div
      data-testid="ingest-workspace"
      className={cn("@container min-h-0 w-full flex-1", className)}
    >
      <div className="flex h-full w-full flex-col @lg:flex-row">
        <div className="min-h-0 flex-1 @lg:w-2/5 @lg:flex-none">
          <IngestPanel
            phase={phase}
            content={content}
            sourceType={sourceType}
            {...(validationMessage !== null ? { validationMessage } : {})}
            {...(summary !== null ? { summary } : {})}
            {...(errorMessage !== null ? { errorMessage } : {})}
            {...(errorCode !== null ? { errorCode } : {})}
            onContentChange={setContent}
            onSourceTypeChange={setSourceType}
            onSubmit={handleSubmit}
            onAssembleExisting={handleAssembleExisting}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </div>

        <div
          data-testid="graph-space-panel"
          className="min-h-0 flex-1 p-lg @lg:w-3/5 @lg:flex-none"
        >
          {selectedNode !== null ? (
            <NodeDetailPanel
              nodeId={selectedNode.id}
              {...(selectedNode.label !== undefined
                ? { nodeLabel: selectedNode.label }
                : {})}
              onClose={handleDetailClose}
            />
          ) : (
            <GraphSpace
              nodes={nodes}
              links={links}
              status={graphStatus}
              {...(graphErrorMessage !== undefined
                ? { errorMessage: graphErrorMessage }
                : {})}
              onNodeSelect={handleNodeSelect}
              revealStaggerMs={90}
            />
          )}
        </div>
      </div>
    </div>
  );
};
