/**
 * NodeDetailPanel — shell sub-pieces (header, loading view, error view).
 *
 * Split out of `NodeDetailPanel.tsx` to keep the main shell under the 300-line
 * cap mandated by spec §11. None of these components do data fetching;
 * branching on TanStack Query state remains in the root panel.
 */
import { Loader2, X, AlertTriangle, Network } from "lucide-react";
import type { FC } from "react";

import { cn } from "@/lib/cn";
import { NODE_DETAIL_COPY } from "./NodeDetailPanel.copy";

/* ---------- error code → state mapping --------------------------------- */
export type ErrorVariant = "not-found" | "deleted" | "generic";

/** Classify a top-level `useNodeDetail` error code into the state row to
 *  render. 404 / 410 are terminal — only `generic` gets a retry button. */
export function classifyError(err: unknown): ErrorVariant {
  if (err === null || typeof err !== "object") return "generic";
  const code = (err as { code?: unknown }).code;
  if (code === "RESOURCE_NOT_FOUND") return "not-found";
  if (code === "BUSINESS_NODE_DELETED") return "deleted";
  return "generic";
}

/* ---------- header (shared across states) ------------------------------ */
export interface PanelHeaderProps {
  title: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  trailing?: React.ReactNode;
}

export const PanelHeader: FC<PanelHeaderProps> = ({
  title,
  closeRef,
  onClose,
  trailing,
}) => {
  return (
    <header className="flex items-start gap-md p-lg pb-md">
      <div className="min-w-0 flex-1">
        <h2
          className="text-heading text-content truncate"
          data-testid="node-detail-title"
        >
          {title}
        </h2>
        {trailing !== undefined && (
          <div className="mt-sm flex flex-wrap items-center gap-sm">
            {trailing}
          </div>
        )}
      </div>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={NODE_DETAIL_COPY.close}
        data-testid="node-detail-close"
        className={cn(
          "shrink-0 inline-flex items-center justify-center",
          "size-8 rounded-md",
          "text-content hover:bg-elevated",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
        )}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

/* ---------- loading state --------------------------------------------- */
export interface LoadingViewProps {
  nodeLabel: string | undefined;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export const LoadingView: FC<LoadingViewProps> = ({
  nodeLabel,
  closeRef,
  onClose,
}) => {
  const title = nodeLabel ?? "";
  return (
    <>
      <PanelHeader title={title} closeRef={closeRef} onClose={onClose} />
      <div
        className="flex flex-1 items-center justify-center gap-sm p-lg"
        data-testid="node-detail-loading"
      >
        <Loader2
          className="size-5 shrink-0 animate-spin text-content"
          aria-hidden="true"
        />
        <span aria-live="polite" className="text-body-sm text-content">
          {NODE_DETAIL_COPY.loading}
        </span>
      </div>
    </>
  );
};

/* ---------- error states ---------------------------------------------- */
export interface ErrorViewProps {
  variant: ErrorVariant;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onRetry: () => void;
}

export const ErrorView: FC<ErrorViewProps> = ({
  variant,
  closeRef,
  onClose,
  onRetry,
}) => {
  const message =
    variant === "not-found"
      ? NODE_DETAIL_COPY.errorNotFound
      : variant === "deleted"
        ? NODE_DETAIL_COPY.errorDeleted
        : NODE_DETAIL_COPY.errorGeneric;
  const showRetry = variant === "generic";
  return (
    <>
      <PanelHeader
        title={NODE_DETAIL_COPY.errorNotFound}
        closeRef={closeRef}
        onClose={onClose}
      />
      <div
        className="flex flex-1 flex-col items-center justify-center gap-md p-lg text-center"
        role="alert"
        data-testid="node-detail-error"
        data-variant={variant}
      >
        <AlertTriangle
          className={cn(
            "size-6 shrink-0",
            variant === "generic" ? "text-warning" : "text-danger",
          )}
          aria-hidden="true"
        />
        <p className="text-body-sm text-content max-w-md">{message}</p>
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid="node-detail-retry"
            className={cn(
              "inline-flex items-center gap-xs px-md py-sm rounded-md",
              "text-body-sm text-content-inverse bg-action hover:bg-action-hover",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
            )}
          >
            <Network size={14} aria-hidden="true" />
            {NODE_DETAIL_COPY.retry}
          </button>
        )}
      </div>
    </>
  );
};
