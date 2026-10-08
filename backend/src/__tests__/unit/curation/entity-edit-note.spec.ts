import type { PoolClient } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  recordOperatorNote,
  type OperatorNoteInput,
} from "../../../modules/curation/service/entity-edit-note.js";

const NODE_ID = "33333333-0000-4000-8000-0000000000c3";
const REASON = "corrigido apos conferir o contrato assinado";
const EDITED_DATE = "2026-10-07";
const EDITED_TIME = "14:35:09";
const EDITED_AT = new Date(`${EDITED_DATE}T${EDITED_TIME}.000Z`);
const PADDING = "\t\t";
const OTHER_RUN_ID = "99999999-0000-4000-8000-000000000001";
const OTHER_RAW_ID = "99999999-0000-4000-8000-000000000002";

type Row = Record<string, unknown>;

interface Store {
  rawInformation: Row[];
  rawChunk: Row[];
  llmRun: Row[];
  fragment: Row[];
  fragmentSource: Row[];
}

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface Context {
  readonly store: Store;
  readonly nextId: () => string;
}

type Statement = (context: Context, params: unknown[]) => QueryResult;

function emptyStore(): Store {
  return {
    rawInformation: [],
    rawChunk: [],
    llmRun: [],
    fragment: [],
    fragmentSource: [],
  };
}

function insertRow(table: Row[], row: Row): QueryResult {
  table.push(row);
  return { rows: [structuredClone(row)], rowCount: 1 };
}

function rejectDuplicate(
  table: readonly Row[],
  column: string,
  value: unknown
): void {
  if (table.some((row) => row[column] === value)) {
    throw new Error(`duplicate key value violates unique constraint ${column}`);
  }
}

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function insertRawInformationStatement(
  { store, nextId }: Context,
  params: unknown[]
): QueryResult {
  const [sourceType, content, contentHash, metadata] = params;
  const parsedMetadata: unknown = JSON.parse(String(metadata));
  rejectDuplicate(store.rawInformation, "content_hash", contentHash);
  return insertRow(store.rawInformation, {
    id: nextId(),
    source_type: sourceType,
    content,
    content_hash: contentHash,
    metadata: parsedMetadata,
  });
}

function insertRawChunkStatement(
  { store, nextId }: Context,
  params: unknown[]
): QueryResult {
  const [rawId, indices, texts, starts, ends, versions] = params;
  const rows = listOf(indices).map((chunkIndex, position) => ({
    id: nextId(),
    raw_information_id: rawId,
    chunk_index: chunkIndex,
    text: listOf(texts)[position],
    offset_start: listOf(starts)[position],
    offset_end: listOf(ends)[position],
    chunking_version: listOf(versions)[position],
  }));
  store.rawChunk.push(...rows);
  return { rows: structuredClone(rows), rowCount: rows.length };
}

function insertLlmRunStatement(
  { store, nextId }: Context,
  params: unknown[]
): QueryResult {
  const [model, promptVersion, rawId, idempotencyKey] = params;
  rejectDuplicate(store.llmRun, "idempotency_key", idempotencyKey);
  return insertRow(store.llmRun, {
    id: nextId(),
    model,
    prompt_version: promptVersion,
    input_raw_information_id: rawId,
    idempotency_key: idempotencyKey,
    status: "running",
    finished_at: null,
  });
}

function insertFragmentStatement(
  { store, nextId }: Context,
  params: unknown[]
): QueryResult {
  const [runId, text, confidence] = params;
  return insertRow(store.fragment, {
    id: nextId(),
    llm_run_id: runId,
    text,
    confidence,
    status: "proposed",
  });
}

function insertFragmentSourceStatement(
  { store }: Context,
  params: unknown[]
): QueryResult {
  const [fragmentId, chunkIds] = params;
  const ids = listOf(chunkIds);
  for (const chunkId of ids) {
    store.fragmentSource.push({ fragment_id: fragmentId, raw_chunk_id: chunkId });
  }
  return { rows: [], rowCount: ids.length };
}

