/**
 * NodeDetailPanel — inline node detail panel for the GraphSpace pane (TC-FE-08).
 *
 * Renders inside the 60% right pane of `ChatWorkspace` when the user clicks
 * a node in `GraphSpace`. Fetches `GET /api/v1/nodes/:id` via
 * `useNodeDetail(nodeId)` and displays the canonical name, type, aliases,
 * and current attributes. NEVER opens a modal, drawer, or route change
 * (spec §1 + AC-F.20 / I-3).
 *
 * Structural unidirectionality (AC-U.3 / REQ-6):
 *  - This file does NOT import `useChatTurnStore`, `useSendMessage`, or
 *    anything from `@/features/chat`. The structural test in
 *    `__tests__/NodeDetailPanel.spec.tsx` scans the file source to confirm
 *    that — a regression that adds such an import fails the test loudly.
 *
 * States (spec §3):
 *  - Loading            → spinner + `nodeLabel` heading (if any)
 *  - Success            → name + type badge + status badge + aliases + table
 *  - Error 404          → "Nó não encontrado." (no retry)
 *  - Error 410          → "Este nó foi removido por conformidade." (no retry)
 *  - Error network/5xx  → "Não foi possível carregar os detalhes. Tente
 *                          novamente." + "Tentar novamente" button
 *
 * Accessibility (spec §8):
 *  - `role="complementary"` + `aria-label="Detalhes do nó: <label>"`.
 *  - Loading state announces "Carregando detalhes…" via `aria-live`.
 *  - Error state announces via `role="alert"`.
 *  - `Escape` fires `onClose`.
 *  - Close button receives focus on mount (so keyboard users can dismiss
 *    immediately, and screen-reader focus lands on a meaningful control).
 *
 * Why no `forwardRef`:
 *  - React 19 ref-as-prop. The `ref` lives on `NodeDetailPanelProps` and is
 *    forwarded directly to the root `<section>`.
 */
import { useEffect, useRef, type FC, type KeyboardEvent } from "react";
import { X, Loader2, AlertTriangle, Network } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { StateBadge } from "@/components/ds/StateBadge";
import { cn } from "@/lib/cn";
import { useNodeDetail } from "../../api/useNodeDetail";
import type { NodeDetailPanelProps } from "./NodeDetailPanel.types";

/* ---------- canonical pt-BR copy --------------------------------------- */
/**
 * Frozen pt-BR labels — no i18n layer (CLAUDE.md `i18n: false`). Exported as
 * a module constant so tests can import the same string instead of
 * duplicating it (`text-as-data` pattern, mirrors `GraphEmptyState`).
 */
export const NODE_DETAIL_COPY = Object.freeze({
  loading: "Carregando detalhes…",
  errorNotFound: "Nó não encontrado.",
  errorDeleted: "Este nó foi removido por conformidade.",
  errorGeneric: "Não foi possível carregar os detalhes. Tente novamente.",
  retry: "Tentar novamente",
  close: "Fechar detalhes do nó",
  aliasesHeading: "Aliases",
  attributesHeading: "Atributos",
  attrColKey: "Atributo",
  attrColValue: "Valor",
  attrColState: "Estado",
  noAttributes: "Nenhum atributo registrado.",
  noAliases: "Nenhum alias adicional.",
});

/* ---------- error code → state mapping --------------------------------- */
type ErrorVariant = "not-found" | "deleted" | "generic";

/**
 * Discriminate the error code from the BFF envelope. Codes are declared in
 * `docs/specs/domains/knowledge-graph/openapi.yaml` (404 RESOURCE_NOT_FOUND,
 * 410 BUSINESS_NODE_DELETED). Anything else falls through to the generic
 * variant — `SYSTEM_NETWORK`, `SYSTEM_TIMEOUT`, `SYSTEM_UPSTREAM`, etc.
 */
