import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type { DocumentContextStatus } from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  produceDocumentContext,
  type ContextReader,
} from "../../../modules/ingestion/service/preliminary-reading.js";

export const CONTENT_LIMIT_UNITS = 100_000;
export const ONE_CHUNK = 1;
export const SEVERAL_CHUNKS = 3;

const RUN_ID = "77777777-7777-4777-8777-777777777777";
const CONTEXT_MODEL = "claude-context-under-test";
const ASTRAL_CHARACTER = "\u{1F600}";
const UNITS_PER_ASTRAL_CHARACTER = 2;
const READING_ANSWER = JSON.stringify({
  summary: "Ata de reuniao.",
  entities: [],
});

const CATALOG = buildSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

export interface RunShape {
  readonly chunkCount: number;
  readonly content: string;
  readonly readingFails?: boolean;
}

interface Store {
  status: DocumentContextStatus | null;
}

export function contentOfUnits(units: number): string {
  return "x".repeat(units);
}

export function astralContentOfUnits(oddUnits: number): string {
  const astralCount = (oddUnits - 1) / UNITS_PER_ASTRAL_CHARACTER;
  return "x" + ASTRAL_CHARACTER.repeat(astralCount);
}

function poolRecordingStatusInto(store: Store): Pool {
  const client = {
    query: async (
      sql: string,
      params: unknown[] = []
    ): Promise<{ rows: object[] }> => {
      if (/SET document_context_status/.test(sql.replace(/\s+/g, " "))) {
        store.status = params[1] as DocumentContextStatus;
      }
      return { rows: [{}] };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function readerFor(shape: RunShape): ContextReader {
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

export async function statusRecordedOnRun(
  promptVersion: string,
  shape: RunShape
): Promise<DocumentContextStatus | null> {
  const store: Store = { status: null };
  await produceDocumentContext({
    pool: poolRecordingStatusInto(store),
    anthropic: readerFor(shape),
    catalog: CATALOG,
    logger: pino({ level: "silent" }),
    model: CONTEXT_MODEL,
    run: { id: RUN_ID, prompt_version: promptVersion, document_context: null },
    chunkCount: shape.chunkCount,
    content: shape.content,
  });
  return store.status;
}
