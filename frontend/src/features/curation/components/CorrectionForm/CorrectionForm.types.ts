/**
 * CorrectionForm — props contract (TC-05, UI-11 — errata UC-10).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-11, §5 (input validations),
 *    §6 (BUSINESS_CORRECTION_NO_CHANGES, BUSINESS_TEMPORAL_INCOHERENT,
 *    BUSINESS_DATE_UNJUSTIFIED inline), §8 (a11y focus management),
 *    §10 ("qualifica para component.spec.md").
 *  - openapi.yaml — `CorrectItemRequest` shape.
 *
 * Decoupling rule (TC-05 constraint): reused in TC-07's CurationDrawer, so
 * the component MUST NOT know about route params or the curation store.
 * It receives `defaults` (the current item's values pre-filled), a submit
 * callback (caller wires `useCorrectItem.mutate`) and a cancel callback
 * (caller closes the form and restores focus to the "Corrigir…" button).
 *
 * Server errors: the parent supplies `serverError` whenever the mutation
 * fails. We map the known codes to inline UI:
 *  - BUSINESS_CORRECTION_NO_CHANGES   -> form-level message
 *  - BUSINESS_TEMPORAL_INCOHERENT     -> validFrom/validTo aria-invalid
 *  - BUSINESS_DATE_UNJUSTIFIED        -> DateJustification radio focus
 *  - BUSINESS_FRAGMENT_NOT_ACCEPTED   -> fragment picker message
 *
 * Single-owner pt-BR — strings in code.
 */
import type { CorrectItemRequest, ItemKind, ValidFromSource } from "../../types";

export interface CorrectionFormDefaults {
  /** Current attribute value (for attribute item_kind). */
  readonly value?: string | null;
  /** Current target node id (for link item_kind). */
  readonly targetNodeId?: string | null;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly validFromSource?: ValidFromSource;
  readonly validFromFragmentId?: string | null;
}

export interface CorrectionFormProps {
  /** Item kind drives which value field is rendered (value vs target_node_id). */
  readonly itemKind: ItemKind;
  /** Item id forwarded into the request. */
  readonly itemId: string;
  /** Pre-filled current values. */
  readonly defaults: CorrectionFormDefaults;
  /**
   * Optional `llm_run_id` / `raw_information_id` filter for the accepted-
   * fragment picker. When both are absent and `valid_from_source=stated`
   * is chosen, the picker degrades to a plain text input (R2 fallback,
   * flow spec 3o). When the picker is shown but returns no results, the
   * same fallback applies.
   */
  readonly fragmentFilter?: {
    readonly llmRunId?: string;
    readonly rawInformationId?: string;
  };
  /** Submission callback. The caller is responsible for the mutation. */
  readonly onSubmit: (body: CorrectItemRequest) => void;
  /** Cancel — caller closes the form and restores focus. */
  readonly onCancel: () => void;
  /** While the parent mutation is in flight. */
  readonly submitting?: boolean;
  /** Server-side error from the parent mutation (post-422). */
  readonly serverError?: { readonly code: string; readonly message: string } | null;
  readonly className?: string;
}
