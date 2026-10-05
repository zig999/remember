import { useState, type FC } from "react";

import { StateBadge } from "@/components/ds/StateBadge";
import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import { NodeProvenanceChain } from "./NodeProvenanceChain";
import { useProvenance } from "../../api";
import type { NodeAttributeView, ProvenanceEntryView } from "../../api";

const COLSPAN = 3;

interface InlineProvenanceProps {
  readonly entries: ReadonlyArray<ProvenanceEntryView>;
}

const InlineProvenance: FC<InlineProvenanceProps> = ({ entries }) => {
  return (
    <details
      className="rounded-md border border-border bg-elevated"
      data-testid="attribute-inline-provenance"
    >
      <summary className="min-h-8 cursor-pointer px-sm py-xs text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {NODE_DETAIL_COPY.attributeProvenanceSummary(entries.length)}
      </summary>
      <ul className="flex flex-col gap-sm p-sm">
        {entries.map((p) => (
          <li
            key={p.fragmentId}
            className="flex flex-col gap-xs"
            data-testid="attribute-inline-provenance-entry"
          >
            <p className="text-xs text-foreground">{p.fragmentText}</p>
            <div className="flex flex-wrap items-center gap-sm text-xs text-muted-foreground">
              {p.confidenceLabel !== null && (
                <span data-testid="attribute-inline-provenance-confidence">
                  {p.confidenceLabel}
                </span>
              )}
              {p.sourceType !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span data-testid="attribute-inline-provenance-source">
                    {p.sourceType}
                  </span>
                </>
              )}
              {p.receivedAtLabel !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span data-testid="attribute-inline-provenance-received">
                    {p.receivedAtLabel}
                  </span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
};

interface LazyOriginProps {
  readonly attributeId: string;
}

const LazyOrigin: FC<LazyOriginProps> = ({ attributeId }) => {
  const [open, setOpen] = useState(false);
  const query = useProvenance("attributes", attributeId, open);

  return (
    <details
      className="rounded-md border border-border bg-elevated"
      data-testid="attribute-lazy-origin"
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

export interface NodeAttributeRowProps {
  readonly attr: NodeAttributeView;
}

export const NodeAttributeRow: FC<NodeAttributeRowProps> = ({ attr }) => {
  const provenance = attr.provenance ?? [];
  const hasInlineProvenance = provenance.length > 0;
  return (
    <>
      <tr
        className="border-t border-border"
        data-testid="node-detail-attribute-row"
        data-in-effect={attr.isInEffect ? "true" : "false"}
      >
        <td className="p-xs align-top">{attr.key}</td>
        <td className="p-xs align-top">
          <span>{attr.value}</span>
          {(attr.validFromLabel !== null || attr.validToLabel !== null) && (
            <span className="block text-xs text-muted-foreground">
              {attr.validFromLabel ?? "—"}
              {" → "}
              {attr.validToLabel ?? "—"}
            </span>
          )}
        </td>
        <td className="p-xs align-top">
          <StateBadge state={attr.state} size="sm" iconOnly />
        </td>
      </tr>
      <tr data-testid="node-detail-attribute-disclosure-row">
        <td colSpan={COLSPAN} className="p-xs pt-0">
          <div className="flex flex-col gap-xs">
            {hasInlineProvenance && (
              <InlineProvenance entries={provenance} />
            )}
            <LazyOrigin attributeId={attr.id} />
          </div>
        </td>
      </tr>
    </>
  );
};
