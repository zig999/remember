/**
 * NodeDetailPanel — curation target derivation (TC-07; preserved verbatim
 * during the dev_tc_001 progressive-disclosure refactor).
 *
 * The "Curar" button on the panel header surfaces two distinct curation
 * targets, mutually exclusive:
 *  - `needs_review` nodes belong to the **entity_match** queue (BFF emits
 *    one queue row per `needs_review` node — keyed by `node_id`).
 *  - Nodes with at least one `uncertain`/`disputed` attribute have a
 *    contextual `disputed` target (uncertain is a display flag, not a
 *    dedicated queue, so the drawer surfaces it via the disputed family +
 *    the attribute id).
 *
 * Pure function — exported for direct unit-test coverage.
 */
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
