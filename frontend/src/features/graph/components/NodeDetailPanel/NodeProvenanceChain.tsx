/**
 * NodeProvenanceChain — Phase C "Ver origem completa" body (dev_tc_001).
 *
 * Renders a `ProvenanceResponse` (Phase C lazy fetch result) inside a
 * `<details>` body. Used by both `NodeAttributeRow` and
 * `NodeRelationshipRow` — kept here as a shared, presentational component
 * with no data layer of its own.
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §3 — lazy
 *    provenance loading / error / tombstoned states.
 *  - §9 — Phase C transforms: `chunk_index`, `offset_start–offset_end`,
 *    `excerpt`, RawInformation metadata (source_type, received_at, title,
 *    document_date).
 *  - §10 — error → UI mapping (404 / 410 / 500).
 *
 * Accessibility (§8):
 *  - When loading: `aria-busy="true"` on the body and a live region.
 *  - When error: `role="alert"` on the error notice.
 *  - 410 (tombstoned) is permanent — no retry button.
 */
import { Loader2, AlertTriangle } from "lucide-react";
import type { FC } from "react";

import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import type { ProvenanceResponseView } from "../../api";

/* ---------- error classification ---------- */

/** Error variants surfaced inside the Phase C disclosure body. */
export type ProvenanceErrorVariant =
  | "not-found"
  | "deleted"
  | "generic"
  | "unknown";

/**
 * Classify a Phase C fetch error into the variant the body renders.
 * Codes are namespaced (`RESOURCE_NOT_FOUND`, `BUSINESS_RAW_INFORMATION_DELETED`,
 * `SYSTEM_*`). Anything else falls back to `generic`.
 *
 * Exported for direct unit-test coverage so a regression that flips a code
 * surface (e.g. tombstone → not-found) is caught by the transforms tests
 * rather than only the panel integration tests.
 */
export function classifyProvenanceError(err: unknown): ProvenanceErrorVariant {
  if (err === null || typeof err !== "object") return "unknown";
  const code = (err as { code?: unknown }).code;
  if (code === "RESOURCE_NOT_FOUND") return "not-found";
  if (code === "BUSINESS_RAW_INFORMATION_DELETED") return "deleted";
  if (typeof code === "string" && code.startsWith("SYSTEM_")) return "generic";
  return "unknown";
}

/* ---------- presentational sub-pieces ---------- */

interface ChunkDetailsProps {
  readonly chunkIndex: number;
  readonly offsetRangeLabel: string;
  readonly excerpt: string;
  readonly sourceType: string;
  readonly receivedAtLabel: string;
  readonly title: string | null;
  readonly documentDateLabel: string | null;
}

