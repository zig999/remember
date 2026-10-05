import { useEffect, useRef, type FC } from "react";
import { AlertTriangle, FileText, Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface";
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
  const linkQ = useProvenanceByLink(itemKind === "link" ? itemId : undefined);
  const attrQ = useProvenanceByAttribute(
    itemKind === "attribute" ? itemId : undefined,
  );
  const active = itemKind === "link" ? linkQ : attrQ;
  const { data, isPending, isError, error } = active;

  const rawDeleted =
    isError && error instanceof EnvelopeError &&
    error.code === "BUSINESS_RAW_INFORMATION_DELETED";

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);
  const dataReady = !isPending && !isError && data !== undefined;

  useEffect(() => {
    if (!dataReady || firedRef.current) return;
    const el = sentinelRef.current;
    if (!el) return;

    function fire(): void {
      if (firedRef.current) return;
      firedRef.current = true;
      onEvidenceViewed();
    }

    function onFocus(): void {
      fire();
    }
    el.addEventListener("focusin", onFocus);

    let observer: IntersectionObserver | null = null;
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
          "flex items-start gap-md rounded-md border border-border bg-warning p-md text-foreground",
          className,
        )}
      >
        <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-xs">
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
          "flex items-start gap-md rounded-md border border-border-error p-md text-destructive",
          className,
        )}
      >
        <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-xs">Não foi possível carregar a evidência.</p>
      </section>
    );
  }

  const fragments = data?.fragments ?? [];
  if (fragments.length === 0) {
    return (
      <GlassSurface
        level="ambient"
        role="region"
        ref={sentinelRef}
        aria-label="Sem proveniência"
        tabIndex={0}
        className={cn(
          "flex items-start gap-md p-md text-body",
          className,
        )}
      >
        <p role="alert" className="text-xs">
          Nenhuma proveniência disponível.
        </p>
      </GlassSurface>
    );
  }

  return (
    <GlassSurface
      level="ambient"
      role="region"
      ref={sentinelRef}
      aria-label="Trilha de evidência"
      tabIndex={0}
      className={cn("flex flex-col gap-md p-md", className)}
    >
      {fragments.map((frag) => (
        <article
          key={frag.id}
          className="flex flex-col gap-sm rounded-md border border-border bg-surface-glass-panel p-md"
        >
          <header className="flex items-center gap-sm text-xs text-body">
            <Quote aria-hidden="true" className="size-4" />
            <span>Fragmento</span>
            <span aria-hidden="true">·</span>
            <span>confiança {(frag.confidence * 100).toFixed(0)}%</span>
          </header>
          <p className="text-xs text-foreground">{truncate(frag.text)}</p>
          {frag.chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="flex flex-col gap-xs border-t border-border pt-sm"
            >
              <p className="text-xs text-body">
                {formatSourceType(chunk.rawInformation.sourceType)} ·{" "}
                {formatDate(chunk.rawInformation.receivedAt)} · trecho{" "}
                {chunk.offsetStart}–{chunk.offsetEnd}
              </p>
              <p className="text-xs text-foreground">
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
    </GlassSurface>
  );
};
