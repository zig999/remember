import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type {
  DocumentContext,
  DocumentContextStatus,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  produceDocumentContext,
  type ContextReader,
} from "../../../modules/ingestion/service/preliminary-reading.js";

const RUN_ID = "55555555-5555-4555-8555-555555555555";
const CONTEXT_MODEL = "claude-context-under-test";
const FIRST_READING_VERSION = "v5";
const LATER_VERSION = "v6";
const SEVERAL_CHUNKS = 3;
const OVER_LIMIT_UNITS = 100_001;
const HELD_STATUS: DocumentContextStatus = "produced";

const HELD_CONTEXT: DocumentContext = {
  summary: "Contexto ja produzido para o documento.",
  entities: [],
  model: CONTEXT_MODEL,
};

const CATALOG = buildSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

interface Store {
  status: DocumentContextStatus | null;
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

function buildReader(): ContextReader {
  return {
    messages: {
      stream: () => ({
        finalMessage: async (): Promise<Anthropic.Messages.Message> => {
          throw new Error("no preliminary reading is expected for a run holding a context");
        },
      }),
    },
  };
}

async function statusAfterExtraction(promptVersion: string): Promise<DocumentContextStatus | null> {
  const store: Store = { status: HELD_STATUS };
  await produceDocumentContext({
    pool: buildPool(store),
    anthropic: buildReader(),
    catalog: CATALOG,
    logger: pino({ level: "silent" }),
    model: CONTEXT_MODEL,
    run: { id: RUN_ID, prompt_version: promptVersion, document_context: HELD_CONTEXT },
    chunkCount: SEVERAL_CHUNKS,
    content: "x".repeat(OVER_LIMIT_UNITS),
  });
  return store.status;
}

it("leaves the held document context status unchanged when a run holding a document context is extracted under v5 and under a later prompt version", async () => {
  const wanted = {
    [FIRST_READING_VERSION]: HELD_STATUS,
    [LATER_VERSION]: HELD_STATUS,
  };

  const observed = {
    [FIRST_READING_VERSION]: await statusAfterExtraction(FIRST_READING_VERSION),
    [LATER_VERSION]: await statusAfterExtraction(LATER_VERSION),
  };

  expect(observed).toEqual(wanted);
});
