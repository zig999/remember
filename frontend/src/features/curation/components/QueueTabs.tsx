/**
 * QueueTabs — filters QueueList by `kind` (TC-04).
 *
 * Three buttons: Tudo · Entidades · Disputas. Controlled component —
 * the parent CurationPage owns the active filter and persists it in URL
 * search (`?queue=` is reserved for a later TC; for now the filter is
 * page-local state).
 *
 * Accessibility: implemented as a tablist (`role="tablist"`). Each tab
 * is `role="tab"` with `aria-selected`. The associated tabpanel is the
 * QueueList itself; the parent wires `aria-controls` if needed.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { ReviewQueueKind } from "../types";

/** `undefined` means "Tudo" (both queues). Keep the value space narrow
 *  so future changes do not introduce a fourth tab without a CR. */
export type QueueKindFilter = ReviewQueueKind | undefined;

export interface QueueTabsProps {
  /** Active filter. `undefined` = Tudo. */
  readonly value: QueueKindFilter;
  /** Fires when the curator picks a new tab. */
  readonly onChange: (next: QueueKindFilter) => void;
}

interface TabDefinition {
  readonly id: QueueKindFilter;
  readonly label: string;
  readonly key: string;
}

const TABS: ReadonlyArray<TabDefinition> = [
  { id: undefined, label: "Tudo", key: "all" },
  { id: "entity_match", label: "Entidades", key: "entity_match" },
  { id: "disputed", label: "Disputas", key: "disputed" },
];

export const QueueTabs: FC<QueueTabsProps> = ({ value, onChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Filtrar fila por tipo"
      data-testid="curation-queue-tabs"
      className="flex items-center gap-xs border-b border-border"
    >
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            type="button"
            key={tab.key}
            role="tab"
            aria-selected={active}
            data-tab-key={tab.key}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-md py-sm text-body-sm",
              "border-b-2 border-transparent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
              active
                ? "border-border-focus text-content"
                : "text-muted hover:text-content",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