function acceptFragmentStatement(
  { store }: Context,
  params: unknown[]
): QueryResult {
  const fragment = store.fragment.find(
    (row) => row.id === params[0] && row.status === "proposed"
  );
  if (fragment === undefined) return { rows: [], rowCount: 0 };
  fragment.status = "accepted";
  return { rows: [{ id: fragment.id }], rowCount: 1 };
}

function closeRunStatement({ store }: Context, params: unknown[]): QueryResult {
  const run = store.llmRun.find(
    (row) => row.id === params[0] && row.status === "running"
  );
  if (run === undefined) return { rows: [], rowCount: 0 };
  run.status = params[1];
  run.finished_at = new Date();
  return { rows: [structuredClone(run)], rowCount: 1 };
}

const STATEMENTS: ReadonlyArray<readonly [RegExp, Statement]> = [
  [/^\s*INSERT INTO raw_information\b/i, insertRawInformationStatement],
  [/^\s*INSERT INTO raw_chunk\b/i, insertRawChunkStatement],
  [/^\s*INSERT INTO llm_run\b/i, insertLlmRunStatement],
  [/^\s*INSERT INTO information_fragment\b/i, insertFragmentStatement],
  [/^\s*INSERT INTO fragment_source\b/i, insertFragmentSourceStatement],
  [/^\s*UPDATE information_fragment\b/i, acceptFragmentStatement],
  [/^\s*UPDATE llm_run\b/i, closeRunStatement],
];

function buildStore(seed: Partial<Store> = {}): {
  client: PoolClient;
  store: Store;
} {
  const store: Store = { ...emptyStore(), ...structuredClone(seed) };
  let sequence = 0;
  const nextId = (): string =>
    `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult> => {
    const statement = STATEMENTS.find(([pattern]) => pattern.test(sql));
    if (statement === undefined) {
      throw new Error(`statement outside the note's records: ${sql}`);
    }
    return statement[1]({ store, nextId }, params);
  };
  return { client: { query } as unknown as PoolClient, store };
}

function seededOtherRun(): Partial<Store> {
  return {
    rawInformation: [
      {
        id: OTHER_RAW_ID,
        source_type: "pdf",
        content: "documento ja ingerido",
        content_hash: "b".repeat(64),
        metadata: {},
      },
    ],
    llmRun: [
      {
        id: OTHER_RUN_ID,
        model: "claude-sonnet-4-5",
        prompt_version: "v5",
        input_raw_information_id: OTHER_RAW_ID,
        idempotency_key: "c".repeat(64),
        status: "running",
        finished_at: null,
      },
    ],
  };
}

function noteInput(reason: string = REASON): OperatorNoteInput {
  return { nodeId: NODE_ID, reason, editedAt: EDITED_AT };
}

function only(rows: readonly Row[]): Row {
  const [row] = rows;
  if (row === undefined) throw new Error("expected one recorded row");
  return row;
}

const COMPLETED_OPERATOR_RUN = {
  model: "operator",
  prompt_version: "operator-edit-v1",
  status: "completed",
};

function describeRuns(store: Store): Row[] {
  return store.llmRun.map((run) => ({
    model: run.model,
    prompt_version: run.prompt_version,
    status: run.status,
  }));
}

function describeNote(store: Store): Row {
  const chunk = only(store.rawChunk);
  const fragment = only(store.fragment);
  return {
    rawInformations: store.rawInformation.length,
    chunks: store.rawChunk.length,
    chunkOf: chunk.raw_information_id,
    chunkText: chunk.text,
    chunkSpan: [chunk.offset_start, chunk.offset_end],
    fragments: store.fragment.length,
    fragmentStatus: fragment.status,
    fragmentText: fragment.text,
    fragmentAnchors: store.fragmentSource.map((source) => [
      source.fragment_id,
      source.raw_chunk_id,
    ]),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the run an entity edit's note opens", () => {
  it("is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput());

    expect({
      runs: describeRuns(store),
      networkCalls: fetchSpy.mock.calls.length,
    }).toEqual({ runs: [COMPLETED_OPERATOR_RUN], networkCalls: 0 });
  });
});

