import type { FC } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { ReviewQueueKind } from "../types";

export type QueueKindFilter = ReviewQueueKind | undefined;

export interface QueueTabsProps {
  readonly value: QueueKindFilter;
  readonly onChange: (next: QueueKindFilter) => void;
}

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
