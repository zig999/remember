/**
 * DecisionPanel — props contract (TC-05, hero panel).
 *
 * Decoupling rule (TC-05 constraint): reused in TC-07's CurationDrawer, so
 * the component MUST NOT depend on TanStack Router, the curation store, or
 * the route's URL. It receives:
 *   - `item`             — the queue item (domain shape).
 *   - `evidenceViewed`   — gates the DecisionBar (caller-managed).
 *   - `stale`            — when true, StaleBanner overlays the panel.
 *   - `onRefetch`        — fired by StaleBanner's Recarregar button.
 *   - action callbacks   — one per decision (confirm / merge / keep / …);
 *                          parent wires them to mutations (TC-03 hooks).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-02, UI-03, UI-10, UI-11.
 *  - §3 state transition table (UI-03 -> UI-04/UI-05; UI-10 banner).
 *  - §6 error map (BUSINESS_REASON_REQUIRED, BUSINESS_SELF_MERGE_FORBIDDEN
 *    inline).
 *  - §8 a11y (aria-disabled, focus management, role=alert for banners).
 *  - §10 ("qualifica para component.spec.md").
 */
import type {
  ReviewQueueItem,
  ItemKind,
  ResolveEntityMatchRequest,
  ResolveDisputeRequest,
  ConfirmItemRequest,
  RejectItemRequest,
  CorrectItemRequest,
} from "../../types";

/** A side identifier inside a `disputed` item — used to wire DisputeSideCard
 *  selection (winner_id) and adjust-periods inputs. */
export type DisputeSideId = string;

/** Action callbacks the parent supplies. Each one corresponds to a curation
 *  domain mutation; the parent handles invalidation/undo/auto-advance. */
export interface DecisionPanelActions {
  readonly onResolveEntityMatch?: (body: ResolveEntityMatchRequest) => void;
  readonly onResolveDispute?: (body: ResolveDisputeRequest) => void;
  readonly onConfirm?: (body: ConfirmItemRequest) => void;
  readonly onReject?: (body: RejectItemRequest) => void;
  readonly onCorrect?: (body: CorrectItemRequest) => void;
}

export interface DecisionPanelServerError {
  readonly code: string;
  readonly message: string;
}

export interface DecisionPanelProps {
  readonly item: ReviewQueueItem;
  /** Set true after the curator scrolled/focused the ProvenanceTrail. */
  readonly evidenceViewed: boolean;
  /** When true, StaleBanner overlays the panel (UI-10). */
  readonly stale?: boolean;
  /** Fired by the StaleBanner "Recarregar" button. */
  readonly onRefetch?: () => void;
  /** Server-side error from the most recent action (post-422/409). */
  readonly serverError?: DecisionPanelServerError | null;
  /** Submit-in-flight flag (disables buttons + shows the spinner). */
  readonly submitting?: boolean;
  /** Action callbacks (see `DecisionPanelActions`). */
  readonly actions?: DecisionPanelActions;
  /**
   * Optional `llm_run_id` / `raw_information_id` filter forwarded to the
   * CorrectionForm fragment picker. The parent supplies it from the
   * provenance hook result (the first chunk usually carries the source).
   */
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  /** ProvenanceTrail integration — the parent passes the node mounted as
   *  evidence trail; gives drawer/page latitude in placement. */
  readonly provenanceSlot?: React.ReactNode;
  readonly className?: string;
}

/** Item-kind helper used by sub-components. */
export function itemKindOf(item: ReviewQueueItem): ItemKind {
  if (item.kind === "entity_match") {
    // entity_match deals with NODES (no link/attribute id) — but the
    // correctItem mutation needs a kind. The decision panel does not
    // expose "correct" for entity_match items in the spec, so this is
    // unused in that branch. We default to "link" to keep the type total.
    return "link";
  }
  return item.itemKind;
}