const ChunkDetails: FC<ChunkDetailsProps> = ({
  chunkIndex,
  offsetRangeLabel,
  excerpt,
  sourceType,
  receivedAtLabel,
  title,
  documentDateLabel,
}) => {
  return (
    <div
      className="flex flex-col gap-xs rounded-md border border-border bg-elevated p-sm"
      data-testid="node-provenance-chunk"
    >
      <div className="flex flex-wrap items-center gap-sm text-caption text-muted">
        <span data-testid="node-provenance-chunk-index">
          chunk #{chunkIndex}
        </span>
        <span aria-hidden="true">·</span>
        <span data-testid="node-provenance-offset">{offsetRangeLabel}</span>
      </div>
      <blockquote
        className="text-body-sm text-content border-l-2 border-border pl-sm"
        data-testid="node-provenance-excerpt"
      >
        {excerpt}
      </blockquote>
      <dl className="flex flex-wrap gap-x-md gap-y-xs text-caption text-muted">
        <div className="flex gap-xs">
          <dt className="font-medium">Tipo:</dt>
          <dd>{sourceType}</dd>
        </div>
        <div className="flex gap-xs">
          <dt className="font-medium">Recebido em:</dt>
          <dd>{receivedAtLabel}</dd>
        </div>
        {title !== null && (
          <div className="flex gap-xs">
            <dt className="font-medium">Título:</dt>
            <dd>{title}</dd>
          </div>
        )}
        {documentDateLabel !== null && (
          <div className="flex gap-xs">
            <dt className="font-medium">Data do documento:</dt>
            <dd>{documentDateLabel}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};

/* ---------- public component ---------- */

export interface NodeProvenanceChainProps {
  /** TanStack Query state — `isPending` toggles the loading body. */
  readonly isPending: boolean;
  /** TanStack Query state — `isError` toggles the error body. */
  readonly isError: boolean;
  readonly error: unknown;
  readonly data: ProvenanceResponseView | undefined;
  /** Retry handler — only invoked for the generic variant. */
  readonly onRetry: () => void;
}

/**
 * Renders the body of a "Ver origem completa" `<details>` based on the
 * Phase C query state. The `<details>` element itself is owned by the
 * caller (so the open/closed state lives where the user toggles it).
 */
export const NodeProvenanceChain: FC<NodeProvenanceChainProps> = ({
  isPending,
  isError,
  error,
  data,
  onRetry,
}) => {
  if (isPending) {
    return (
      <div
        className="flex items-center gap-sm p-sm"
        aria-busy="true"
        data-testid="node-provenance-loading"
      >
        <Loader2
          className="size-4 shrink-0 animate-spin text-content"
          aria-hidden="true"
        />
        <span aria-live="polite" className="text-body-sm text-muted">
          {NODE_DETAIL_COPY.originLoading}
        </span>
      </div>
    );
  }

  if (isError) {
    const variant = classifyProvenanceError(error);
    const message =
      variant === "deleted"
        ? NODE_DETAIL_COPY.originDeleted
        : variant === "not-found"
          ? NODE_DETAIL_COPY.originNotFound
          : NODE_DETAIL_COPY.originError;
    const showRetry = variant !== "deleted";
    return (
      <div
        className="flex flex-col items-start gap-sm p-sm"
        role="alert"
        data-testid="node-provenance-error"
        data-variant={variant}
      >
        <div className="flex items-center gap-xs text-body-sm text-content">
          <AlertTriangle
            className={
              variant === "deleted" ? "size-4 text-warning" : "size-4 text-danger"
            }
            aria-hidden="true"
          />
          <span>{message}</span>
        </div>
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid="node-provenance-retry"
            className="min-h-8 inline-flex items-center px-md py-xs rounded-md text-body-sm text-content-inverse bg-action hover:bg-action-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            {NODE_DETAIL_COPY.originRetry}
          </button>
        )}
      </div>
    );
  }

  // Success — render the fragments / chunks list. Defensive: if `data` is
  // missing despite settled state, render an empty body rather than crashing.
  if (data === undefined || data.fragments.length === 0) {
    return (
      <p
        className="p-sm text-body-sm text-muted"
        data-testid="node-provenance-empty"
      >
        {NODE_DETAIL_COPY.originNotFound}
      </p>
    );
  }

  return (
    <div
      className="flex flex-col gap-sm p-sm"
      data-testid="node-provenance-body"
    >
      {data.fragments.map((frag) => (
        <article
          key={frag.id}
          className="flex flex-col gap-xs"
          data-testid="node-provenance-fragment"
        >
          <header className="flex flex-wrap items-center gap-sm text-caption text-muted">
            <span data-testid="node-provenance-fragment-confidence">
              {frag.confidenceLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{frag.status}</span>
          </header>
          <p
            className="text-body-sm text-content"
            data-testid="node-provenance-fragment-text"
          >
            {frag.text}
          </p>
          {frag.chunks.map((chunk) => (
            <ChunkDetails
              key={chunk.id}
              chunkIndex={chunk.chunkIndex}
              offsetRangeLabel={chunk.offsetRangeLabel}
              excerpt={chunk.excerpt}
              sourceType={chunk.rawInformation.sourceType}
              receivedAtLabel={chunk.rawInformation.receivedAtLabel}
              title={chunk.rawInformation.title}
              documentDateLabel={chunk.rawInformation.documentDateLabel}
            />
          ))}
        </article>
      ))}
    </div>
  );
};
