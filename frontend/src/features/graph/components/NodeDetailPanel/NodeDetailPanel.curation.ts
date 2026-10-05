import type { SelectedItemKind } from "@/features/curation/state/curation-store";
import type { NodeDetailView } from "../../api";

export interface NodeCurationTarget {
  readonly kind: SelectedItemKind;
  readonly itemId: string;
}

export function deriveCurationTarget(
  data: NodeDetailView,
): NodeCurationTarget | null {
  if (data.status === "needs_review") {
    return { kind: "entity_match", itemId: data.id };
  }
  for (const attr of data.attributes) {
    if (
      attr.effectiveStatus === "uncertain" ||
      attr.effectiveStatus === "disputed"
    ) {
      return { kind: "disputed", itemId: attr.id };
    }
  }
  return null;
}
