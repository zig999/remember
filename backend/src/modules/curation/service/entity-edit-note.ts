import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import { CHUNKING_VERSION } from "../../ingestion/chunker/config.js";
import type { RawChunkInput } from "../../ingestion/chunker/v1.js";
import type { SourceType } from "../../ingestion/dto/source-type.js";
import { composeIdempotencyKey, sha256Hex } from "../../ingestion/hash.js";
import {
  insertLlmRun,
  insertRawChunks,
  insertRawInformation,
} from "../../ingestion/repository/ingestion.repository.js";
import type { LlmRunRow } from "../../ingestion/repository/ingestion.repository.js";
import {
  closeLlmRunRow,
  insertFragmentWithSources,
} from "../../ingestion/repository/llm-run.repository.js";
import { acceptInformationFragment } from "../repository/curation.repository.js";

export const OPERATOR_NOTE_MODEL = "operator";
export const OPERATOR_NOTE_PROMPT_VERSION = "operator-edit-v1";
export const OPERATOR_NOTE_CONFIDENCE = 1.0;

const OPERATOR_NOTE_SOURCE_TYPE: SourceType = "outro";
const NOTE_CONTENT_SEPARATOR = "\n";
const FIRST_CHUNK_INDEX = 0;
const CONTENT_START_OFFSET = 0;

export interface OperatorNoteInput {
  readonly nodeId: string;
  readonly reason: string;
  readonly editedAt: Date;
}

export interface OperatorNoteRecord {
  readonly llmRunId: string;
  readonly rawInformationId: string;
  readonly rawChunkId: string;
  readonly fragmentId: string;
}

function composeNoteContent(
  reason: string,
  editedAt: Date,
  nonce: string
): string {
  return [reason, editedAt.toISOString(), nonce].join(NOTE_CONTENT_SEPARATOR);
}

function wholeContentChunk(content: string): RawChunkInput {
  return {
    chunk_index: FIRST_CHUNK_INDEX,
    text: content,
    offset_start: CONTENT_START_OFFSET,
    offset_end: Array.from(content).length,
    chunking_version: CHUNKING_VERSION,
  };
}

async function openOperatorRun(
  client: PoolClient,
  rawInformationId: string,
  contentHash: string
): Promise<LlmRunRow> {
  return insertLlmRun(client, {
    model: OPERATOR_NOTE_MODEL,
    prompt_version: OPERATOR_NOTE_PROMPT_VERSION,
    input_raw_information_id: rawInformationId,
    idempotency_key: composeIdempotencyKey({
      content_hash: contentHash,
      prompt_version: OPERATOR_NOTE_PROMPT_VERSION,
      model: OPERATOR_NOTE_MODEL,
      chunking_version: CHUNKING_VERSION,
    }),
  });
}

async function completeOperatorRun(
  client: PoolClient,
  llmRunId: string
): Promise<void> {
  const closed = await closeLlmRunRow(client, {
    llm_run_id: llmRunId,
    outcome: "completed",
  });
  if (closed === null) {
    throw new InvariantError(
      `completeOperatorRun: llm_run ${llmRunId} was not running`
    );
  }
}

async function insertAcceptedNoteFragment(
  client: PoolClient,
  args: { llmRunId: string; reason: string; chunkId: string }
): Promise<string> {
  const fragment = await insertFragmentWithSources(client, {
    llm_run_id: args.llmRunId,
    text: args.reason,
    confidence: OPERATOR_NOTE_CONFIDENCE,
    chunk_ids: [args.chunkId],
  });
  const accepted = await acceptInformationFragment(client, fragment.id);
  if (accepted !== 1) {
    throw new InvariantError(
      `insertAcceptedNoteFragment: fragment ${fragment.id} was not proposed`
    );
  }
  return fragment.id;
}

interface NoteSource {
  readonly rawInformationId: string;
  readonly rawChunkId: string;
  readonly contentHash: string;
}

async function insertNoteSource(
  client: PoolClient,
  nodeId: string,
  content: string
): Promise<NoteSource> {
  const contentHash = sha256Hex(content);
  const raw = await insertRawInformation(client, {
    source_type: OPERATOR_NOTE_SOURCE_TYPE,
    content,
    content_hash: contentHash,
    metadata: { operator_note: true, node_id: nodeId },
  });
  const [chunk] = await insertRawChunks(client, raw.id, [
    wholeContentChunk(content),
  ]);
  if (chunk === undefined) {
    throw new InvariantError("insertNoteSource: no raw chunk returned");
  }
  return { rawInformationId: raw.id, rawChunkId: chunk.id, contentHash };
}

export async function recordOperatorNote(
  client: PoolClient,
  input: OperatorNoteInput
): Promise<OperatorNoteRecord> {
  const reason = input.reason.trim();
  const content = composeNoteContent(reason, input.editedAt, randomUUID());
  const source = await insertNoteSource(client, input.nodeId, content);
  const run = await openOperatorRun(
    client,
    source.rawInformationId,
    source.contentHash
  );
  const fragmentId = await insertAcceptedNoteFragment(client, {
    llmRunId: run.id,
    reason,
    chunkId: source.rawChunkId,
  });
  await completeOperatorRun(client, run.id);
  return {
    llmRunId: run.id,
    rawInformationId: source.rawInformationId,
    rawChunkId: source.rawChunkId,
    fragmentId,
  };
}
