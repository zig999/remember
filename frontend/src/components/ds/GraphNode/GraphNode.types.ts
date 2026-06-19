/**
 * GraphNode — public type contract.
 *
 * Presentational knowledge-graph node (front.md §7.1, frontend-analise-funcional.md §5.1).
 * NO React Flow dependency — it is the reusable visual. The React Flow custom-node
 * adapter (`features/graph`, adds `<Handle>`) wraps this and maps `data → props`.
 */
import type { Ref } from "react";
import type { ConfidenceState } from "@/components/ds/StateBadge";

/** The 10 normative NodeTypes (remember-modelagem-v7 §15.1 / tokens.md §6.3). */
export type GraphNodeType =
  | "person"
  | "organization"
  | "project"
  | "event"
  | "role"
  | "category"
  | "concept"
  | "location"
  | "document"
  | "task";

export interface GraphNodeProps {
  /** NodeType — drives the lucide icon + accent color. */
  type: GraphNodeType;
  /** Entity name (primary label). */
  label: string;
  /** Confidence state — colored glass accent border + StateBadge selo. */
  state?: ConfidenceState;
  /** Override the subtitle (defaults to the pt-BR type name). */
  subtitle?: string;
  /** Selected (React Flow passes this) — focus ring + focus accent. */
  selected?: boolean;
  /** Extra classes merged via `cn()`. */
  className?: string;
  /** React 19 ref-as-prop — forwarded to the GlassSurface root. */
  ref?: Ref<HTMLDivElement>;
}
