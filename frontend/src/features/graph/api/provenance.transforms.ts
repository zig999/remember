/**
 * Provenance transforms — wire → surface for the Phase C `ProvenanceResponse`
 * (dev_tc_001).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "Response transforms" rows for Phase C:
 *      • `raw_information.received_at` → pt-BR `DD/MM/YYYY HH:mm`.
 *      • `chunk.offset_start`/`offset_end` → `chars {start}–{end}`.
 *  - docs/specs/domains/query-retrieval/openapi.yaml `ProvenanceResponse`.
 *
 * Pure functions — exercised in isolation by unit tests.
 */
import { formatConfidenceLabel, formatDateLabel } from "./_transforms";
import type {
  ProvenanceChunkView,
  ProvenanceChunkWire,
  ProvenanceFragmentView,
  ProvenanceFragmentWire,
  ProvenanceRawInformationView,
  ProvenanceRawInformationWire,
  ProvenanceResponseView,
  ProvenanceResponseWire,
} from "./provenance.types";

/** pt-BR formatter for `received_at` (date + time). */
const RECEIVED_AT_DATETIME = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Format a `received_at` ISO instant as `DD/MM/YYYY HH:mm` in the user's
 * local timezone. Returns the raw string on parse failure (defensive).
 */
export function formatReceivedAtDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return RECEIVED_AT_DATETIME.format(dt);
}

/** Read `metadata.title` if it's a string, else `null`. */
function readMetadataTitle(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string | null {
  if (metadata === undefined) return null;
  const t = metadata.title;
  return typeof t === "string" && t.length > 0 ? t : null;
}

/** Read `metadata.document_date` (ISO date) → pt-BR `DD/MM/YYYY`, or null. */
function readMetadataDocumentDate(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string | null {
  if (metadata === undefined) return null;
  const d = metadata.document_date;
  if (typeof d !== "string" || d.length === 0) return null;
  // `formatDateLabel` returns `null` for `null` input only — `d` is a string.
  return formatDateLabel(d);
}

function toRawInformationView(
  wire: ProvenanceRawInformationWire,
): ProvenanceRawInformationView {
  const base: ProvenanceRawInformationView = {
    id: wire.id,
    sourceType: wire.source_type,
    receivedAtLabel: formatReceivedAtDateTime(wire.received_at),
    title: readMetadataTitle(wire.metadata),
    documentDateLabel: readMetadataDocumentDate(wire.metadata),
  };
  // Raw passthrough (v2.1 — TC-04): NodeProvenanceChain interprets the
  // three branches (non-null/non-REDACTED → disclosure; '[REDACTED]' →
  // muted indicator; null/undefined → nothing). Only set the field when
  // the wire actually carried a value — TS strict `exactOptionalPropertyTypes`
  // forbids assigning `undefined` to an optional property.
  if (wire.original_input !== undefined) {
    return { ...base, originalInput: wire.original_input };
  }
  return base;
}

function toChunkView(wire: ProvenanceChunkWire): ProvenanceChunkView {
  return {
    id: wire.id,
    chunkIndex: wire.chunk_index,
    offsetStart: wire.offset_start,
    offsetEnd: wire.offset_end,
    offsetRangeLabel: `chars ${wire.offset_start}–${wire.offset_end}`,
    excerpt: wire.excerpt,
    locator: wire.locator ?? {},
    rawInformation: toRawInformationView(wire.raw_information),
  };
}

function toFragmentView(
  wire: ProvenanceFragmentWire,
): ProvenanceFragmentView {
  return {
    id: wire.id,
    text: wire.text,
    confidence: wire.confidence,
    confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%",
    status: wire.status,
    chunks: wire.chunks.map(toChunkView),
  };
}

export function toProvenanceResponse(
  wire: ProvenanceResponseWire,
): ProvenanceResponseView {
  return { fragments: wire.fragments.map(toFragmentView) };
}
