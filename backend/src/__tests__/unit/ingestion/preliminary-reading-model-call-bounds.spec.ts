import { afterEach, expect, it, vi } from "vitest";
import pino from "pino";
import { z } from "zod";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { runLlmExtraction } from "../../../modules/ingestion/service/extraction.service.js";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const RAW_ID = "55555555-5555-4555-8555-555555555555";
const NODE_TYPE_PERSON = "00000000-0000-4000-8000-000000000001";
const RUN_MODEL = "claude-opus-4-8";
const CONTEXT_MODEL = "claude-context-under-test";
const ENV = { ANTHROPIC_API_KEY: "sk-ant-test", CONTEXT_MODEL } as const;

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;
const MAX_DRAIN_MINUTES = 240;
const MAX_ATTEMPTS_OF_ONE_CALL = 3;
const OVERLOADED_STATUS = 529;
const CHUNK_TEXTS = ["first chunk body", "second chunk body", "third chunk body"];
const CONTENT = CHUNK_TEXTS.join("\n");

interface QueryResult {
  rows: object[];
  rowCount: number;
}

interface Attempt {
  readonly model: string;
  readonly signal: AbortSignal;
  readonly startedAt: number;
  abortedAt?: number;
}

interface Extraction {
  done: boolean;
  failure?: unknown;
}

interface CallBounds {
  called: boolean;
  attemptsAtMostThree: boolean;
  abandonedWithinFiveMinutes: boolean;
}

const RequestBodySchema = z.object({ model: z.string() });

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const EMPTY_RESULT: QueryResult = { rows: [], rowCount: 0 };

function rowsOf(...rows: object[]): QueryResult {
  return { rows, rowCount: rows.length };
}

function runRow(): object {
  return {
    id: RUN_ID,
    model: RUN_MODEL,
    prompt_version: "v5",
    started_at: new Date("2026-10-05T12:00:00Z"),
    finished_at: null,
    status: "running",
    attempts: 1,
    input_raw_information_id: RAW_ID,
    idempotency_key: "a".repeat(64),
    document_context: null,
    document_context_status: null,
  };
}

function rawRow(): object {
  return {
    id: RAW_ID,
    source_type: "transcricao",
    content: CONTENT,
    storage_ref: null,
    content_hash: "f".repeat(64),
    received_at: new Date("2026-10-05T12:00:00Z"),
    metadata: { document_date: "2026-09-30", title: "Test doc" },
  };
}

function chunkRows(): object[] {
  return CHUNK_TEXTS.map((text, index) => ({
    id: `66666666-6666-4666-8666-66666666660${index}`,
    raw_information_id: RAW_ID,
    chunk_index: index,
    text,
    offset_start: 0,
    offset_end: text.length,
    locator: null,
    chunking_version: "v1",
  }));
}

function answer(sql: string): QueryResult {
  if (sql.startsWith("UPDATE llm_run")) return rowsOf(runRow());
  if (sql.includes("FROM llm_run")) return rowsOf(runRow());
  if (sql.includes("FROM raw_information")) return rowsOf(rawRow());
  if (sql.includes("FROM raw_chunk")) return rowsOf(...chunkRows());
  return EMPTY_RESULT;
}

function buildPool(): Pool {
  const client = {
    query: async (...args: unknown[]): Promise<QueryResult> =>
      answer(String(args[0]).replace(/\s+/g, " ").trim()),
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function attemptOf(init: RequestInit | undefined): Attempt {
  const { model } = RequestBodySchema.parse(JSON.parse(String(init?.body)));
  if (init?.signal == null) throw new Error("the model call carried no abort signal");
  const attempt: Attempt = { model, signal: init.signal, startedAt: Date.now() };
  init.signal.addEventListener("abort", () => {
    attempt.abortedAt = Date.now();
  });
  return attempt;
}

function neverAnsweringFetch(attempts: Attempt[]): typeof fetch {
  return (_input, init) => {
    const attempt = attemptOf(init);
    attempts.push(attempt);
    return new Promise<Response>((_resolve, reject) => {
      attempt.signal.addEventListener(
        "abort",
        () => reject(new DOMException("The operation was aborted.", "AbortError")),
        { once: true }
      );
    });
  };
}

function overloadedFetch(attempts: Attempt[]): typeof fetch {
  const body = JSON.stringify({
    type: "error",
    error: { type: "overloaded_error", message: "Overloaded" },
  });
  return async (_input, init) => {
    attempts.push(attemptOf(init));
    return new Response(body, {
      status: OVERLOADED_STATUS,
      headers: { "content-type": "application/json" },
    });
  };
}

function startExtraction(stub: typeof fetch): Extraction {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", stub);
  const extraction: Extraction = { done: false };
  runLlmExtraction(buildPool(), RUN_ID, pino({ level: "silent" }), CATALOG, {
    env: ENV,
  })
    .catch((failure: unknown) => {
      extraction.failure = failure;
    })
    .finally(() => {
      extraction.done = true;
    });
  return extraction;
}

async function untilFinished(extraction: Extraction): Promise<void> {
  for (let minute = 0; minute < MAX_DRAIN_MINUTES && !extraction.done; minute += 1) {
    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MS);
  }
}

function boundsOf(attempts: readonly Attempt[], model: string): CallBounds {
  const own = attempts.filter((attempt) => attempt.model === model);
  const waits = own.map(
    (attempt) => (attempt.abortedAt ?? Number.POSITIVE_INFINITY) - attempt.startedAt
  );
  return {
    called: own.length >= 1,
    attemptsAtMostThree: own.length <= MAX_ATTEMPTS_OF_ONE_CALL,
    abandonedWithinFiveMinutes: Math.max(...waits) <= FIVE_MINUTES_MS,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("abandons a model call that never answers within five minutes and attempts it at most three times, for the preliminary reading and for a chunk alike", async () => {
  const attempts: Attempt[] = [];
  const extraction = startExtraction(neverAnsweringFetch(attempts));

  await untilFinished(extraction);

  const bounds = {
    reading: boundsOf(attempts, CONTEXT_MODEL),
    firstChunk: boundsOf(attempts, RUN_MODEL),
  };
  const bounded: CallBounds = {
    called: true,
    attemptsAtMostThree: true,
    abandonedWithinFiveMinutes: true,
  };
  expect(bounds).toEqual({ reading: bounded, firstChunk: bounded });
});

it("calls the context model exactly three times for one preliminary reading when it answers a retryable error on every attempt", async () => {
  const attempts: Attempt[] = [];
  const extraction = startExtraction(overloadedFetch(attempts));

  await untilFinished(extraction);

  const readingAttempts = attempts.filter((attempt) => attempt.model === CONTEXT_MODEL);
  expect(readingAttempts).toHaveLength(MAX_ATTEMPTS_OF_ONE_CALL);
});
