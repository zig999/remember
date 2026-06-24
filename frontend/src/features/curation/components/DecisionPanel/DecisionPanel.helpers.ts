/**
 * DecisionPanel.helpers — pure helpers extracted from DecisionPanel.tsx to
 * keep the component under the 300-line limit. No React, no side effects.
 */
import type {
  ReviewQueueItem,
  DisputeQueueItem,
} from "../../types";
import type { CorrectionFormDefaults } from "../CorrectionForm";

/** Human-readable relative time in pt-BR ("agora", "há 3 min", …). */
export function relative(now: Date, then: Date): string {
  const diff = Math.max(0, now.getTime() - then.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} d`;
  return then.toLocaleDateString("pt-BR");
}

/** Map a queue item to its header StateBadge state + label. */
export function headerBadge(item: ReviewQueueItem): {
  readonly state: "uncertain" | "disputed";
  readonly label: string;
} {
  if (item.kind === "entity_match") {
    return { state: "uncertain", label: "Para revisar" };
  }
  return { state: "disputed", label: "Disputado" };
}

/** The scope/name shown in the header. */
export function describeScope(item: ReviewQueueItem): string {
  if (item.kind === "entity_match") return item.canonicalName;
  return item.scope.linkType ?? item.scope.attributeKey ?? "Item em disputa";
}

/** Build CorrectionForm defaults from a disputed item's first side. The
 *  parent picks which side seeds the form; we default to side[0]. */
export function buildCorrectionDefaults(
  item: DisputeQueueItem,
): CorrectionFormDefaults {
  const first = item.sides[0];
  if (!first) {
    return { validFromSource: "document" };
  }
  return {
    value: first.value,
    targetNodeId: first.targetNodeId,
    validFrom: first.validFrom ? first.validFrom.toISOString().slice(0, 10) : null,
    validTo: first.validTo ? first.validTo.toISOString().slice(0, 10) : null,
    validFromSource: first.validFromSource,
    validFromFragmentId: null,
  };
}
