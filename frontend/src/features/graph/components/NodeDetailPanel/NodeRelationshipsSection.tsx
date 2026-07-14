/**
 * NodeRelationshipsSection — "Relações" section of `NodeDetailPanel`
 * (dev_tc_001, Phase B).
 *
 * Owns the `useNodeRelationships(nodeId)` call and renders the four states
 * declared in the spec:
 *  - loading            → spinner + live copy
 *  - empty (`links=[]`) → "Nenhuma relação encontrada."
 *  - error              → "Não foi possível carregar as relações." + retry
 *  - success            → `<ul>` of `NodeRelationshipRow`s
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §3
 *    (relationship states), §7 Scenario 2, §8 (a11y), §10 (errors).
 */
import { Loader2, AlertTriangle } from "lucide-react";
import type { FC } from "react";

import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import { NodeRelationshipRow } from "./NodeRelationshipRow";
import { useNodeRelationships } from "../../api";

export interface NodeRelationshipsSectionProps {
  readonly nodeId: string;
}

export const NodeRelationshipsSection: FC<NodeRelationshipsSectionProps> = ({
  nodeId,
}) => {
  const query = useNodeRelationships(nodeId);

  let body: React.ReactNode;
  if (query.isPending) {
    body = (
      <div
        className="flex items-center gap-sm p-sm"
        data-testid="node-detail-relationships-loading"
      >
        <Loader2
          className="size-4 shrink-0 animate-spin text-foreground"
          aria-hidden="true"
        />
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {NODE_DETAIL_COPY.relationshipsLoading}
        </span>
      </div>
    );
  } else if (query.isError) {
    body = (
      <div
        className="flex flex-col items-start gap-sm p-sm"
        role="alert"
        data-testid="node-detail-relationships-error"
      >
        <div className="flex items-center gap-xs text-xs text-foreground">
          <AlertTriangle
            className="size-4 text-warning"
            aria-hidden="true"
          />
          <span>{NODE_DETAIL_COPY.relationshipsError}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            void query.refetch();
          }}
          data-testid="node-detail-relationships-retry"
          className="min-h-8 inline-flex items-center px-md py-xs rounded-md text-xs text-primary-foreground bg-primary hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {NODE_DETAIL_COPY.relationshipsRetry}
        </button>
      </div>
    );
  } else if (query.data === undefined || query.data.links.length === 0) {
    body = (
      <p
        className="p-sm text-xs text-muted-foreground"
        data-testid="node-detail-relationships-empty"
      >
        {NODE_DETAIL_COPY.relationshipsEmpty}
      </p>
    );
  } else {
    body = (
      <ul
        className="flex flex-col gap-sm"
        data-testid="node-detail-relationships-list"
      >
        {query.data.links.map((l) => (
          <NodeRelationshipRow key={l.id} link={l} />
        ))}
      </ul>
    );
  }

  return (
    <section
      className="mt-lg"
      aria-label={NODE_DETAIL_COPY.relationshipsHeading}
      data-testid="node-detail-relationships"
      aria-busy={query.isPending ? "true" : "false"}
    >
      <h3 className="text-sm font-medium text-foreground mb-sm">
        {NODE_DETAIL_COPY.relationshipsHeading}
      </h3>
      {body}
    </section>
  );
};
