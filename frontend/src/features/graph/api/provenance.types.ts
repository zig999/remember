export type ProvenanceKind = "links" | "attributes" | "fragments";

export interface ProvenanceRawInformationWire {
  readonly id: string;
  readonly source_type: string;
  readonly received_at: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly original_input?: string | null;
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

export interface ProvenanceRawInformationView {
  readonly id: string;
  readonly sourceType: string;
  readonly receivedAtLabel: string;
  readonly title: string | null;
  readonly documentDateLabel: string | null;
  readonly originalInput?: string | null;
}

export interface ProvenanceChunkView {
  readonly id: string;
  readonly chunkIndex: number;
  readonly offsetStart: number;
  readonly offsetEnd: number;
  readonly offsetRangeLabel: string;
  readonly excerpt: string;
  readonly locator: Readonly<Record<string, unknown>>;
  readonly rawInformation: ProvenanceRawInformationView;
}

export interface ProvenanceFragmentView {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  readonly confidenceLabel: string;
  readonly status: string;
  readonly chunks: ReadonlyArray<ProvenanceChunkView>;
}

export interface ProvenanceResponseView {
  readonly fragments: ReadonlyArray<ProvenanceFragmentView>;
}
