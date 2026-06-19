/**
 * Footer — fixed bottom status bar (z-frame).
 *
 * Spec: frontend-analise-funcional.md §2 (status bar — health · as_of · curation
 * pending · active run), front.md §2/§2.2.
 *
 * Phase 2a: presentational. The `as_of` segment is fully wired to the client
 * store (+ a Popover date picker). The other three segments take their state via
 * props with neutral defaults — the live BFF hooks (useHealth / useCurationCount
 * / useActiveRun) are wired in Phase 2b. Hidden when there is nothing to show
 * (curation == 0, no active run), per the spec ("some quando zero").
 *
 * NOTE: writing `as_of` here calls the store directly (in-memory). The canonical
 * write is `navigate({ search: { as_of } })` (front.md §3.2, URL is source of
 * truth) — to be swapped in when the routing search-schema lands.
 */
import { Link } from "@tanstack/react-router";
import { Clock, Scale, Upload } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsOfStore } from "@/state/as-of";

export type HealthStatus = "ok" | "down" | "checking";

export interface FooterProps {
  className?: string;
  /** System health (BFF /health). Defaults to "checking" until wired (2b). */
  health?: HealthStatus;
  /** Curation queue total (entity_match + disputed). Hidden when 0. */
  curationPending?: number;
  /** Active ingestion run, if any. Hidden when null. */
  activeRun?: { label: string } | null;
}

const HEALTH: Readonly<Record<HealthStatus, { dot: string; label: string }>> =
  Object.freeze({
    ok: { dot: "bg-state-accepted", label: "online" },
    down: { dot: "bg-danger", label: "banco inacessível" },
    checking: { dot: "bg-muted", label: "verificando…" },
  });

function formatAsOf(asOf: Date | null): string {
  return asOf ? asOf.toLocaleDateString("pt-BR") : "hoje";
}

export function Footer({
  className,
  health = "checking",
  curationPending = 0,
  activeRun = null,
}: FooterProps) {
  const asOf = useAsOfStore((s) => s.asOf);
  const setAsOf = useAsOfStore((s) => s.set);
  const h = HEALTH[health];

  return (
    <GlassSurface
      level="ambient"
      role="contentinfo"
      aria-label="Rodapé"
      className={cn(
        "fixed inset-x-0 bottom-0 z-frame flex h-8 items-center gap-md px-lg text-caption text-muted",
        className,
      )}
    >
      {/* System health */}
      <span className="inline-flex items-center gap-xs" data-testid="footer-health">
        <span className={cn("size-2 rounded-pill", h.dot)} aria-hidden="true" />
        {h.label}
      </span>

      {/* Temporal cursor (as_of) */}
      <span className="border-l border-border pl-md">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-xs rounded-sm px-1 text-caption text-body transition-colors hover:text-content"
            >
              <Clock className="size-3" aria-hidden="true" /> Como em: {formatAsOf(asOf)}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <p className="text-label font-semibold text-content">Recorte temporal</p>
            <p className="mt-xs text-body-sm text-muted">
              Veja o que era verdade numa data (as_of).
            </p>
            <Input
              type="date"
              aria-label="Data do recorte"
              className="mt-md"
              value={asOf ? asOf.toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                setAsOf(e.target.value ? new Date(e.target.value) : null)
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-sm w-full"
              onClick={() => setAsOf(null)}
            >
              Voltar para hoje
            </Button>
          </PopoverContent>
        </Popover>
      </span>

      {/* Curation pending — hidden when zero */}
      {curationPending > 0 && (
        <Link
          to="/curation"
          className="inline-flex items-center gap-xs border-l border-border pl-md text-caption text-body transition-colors hover:text-content"
        >
          <Scale className="size-3" aria-hidden="true" /> {curationPending} pendentes
        </Link>
      )}

      {/* Active run — hidden when idle */}
      {activeRun && (
        <Link
          to="/history"
          className="ml-auto inline-flex items-center gap-xs text-caption text-data transition-colors hover:text-content"
        >
          <Upload className="size-3 animate-pulse" aria-hidden="true" /> {activeRun.label}
        </Link>
      )}
    </GlassSurface>
  );
}
