/**
 * NodeRelationshipRow — single relationship row with progressive disclosure
 * (dev_tc_001, Phases B inline + C lazy).
 *
 * Renders as a `<li>` inside the "Relações" `<ul>` of `NodeDetailPanel`. The
 * row shows direction arrow, link type, neighbor name, confidence,
 * temporal/effective-status badge, and two stacked disclosures:
 *  - "Proveniência do link" — inline `link.provenance[]` (no extra fetch).
 *  - "Ver origem completa" — lazy `useProvenance('links', linkId)`, enabled
 *    only when expanded.
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §3 / §7 /
 *    §8 / §9.
 */
import { useState, type FC } from "react";

import { StateBadge } from "@/components/ds/StateBadge";
import { mapAttributeStatusToBadge } from "../../api/_transforms";
import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import { NodeProvenanceChain } from "./NodeProvenanceChain";
import { useProvenance } from "../../api";
import type { ProvenanceEntryView, TraversalLinkView } from "../../api";

/* ---------- Phase B — inline link provenance ---------- */

interface LinkInlineProvenanceProps {
  readonly entries: ReadonlyArray<ProvenanceEntryView>;
}

const LinkInlineProvenance: FC<LinkInlineProvenanceProps> = ({ entries }) => {
  return (
    <details
      className="rounded-md border border-border bg-elevated"
      data-testid="link-inline-provenance"
    >
      <summary className="min-h-8 cursor-pointer px-sm py-xs text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {NODE_DETAIL_COPY.linkProvenanceSummary(entries.length)}
      </summary>
      <ul className="flex flex-col gap-sm p-sm">
        {entries.map((p) => (
          <li
            key={p.fragmentId}
            className="flex flex-col gap-xs"
            data-testid="link-inline-provenance-entry"
          >
            <p className="text-xs text-foreground">{p.fragmentText}</p>
            <div className="flex flex-wrap items-center gap-sm text-xs text-muted-foreground">
              {p.confidenceLabel !== null && (
                <span>{p.confidenceLabel}</span>
              )}
              {p.sourceType !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{p.sourceType}</span>
                </>
              )}
              {p.receivedAtLabel !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{p.receivedAtLabel}</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
};

/* ---------- Phase C — lazy full origin (link) ---------- */

interface LazyLinkOriginProps {
  readonly linkId: string;
}

const LazyLinkOrigin: FC<LazyLinkOriginProps> = ({ linkId }) => {
  const [open, setOpen] = useState(false);
  const query = useProvenance("links", linkId, open);
  return (
    <details
      className="rounded-md border border-border bg-elevated"
      data-testid="link-lazy-origin"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="min-h-8 cursor-pointer px-sm py-xs text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {NODE_DETAIL_COPY.originSummary}
      </summary>
      {open && (
        <NodeProvenanceChain
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          data={query.data}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
    </details>
  );
};

/* ---------- public component ---------- */

export interface NodeRelationshipRowProps {
  readonly link: TraversalLinkView;
}

export const NodeRelationshipRow: FC<NodeRelationshipRowProps> = ({ link }) => {
  // The wire AssertionStatus enum doesn't include "active" — we pass
  // "accepted" (the closest analogue for a live link) since the row only
  // surfaces the effective status badge; the inner assertion status is not
  // consumed at the row level beyond the disputed/superseded fallback.
  const badgeState = mapAttributeStatusToBadge(link.effectiveStatus, "accepted");
  const directionSr =
    link.direction === "outgoing"
      ? NODE_DETAIL_COPY.directionOutgoingSr
      : NODE_DETAIL_COPY.directionIncomingSr;
  const provenance = link.provenance ?? [];
  const hasInlineProvenance = provenance.length > 0;

  return (
    <li
      className="flex flex-col gap-xs rounded-md border border-border p-sm"
      data-testid="node-detail-relationship-row"
      data-direction={link.direction}
    >
      <div className="flex flex-wrap items-center gap-sm">
        <span
          className="text-xs font-medium text-foreground"
          aria-hidden="true"
          data-testid="node-detail-relationship-arrow"
        >
          {link.directionArrow}
        </span>
        <span className="sr-only">{directionSr}</span>
        <span
          className="text-xs text-foreground"
          data-testid="node-detail-relationship-type"
        >
          {link.directionLabel}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span
          className="text-xs text-foreground font-medium"
          data-testid="node-detail-relationship-neighbor"
        >
          {link.neighborName}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span
          className="text-xs text-muted-foreground"
          data-testid="node-detail-relationship-confidence"
        >
          {link.confidenceLabel}
        </span>
        <span data-testid="node-detail-relationship-status">
          <StateBadge state={badgeState} size="sm" iconOnly />
        </span>
      </div>
      {(link.validFromLabel !== null || link.validToLabel !== null) && (
        <div className="text-xs text-muted-foreground">
          {link.validFromLabel ?? "—"}
          {" → "}
          {link.validToLabel ?? "—"}
        </div>
      )}
      <div className="flex flex-col gap-xs">
        {hasInlineProvenance && (
          <LinkInlineProvenance entries={provenance} />
        )}
        <LazyLinkOrigin linkId={link.id} />
      </div>
    </li>
  );
};
