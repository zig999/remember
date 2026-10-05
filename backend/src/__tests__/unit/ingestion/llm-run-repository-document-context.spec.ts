import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import {
  DocumentContextStatusSchema,
  type DocumentContext,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  findLlmRunById,
  recordDocumentContext,
  recordDocumentContextStatus,
} from "../../../modules/ingestion/repository/llm-run.repository.js";

const RUN_ID = "11111111-0000-4000-8000-0000000000a1";
const RAW_ID = "22222222-0000-4000-8000-0000000000b2";
const ASSIGNMENT = /^\s*(\w+)\s*=\s*\$(\d+)(?:::(\w+))?\s*$/;

const CONTEXT: DocumentContext = {
  summary: "Ata da reuniao do comite sobre a renovacao do contrato.",
  entities: [
    { node_type: "Person", names: ["Maria Souza", "M. Souza", "Maria"] },
    { node_type: "Organization", names: ["Acme Ltda", "Acme"] },
  ],
  model: "claude-haiku-4-5",
};

type StoredRun = Record<string, unknown>;

function applyAssignments(
  run: StoredRun,
  sql: string,
  params: unknown[]
): void {
  const set = /\bSET\b([\s\S]*?)\bWHERE\b/i.exec(sql);
  for (const part of (set?.[1] ?? "").split(",")) {
    const match = ASSIGNMENT.exec(part);
    if (match === null) continue;
    const [, column, position, cast] = match;
    if (column === undefined || position === undefined) continue;
    const raw = params[Number(position) - 1];
    const parsed: unknown =
      cast === "jsonb" && typeof raw === "string" ? JSON.parse(raw) : raw;
    run[column] = parsed;
  }
}

function listedColumns(sql: string): string[] {
  const list =
    /RETURNING([\s\S]*)$/i.exec(sql)?.[1] ??
    /\bSELECT\b([\s\S]*?)\bFROM\b/i.exec(sql)?.[1] ??
    "";
  return list
    .split(",")
    .map((column) => column.trim().split(/\s+/).pop() ?? "")
    .filter((column) => column !== "");
}

function buildRunStore(): PoolClient {
  const run: StoredRun = {
    id: RUN_ID,
    model: "claude-sonnet-4-5",
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
  const query = async (
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: StoredRun[]; rowCount: number }> => {
    if (params[0] !== run.id) return { rows: [], rowCount: 0 };
    if (/^\s*UPDATE/i.test(sql)) applyAssignments(run, sql, params);
    const row = Object.fromEntries(
      listedColumns(sql).map((column) => [column, structuredClone(run[column])])
    );
    return { rows: [row], rowCount: 1 };
  };
  return { query, release: () => undefined } as unknown as PoolClient;
}

describe("a run whose document context was recorded", () => {
  it("reads back with the summary of that context", async () => {
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: CONTEXT,
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context?.summary).toBe(CONTEXT.summary);
  });

  it("reads back with the node type of each listed entity", async () => {
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: CONTEXT,
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context?.entities.map((e) => e.node_type)).toEqual([
      "Person",
      "Organization",
    ]);
  });
});

describe("a run whose document context was recorded, entity names and model", () => {
  it("reads back with the names of each listed entity", async () => {
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: CONTEXT,
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context?.entities.map((e) => e.names)).toEqual([
      ["Maria Souza", "M. Souza", "Maria"],
      ["Acme Ltda", "Acme"],
    ]);
  });

  it("reads back with the model that produced the context", async () => {
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: CONTEXT,
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context?.model).toBe("claude-haiku-4-5");
  });
});

describe("a run whose document context was recorded, whole", () => {
  it("reads back the document context with its summary, every entity and its model", async () => {
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: CONTEXT,
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context).toEqual(CONTEXT);
  });
});

describe("a run whose document context lists an entity", () => {
  it("reads back an entity with its one node type and all of its names in the recorded order", async () => {
    const entity = {
      node_type: "Event",
      names: ["Assembleia geral", "AG 2026", "assembleia"],
    };
    const client = buildRunStore();
    await recordDocumentContext(client, {
      llm_run_id: RUN_ID,
      document_context: { summary: "Convocacao.", entities: [entity], model: "m" },
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context?.entities).toEqual([entity]);
  });
});

describe("a run's document context status", () => {
  it("reads back with the status that was recorded", async () => {
    const client = buildRunStore();
    await recordDocumentContextStatus(client, {
      llm_run_id: RUN_ID,
      document_context_status: "too-long",
    });

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context_status).toBe("too-long");
  });

  it("reads back holding no document context when none was recorded", async () => {
    const client = buildRunStore();

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context).toBeNull();
  });

  it("reads back holding no document context status when none was recorded", async () => {
    const client = buildRunStore();

    const run = await findLlmRunById(client, RUN_ID);

    expect(run?.document_context_status).toBeNull();
  });
});

describe("the document context status enumeration", () => {
  it("accepts produced, single-chunk, too-long and failed and nothing else", () => {
    const candidates = [
      "produced",
      "single-chunk",
      "too-long",
      "failed",
      "pending",
      "",
      "Produced",
      "single_chunk",
      "too_long",
      "skipped",
    ];

    const accepted = candidates.filter(
      (candidate) => DocumentContextStatusSchema.safeParse(candidate).success
    );

    expect(accepted).toEqual(["produced", "single-chunk", "too-long", "failed"]);
  });
});
