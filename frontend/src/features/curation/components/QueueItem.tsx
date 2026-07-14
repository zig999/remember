/**
 * QueueItem — single row in the review-queue list (TC-04).
 *
 * Renders ONE `ReviewQueueItem` (entity_match or disputed) with:
 *   - kind+state badge (via StateBadge, see adapter in feature.spec §7)
 *   - canonical scope/name
 *   - relative "Há Ns" timestamp
 *
 * Accessibility (curadoria.feature.spec.md §8):
 *   - `role="option"` (parent QueueList is `role="listbox"`)
 *   - `aria-selected` when this item is `selectedItem`
 *   - `aria-current="true"` while it sits in the DecisionPanel
 *
 * Why a plain `<button>` (not a `<li>` + onClick): screen readers
 * announce listbox options just fine without the implicit semantics of
 * `<li>` — and `<button>` gives us Enter/Space activation for free.
 * The role=option override turns it into an option for the parent
 * listbox.
 */
import { useMemo, type FC, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge/StateBadge";
import type { ReviewQueueItem } from "../types";
import type { SelectedItem } from "../state/curation-store";

export interface QueueItemProps {
  /** The wire item to render. */
  readonly item: ReviewQueueItem;
  /** Compact key (kind:id) used for selection, deep-link, and React key. */
  readonly itemKey: SelectedItem;
  /** Is this item the active selection (in DecisionPanel)? */
  readonly selected: boolean;
  /** Fires when the row is clicked / Enter-activated. */
  readonly onSelect: (item: SelectedItem) => void;
}

/**
 * Pretty-print a Date into a coarse pt-BR "Há …" relative label. Buckets
 * are intentionally coarse: the queue is volatile (refetches every 30s)
 * and the user does not need seconds-precision — only "fresh" vs "stale".
 */
function formatRelative(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} d`;
  return date.toLocaleDateString("pt-BR");
}

/**
 * Derive the StateBadge `state` from the queue item kind. Mirrors the
 * adapter table in feature.spec §7 — kept as a tiny helper so the QA
 * tests can pin the mapping in one place. `needs-review` is rendered via
 * the "uncertain" StateBadge state until StateBadge.spec adds an
 * explicit `needs-review` member (see §7 TO-CONFIRM).
 */
function mapKindToBadge(kind: ReviewQueueItem["kind"]): {
  readonly state: "uncertain" | "disputed";
  readonly label: string;
} {
  if (kind === "entity_match") {
    return { state: "uncertain", label: "Para revisar" };
  }
  return { state: "disputed", label: "Disputado" };
}

/**
 * Compose a short textual scope to show alongside the badge. Stays
 * defensive against partial data: entity_match always has a canonical
 * name; disputed has scope.linkType / attributeKey but never both.
 */
function describeScope(item: ReviewQueueItem): string {
  if (item.kind === "entity_match") {
    return item.canonicalName;
  }
  const linkType = item.scope.linkType;
  const attributeKey = item.scope.attributeKey;
  if (item.itemKind === "link") {
    return linkType !== null ? `Link · ${linkType}` : "Link";
  }
  return attributeKey !== null ? `Atributo · ${attributeKey}` : "Atributo";
}

export const QueueItem: FC<QueueItemProps> = ({
  item,
  itemKey,
  selected,
  onSelect,
}) => {
  const badge = mapKindToBadge(item.kind);
  const scope = describeScope(item);
  // `formatRelative` is pure but the `now` it closes over would otherwise
  // re-compute on every render. Memoise against `createdAt` so the label
  // is stable while the row is on screen — 30s polling will refetch the
  // list anyway, so a stale-by-one-tick label is acceptable.
  const relative = useMemo(
    () => formatRelative(item.createdAt),
    [item.createdAt],
  );

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    // Enter and Space are the standard listbox-option activators. The
    // browser already fires `click` on these for <button>, but we keep
    // an explicit handler so future migrations to `<div role="option">`
    // do not lose the affordance.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(itemKey);
    }
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      // `aria-current` is what assistive tech announces as "current item"
      // — distinct from `aria-selected` (multi-selection vs. focus).
      {...(selected ? { "aria-current": "true" as const } : {})}
      onClick={() => onSelect(itemKey)}
      onKeyDown={handleKey}
      data-testid="curation-queue-item"
      data-item-kind={item.kind}
      className={cn(
        // Min target size 32px — feature.spec §8.
        "flex w-full flex-col items-start gap-xs rounded-md p-md text-left",
        // Stay in the translucent glass family so the row harmonises with the
        // white-frost ambient panel it sits inside: a faint glass border + the
        // panel frost fill at rest.
        "border border-border-glass bg-surface-glass-panel",
        // Hover = a slightly stronger frost (modal tier), NOT an opaque dark
        // fill — lifts within the same light-frost family. Keyboard focus uses
        // the app-standard blue focus ring.
        "transition-colors hover:bg-surface-glass-modal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        // Selection highlight (UI-02): stronger frost + the BLUE focus-tone ring,
        // standardised with the app's focus colour. Selection and keyboard focus
        // share the same blue, so the highlight no longer changes colour between
        // mouse-select and keyboard nav.
        selected && "bg-surface-glass-modal ring-2 ring-border-focus",
      )}
    >
      <div className="flex w-full items-center justify-between gap-sm">
        <StateBadge state={badge.state} size="sm" label={badge.label} />
        <span className="text-xs text-muted-foreground">{relative}</span>
      </div>
      <span className="text-xs font-medium text-foreground">{scope}</span>
    </button>
  );
};
