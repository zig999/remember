// Temporal validation layer (Layer 3 of BR-13). Used by `propose_link` and
// `propose_attribute` (UC-10, UC-11). Validates:
//
//   - semi-open invariant: `valid_from < valid_to` when both are provided
//     (BR-16 / §13.3 / §5.2).
//   - date justification chain (A14 / §6.5): when `requires_valid_from = true`
//     for the link_type or attribute_key, AND `valid_from` is supplied, the
//     caller must declare a non-null `valid_from_basis`. The case where the
//     basis is `stated` and the value is missing from any cited fragment text
//     is detected by the structural cross-check, not here.
//   - correction signal: `change_hint = 'correction'` requires textual errata
//     evidence in at least one cited fragment. Without the signal it is a
//     TEMPORAL_INCOHERENT failure.
//
// The layer is pure (no DB calls). The caller passes the fragment texts that
// were already fetched (the anti-hallucination layer reads them anyway, so we
// share the result).

import { ValidationFailure } from "./errors.js";

/** Inputs the temporal layer consumes. */
export interface TemporalLayerInput {
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
  readonly requires_valid_from: boolean;
  readonly change_hint: "none" | "succession" | "correction";
  readonly fragment_texts: readonly string[];
  readonly document_date: string | null;
}

/**
 * Errata-signal heuristic — `'correction'` requires textual evidence of an
 * errata in at least one cited fragment (case-insensitive substring of any
 * of the Portuguese/English markers used in the domain glossary).
 */
const ERRATA_MARKERS = ["errata", "errado", "correção", "corrigir", "correction", "correcao"] as const;

function hasErrataSignal(fragments: readonly string[]): boolean {
  for (const f of fragments) {
    const lower = f.toLowerCase();
    for (const m of ERRATA_MARKERS) {
      if (lower.includes(m)) return true;
    }
  }
  return false;
}

/** Apply the temporal layer. Throws `ValidationFailure` on the first issue. */
export function validateTemporal(input: TemporalLayerInput): void {
  // Semi-open interval invariant.
  if (input.valid_from !== null && input.valid_to !== null) {
    if (input.valid_from >= input.valid_to) {
      throw new ValidationFailure(
        "TEMPORAL_INCOHERENT",
        "valid_from must be strictly before valid_to.",
        { valid_from: input.valid_from, valid_to: input.valid_to }
      );
    }
  }

  // Correction signal — must have textual evidence.
  if (input.change_hint === "correction") {
    if (!hasErrataSignal(input.fragment_texts)) {
      throw new ValidationFailure(
        "TEMPORAL_INCOHERENT",
        "change_hint = 'correction' requires errata textual evidence in at least one cited fragment.",
        { change_hint: input.change_hint }
      );
    }
  }

  // Date justification chain (A14): a `valid_from` carried into the row must
  // be backed by a known basis. When `requires_valid_from` is true and no
  // basis is declared, fall back to `received` ONLY when the caller did not
  // supply a `valid_from`. If a `valid_from` was supplied without a basis,
  // it is DATE_UNJUSTIFIED.
  if (input.valid_from !== null && input.valid_from_basis === null) {
    throw new ValidationFailure(
      "DATE_UNJUSTIFIED",
      "valid_from supplied without a valid_from_basis (stated | document | received).",
      { valid_from: input.valid_from }
    );
  }
  if (
    input.requires_valid_from &&
    input.valid_from === null &&
    input.document_date === null
  ) {
    // No stated date, no document_date in metadata, no fallback to received
    // for this requires_valid_from = true type.
    throw new ValidationFailure(
      "DATE_UNJUSTIFIED",
      "link_type / attribute_key requires_valid_from = true but no date is available.",
      { requires_valid_from: input.requires_valid_from }
    );
  }
}

export const __testing__ = { hasErrataSignal };
