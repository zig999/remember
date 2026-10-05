import { InvariantError } from "../../../shared/invariant-error.js";

export type SearchKind = "node" | "link" | "fragment";
export type SearchLayer = "fragment" | "node" | "chunk";
export type AssertionFlag = "uncertain" | "disputed" | "low_confidence";
export type NodeMatch = "exact" | "approximate";
export type SourceType =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

const SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  "pdf",
  "email",
  "ata",
  "chat",
  "artigo",
  "transcricao",
  "outro",
]);

export function toSourceType(s: string): SourceType {
  if (SOURCE_TYPES.has(s as SourceType)) return s as SourceType;
  throw new InvariantError(`Unexpected source_type from DB: ${s}`);
}

export interface SearchProvenanceEntry {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly confidence: number;
  readonly raw_information_id: string;
  readonly source_type: SourceType;
  readonly received_at: string;
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
  readonly match?: NodeMatch;
  readonly similarity?: number;
  readonly provenance: readonly SearchProvenanceEntry[];
}

export interface SearchResponse {
  readonly query: string;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly SearchItem[];
}

export interface ProvenanceRawInformation {
  readonly id: string;
  readonly source_type: SourceType;
  readonly received_at: string;
  readonly metadata: Record<string, unknown>;
  readonly original_input: string | null;
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
