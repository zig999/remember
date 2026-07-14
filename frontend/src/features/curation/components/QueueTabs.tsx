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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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

/**
 * Radix Tabs values are strings, but `QueueKindFilter` carries `undefined`
 * for the "Tudo" case. We map across that gap with a stable sentinel.
 */
const ALL_SENTINEL = "all";

interface TabDefinition {
  readonly id: QueueKindFilter;
  readonly label: string;
  readonly key: string;
}

const TABS: ReadonlyArray<TabDefinition> = [
  { id: undefined, label: "Tudo", key: ALL_SENTINEL },
  { id: "entity_match", label: "Entidades", key: "entity_match" },
  { id: "disputed", label: "Disputas", key: "disputed" },
];

function keyToFilter(key: string): QueueKindFilter {
  if (key === ALL_SENTINEL) return undefined;
  return key as ReviewQueueKind;
}

function filterToKey(value: QueueKindFilter): string {
  return value ?? ALL_SENTINEL;
}

/**
 * Tab filter using the standard Tabs component (Radix). The QueueList is
 * the tabpanel — owned by the parent, so we only render the trigger row
 * (TabsList/TabsTrigger) here; no TabsContent.
 */
export const QueueTabs: FC<QueueTabsProps> = ({ value, onChange }) => {
  return (
    <Tabs
      defaultValue={filterToKey(value)}
      value={filterToKey(value)}
      onValueChange={(next) => onChange(keyToFilter(next))}
      data-testid="curation-queue-tabs"
    >
      <TabsList aria-label="Filtrar fila por tipo">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} data-tab-key={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
