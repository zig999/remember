/**
 * Provenance — wire + surface shapes for the cross-layer provenance walk
 * (dev_tc_001, Phase C of NodeDetailPanel v2.0).
 *
 * Wire shapes mirror `docs/specs/domains/query-retrieval/openapi.yaml`
 * (schemas `ProvenanceResponse`, `ProvenanceFragment`, `ProvenanceChunk`,
 * `ProvenanceRawInformation`).
 *
 * Endpoint family — three URL shapes, identical body:
 *   GET /api/v1/provenance/links/:link_id
 *   GET /api/v1/provenance/attributes/:attribute_id
 *   GET /api/v1/provenance/fragments/:fragment_id
 *
 * The SPA hook (`useProvenance`) picks the URL via the `kind` argument so
 * the call site stays declarative ("`links` / `attributes` / `fragments`").
 */

/** Discriminator for the three provenance-walk URLs. */
export type ProvenanceKind = "links" | "attributes" | "fragments";

/* -------------------------------------------------------------------------
 * Wire shapes.
 * ------------------------------------------------------------------------- */

export interface ProvenanceRawInformationWire {
  readonly id: string;
  readonly source_type: string;
  readonly received_at: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProvenanceChunkWire {
  readonly id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly locator?: Readonly<Record<string, unknown>>;
  readonly raw_information: ProvenanceRawInformationWire;
}

export interface ProvenanceFragmentWire {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  readonly status: string;
  readonly chunks: ReadonlyArray<ProvenanceChunkWire>;
}

export interface ProvenanceResponseWire {
  readonly fragments: ReadonlyArray<ProvenanceFragmentWire>;
}

/* -------------------------------------------------------------------------
 * Surface shapes.
 * ------------------------------------------------------------------------- */

export interface ProvenanceRawInformationView {
  readonly id: string;
  readonly sourceType: string;
  /** Pre-formatted pt-BR label `DD/MM/YYYY HH:mm` for `received_at`. */
  readonly receivedAtLabel: string;
  /** `metadata.title` if present, else `null`. */
  readonly title: string | null;
  /** `metadata.document_date` (pt-BR `DD/MM/YYYY`) if present, else `null`. */
  readonly documentDateLabel: string | null;
}

export interface ProvenanceChunkView {
  readonly id: string;
  readonly chunkIndex: number;
  readonly offsetStart: number;
  readonly offsetEnd: number;
  /** `"chars 0–1742"` — pre-formatted offset window (Phase C transform). */
  readonly offsetRangeLabel: string;
  readonly excerpt: string;
  readonly locator: Readonly<Record<string, unknown>>;
  readonly rawInformation: ProvenanceRawInformationView;
}

export interface ProvenanceFragmentView {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  /** `"92%"` formatted label. */
  readonly confidenceLabel: string;
  readonly status: string;
  readonly chunks: ReadonlyArray<ProvenanceChunkView>;
}

export interface ProvenanceResponseView {
  readonly fragments: ReadonlyArray<ProvenanceFragmentView>;
}
