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
// Fallback chain for `requires_valid_from = true` (v7 §6.5 / §13c / A14):
//   stated -> document -> received. When `valid_from` is not supplied and
//   `document_date` is absent BUT `received_at` is available, the layer
//   resolves `valid_from := received_at` (date portion) with
//   `valid_from_source := 'received'`. The DATE_UNJUSTIFIED rejection only
//   fires when ALL THREE links of the chain are absent. The resolved values
//   are returned so the caller can pass them to the consolidator instead of
//   the raw input.
//
// The layer is pure (no DB calls). The caller passes the fragment texts that
// were already fetched (the anti-hallucination layer reads them anyway, so we
// share the result) and `received_at` from the LLMRun's source.

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
  /**
   * ISO-8601 timestamp of `raw_information.received_at`. May be null only
   * when the caller cannot supply it (transports always have a real value).
   * When `requires_valid_from = true` and the upstream `stated`/`document`
   * links are absent, the layer falls back to the date portion (YYYY-MM-DD)
   * of this value as `valid_from`.
   */
  readonly received_at: string | null;
}

/**
 * Resolved temporal fields the caller threads into the consolidator. When
 * the input already carries `valid_from`, these mirror the input. When the
 * input had a null `valid_from` and the layer applied the `received`
 * fallback, `valid_from` holds the resolved date and `valid_from_basis`
 * holds `'received'`.
 */
export interface TemporalResolved {
  readonly valid_from: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
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

/**
 * Extract the YYYY-MM-DD date portion from an ISO-8601 timestamp. Returns
 * `null` when the input is null OR not parseable as a date prefix.
 *
 * `received_at` is stored as `timestamptz` in PostgreSQL and reaches this
 * layer as the result of `Date#toISOString()` or `to_char` — both produce
 * strings whose first 10 chars are a valid `YYYY-MM-DD`. The regex guard
 * defends against unexpected upstream shapes.
 */
function toIsoDate(ts: string | null): string | null {
  if (ts === null) return null;
  if (ts.length < 10) return null;
  const head = ts.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return null;
  return head;
}

/**
 * Apply the temporal layer.
 *
 * Throws `ValidationFailure` on the first issue. On success returns the
 * resolved `{ valid_from, valid_from_basis }` pair that the caller must
 * propagate to the consolidator (the `received` fallback materializes the
 * actual stored values here — they cannot be left null downstream because
 * the consolidator's branch decision compares `vigent.valid_from` against
 * `args.valid_from`).
 */
export function validateTemporal(input: TemporalLayerInput): TemporalResolved {
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

  // Date justification chain (A14 / v7 §6.5 / §13c): a `valid_from` carried
  // into the row must be backed by a known basis. When `requires_valid_from`
  // is true and the caller did not supply a `valid_from`, we walk the chain
  // stated -> document -> received. The first two links (stated, document)
  // are signalled by the caller (`valid_from`+`valid_from_basis` for stated;
  // `document_date` for document). `received_at` is always available from
  // the run's source — it is the LAST link and the reason DATE_UNJUSTIFIED
  // should fire ONLY when received_at is also absent.
  if (input.valid_from !== null && input.valid_from_basis === null) {
    throw new ValidationFailure(
      "DATE_UNJUSTIFIED",
      "valid_from supplied without a valid_from_basis (stated | document | received).",
      { valid_from: input.valid_from }
    );
  }
  if (input.requires_valid_from && input.valid_from === null) {
    // No stated date. Try document_date next.
    if (input.document_date !== null) {
      // The caller's existing contract is that `document_date` materializes
      // through the structural/anti-hallucination layers but never into the
      // consolidator args directly (the LLM is the only producer of
      // `valid_from`). We preserve that: validation passes, but we DO NOT
      // resolve `valid_from`/`valid_from_basis` to the document_date here.
      // This keeps the behaviour of the previous version (which also let
      // this branch through with null args) — covered by the unit test
      // "accepts requires_valid_from = true when document_date is available".
      return {
        valid_from: input.valid_from,
        valid_from_basis: input.valid_from_basis,
      };
    }
    // Last link: received fallback (v7 §6.5 / A14).
    const receivedDate = toIsoDate(input.received_at);
    if (receivedDate !== null) {
      return {
        valid_from: receivedDate,
        valid_from_basis: "received",
      };
    }
    // ALL three links absent — only now is the row DATE_UNJUSTIFIED.
    throw new ValidationFailure(
      "DATE_UNJUSTIFIED",
      "link_type / attribute_key requires_valid_from = true but no date is available (stated, document_date, and received_at are all absent).",
      { requires_valid_from: input.requires_valid_from }
    );
  }

  // Either `requires_valid_from = false`, OR the caller supplied a valid
  // `valid_from` + `valid_from_basis`. Return the input unchanged.
  return {
    valid_from: input.valid_from,
    valid_from_basis: input.valid_from_basis,
  };
}

export const __testing__ = { hasErrataSignal, toIsoDate };
