import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { chatRoute } from "@/router/routes";
import {
  GraphSpace,
  NodeDetailPanel,
  useGraphStore,
  type GraphSpaceHandle,
} from "@/features/graph";
import { ConversationView } from "./ConversationView";
import { useGraphPersistence } from "@/features/graph/api/use-graph-persistence";

export const ChatWorkspace: FC = () => {
  const { conversation } = chatRoute.useSearch();

  const [selectedNode, setSelectedNode] = useState<
    { id: string; label: string | undefined } | null
  >(null);

  const graphRef = useRef<GraphSpaceHandle>(null);

  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const status = useGraphStore((s) => s.status);
  const errorMessage = useGraphStore((s) => s.errorMessage);

  const nodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const links = useMemo(() => Array.from(linksMap.values()), [linksMap]);

  useEffect(() => {
    useGraphStore.getState().clear();
    setSelectedNode(null);
  }, [conversation]);

  useGraphPersistence(conversation);

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
      className="@container min-h-0 w-full flex-1"
      data-testid="chat-workspace"
    >
      <div className="flex h-full w-full flex-col @lg:flex-row">
        <div className="min-h-0 flex-1 @lg:w-2/5 @lg:flex-none">
          <ConversationView conversationId={conversation} />
        </div>

        <div
          className="min-h-0 flex-1 p-lg @lg:w-3/5 @lg:flex-none"
          data-testid="graph-space-panel"
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
              status={status}
              {...(errorMessage !== undefined ? { errorMessage } : {})}
              onNodeSelect={handleNodeSelect}
              ref={graphRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};
