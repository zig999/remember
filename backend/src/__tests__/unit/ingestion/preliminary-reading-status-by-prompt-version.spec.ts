import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type { DocumentContextStatus } from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  produceDocumentContext,
  type ContextReader,
} from "../../../modules/ingestion/service/preliminary-reading.js";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const CONTEXT_MODEL = "claude-context-under-test";
const V5_AND_LATER = ["v5", "v6", "v10"];
const CONTENT_LIMIT_UNITS = 100_000;
const OVER_LIMIT_UNITS = CONTENT_LIMIT_UNITS + 1;
const SHORT_CONTENT_UNITS = 100;
const SINGLE_CHUNK = 1;
const SEVERAL_CHUNKS = 3;
const ASTRAL_CHARACTER = "\u{1F600}";
const READING_ANSWER = JSON.stringify({ summary: "Ata de reuniao.", entities: [] });

const CATALOG = buildSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

interface Shape {
  readonly chunkCount: number;
  readonly content: string;
  readonly readingFails?: boolean;
}

interface Store {
  status: DocumentContextStatus | null;
}

function contentOfUnits(units: number): string {
  return "x".repeat(units);
}

function astralContentOneUnitPastTheLimit(): string {
  return "x" + ASTRAL_CHARACTER.repeat((OVER_LIMIT_UNITS - 1) / 2);
}

function buildPool(store: Store): Pool {
  const client = {
    query: async (sql: string, params: unknown[] = []): Promise<{ rows: object[] }> => {
      if (/SET document_context_status/.test(sql.replace(/\s+/g, " "))) {
        store.status = params[1] as DocumentContextStatus;
      }
      return { rows: [{}] };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function buildReader(shape: Shape): ContextReader {
  return {
    messages: {
      stream: () => ({
        finalMessage: async (): Promise<Anthropic.Messages.Message> => {
          if (shape.readingFails === true) throw new Error("provider unavailable");
          return {
            content: [{ type: "text", text: READING_ANSWER, citations: null }],
          } as unknown as Anthropic.Messages.Message;
        },
      }),
    },
  };
}

async function statusRecorded(promptVersion: string, shape: Shape): Promise<DocumentContextStatus | null> {
  const store: Store = { status: null };
  await produceDocumentContext({
    pool: buildPool(store),
    anthropic: buildReader(shape),
    catalog: CATALOG,
    logger: pino({ level: "silent" }),
    model: CONTEXT_MODEL,
    run: { id: RUN_ID, prompt_version: promptVersion, document_context: null },
    chunkCount: shape.chunkCount,
    content: shape.content,
  });
  return store.status;
}

function shapes(): Record<string, Shape> {
  return {
    oneChunkWithinTheLimit: {
      chunkCount: SINGLE_CHUNK,
      content: contentOfUnits(SHORT_CONTENT_UNITS),
    },
    oneChunkPastTheLimit: {
      chunkCount: SINGLE_CHUNK,
      content: contentOfUnits(OVER_LIMIT_UNITS),
    },
    severalChunksAtTheLimit: {
      chunkCount: SEVERAL_CHUNKS,
      content: contentOfUnits(CONTENT_LIMIT_UNITS),
    },
    severalChunksOneUnitPastTheLimit: {
      chunkCount: SEVERAL_CHUNKS,
      content: contentOfUnits(OVER_LIMIT_UNITS),
    },
    severalChunksPastTheLimitInUnitsWithinItInCodePoints: {
      chunkCount: SEVERAL_CHUNKS,
      content: astralContentOneUnitPastTheLimit(),
    },
    severalChunksWhoseReadingFails: {
      chunkCount: SEVERAL_CHUNKS,
      content: contentOfUnits(SHORT_CONTENT_UNITS),
      readingFails: true,
    },
  };
}

async function statusesOf(promptVersion: string): Promise<Record<string, DocumentContextStatus | null>> {
  const statuses: Record<string, DocumentContextStatus | null> = {};
  for (const [name, shape] of Object.entries(shapes())) {
    statuses[name] = await statusRecorded(promptVersion, shape);
  }
  return statuses;
}

it("records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version", async () => {
  const expected = {
    oneChunkWithinTheLimit: "single-chunk",
    oneChunkPastTheLimit: "single-chunk",
    severalChunksAtTheLimit: "produced",
    severalChunksOneUnitPastTheLimit: "too-long",
    severalChunksPastTheLimitInUnitsWithinItInCodePoints: "too-long",
    severalChunksWhoseReadingFails: "failed",
  };
  const observed: Record<string, Record<string, DocumentContextStatus | null>> = {};
  const wanted: Record<string, Record<string, string>> = {};

  for (const promptVersion of V5_AND_LATER) {
    observed[promptVersion] = await statusesOf(promptVersion);
    wanted[promptVersion] = expected;
  }

  expect(observed).toEqual(wanted);
});
