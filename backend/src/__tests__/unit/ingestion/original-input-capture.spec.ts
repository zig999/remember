// TC-01 / BR-34 — verbatim user-turn capture on chat-directed ingestion.
//
// What we encode here is the SHAPE of capture across the four layers the TC
// touches, not domain behaviour the other ingestion suites already pin down:
//
//   (a) handler invocation_context.source_excerpt='X' → orchestrator
//       receives sourceExcerpt='X' → ingestRawInformation receives
//       original_input='X'.
//   (b) handler WITHOUT invocation_context → orchestrator receives
//       sourceExcerpt undefined → ingestRawInformation receives
//       original_input=null.
//   (c) ingestion.service `IngestRawInformationRequest` accepts
//       original_input and forwards it to insertRawInformation. content_hash
//       is computed over `content` only (regression).
//   (d) repository insertRawInformation round-trips original_input through
//       RETURNING ('x' → 'x'; undefined → null).
//   (e) regression: two ingestRawInformation calls with same `content` but
//       different `original_input` produce the SAME content_hash and the
//       second hits the noop_existing branch (idempotency intact).
//
// Why these tests are a Rule-9 fit: each one would FLIP RED on the regression
// they encode (a confidence-style shorthand that drops the column from the
// INSERT, a service that mixes original_input into the hash, a handler that
// forwards undefined keys and trips exactOptionalPropertyTypes).

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import { CHUNKING_VERSION } from "../../../modules/ingestion/chunker/config.js";
import { sha256Hex } from "../../../modules/ingestion/hash.js";
import {
  ingestDirectedHandler,
  type IngestDirectedDeps,
  type IngestDirectedInvocationContext,
} from "../../../modules/ingestion/mcp/directed-ingest.handler.js";
import { insertRawInformation } from "../../../modules/ingestion/repository/ingestion.repository.js";
import { ingestRawInformation } from "../../../modules/ingestion/service/ingestion.service.js";

// ---------------------------------------------------------------------------
// Fixtures.
// ---------------------------------------------------------------------------

const VALID_DIRECTED_INPUT = {
  fragments: [{ ref: "f1", text: "Rodrigo lidera o Projeto Apollo." }],
  nodes: [
    { ref: "n_r", node_type: "Person", name: "Rodrigo" },
    { ref: "n_a", node_type: "Project", name: "Apollo" },
  ],
};

const logger = pino({ enabled: false });

function makeHandlerDeps(over: Partial<IngestDirectedDeps>): IngestDirectedDeps {
  return {
    pool: { connect: vi.fn() } as unknown as IngestDirectedDeps["pool"],
    logger,
    catalog: {} as unknown as IngestDirectedDeps["catalog"],
    ...over,
  };
}

/**
 * Build an `ok:true` directedIngestion stub that captures the deps object so
 * the test can assert on `sourceExcerpt`. The return value is shape-correct
 * but minimal — none of the orchestrator's wire fields matter for these
 * capture-shape tests.
 */
function buildDirectedStub(): {
  fn: NonNullable<IngestDirectedDeps["directedIngestion"]>;
  lastDeps: () => Record<string, unknown> | undefined;
} {
  let capturedDeps: Record<string, unknown> | undefined;
  const fn = vi.fn(async (_input: unknown, deps: unknown) => {
    capturedDeps = deps as Record<string, unknown>;
    return {
      ok: true as const,
      result: {
        outcome: "ingested" as const,
        raw_information_id: "raw-1",
        llm_run_id: "run-1",
        chunk_count: 1,
        run: {
          id: "run-1",
          model: "directed" as const,
          prompt_version: "directed-v1" as const,
          status: "completed" as const,
          started_at: "2026-06-27T00:00:00.000Z",
          finished_at: "2026-06-27T00:00:01.000Z",
          attempts: 1,
          input_raw_information_id: "raw-1",
          affected_nodes: [],
        },
        report: [],
        summary: {
          fragments: 0,
          nodes: 0,
          attributes: 0,
          links: 0,
          accepted: 0,
          consolidated: 0,
          superseded_previous: 0,
          needs_review: 0,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          dependency_failed: 0,
        },
      },
    };
  });
  return {
    fn: fn as unknown as NonNullable<IngestDirectedDeps["directedIngestion"]>,
    lastDeps: () => capturedDeps,
  };
}

