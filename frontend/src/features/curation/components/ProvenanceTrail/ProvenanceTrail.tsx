/**
 * ProvenanceTrail — evidence panel rendering fragment → chunk → raw_info
 * for the currently selected curation item (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §1 (consumes getProvenanceByLink /
 *    getProvenanceByAttribute), §2 UI-02 (skeleton while loading),
 *    UI-03 (evidenceViewed gate), §6 (BUSINESS_RAW_INFORMATION_DELETED
 *    inline warning, role=alert, blocks decision-bar), §8 (a11y).
 *  - Hooks come from TC-03 (`features/curation/api/provenance.hooks.ts`).
 *
 * Evidence-viewed tracking:
 *   The trail fires `onEvidenceViewed()` exactly once per mount, the FIRST
 *   time either of these happens:
 *     1. The root sentinel enters the viewport (IntersectionObserver,
 *        threshold 0.25 — enough surface visible to count as "viewing").
 *     2. The root receives keyboard focus (Tab navigation lands on it).
 *   Both events are wired so screen-reader users (who may not scroll) can
 *   still arm the DecisionBar.
 *
 * Why an IntersectionObserver and not a scroll listener: the trail can sit
 * inside a scroll container (drawer, drawer-inside-page) or be visible from
 * the get-go (when the panel is taller than the viewport already). A scroll
 * listener would miss the "already visible" case; IO fires on both mount
 * AND scroll, with a configurable threshold.
 *
 * Reused in TC-07's CurationDrawer — keeps the component decoupled from
 * curationStore (callback prop instead of direct store write).
 */
import { useEffect, useRef, type FC } from "react";
import { AlertTriangle, FileText, Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import { EnvelopeError } from "@/lib/http";
import {
  useProvenanceByLink,
  useProvenanceByAttribute,
} from "../../api/provenance.hooks";
import type { ProvenanceTrailProps } from "./ProvenanceTrail.types";

const IO_THRESHOLD = 0.25;

const SOURCE_TYPE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  document: "Documento",
  email: "E-mail",
  meeting: "Reunião",
  chat: "Conversa",
  article: "Artigo",
  transcript: "Transcrição",
});

function formatSourceType(t: string): string {
  return SOURCE_TYPE_LABELS[t] ?? t;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

/** Format a chunk excerpt for the trail. Keeps it short — the user can
 *  click "Abrir no documento" to see the full chunk. */
function truncate(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export const ProvenanceTrail: FC<ProvenanceTrailProps> = ({
  itemKind,
  itemId,
  onEvidenceViewed,
  className,
}) => {
  // Both hooks are called unconditionally (React rules of hooks) — TanStack
  // Query is disabled internally when its id is empty.
  const linkQ = useProvenanceByLink(itemKind === "link" ? itemId : undefined);
  const attrQ = useProvenanceByAttribute(
    itemKind === "attribute" ? itemId : undefined,
  );
  const active = itemKind === "link" ? linkQ : attrQ;
  const { data, isPending, isError, error } = active;

  // Detect the compliance-tombstone case explicitly — keeps the
  // decision-bar gate closed (caller never sees onEvidenceViewed).
  const rawDeleted =
    isError && error instanceof EnvelopeError &&
    error.code === "BUSINESS_RAW_INFORMATION_DELETED";

  // ---- evidence-viewed tracking ----
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);
  const dataReady = !isPending && !isError && data !== undefined;

  useEffect(() => {
    // Only observe when there IS evidence to view (compliance tombstone
    // case must keep the gate closed — see spec §6 row).
    if (!dataReady || firedRef.current) return;
    const el = sentinelRef.current;
    if (!el) return;

    function fire(): void {
      if (firedRef.current) return;
      firedRef.current = true;
      onEvidenceViewed();
    }

    // Focus path — keyboard users who land on the region via Tab arm the
    // gate even without scrolling. Use capture so a focused descendant
    // also counts (e.g. an internal "Abrir no documento" link).
    function onFocus(): void {
      fire();
    }
    el.addEventListener("focusin", onFocus);

    let observer: IntersectionObserver | null = null;
    // IO availability: jsdom does not implement it. Treat absence as
    // "rely on focus only" rather than crashing in tests.
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              fire();
              return;
            }
          }
        },
        { threshold: IO_THRESHOLD },
      );
      observer.observe(el);
    }

    return () => {
      el.removeEventListener("focusin", onFocus);
      if (observer) observer.disconnect();
    };
  }, [dataReady, onEvidenceViewed]);

  // -------- render branches --------

  if (isPending) {
    return (
      <section
        aria-busy="true"
        aria-label="Carregando evidência"
        className={cn("flex flex-col gap-md p-md", className)}
      >
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-surface" />
        <div className="h-20 w-full animate-pulse rounded-md bg-surface" />
        <div className="h-20 w-full animate-pulse rounded-md bg-surface" />
      </section>
    );
  }

  if (rawDeleted) {
    return (
      <section
        role="alert"
        aria-label="Proveniência indisponível"
        className={cn(
          "flex items-start gap-md rounded-md border border-border bg-warning p-md text-content",
          className,
        )}
      >
        <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-body-sm">
          A fonte original foi excluída por conformidade. Sem proveniência
          disponível.
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        role="alert"
        aria-label="Erro ao carregar proveniência"
        className={cn(
          "flex items-start gap-md rounded-md border border-border-error p-md text-danger",
          className,
        )}
      >
        <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-body-sm">Não foi possível carregar a evidência.</p>
      </section>
    );
  }

  // dataReady — render the trail
  const fragments = data?.fragments ?? [];
  if (fragments.length === 0) {
    return (
      <section
        ref={sentinelRef}
        role="alert"
        aria-label="Sem proveniência"
        tabIndex={0}
        className={cn(
          "flex items-start gap-md rounded-md border border-border bg-surface p-md text-body",
          className,
        )}
      >
        <p className="text-body-sm">Nenhuma proveniência disponível.</p>
      </section>
    );
  }

  return (
    <section
      ref={sentinelRef}
      aria-label="Trilha de evidência"
      tabIndex={0}
      className={cn("flex flex-col gap-md p-md", className)}
    >
      {fragments.map((frag) => (
        <article
          key={frag.id}
          className="flex flex-col gap-sm rounded-md border border-border bg-surface p-md"
        >
          <header className="flex items-center gap-sm text-body-sm text-body">
            <Quote aria-hidden="true" className="size-4" />
            <span>Fragmento</span>
            <span aria-hidden="true">·</span>
            <span>confiança {(frag.confidence * 100).toFixed(0)}%</span>
          </header>
          <p className="text-body-sm text-content">{truncate(frag.text)}</p>
          {frag.chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="flex flex-col gap-xs border-t border-border pt-sm"
            >
              <p className="text-caption text-body">
                {formatSourceType(chunk.rawInformation.sourceType)} ·{" "}
                {formatDate(chunk.rawInformation.receivedAt)} · trecho{" "}
                {chunk.offsetStart}–{chunk.offsetEnd}
              </p>
              <p className="text-body-sm text-content">
                <FileText
                  aria-hidden="true"
                  className="mr-xs inline size-3 align-text-bottom"
                />
                {truncate(chunk.excerpt, 200)}
              </p>
            </div>
          ))}
        </article>
      ))}
    </section>
  );
};
