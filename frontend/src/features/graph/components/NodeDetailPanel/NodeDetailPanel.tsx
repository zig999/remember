/**
 * NodeDetailPanel — inline node detail panel for the GraphSpace pane.
 *
 * v1 (TC-FE-08) — fetches `GET /api/v1/nodes/:id` via `useNodeDetail(nodeId)`
 * and displays canonical name, type, aliases, and current attributes.
 *
 * v2 (dev_tc_001, progressive-disclosure wave) — exposes the full knowledge
 * chain through THREE phases:
 *   (A) attribute provenance inline (`attribute.provenance[]` already in
 *       the `getNodeById` payload — no extra fetch);
 *   (B) "Relações" section via `useNodeRelationships(nodeId)` (traverse
 *       depth=1) with inline link provenance;
 *   (C) lazy "Ver origem completa" disclosures backed by `useProvenance(
 *       kind, id)` — fired only when the user opens the `<details>`.
 *
 * Renders inside the 60% right pane of `ChatWorkspace`. NEVER opens a modal,
 * drawer, or route change (spec §1 + AC-F.20 / I-3).
 *
 * Structural unidirectionality (AC-U.3 / REQ-6):
 *  - No file in `features/graph/` imports from `@/features/chat`. A
 *    structural test in `__tests__/NodeDetailPanel.spec.tsx` scans the source
 *    files and fails on regression.
 *
 * Accessibility (§8):
 *  - `role="complementary"` + `aria-label="Detalhes do nó: <label>"`.
 *  - Loading state announces via `aria-live="polite"`.
 *  - Error state announces via `role="alert"`.
 *  - `Escape` fires `onClose`.
 *  - Close button receives focus on mount.
 *  - Disclosures use native `<details>`/`<summary>` — keyboard accessible.
 *
 * File-size constraint (§11):
 *  - This shell is intentionally kept short. The success body, attribute
 *    row, relationship row, relationships section, and Phase C chain live in
 *    sibling files.
 */
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

/* ---------- re-exports (preserve TC-FE-08 public surface) ------------- */

export { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
export { deriveCurationTarget } from "./NodeDetailPanel.curation";
export type { NodeCurationTarget } from "./NodeDetailPanel.curation";

/* ---------- root component --------------------------------------------- */

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

  // CurationDrawer open state (TC-07). Local — the drawer never changes the
  // URL (spec §3 row "CurationDrawer abre"), so the parent route is unaware.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Spec §8 — focus the close button on mount so keyboard users can dismiss
  // immediately. The `nodeId` dep re-focuses when the panel swaps nodes.
  useEffect(() => {
    closeRef.current?.focus();
  }, [nodeId]);

  // Restore focus to the trigger when the drawer closes (FL-CURATION-03 §7).
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

  // Escape closes (spec §8). Attached to the panel root so the listener
  // auto-cleans when the panel unmounts.
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
