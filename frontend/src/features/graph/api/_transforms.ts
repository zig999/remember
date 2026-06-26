/**
 * graph/api — pure wire→surface transforms (TC-FE-08).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "Response transforms" — the canonical mapping rules:
 *      • `node.status` → StateBadge state (`active → accepted`,
 *        `needs_review → uncertain`, `merged → superseded`).
 *      • Attributes sorted: `is_in_effect: true` first, then by `key`
 *        alphabetically (stable).
 *      • `valid_from`/`valid_to` formatted as `DD/MM/YYYY` (pt-BR) using
 *        `Intl.DateTimeFormat`.
 *
 * Keeping these as pure functions (no React, no fetch) so the hook stays a
 * thin wrapper around `http<T>` + the transform, and so the transforms can
 * be exercised by unit tests in isolation (mirrors the chat-api pattern).
 */
import type { ConfidenceState } from "@/components/ds/StateBadge";
import type {
  AttributeWire,
  AttributeWireAssertionStatus,
  AttributeWireEffectiveStatus,
  NodeAliasView,
  NodeAliasWire,
  NodeAttributeView,
  NodeDetailView,
  NodeDetailWire,
  NodeWireStatus,
  ProvenanceEntryView,
  ProvenanceEntryWire,
} from "./node-detail.types";

/* ---------- node-level status → StateBadge state -------------------- */

/**
 * Map a `NodeStatus` value to a `ConfidenceState` for the panel header
 * badge. Spec §9 row "node.status".
 *
 *  - `active`        → `accepted`     (the canonical "this is the truth" state)
 *  - `needs_review`  → `uncertain`    (review queue, §10 of remember-modelagem)
 *  - `merged`        → `superseded`   (a merged node is shown with the
 *                                       "superado" badge — the panel may also
 *                                       carry a notice + link, but that's a
 *                                       v1.1+ concern; v1 just badges it)
 *
 * `deleted` does not get mapped — the openapi returns 410 BUSINESS_NODE_DELETED
 * for deleted nodes and the panel renders the error path instead.
 */
export function mapNodeStatusToBadge(status: NodeWireStatus): ConfidenceState {
  switch (status) {
    case "active":
      return "accepted";
    case "needs_review":
      return "uncertain";
    case "merged":
      return "superseded";
    case "deleted":
      // Defensive: if we ever receive a 200 with `status:"deleted"` we still
      // show *something* — `superseded` is the least misleading state badge
      // (the panel will also surface an error elsewhere via the wire status).
      return "superseded";
  }
}

/* ---------- attribute-level status → StateBadge state --------------- */

/**
 * Map an attribute `effective_status` + `status` pair to a `ConfidenceState`
 * for the per-row StateBadge in the attributes table.
 *
 * Effective status is the post-derivation field (section 5.4 of the modelagem
 * spec); it is what the panel surface uses for the badge. The raw assertion
 * status is consulted only for the `disputed` mapping, which the effective
 * view also exposes as `disputed` so the precedence is:
 *
 *   effective_status === 'disputed'  → 'disputed'
 *   effective_status === 'uncertain' → 'uncertain'
 *   effective_status === 'inactive'  → 'superseded' (no longer in effect)
 *   effective_status === 'active'    → 'accepted'
 *
 * `low-confidence` is a flag, not a status — it lives on `flags[]` and the v1
 * panel does not surface it (deferred to a later wave that introduces flag
 * badges per spec §9 "Does NOT" row).
 */
export function mapAttributeStatusToBadge(
  effective: AttributeWireEffectiveStatus,
  assertion: AttributeWireAssertionStatus,
): ConfidenceState {
  if (effective === "disputed") return "disputed";
  if (effective === "uncertain") return "uncertain";
  if (effective === "inactive") return "superseded";
  // `active` — but if the underlying assertion was 'superseded' (which would
  // be unusual since effective='active' implies a current assertion), keep
  // 'superseded' as the least misleading.
  if (assertion === "superseded") return "superseded";
  return "accepted";
}

/* ---------- date formatting ----------------------------------------- */

/** Memoised pt-BR formatter — created once at module load. Cheap to reuse.
 *  `timeZone: 'UTC'` matches the wire date construction (Date.UTC) below so
 *  the formatted day never drifts by ±1 day across timezones. The wire field
 *  is a plain calendar date (`YYYY-MM-DD`), NOT an instant — formatting it
 *  in the user's local timezone would be semantically wrong (a 'deadline'
 *  on 2026-07-15 is the same calendar day everywhere). */
const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Format a wire date (`YYYY-MM-DD`) as a pt-BR label `DD/MM/YYYY`.
 * Returns `null` when input is `null` (open-ended interval). Returns the
 * raw string if parsing fails — never throws (spec §9 mandates a label).
 */
