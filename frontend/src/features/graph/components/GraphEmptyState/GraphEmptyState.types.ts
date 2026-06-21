/**
 * GraphEmptyState — public type contract (TC-FE-07).
 *
 * Empty placeholder shown when `GraphStatus === "empty"`. Static pt-BR copy
 * per `GraphSpace.component.spec.md §3` and `temp/chat-graphspace-plan.md`
 * §6.7 (table) — "A memória aparecerá aqui conforme você conversa.".
 *
 * The component is purely presentational and accepts no required props.
 * `className` is forwarded for layout overrides — anything else is invented.
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §3 (states),
 *    §7 BDD Scenario 1.
 *  - temp/chat-graphspace-plan.md §6.7 GraphEmptyState row.
 */
import type { Ref } from "react";

export interface GraphEmptyStateProps {
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
  /** React 19 ref-as-prop on the root container. */
  ref?: Ref<HTMLDivElement>;
}
