/**
 * ProvenanceTrail — props contract (TC-05).
 *
 * Spec reference: curadoria.feature.spec.md §2 UI-02/UI-03, §6 (error map),
 * §8 (a11y), §10 ("qualifica para component.spec.md").
 *
 * Decoupling rule (TC-05 constraint): the component is reused in TC-07's
 * CurationDrawer, so it MUST NOT read curationStore directly nor know about
 * route params. It receives:
 *  - the item context (kind + id) — so it can pick the right provenance hook.
 *  - the `onEvidenceViewed` callback — fired exactly ONCE when the trail
 *    enters the viewport (IntersectionObserver) OR receives focus. Callers
 *    wire this to whichever store/handler they use (CurationPage wires it
 *    to curationStore.setEvidenceViewed(true); the drawer wires it to its
 *    own per-modal state).
 */
import type { ItemKind } from "../../types";

export interface ProvenanceTrailProps {
  /** Item kind drives which provenance hook is consumed. */
  readonly itemKind: ItemKind;
  /** Identifier of the link/attribute whose evidence to fetch. */
  readonly itemId: string;
  /**
   * Called the first time the user "looks at" the trail — i.e. it enters
   * the viewport OR receives keyboard focus. Idempotent at the consumer
   * level (curationStore guards re-calls). Not called when the inline
   * `BUSINESS_RAW_INFORMATION_DELETED` warning is showing — without
   * provenance, the decision-bar gate MUST stay closed (§6 row).
   */
  readonly onEvidenceViewed: () => void;
  /** Optional extra Tailwind classes merged with `cn()`. */
  readonly className?: string;
}