describe("the raw information an entity edit's note records", () => {
  it("has source type other and metadata of operator_note true and the edited node's identity under node_id", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput());

    const observed = store.rawInformation.map((raw) => ({
      source_type: raw.source_type,
      metadata: raw.metadata,
    }));
    expect(observed).toEqual([
      {
        source_type: "outro",
        metadata: { operator_note: true, node_id: NODE_ID },
      },
    ]);
  });

  it("holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput());
    await recordOperatorNote(client, noteInput());

    const contents = store.rawInformation.map((raw) => String(raw.content));
    const observed = {
      notes: contents.length,
      holdingReason: contents.filter((c) => c.includes(REASON)).length,
      holdingDate: contents.filter((c) => c.includes(EDITED_DATE)).length,
      holdingTime: contents.filter((c) => c.includes(EDITED_TIME)).length,
      distinctContents: new Set(contents).size,
    };
    expect(observed).toEqual({
      notes: 2,
      holdingReason: 2,
      holdingDate: 2,
      holdingTime: 2,
      distinctContents: 2,
    });
  });
});

describe("what an entity edit's note records", () => {
  it("is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput());

    const raw = only(store.rawInformation);
    const chunk = only(store.rawChunk);
    const fragment = only(store.fragment);
    expect(describeNote(store)).toEqual({
      rawInformations: 1,
      chunks: 1,
      chunkOf: raw.id,
      chunkText: raw.content,
      chunkSpan: [0, String(raw.content).length],
      fragments: 1,
      fragmentStatus: "accepted",
      fragmentText: REASON,
      fragmentAnchors: [[fragment.id, chunk.id]],
    });
  });

  it("records the information fragment at confidence 1.0", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput());

    expect(store.fragment.map((fragment) => fragment.confidence)).toEqual([1.0]);
  });
});

describe("the run that holds an entity edit's note", () => {
  it("is the run the edit opened, never a run that already existed, for both the fragment and the raw information it is anchored in", async () => {
    const { client, store } = buildStore(seededOtherRun());

    await recordOperatorNote(client, noteInput());

    const noteRaw = only(
      store.rawInformation.filter((raw) => raw.id !== OTHER_RAW_ID)
    );
    const fragmentRun = store.llmRun.find(
      (run) => run.id === only(store.fragment).llm_run_id
    );
    const observed = {
      fragmentRunModel: fragmentRun?.model,
      fragmentRunPromptVersion: fragmentRun?.prompt_version,
      rawInformationOfThatRun: fragmentRun?.input_raw_information_id,
    };
    expect(observed).toEqual({
      fragmentRunModel: "operator",
      fragmentRunPromptVersion: "operator-edit-v1",
      rawInformationOfThatRun: noteRaw.id,
    });
  });
});

describe("a reason with whitespace around it", () => {
  it("is recorded as the information fragment's text without that whitespace", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput(`${PADDING}${REASON}${PADDING}`));

    expect(store.fragment.map((fragment) => fragment.text)).toEqual([REASON]);
  });

  it("is recorded in the raw information's content without that whitespace on either side", async () => {
    const { client, store } = buildStore();

    await recordOperatorNote(client, noteInput(`${PADDING}${REASON}${PADDING}`));

    const content = String(only(store.rawInformation).content);
    expect({
      whitespaceBefore: content.includes(`${PADDING}${REASON}`),
      whitespaceAfter: content.includes(`${REASON}${PADDING}`),
    }).toEqual({ whitespaceBefore: false, whitespaceAfter: false });
  });
});
