/**
 * CurationDrawer — props contract (TC-07).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 (UI-* transitions) — CurationDrawer row:
 *    `role="dialog"`, `aria-modal=true`, `aria-label="Curadoria"`, focus
 *    trap, `Esc` closes; mounts `DecisionPanel`; does NOT change URL.
 *  - curadoria.flow.md §2 Sub-flow C / §4 FL-CURATION-03 / §3 row 3m / §5
 *    deep-link escape hatch (`Abrir na fila de curadoria`).
 *
 * Origin context (`itemKind` discriminator + composite id) is passed in as
 * props — NOT via the URL (constraint: drawer does not change the URL).
 * The drawer fetches `listReviewQueue` internally and finds the matching
 * item. If the item is not in the queue (already resolved / not yet
 * indexed) the spec's fallback (FL-CURATION-03) is to surface an inline
 * error with an "Abrir na fila de curadoria" link to `/curation?item=…`.
 */
import type { SelectedItemKind } from "../../state/curation-store";

export interface CurationDrawerProps {
  /** Open / closed — owned by the parent (NodeDetailPanel, etc.). */
  readonly open: boolean;
  /**
   * Called when the user dismisses the drawer (Esc, X button, click on the
   * backdrop, decision-success). The parent moves focus back to the element
   * that triggered the drawer (per Sub-flow C step 7).
   */
  readonly onOpenChange: (open: boolean) => void;
  /**
   * Queue family the item lives in — needed so the drawer can pick the
   * right entry in the queue payload.
   */
  readonly kind: SelectedItemKind;
  /**
   * Composite id of the queue item. For `entity_match` this is the node
   * id; for `disputed` this is the synthetic dispute key the BFF emits in
   * the queue listing (we match by side `itemId` membership).
   */
  readonly itemId: string;
  /**
   * Friendly label rendered while the queue is loading (so the drawer
   * does not flash an empty title). Usually the node's canonical name
   * or the link/attribute scope.
   */
  readonly itemLabel?: string;
}
