import type { Pool } from "pg";

import type {
  DocumentContext,
  DocumentContextStatus,
  LlmRunStatus,
} from "../../../modules/ingestion/dto/llm-run.dto.js";

export const RUN_ID = "44444444-4444-4444-8444-444444444444";
export const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";

export const DOCUMENT_CONTEXT: DocumentContext = {
  summary: "Ata da reuniao do comite sobre a renovacao do contrato com a Acme.",
  entities: [
    { node_type: "Person", names: ["Maria Souza", "M. Souza", "Maria"] },
    { node_type: "Organization", names: ["Acme Ltda", "Acme"] },
  ],
  model: "claude-haiku-4-5",
};

export interface HeldDocumentContext {
  readonly status: DocumentContextStatus | null;
  readonly context: DocumentContext | null;
}

export const HOLDS_NONE: HeldDocumentContext = { status: null, context: null };

export interface RunRowArgs {
  readonly status: LlmRunStatus;
  readonly prompt_version: string;
  readonly held: HeldDocumentContext;
}

export function llmRunRow(args: RunRowArgs): Record<string, unknown> {
  return {
    id: RUN_ID,
    model: "claude-sonnet-4-5",
    prompt_version: args.prompt_version,
    started_at: new Date("2026-10-05T12:00:00Z"),
    finished_at:
      args.status === "running" ? null : new Date("2026-10-05T12:05:00Z"),
    status: args.status,
    attempts: 1,
    input_raw_information_id: RAW_INFO_ID,
    idempotency_key: "a".repeat(64),
    document_context: args.held.context,
    document_context_status: args.held.status,
  };
}

function readAnswer(sql: string, args: RunRowArgs): unknown[] {
  if (sql.includes("GROUP BY validation_outcome")) return [];
  if (sql.includes("FROM information_fragment")) return [{ n: 0 }];
  if (sql.includes("FROM llm_run")) return [llmRunRow(args)];
  return [];
}

export function runReadPool(args: RunRowArgs): Pool {
  const client = {
    query: async (...queryArgs: unknown[]) => {
      const sql = String(queryArgs[0]).replace(/\s+/g, " ").trim();
      const rows = readAnswer(sql, args);
      return { rows, rowCount: rows.length };
    },
    release: () => undefined,
  };
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
}
