import { Loader2, AlertTriangle } from "lucide-react";
import type { FC } from "react";

import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";
import type { ProvenanceResponseView } from "../../api";

export type ProvenanceErrorVariant =
  | "not-found"
  | "deleted"
  | "generic"
  | "unknown";

export function classifyProvenanceError(err: unknown): ProvenanceErrorVariant {
  if (err === null || typeof err !== "object") return "unknown";
  const code = (err as { code?: unknown }).code;
  if (code === "RESOURCE_NOT_FOUND") return "not-found";
  if (code === "BUSINESS_RAW_INFORMATION_DELETED") return "deleted";
  if (typeof code === "string" && code.startsWith("SYSTEM_")) return "generic";
  return "unknown";
}

interface ChunkDetailsProps {
  readonly chunkIndex: number;
  readonly offsetRangeLabel: string;
  readonly excerpt: string;
  readonly sourceType: string;
  readonly receivedAtLabel: string;
  readonly title: string | null;
  readonly documentDateLabel: string | null;
  readonly originalInput: string | null | undefined;
}

const REDACTED_SENTINEL = "[REDACTED]";

const ChunkDetails: FC<ChunkDetailsProps> = ({
  chunkIndex,
  offsetRangeLabel,
  excerpt,
  sourceType,
  receivedAtLabel,
  title,
  documentDateLabel,
  originalInput,
}) => {
  return (
    <div
      className="flex flex-col gap-xs rounded-md border border-border bg-elevated p-sm"
      data-testid="node-provenance-chunk"
    >
      <div className="flex flex-wrap items-center gap-sm text-xs text-muted-foreground">
        <span data-testid="node-provenance-chunk-index">
          chunk #{chunkIndex}
        </span>
        <span aria-hidden="true">·</span>
        <span data-testid="node-provenance-offset">{offsetRangeLabel}</span>
      </div>
      <blockquote
        className="text-xs text-foreground border-l-2 border-border pl-sm"
        data-testid="node-provenance-excerpt"
      >
        {excerpt}
      </blockquote>
      <dl className="flex flex-wrap gap-x-md gap-y-xs text-xs text-muted-foreground">
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
      {typeof originalInput === "string" &&
        originalInput !== REDACTED_SENTINEL && (
          <details
            className="text-xs text-foreground"
            data-testid="node-provenance-original-input"
          >
            <summary className="cursor-pointer text-muted-foreground">
              {NODE_DETAIL_COPY.originalInputSummary}
            </summary>
            <p
              className="mt-xs whitespace-pre-wrap"
              data-testid="node-provenance-original-input-text"
            >
              {originalInput}
            </p>
          </details>
        )}
      {originalInput === REDACTED_SENTINEL && (
        <p
          className="text-xs text-muted-foreground italic"
          aria-label={NODE_DETAIL_COPY.originalInputRedactedAria}
          data-testid="node-provenance-original-input-redacted"
        >
          {NODE_DETAIL_COPY.originalInputRedacted}
        </p>
      )}
    </div>
  );
};

export interface NodeProvenanceChainProps {
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly data: ProvenanceResponseView | undefined;
  readonly onRetry: () => void;
}

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
          className="size-4 shrink-0 animate-spin text-foreground"
          aria-hidden="true"
        />
        <span aria-live="polite" className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-xs text-xs text-foreground">
          <AlertTriangle
            className={
              variant === "deleted" ? "size-4 text-warning" : "size-4 text-destructive"
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
            className="min-h-8 inline-flex items-center px-md py-xs rounded-md text-xs text-primary-foreground bg-primary hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {NODE_DETAIL_COPY.originRetry}
          </button>
        )}
      </div>
    );
  }

  if (data === undefined || data.fragments.length === 0) {
    return (
      <p
        className="p-sm text-xs text-muted-foreground"
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
          <header className="flex flex-wrap items-center gap-sm text-xs text-muted-foreground">
            <span data-testid="node-provenance-fragment-confidence">
              {frag.confidenceLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{frag.status}</span>
          </header>
          <p
            className="text-xs text-foreground"
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
              originalInput={chunk.rawInformation.originalInput}
            />
          ))}
        </article>
      ))}
    </div>
  );
};
