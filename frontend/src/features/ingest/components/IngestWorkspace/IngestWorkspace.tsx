/**
 * IngestWorkspace — `/ingest` page-level component (dev_tc_005).
 *
 * Layout (mirrors `ChatWorkspace`):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  IngestPanel (40%)       │  GraphSpace OR NodeDetailPanel    │
 *   │  form + progress/summary │  (60% — toggled by selectedNode)  │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Container-query split: `@container` + `@lg:flex-row` — the exact class
 * strings from `ChatWorkspace` are reused verbatim (TC constraint: copy the
 * pattern, do not invent variants).
 *
 * State machine (`ingest.feature.spec.md §3`):
 *
 *   idle → ready → sending → { extracting | polling | noop | error } →
 *   { complete | revealing → complete | error }
 *
 *   plus the side-mode `node_selected` (right column swap; left column
 *   unaffected, hence the panel phase is unchanged).
 *
 * The async machine lives in `useIngestOrchestration` (split off in
 * dev_tc_005_r1 to keep this file ≤ 300 lines); this component just owns the
 * form values, the graph-store subscriptions, the right-column toggle, and
 * the layout.
 *
 * No imports from `features/chat` — only `features/graph` (right column),
 * `features/ingest/api` (the orchestration hook), and `features/ingest/
 * components` (the left column).
 */
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
  // ---- form state ---------------------------------------------------------
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

  // ---- async orchestration (phase machine + mutations + polling) ----------
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

  // ---- graph store --------------------------------------------------------
  const graphStatus = useGraphStore((s) => s.status);
  const graphErrorMessage = useGraphStore((s) => s.errorMessage);
  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const nodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const links = useMemo(() => Array.from(linksMap.values()), [linksMap]);

  // ---- graph node selection ----------------------------------------------
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
        {/* Left column — IngestPanel, 40% at @lg+. */}
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

        {/* Right column — GraphSpace or NodeDetailPanel, 60% at @lg+. */}
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
