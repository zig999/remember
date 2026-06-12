// Response-side DTOs for the query-retrieval REST endpoints.
//
// These types describe the wire shape declared by `openapi.yaml` of the
// query-retrieval domain. The service layer builds plain objects matching
// these interfaces; no runtime Zod parsing is needed for responses (TC-04
// precedent).

export type SearchKind = "node" | "link" | "fragment";
export type SearchLayer = "fragment" | "node" | "chunk";
export type AssertionFlag = "uncertain" | "disputed" | "low_confidence";
export type SourceType =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

export interface SearchProvenanceEntry {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly confidence: number;
  readonly raw_information_id: string;
  readonly source_type: SourceType;
  readonly received_at: string; // ISO-8601
  readonly excerpt: string;
}

export interface SearchItem {
  readonly kind: SearchKind;
  readonly layer: SearchLayer;
  readonly id: string;
  readonly score: number;
  readonly hop: number;
  readonly summary: string;
  readonly flags: readonly AssertionFlag[];
  readonly provenance: readonly SearchProvenanceEntry[];
}

export interface SearchResponse {
  readonly query: string;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly SearchItem[];
}

// ---------------------------------------------------------------------------
// Provenance walk response (cross-layer walk, BR-18)
// ---------------------------------------------------------------------------

export interface ProvenanceRawInformation {
  readonly id: string;
  readonly source_type: SourceType;
  readonly received_at: string; // ISO-8601
  readonly metadata: Record<string, unknown>;
}

export interface ProvenanceChunk {
  readonly id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly locator: Record<string, unknown> | null;
  readonly raw_information: ProvenanceRawInformation;
}

export interface ProvenanceFragment {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  readonly status: "accepted" | "proposed" | "rejected" | "deleted";
  readonly chunks: readonly ProvenanceChunk[];
}

export interface ProvenanceResponse {
  readonly fragments: readonly ProvenanceFragment[];
}
