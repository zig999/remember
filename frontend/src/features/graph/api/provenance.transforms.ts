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

const RECEIVED_AT_DATETIME = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatReceivedAtDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return RECEIVED_AT_DATETIME.format(dt);
}

function readMetadataTitle(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string | null {
  if (metadata === undefined) return null;
  const t = metadata.title;
  return typeof t === "string" && t.length > 0 ? t : null;
}

function readMetadataDocumentDate(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string | null {
  if (metadata === undefined) return null;
  const d = metadata.document_date;
  if (typeof d !== "string" || d.length === 0) return null;
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