export function formatDateLabel(date: string | null): string | null {
  if (date === null) return null;
  // The wire date is the canonical `YYYY-MM-DD` (openapi `format: date`).
  // Construct in UTC so `new Date('2026-07-15')` does not silently shift to
  // the prior day in a UTC- timezone.
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const [y, m, d] = parts;
  const yearStr = y ?? "";
  const monthStr = m ?? "";
  const dayStr = d ?? "";
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return date;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return date;
  return DATE_FORMATTER.format(dt);
}

/* ---------- entries → surface shapes -------------------------------- */

function toAliasView(wire: NodeAliasWire): NodeAliasView {
  return {
    id: wire.id,
    alias: wire.alias,
    kind: wire.kind,
  };
}

function toAttributeView(wire: AttributeWire): NodeAttributeView {
  return {
    id: wire.id,
    key: wire.attribute_key,
    value: wire.value,
    valueType: wire.value_type,
    effectiveStatus: wire.effective_status,
    isInEffect: wire.is_in_effect,
    state: mapAttributeStatusToBadge(wire.effective_status, wire.status),
    validFromLabel: formatDateLabel(wire.valid_from),
    validToLabel: formatDateLabel(wire.valid_to),
    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),
  };
}

/* ---------- Phase A — ProvenanceEntry transform --------------------- */

/**
 * Format a confidence float (0..1) as a 0-decimal percentage label
 * (`0.923 → "92%"`). Spec §9 "Response transforms" row.
 *
 * Returns `null` when the wire value was undefined/null — the row UI
 * collapses the label gracefully (`"—"`) without falsely reporting `0%`.
 */
export function formatConfidenceLabel(
  confidence: number | undefined | null,
): string | null {
  if (confidence === undefined || confidence === null) return null;
  if (!Number.isFinite(confidence)) return null;
  return `${Math.round(confidence * 100)}%`;
}

/** Memoised pt-BR formatter for ISO instants (`DD/MM/YYYY`). */
const RECEIVED_AT_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  // `received_at` is a full ISO timestamp, not a date-only field — render in
  // the user's local timezone so the day matches what they would read in a
  // mail header. (Distinct from `valid_from` which is timezone-independent.)
});

/**
 * Format a `received_at` ISO timestamp as a pt-BR date label `DD/MM/YYYY`.
 * Returns the raw string on parse failure (never throws), `null` when input
 * is absent.
 */
export function formatReceivedAtLabel(
  iso: string | undefined | null,
): string | null {
  if (iso === undefined || iso === null) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return RECEIVED_AT_FORMATTER.format(dt);
}

/** Wire → surface for a single Phase A `ProvenanceEntry`. */
export function toProvenanceEntryView(
  wire: ProvenanceEntryWire,
): ProvenanceEntryView {
  const confidence =
    typeof wire.confidence === "number" && Number.isFinite(wire.confidence)
      ? wire.confidence
      : null;
  return {
    fragmentId: wire.fragment_id,
    fragmentText: wire.fragment_text,
    confidence,
    confidenceLabel: formatConfidenceLabel(confidence),
    rawInformationId: wire.raw_information_id ?? null,
    sourceType: wire.source_type ?? null,
    receivedAtLabel: formatReceivedAtLabel(wire.received_at),
    excerpt: wire.excerpt ?? null,
  };
}

/**
 * Sort attributes: `is_in_effect: true` first, then by `attribute_key`
 * (locale-aware, case-insensitive). Stable when keys collide — important for
 * the multi-valued attribute case (§3.3 of the modelagem spec).
 *
 * `localeCompare` with `sensitivity: 'base'` gives the case-insensitive,
 * diacritic-insensitive ordering pt-BR users expect (`Água` near `agua`).
 */
function sortAttributes(
  attrs: ReadonlyArray<NodeAttributeView>,
): ReadonlyArray<NodeAttributeView> {
  return [...attrs].sort((a, b) => {
    if (a.isInEffect !== b.isInEffect) {
      // `true` first → sort descending on the boolean.
      return a.isInEffect ? -1 : 1;
    }
    return a.key.localeCompare(b.key, "pt-BR", { sensitivity: "base" });
  });
}

/** Top-level transform: wire → surface (immutable). */
export function toNodeDetail(wire: NodeDetailWire): NodeDetailView {
  const sortedAttrs = sortAttributes(wire.attributes.map(toAttributeView));
  return {
    id: wire.node.id,
    canonicalName: wire.node.canonical_name,
    nodeType: wire.node.node_type,
    status: wire.node.status,
    badgeState: mapNodeStatusToBadge(wire.node.status),
    mergedIntoNodeId: wire.node.merged_into_node_id ?? null,
    aliases: wire.aliases.map(toAliasView),
    attributes: sortedAttrs,
  };
}