// ---------------------------------------------------------------------------
// (a) (b) Handler → orchestrator: invocation_context propagation.
// ---------------------------------------------------------------------------

describe("ingestDirectedHandler — invocation_context propagation (TC-01)", () => {
  it("(a) forwards invocation_context.source_excerpt as deps.sourceExcerpt to the orchestrator", async () => {
    // WHY: this is the WHOLE point of Path 1 — the chat dispatch threads the
    // verbatim user turn through `invocation_context`, and the handler must
    // forward it as `sourceExcerpt` to the orchestrator. A regression that
    // dropped this would silently kill the §13 traceability fix.
    const stub = buildDirectedStub();
    const ctx: IngestDirectedInvocationContext = {
      source_excerpt: "Acompanahr o projeto Apollo",
    };

    const envelope = await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      ctx
    );

    expect(envelope.ok).toBe(true);
    const deps = stub.lastDeps();
    expect(deps).toBeDefined();
    expect(deps!.sourceExcerpt).toBe("Acompanahr o projeto Apollo");
  });

  it("(b) WITHOUT invocation_context: the handler OMITS sourceExcerpt (exactOptionalPropertyTypes contract)", async () => {
    // WHY: exactOptionalPropertyTypes is on — passing `sourceExcerpt: undefined`
    // would overwrite the orchestrator's default. The handler MUST omit the
    // key entirely so REST/MCP-direct callers (no chat dispatch) land null at
    // the persistence layer.
    const stub = buildDirectedStub();

    await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn })
      // No third argument — REST / MCP direct call shape.
    );

    const deps = stub.lastDeps();
    expect(deps).toBeDefined();
    expect("sourceExcerpt" in deps!).toBe(false);
  });

  it("(b') invocation_context with source_excerpt=undefined ALSO omits the key (no undefined leak)", async () => {
    // WHY: an upstream caller may build `invocation_context` with only some
    // fields populated. The handler MUST treat `source_excerpt: undefined`
    // exactly like a missing key — otherwise `exactOptionalPropertyTypes`
    // would clash.
    const stub = buildDirectedStub();

    await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      { source_excerpt: undefined }
    );

    const deps = stub.lastDeps();
    expect("sourceExcerpt" in deps!).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (c) Service: forwards original_input + content_hash unchanged.
// ---------------------------------------------------------------------------

/**
 * Minimal pg.Client fake that satisfies `ingestRawInformation` end-to-end and
 * records the params each repository call passed in. Recognises SQL by prefix
 * (identical strategy to `service.spec.ts`).
 */
function buildRecordingClient(): {
  client: import("pg").PoolClient;
  inserts: Array<{ original_input: string | null; content_hash: string; content: string }>;
} {
  const inserts: Array<{
    original_input: string | null;
    content_hash: string;
    content: string;
  }> = [];
  let nextId = 1;
  const byHash = new Map<string, { id: string; chunk_count: number }>();
  const llmRunsByKey = new Map<string, { id: string; idempotency_key: string }>();
  const chunks: Array<{
    id: string;
    raw_information_id: string;
    chunk_index: number;
  }> = [];
  const mkId = (prefix: string): string => {
    const n = (nextId++).toString(16).padStart(12, "0");
    return `${prefix}0000-0000-4000-8000-${n}`;
  };

  const client = {
    query: async (sqlRaw: unknown, paramsRaw?: unknown): Promise<unknown> => {
      const sql = String(sqlRaw).trim();
      const params = (paramsRaw as unknown[]) ?? [];

      if (sql.startsWith("INSERT INTO raw_information")) {
        const [source_type, content, content_hash, metadataJson, original_input] =
          params as [string, string, string, string, string | null];
        inserts.push({ original_input, content_hash, content });
        if (byHash.has(content_hash)) {
          const err = Object.assign(new Error("dup"), {
            code: "23505",
            constraint: "raw_information_content_hash_key",
          });
          throw err;
        }
        const id = mkId("aaaa");
        byHash.set(content_hash, { id, chunk_count: 0 });
        return {
          rows: [
            {
              id,
              source_type,
              content,
              storage_ref: null,
              content_hash,
              received_at: new Date("2026-06-27T00:00:00Z"),
              metadata: JSON.parse(metadataJson),
              original_input,
            },
          ],
          rowCount: 1,
        };
      }
      if (
        sql.startsWith("SELECT") &&
        sql.includes("FROM raw_information") &&
        sql.includes("content_hash = $1")
      ) {
        const rec = byHash.get(String(params[0]));
        if (rec === undefined) return { rows: [], rowCount: 0 };
        return {
          rows: [
            {
              id: rec.id,
              source_type: "chat",
              content: "irrelevant",
              storage_ref: null,
              content_hash: String(params[0]),
              received_at: new Date("2026-06-27T00:00:00Z"),
              metadata: {},
              original_input: null,
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.startsWith("INSERT INTO raw_chunk")) {
        const [rid, indices, texts] = params as [string, number[], string[]];
        const rows = indices.map((ci, i) => ({
          id: mkId("bbbb"),
          raw_information_id: rid,
          chunk_index: ci,
          text: texts[i],
          offset_start: 0,
          offset_end: (texts[i] ?? "").length,
          locator: null,
          chunking_version: CHUNKING_VERSION,
        }));
        for (const r of rows) chunks.push(r);
        const rec = byHash.get(
          [...byHash.entries()].find(([, v]) => v.id === rid)?.[0] ?? ""
        );
        if (rec !== undefined) rec.chunk_count = rows.length;
        return { rows, rowCount: rows.length };
      }
      if (
        sql.startsWith("SELECT count(*)") &&
        sql.includes("FROM raw_chunk")
      ) {
        const rid = String(params[0]);
        const n = chunks.filter((c) => c.raw_information_id === rid).length;
        return { rows: [{ n: String(n) }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO llm_run")) {
        const [model, prompt_version, input_raw_information_id, idempotency_key] =
          params as [string, string, string, string];
        if (llmRunsByKey.has(idempotency_key)) {
          const err = Object.assign(new Error("dup"), {
            code: "23505",
            constraint: "llm_run_idempotency_key_key",
          });
          throw err;
        }
        const id = mkId("cccc");
        llmRunsByKey.set(idempotency_key, { id, idempotency_key });
        return {
          rows: [
            {
              id,
              model,
              prompt_version,
              started_at: new Date("2026-06-27T00:00:01Z"),
              finished_at: null,
              status: "running",
              attempts: 1,
              input_raw_information_id,
              idempotency_key,
            },
          ],
          rowCount: 1,
        };
      }
      if (
        sql.startsWith("SELECT") &&
        sql.includes("FROM llm_run") &&
        sql.includes("idempotency_key = $1")
      ) {
        const rec = llmRunsByKey.get(String(params[0]));
        if (rec === undefined) return { rows: [], rowCount: 0 };
        return {
          rows: [
            {
              id: rec.id,
              model: "directed",
              prompt_version: "directed-v1",
              started_at: new Date(),
              finished_at: null,
              status: "running",
              attempts: 1,
              input_raw_information_id: "x",
              idempotency_key: rec.idempotency_key,
            },
          ],
          rowCount: 1,
        };
      }
      throw new Error(`unknown SQL in recording client: ${sql.slice(0, 80)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;

  return { client, inserts };
}

describe("ingestRawInformation — original_input pass-through (TC-01)", () => {
  const baseInput = {
    source_type: "chat" as const,
    content: "[f1] Rodrigo lidera o Projeto Apollo.\n-- nonce=abc",
    metadata: {},
    model: "directed",
    prompt_version: "directed-v1",
  };

  it("(c) forwards original_input to insertRawInformation when provided", async () => {
    const { client, inserts } = buildRecordingClient();
    const result = await ingestRawInformation(client, {
      ...baseInput,
      original_input: "Acompanahr o projeto Apollo",
    });
    expect(result.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.original_input).toBe("Acompanahr o projeto Apollo");
  });

  it("(c') persists null when original_input is undefined (omitted)", async () => {
    const { client, inserts } = buildRecordingClient();
    await ingestRawInformation(client, baseInput);
    expect(inserts[0]!.original_input).toBeNull();
  });

  it("(c'') persists null when original_input is explicitly null", async () => {
    const { client, inserts } = buildRecordingClient();
    await ingestRawInformation(client, { ...baseInput, original_input: null });
    expect(inserts[0]!.original_input).toBeNull();
  });

  it("(c.regression) content_hash is sha256(content) — original_input does NOT participate", async () => {
    // WHY: this is the FROZEN invariant of TC-01. If a careless refactor mixes
    // original_input into the hash, idempotency breaks (the chat operator
    // would create a new `RawInformation` row each turn even on
    // re-affirmation). Hard-pin: hash of inserted row equals sha256(content).
    const { client, inserts } = buildRecordingClient();
    await ingestRawInformation(client, {
      ...baseInput,
      original_input: "anything verbatim",
    });
    expect(inserts[0]!.content_hash).toBe(sha256Hex(baseInput.content));
  });

  it("(f) two calls — same content, different original_input — share content_hash and the second hits noop_existing", async () => {
    // WHY: this is the linchpin promise of the design. The chat operator can
    // re-affirm with a slightly different turn ("ok", "ok!", "Yes") and the
    // system MUST still consolidate (noop_existing path), not duplicate.
    const { client, inserts } = buildRecordingClient();
    const first = await ingestRawInformation(client, {
      ...baseInput,
      original_input: "Acompanahr o projeto Apollo",
    });
    expect(first.status).toBe(201);
    expect(first.body.outcome).toBe("created");

    const second = await ingestRawInformation(client, {
      ...baseInput,
      original_input: "Re-afirmar Apollo",
    });
    expect(second.status).toBe(200);
    expect(second.body.outcome).toBe("noop_existing");

    expect(inserts).toHaveLength(2); // both attempts hit the INSERT (the 2nd raises 23505).
    expect(inserts[0]!.content_hash).toBe(inserts[1]!.content_hash);
    expect(inserts[0]!.original_input).toBe("Acompanahr o projeto Apollo");
    expect(inserts[1]!.original_input).toBe("Re-afirmar Apollo");
  });
});

// ---------------------------------------------------------------------------
// (d) (e) Repository round-trip.
// ---------------------------------------------------------------------------

describe("insertRawInformation — original_input column round-trip (TC-01)", () => {
  function buildSqlCaptureClient(): {
    client: import("pg").PoolClient;
    lastSql: () => string | undefined;
    lastParams: () => unknown[] | undefined;
    setNextReturn: (row: Record<string, unknown>) => void;
  } {
    let lastSql: string | undefined;
    let lastParams: unknown[] | undefined;
    let nextReturn: Record<string, unknown> = {};
    const client = {
      query: async (sqlRaw: unknown, paramsRaw?: unknown): Promise<unknown> => {
        lastSql = String(sqlRaw);
        lastParams = (paramsRaw as unknown[]) ?? [];
        return { rows: [nextReturn], rowCount: 1 };
      },
      release: () => undefined,
    } as unknown as import("pg").PoolClient;
    return {
      client,
      lastSql: () => lastSql,
      lastParams: () => lastParams,
      setNextReturn: (row) => {
        nextReturn = row;
      },
    };
  }

  it("(d) emits original_input in the INSERT column list and RETURNING clause", async () => {
    // WHY: pin the wire-shape of the SQL so a regression that quietly removes
    // the column from the INSERT (or from RETURNING) flips this test red.
    const cap = buildSqlCaptureClient();
    cap.setNextReturn({
      id: "00000000-0000-4000-8000-000000000001",
      source_type: "chat",
      content: "x",
      storage_ref: null,
      content_hash: "a".repeat(64),
      received_at: new Date(),
      metadata: {},
      original_input: "verbatim",
    });

    const row = await insertRawInformation(cap.client, {
      source_type: "chat",
      content: "x",
      content_hash: "a".repeat(64),
      metadata: {},
      original_input: "verbatim",
    });

    expect(cap.lastSql()).toMatch(/INSERT INTO raw_information/);
    expect(cap.lastSql()).toMatch(/original_input/);
    expect(cap.lastSql()).toMatch(/RETURNING[\s\S]*original_input/);
    expect(cap.lastParams()).toEqual([
      "chat",
      "x",
      "a".repeat(64),
      JSON.stringify({}),
      "verbatim",
    ]);
    expect(row.original_input).toBe("verbatim");
  });

  it("(e) emits NULL (not undefined) for $5 when original_input is omitted", async () => {
    // WHY: pg silently coerces `undefined` into `null` in some versions but
    // raises in others — relying on that is fragile. The repo MUST normalise
    // to explicit `null`.
    const cap = buildSqlCaptureClient();
    cap.setNextReturn({
      id: "00000000-0000-4000-8000-000000000002",
      source_type: "chat",
      content: "x",
      storage_ref: null,
      content_hash: "a".repeat(64),
      received_at: new Date(),
      metadata: {},
      original_input: null,
    });

    const row = await insertRawInformation(cap.client, {
      source_type: "chat",
      content: "x",
      content_hash: "a".repeat(64),
      metadata: {},
      // original_input omitted
    });

    const params = cap.lastParams()!;
    expect(params[4]).toBeNull(); // explicit null, not undefined.
    expect(row.original_input).toBeNull();
  });

  it("(e') emits NULL when original_input is explicitly null", async () => {
    const cap = buildSqlCaptureClient();
    cap.setNextReturn({
      id: "00000000-0000-4000-8000-000000000003",
      source_type: "chat",
      content: "x",
      storage_ref: null,
      content_hash: "a".repeat(64),
      received_at: new Date(),
      metadata: {},
      original_input: null,
    });

    const row = await insertRawInformation(cap.client, {
      source_type: "chat",
      content: "x",
      content_hash: "a".repeat(64),
      metadata: {},
      original_input: null,
    });

    expect(cap.lastParams()![4]).toBeNull();
    expect(row.original_input).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (g) directedIngestionService → ingestRaw: sourceExcerpt → original_input.
// ---------------------------------------------------------------------------
//
// We stub `ingestRawInformation` at the orchestrator's seam so the test
// asserts the wire SHAPE the orchestrator hands to its dependency — without
// having to satisfy the propose-* dispatch loop.

describe("directedIngestionService — sourceExcerpt → original_input (TC-01)", () => {
  it("(g) passes sourceExcerpt as original_input to ingestRawInformation", async () => {
    // WHY: the orchestrator owns the translation `deps.sourceExcerpt →
    // ingestRaw(original_input)`. If a refactor renames either side without
    // updating the other, this flips red. The propose-* dispatch path is
    // tested elsewhere — here we just need the intake call shape.
    const { directedIngestionService } = await import(
      "../../../modules/ingestion/service/directed-ingestion.service.js"
    );

    let captured: { original_input?: string | null } | undefined;
    const ingestRaw = vi.fn(async (_client: unknown, body: unknown) => {
      captured = body as { original_input?: string | null };
      // Force a fatal intake failure so the orchestrator returns immediately
      // — we only need to observe the call shape.
      throw new Error("stop after intake");
    });

    const pool = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
        release: () => undefined,
      })),
    } as unknown as Parameters<typeof directedIngestionService>[1]["pool"];

    const envelope = await directedIngestionService(
      VALID_DIRECTED_INPUT,
      {
        pool,
        logger,
        catalog: {} as never,
        ingestRaw: ingestRaw as never,
        sourceExcerpt: "Verbatim user turn",
      }
    );

    // The orchestrator catches intake errors and surfaces an INTERNAL
    // envelope — the test only cares that `ingestRaw` was called with the
    // expected `original_input`.
    expect(envelope.ok).toBe(false);
    expect(captured).toBeDefined();
    expect(captured!.original_input).toBe("Verbatim user turn");
  });

  it("(g') passes original_input=null when sourceExcerpt is omitted", async () => {
    const { directedIngestionService } = await import(
      "../../../modules/ingestion/service/directed-ingestion.service.js"
    );

    let captured: { original_input?: string | null } | undefined;
    const ingestRaw = vi.fn(async (_client: unknown, body: unknown) => {
      captured = body as { original_input?: string | null };
      throw new Error("stop after intake");
    });

    const pool = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
        release: () => undefined,
      })),
    } as unknown as Parameters<typeof directedIngestionService>[1]["pool"];

    await directedIngestionService(VALID_DIRECTED_INPUT, {
      pool,
      logger,
      catalog: {} as never,
      ingestRaw: ingestRaw as never,
      // sourceExcerpt omitted — the REST / MCP direct path.
    });

    expect(captured!.original_input).toBeNull();
  });
});
