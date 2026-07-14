/**
 * GraphNode — translucent knowledge-graph node (presentational).
 *
 * Source: front.md §7.1 ("each node renders as a React component … design system
 * reused"), frontend-analise-funcional.md §5.1 (type = color + icon; state coded
 * unambiguously). Composed from the design system:
 *   - GlassSurface (level="panel") → the translucent frosted material
 *   - NodeType → lucide icon + `text-node-*` color (the eye reads type first)
 *   - confidence state → GlassSurface `accent` (border + uncertain pulse) + StateBadge selo
 *
 * NO React Flow import here — this is the reusable visual. The React Flow adapter
 * (features/graph) adds `<Handle>`s and renders this. `animate={false}`: positioning
 * and entrance are owned by the graph (d3-force), not by the node.
 */
import type { FC } from "react";
import {
  User,
  Building2,
  Rocket,
  CalendarClock,
  IdCard,
  Tag,
  Lightbulb,
  MapPin,
  FileText,
  SquareCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface, type GlassAccent } from "@/components/ds/GlassSurface";
import { StateBadge, type ConfidenceState } from "@/components/ds/StateBadge";
import type { GraphNodeProps, GraphNodeType } from "./GraphNode.types";

interface TypeStyle {
  icon: LucideIcon;
  /** pt-BR type name (default subtitle). */
  label: string;
  /** full literal Tailwind class (so the v4 scanner keeps it). */
  color: string;
}

/** NodeType → icon + pt-BR label + color (canonical map, tokens.md §6.3). */
const NODE_STYLE: Readonly<Record<GraphNodeType, TypeStyle>> = Object.freeze({
  person: { icon: User, label: "Pessoa", color: "text-node-person" },
  organization: { icon: Building2, label: "Organização", color: "text-node-organization" },
  project: { icon: Rocket, label: "Projeto", color: "text-node-project" },
  event: { icon: CalendarClock, label: "Evento", color: "text-node-event" },
  role: { icon: IdCard, label: "Papel", color: "text-node-role" },
  category: { icon: Tag, label: "Categoria", color: "text-node-category" },
  concept: { icon: Lightbulb, label: "Conceito", color: "text-node-concept" },
  location: { icon: MapPin, label: "Local", color: "text-node-location" },
  document: { icon: FileText, label: "Documento", color: "text-node-document" },
  task: { icon: SquareCheck, label: "Tarefa", color: "text-node-task" },
});

/**
 * ConfidenceState → GlassSurface accent. Only the *attention* states color the
 * border; `accepted`/`low-confidence` are "active/normal" (front.md §5.1) and
 * fall through to the default theme-primary border (see `useDefaultBorder`).
 */
const STATE_ACCENT: Readonly<Record<ConfidenceState, GlassAccent>> = Object.freeze({
  accepted: "none",
  uncertain: "uncertain",
  "low-confidence": "none",
  disputed: "disputed",
  superseded: "superseded",
});

export const GraphNode: FC<GraphNodeProps> = ({
  type,
  label,
  state,
  subtitle,
  selected = false,
  className,
  ref,
}) => {
  const style = NODE_STYLE[type];
  const Icon = style.icon;
  const accent: GlassAccent = selected
    ? "focus"
    : state
      ? STATE_ACCENT[state]
      : "none";
  // Resting/default border is the GlassSurface panel's own glass edge
  // (`border-border-glass`) — no override here. Attention states (uncertain /
  // disputed / superseded) recolor it via `accent`; selected uses `focus`.

  return (
    <GlassSurface
      // forward ref only when present (GlassSurface's ref is non-undefined under
      // exactOptionalPropertyTypes)
      {...(ref ? { ref } : {})}
      level="panel"
      radius="rounded-lg"
      accent={accent}
      animate={false}
      role="group"
      aria-label={`${style.label}: ${label}`}
      className={cn(
        "inline-flex max-w-3xs items-center gap-sm px-md py-sm",
        selected && "ring-2 ring-border-focus",
        className,
      )}
    >
      <Icon className={cn("size-5 shrink-0", style.color)} aria-hidden="true" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium font-semibold leading-tight text-foreground">
          {label}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {subtitle ?? style.label}
        </span>
      </div>
      {state && (
        <StateBadge
          state={state}
          size="sm"
          iconOnly
          animate={false}
          className="ml-auto shrink-0"
        />
      )}
    </GlassSurface>
  );
};