function classifyError(err: unknown): ErrorVariant {
  if (err === null || typeof err !== "object") return "generic";
  const code = (err as { code?: unknown }).code;
  if (code === "RESOURCE_NOT_FOUND") return "not-found";
  if (code === "BUSINESS_NODE_DELETED") return "deleted";
  return "generic";
}

/* ---------- header (shared across states) ------------------------------ */
interface PanelHeaderProps {
  title: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  /** Right-side adornment shown next to the title (badges, etc). */
  trailing?: React.ReactNode;
}

const PanelHeader: FC<PanelHeaderProps> = ({
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
        // `aria-label` covers screen readers; the lucide icon is decorative.
        aria-label={NODE_DETAIL_COPY.close}
        data-testid="node-detail-close"
        className={cn(
          "shrink-0 inline-flex items-center justify-center",
          // Hit target ≥ 32px (project floor; spec §8 mandates 44px on
          // mobile but the panel is desktop-only in v1 — the larger
          // floor applies via `min-w-11 min-h-11` if we ever lift the
          // gate). 32px keeps the visual mass restrained inside the panel.
          "size-8 rounded-md",
          "text-content hover:bg-elevated",
          "transition-colors",
          // Visible focus ring (WCAG 2.2 SC 2.4.11).
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
        )}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

/* ---------- loading state --------------------------------------------- */
interface LoadingViewProps {
  nodeLabel: string | undefined;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

const LoadingView: FC<LoadingViewProps> = ({
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
        <span
          // aria-live="polite" announces the load to assistive tech without
          // yanking focus from the close button (spec §8).
          aria-live="polite"
          className="text-body-sm text-content"
        >
          {NODE_DETAIL_COPY.loading}
        </span>
      </div>
    </>
  );
};

/* ---------- error states ---------------------------------------------- */
interface ErrorViewProps {
  variant: ErrorVariant;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onRetry: () => void;
}

const ErrorView: FC<ErrorViewProps> = ({
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
  // Only the generic (network / 5xx) variant gets a retry — 404/410 are
  // terminal per the spec §3 error rows.
  const showRetry = variant === "generic";
  return (
    <>
      <PanelHeader
        title={NODE_DETAIL_COPY.errorNotFound /* placeholder heading */}
        closeRef={closeRef}
        onClose={onClose}
      />
      <div
        className="flex flex-1 flex-col items-center justify-center gap-md p-lg text-center"
        // role="alert" announces the error immediately (spec §8). The whole
        // block is the live region so the message + optional retry button
        // are announced together.
        role="alert"
        data-testid="node-detail-error"
        data-variant={variant}
      >
        <AlertTriangle
          className={cn(
            "size-6 shrink-0",
            // Use the canonical danger token for the icon stroke so the
            // signal matches the surrounding glass accent.
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

/* ---------- success state --------------------------------------------- */
import type { NodeDetailView } from "../../api/node-detail.types";

interface SuccessViewProps {
  data: NodeDetailView;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

const SuccessView: FC<SuccessViewProps> = ({ data, closeRef, onClose }) => {
  return (
    <>
      <PanelHeader
        title={data.canonicalName}
        closeRef={closeRef}
        onClose={onClose}
        trailing={
          <>
            <span
              className="text-caption text-muted"
              data-testid="node-detail-type"
            >
              {data.nodeType}
            </span>
            {/* `data-testid` is not in StateBadge's props (the atom restricts
                its public API to the spec'd props), so we wrap it in a span
                with a stable testid for component tests to anchor against. */}
            <span data-testid="node-detail-status">
              <StateBadge state={data.badgeState} size="sm" />
            </span>
          </>
        }
      />
      {/* Scroll body — bounded by the panel; long attribute lists scroll
          inside the panel rather than pushing the canvas off-screen. */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-lg pb-lg"
        data-testid="node-detail-success"
      >
        {/* ---------- Aliases ---------------------------------------- */}
        <section className="mt-md">
          <h3 className="text-subheading text-content mb-sm">
            {NODE_DETAIL_COPY.aliasesHeading}
          </h3>
          {data.aliases.length === 0 ? (
            <p className="text-body-sm text-muted">
              {NODE_DETAIL_COPY.noAliases}
            </p>
          ) : (
            <ul
              aria-label={NODE_DETAIL_COPY.aliasesHeading}
              className="flex flex-col gap-xs"
              data-testid="node-detail-aliases"
            >
              {data.aliases.map((alias) => (
                <li
                  key={alias.id}
                  className="flex items-center gap-sm text-body-sm text-content"
                >
                  <span>{alias.alias}</span>
                  {alias.kind === "canonical" && (
                    <span className="text-caption text-muted">
                      (canônico)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Attributes ------------------------------------- */}
        <section className="mt-lg">
          <h3 className="text-subheading text-content mb-sm">
            {NODE_DETAIL_COPY.attributesHeading}
          </h3>
          {data.attributes.length === 0 ? (
            <p className="text-body-sm text-muted">
              {NODE_DETAIL_COPY.noAttributes}
            </p>
          ) : (
            <table
              className="w-full text-body-sm text-content"
              data-testid="node-detail-attributes"
            >
              <thead>
                <tr className="text-caption text-muted">
                  <th
                    scope="col"
                    className="text-left p-xs font-normal"
                  >
                    {NODE_DETAIL_COPY.attrColKey}
                  </th>
                  <th
                    scope="col"
                    className="text-left p-xs font-normal"
                  >
                    {NODE_DETAIL_COPY.attrColValue}
                  </th>
                  <th
                    scope="col"
                    className="text-left p-xs font-normal"
                  >
                    {NODE_DETAIL_COPY.attrColState}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.attributes.map((attr) => (
                  <tr
                    key={attr.id}
                    className="border-t border-border"
                    data-testid="node-detail-attribute-row"
                    data-in-effect={attr.isInEffect ? "true" : "false"}
                  >
                    <td className="p-xs align-top">{attr.key}</td>
                    <td className="p-xs align-top">
                      <span>{attr.value}</span>
                      {(attr.validFromLabel !== null ||
                        attr.validToLabel !== null) && (
                        <span className="block text-caption text-muted">
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
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
};

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

  // Spec §8 — focus the close button on mount so keyboard users can dismiss
  // immediately and screen-readers anchor on a meaningful control. The
  // `nodeId` dep re-focuses when the panel switches to a different node
  // without unmounting (e.g. parent swaps the selected id).
  useEffect(() => {
    closeRef.current?.focus();
  }, [nodeId]);

  // Escape closes — spec §8 / BDD Scenario 4. Attached to the panel root
  // (not document) so the listener auto-cleans when the panel unmounts.
  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  // Derive the aria-label using the best available name — known nodeLabel
  // first, then the resolved canonical name (after success). Falls back to
  // a static label if neither is available yet.
  const resolvedLabel =
    query.data?.canonicalName ?? nodeLabel ?? "carregando";

  // Choose the body content based on query state. We render INSIDE a
  // `GlassSurface level="panel"` regardless — the surface is the panel
  // identity, the body just swaps.
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
        onClose={onClose}
      />
    );
  } else {
    // Defensive: settled but no data (should not happen). Treat as loading.
    body = (
      <LoadingView
        nodeLabel={nodeLabel}
        closeRef={closeRef}
        onClose={onClose}
      />
    );
  }

  return (
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
        // Fill the parent (the ChatWorkspace right pane). `flex-col` so the
        // header sits above the scrollable body. `min-h-0` so the body's
        // `overflow-y-auto` actually kicks in inside the flex parent.
        "flex h-full w-full flex-col min-h-0",
        // Pull the panel above the canvas — ChatWorkspace mounts it as a
        // sibling overlay; the z-token keeps it above React Flow's stack.
        // `z-panel` is declared in styles/theme.css as a `@utility` per
        // the Tailwind-v4 z-index gotcha.
        "z-panel",
        className,
      )}
    >
      {body}
    </GlassSurface>
  );
};
