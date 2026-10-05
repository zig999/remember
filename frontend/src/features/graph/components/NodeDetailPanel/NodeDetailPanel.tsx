import { useEffect, useRef, useState, type FC, type KeyboardEvent } from "react";

import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";
import { CurationDrawer } from "@/features/curation/components/CurationDrawer";

import { useNodeDetail } from "../../api/useNodeDetail";
import {
  classifyError,
  ErrorView,
  LoadingView,
} from "./NodeDetailPanel.shell";
import { SuccessView } from "./NodeDetailPanel.success";
import { deriveCurationTarget } from "./NodeDetailPanel.curation";
import type { NodeDetailPanelProps } from "./NodeDetailPanel.types";

export { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
export { deriveCurationTarget } from "./NodeDetailPanel.curation";
export type { NodeCurationTarget } from "./NodeDetailPanel.curation";

export const NodeDetailPanel: FC<NodeDetailPanelProps> = ({
  nodeId,
  nodeLabel,
  onClose,
  className,
  ref,
}) => {
  const query = useNodeDetail(nodeId);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const curateButtonRef = useRef<HTMLButtonElement | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
  }, [nodeId]);

  function handleDrawerOpenChange(next: boolean): void {
    setDrawerOpen(next);
    if (!next) {
      requestAnimationFrame(() => {
        curateButtonRef.current?.focus();
      });
    }
  }

  const curationTarget =
    query.data !== undefined ? deriveCurationTarget(query.data) : null;

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  const resolvedLabel =
    query.data?.canonicalName ?? nodeLabel ?? "carregando";

  let body: React.ReactNode;
  if (query.isPending) {
    body = (
      <LoadingView
        nodeLabel={nodeLabel}
        closeRef={closeRef}
        onClose={onClose}
      />
    );
  } else if (query.isError) {
    const variant = classifyError(query.error);
    body = (
      <ErrorView
        variant={variant}
        closeRef={closeRef}
        onClose={onClose}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  } else if (query.data !== undefined) {
    body = (
      <SuccessView
        data={query.data}
        closeRef={closeRef}
        curateButtonRef={curateButtonRef}
        onClose={onClose}
        curationTarget={curationTarget}
        onCurate={() => setDrawerOpen(true)}
      />
    );
  } else {
    body = (
      <LoadingView
        nodeLabel={nodeLabel}
        closeRef={closeRef}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      <GlassSurface
        level="panel"
        role="complementary"
        aria-label={`Detalhes do nó: ${resolvedLabel}`}
        ref={ref as React.Ref<HTMLDivElement>}
        onKeyDown={onKeyDown}
        data-testid="node-detail-panel"
        data-status={
          query.isPending
            ? "loading"
            : query.isError
              ? "error"
              : query.data !== undefined
                ? "success"
                : "loading"
        }
        className={cn(
          "flex h-full w-full flex-col min-h-0",
          "z-panel",
          className,
        )}
      >
        {body}
      </GlassSurface>
      {curationTarget !== null && (
        <CurationDrawer
          open={drawerOpen}
          onOpenChange={handleDrawerOpenChange}
          kind={curationTarget.kind}
          itemId={curationTarget.itemId}
          {...(query.data?.canonicalName !== undefined
            ? { itemLabel: query.data.canonicalName }
            : {})}
        />
      )}
    </>
  );
};
