// TC-02 / BR-34 — chat-side wiring of the Path-1 verbatim user-turn capture.
//
// TC-01 (already shipped) added the ingestion-side persistence chain. THIS
// TC wires the chat dispatch: the route threads `body.content` and the
// `(conversation_id, message_id)` pointer into `ChatRunInput`, the chat
// agent assembles the transport-neutral `invocation_context` and forwards it
// generically through `raceToolHandler` to ALL tool handlers (only
// `ingest_directed` reads it; the other 13 ignore it silently), and the
// directed-ingest handler forwards `pointer` to the orchestrator as
// `metadataPointer` which lands in `RawInformation.metadata`.
//
// What we encode here (Rule 9 — each test flips RED on a real regression):
//
//   (1)  raceToolHandler passes `invocation_context` as the second argument
//        to handlers when supplied — generically, without per-tool branching.
//   (2)  raceToolHandler calls the handler with ONE argument (no
//        `undefined` leak) when `invocation_context` is absent — preserves
//        the legacy 1-arg call shape for handlers that have not been
//        updated.
//   (3)  raceToolHandler propagates the same invocation_context regardless
//        of tool name (genericity guard).
//   (4)  ingestDirectedHandler reads `invocation_context.pointer` and
//        forwards it to the orchestrator as `metadataPointer`.
//   (5)  ingestDirectedHandler omits `metadataPointer` (vs. setting
//        undefined) when `pointer` is absent — exactOptionalPropertyTypes
//        contract.
//   (6)  ingestDirectedHandler drops a partial pointer (only one id) —
//        never persist a half-pointer.
//   (7)  directedIngestionService merges `metadataPointer` into the
//        `RawInformation.metadata` jsonb (`conversation_id` + `message_id`
//        keys present); WITHOUT pointer, those keys are absent.

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import { raceToolHandler } from "../../../modules/chat/service/chat-agent.service.js";
import {
  ingestDirectedHandler,
  type IngestDirectedDeps,
  type IngestDirectedInvocationContext,
} from "../../../modules/ingestion/mcp/directed-ingest.handler.js";
import { directedIngestionService } from "../../../modules/ingestion/service/directed-ingestion.service.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const logger = pino({ enabled: false });

const VALID_DIRECTED_INPUT = {
  fragments: [{ ref: "f1", text: "Rodrigo lidera o Projeto Apollo." }],
  nodes: [
    { ref: "n_r", node_type: "Person", name: "Rodrigo" },
    { ref: "n_a", node_type: "Project", name: "Apollo" },
  ],
};

function makeHandlerDeps(over: Partial<IngestDirectedDeps>): IngestDirectedDeps {
  return {
    pool: { connect: vi.fn() } as unknown as IngestDirectedDeps["pool"],
    logger,
    catalog: {} as unknown as IngestDirectedDeps["catalog"],
    ...over,
  };
}

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
// (1) (2) (3) raceToolHandler — invocation_context plumbing
// ---------------------------------------------------------------------------

describe("raceToolHandler — invocation_context forwarding (TC-02)", () => {
  it("(1) forwards invocation_context as the SECOND argument when provided", async () => {
    // WHY: the whole Path-1 contract — the chat agent dispatch passes the
    // `invocation_context` generically; a regression that dropped the second
    // argument would silently kill the chat capture (REST/MCP-direct would
    // remain green because they never supply one).
    let receivedInput: unknown;
    let receivedCtx: unknown;
    const handler = vi.fn(async (input: unknown, ctx?: unknown) => {
      receivedInput = input;
      receivedCtx = ctx;
      return { ok: true as const, result: { echoed: true } };
    });
    const invocationContext = {
      source_excerpt: "Acompanahr o projeto Apollo",
      pointer: { conversation_id: "c1", message_id: "m1" },
    };

    const envelope = await raceToolHandler(
      handler,
      { foo: 1 },
      10_000,
      invocationContext
    );

    expect(envelope.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]).toHaveLength(2);
    expect(receivedInput).toEqual({ foo: 1 });
    expect(receivedCtx).toEqual(invocationContext);
  });

  it("(2) calls the handler with EXACTLY ONE argument when invocation_context is absent", async () => {
    // WHY: handlers that have not been updated to the 2-arg shape must keep
    // working. Passing `undefined` would still type-check, but legacy stubs
    // that count `.length` of received args (and tests that assert
    // `toHaveBeenCalledWith(X)` without a 2nd arg) would flip red.
    const handler = vi.fn(async (input: unknown) => ({
      ok: true as const,
      result: { received: input },
    }));

    await raceToolHandler(handler, { foo: 2 }, 10_000 /* no 4th arg */);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]).toHaveLength(1);
    expect(handler.mock.calls[0]![0]).toEqual({ foo: 2 });
  });

  it("(3) forwards the SAME invocation_context regardless of handler identity (genericity)", async () => {
    // WHY: the dispatch contract is "every tool handler sees the same
    // invocation_context — no per-tool branch". A regression that scoped the
    // forwarding to a single tool name would surface here.
    const ctx = { source_excerpt: "x" };
    const captured: unknown[] = [];
    const mkHandler = () =>
      vi.fn(async (_in: unknown, c?: unknown) => {
        captured.push(c);
        return { ok: true as const, result: {} };
      });

    const h1 = mkHandler();
    const h2 = mkHandler();
    const h3 = mkHandler();

    await raceToolHandler(h1, { a: 1 }, 10_000, ctx);
    await raceToolHandler(h2, { b: 2 }, 10_000, ctx);
    await raceToolHandler(h3, { c: 3 }, 10_000, ctx);

    expect(captured).toEqual([ctx, ctx, ctx]);
  });
});

// ---------------------------------------------------------------------------
// (4) (5) (6) ingestDirectedHandler — pointer propagation to the orchestrator
// ---------------------------------------------------------------------------

describe("ingestDirectedHandler — invocation_context.pointer propagation (TC-02)", () => {
  it("(4) forwards invocation_context.pointer as deps.metadataPointer to the orchestrator", async () => {
    // WHY: the route writes the `(conversation_id, message_id)` non-PII
    // pointer into the chat agent input; the agent threads it through the
    // generic invocation_context; the handler is what finally lands it on
    // the orchestrator's deps surface. Dropping it here silently strips the
    // chat-row pointer from the persisted metadata jsonb.
    const stub = buildDirectedStub();
    const ctx: IngestDirectedInvocationContext = {
      source_excerpt: "ingere o documento",
      pointer: { conversation_id: "conv-42", message_id: "msg-77" },
    };

    const envelope = await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      ctx
    );

    expect(envelope.ok).toBe(true);
    const deps = stub.lastDeps();
    expect(deps).toBeDefined();
    expect(deps!.metadataPointer).toEqual({
      conversation_id: "conv-42",
      message_id: "msg-77",
    });
    // sanity — source_excerpt arrived too (TC-01 contract preserved).
    expect(deps!.sourceExcerpt).toBe("ingere o documento");
  });

  it("(5) WITHOUT a pointer: handler OMITS metadataPointer (exactOptionalPropertyTypes)", async () => {
    // WHY: same rationale as TC-01 test (b) — passing `metadataPointer:
    // undefined` would clash with `exactOptionalPropertyTypes` and overwrite
    // the orchestrator's default. The handler MUST omit the key entirely.
    const stub = buildDirectedStub();

    await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      { source_excerpt: "x" }
    );

    const deps = stub.lastDeps();
    expect(deps).toBeDefined();
    expect("metadataPointer" in deps!).toBe(false);
  });

  it("(6) DROPS a partial pointer (only one id present) — never persist a half-pointer", async () => {
    // WHY: a half-pointer (`{ conversation_id }` without `message_id`) would
    // poison the metadata jsonb with a useless reference. The handler must
    // treat it as "no pointer" rather than smuggling it through.
    const stub = buildDirectedStub();

    await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      {
        // Cast — runtime shape from a misbehaving caller. We want to assert
        // the handler is defensive even when typecheck did not catch it.
        pointer: { conversation_id: "c1" } as unknown as {
          conversation_id: string;
          message_id: string;
        },
      }
    );

    const deps = stub.lastDeps();
    expect(deps).toBeDefined();
    expect("metadataPointer" in deps!).toBe(false);
  });

  it("(6') also drops a pointer with non-string ids", async () => {
    // WHY: defensive guard for a caller that hands a numeric message_id (e.g.
    // an autoincrement) — refuse rather than coerce.
    const stub = buildDirectedStub();

    await ingestDirectedHandler(
      VALID_DIRECTED_INPUT,
      makeHandlerDeps({ directedIngestion: stub.fn }),
      {
        pointer: { conversation_id: "c1", message_id: 42 as unknown as string },
      }
    );

    const deps = stub.lastDeps();
    expect("metadataPointer" in deps!).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (7) directedIngestionService merges metadataPointer into RawInformation.metadata
// ---------------------------------------------------------------------------

describe("directedIngestionService — metadataPointer → RawInformation.metadata (TC-02)", () => {
  it("(7) merges conversation_id + message_id into the ingestRaw metadata when pointer is supplied", async () => {
    // WHY: this is where the pointer actually LANDS in the database column
    // (`raw_information.metadata` jsonb). Without this merge the route's
    // pointer would die in the orchestrator. We capture the call to a
    // stubbed `ingestRaw` and inspect the `metadata` argument literally.
    let capturedIngestRawCall: { metadata: Record<string, unknown> } | undefined;
    const ingestRawStub = vi.fn(async (_client: unknown, input: unknown) => {
      const i = input as { metadata: Record<string, unknown> };
      capturedIngestRawCall = { metadata: i.metadata };
      // Throw to short-circuit — we do not need the full ingestion flow for
      // this metadata-shape assertion; we only need to verify what the
      // orchestrator HANDED to `ingestRaw`.
      throw Object.assign(new Error("short-circuit"), { __short: true });
    });
    // The pool surface is read by the orchestrator's `withTransaction`
    // wrapper; we satisfy it with a minimal `connect()` that yields a no-op
    // client (`ingestRawStub` throws before any of the client.query calls
    // would matter).
    const pool = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => ({ rows: [] })),
        release: vi.fn(),
      })),
    } as unknown as Parameters<typeof directedIngestionService>[1]["pool"];

    const result = await directedIngestionService(VALID_DIRECTED_INPUT, {
      pool,
      logger,
      catalog: {} as unknown as Parameters<
        typeof directedIngestionService
      >[1]["catalog"],
      ingestRaw: ingestRawStub as unknown as Parameters<
        typeof directedIngestionService
      >[1]["ingestRaw"],
      sourceExcerpt: "Acompanahr o projeto Apollo",
      metadataPointer: {
        conversation_id: "conv-abc",
        message_id: "msg-xyz",
      },
    });

    // Intake failed (we forced it) — but the call we want to inspect already
    // happened before the throw.
    expect(result.ok).toBe(false);
    expect(capturedIngestRawCall).toBeDefined();
    expect(capturedIngestRawCall!.metadata).toMatchObject({
      directed: true,
      conversation_id: "conv-abc",
      message_id: "msg-xyz",
    });
  });

  it("(7') OMITS conversation_id / message_id from metadata when no pointer is supplied", async () => {
    // WHY: REST/MCP-direct callers (no chat dispatch) must NOT pollute the
    // metadata jsonb with chat-row keys — the absence is the contract.
    let capturedMetadata: Record<string, unknown> | undefined;
    const ingestRawStub = vi.fn(async (_client: unknown, input: unknown) => {
      capturedMetadata = (input as { metadata: Record<string, unknown> }).metadata;
      throw Object.assign(new Error("short-circuit"), { __short: true });
    });
    const pool = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => ({ rows: [] })),
        release: vi.fn(),
      })),
    } as unknown as Parameters<typeof directedIngestionService>[1]["pool"];

    await directedIngestionService(VALID_DIRECTED_INPUT, {
      pool,
      logger,
      catalog: {} as unknown as Parameters<
        typeof directedIngestionService
      >[1]["catalog"],
      ingestRaw: ingestRawStub as unknown as Parameters<
        typeof directedIngestionService
      >[1]["ingestRaw"],
      // No sourceExcerpt, no metadataPointer — REST / MCP-direct path.
    });

    expect(capturedMetadata).toBeDefined();
    expect(capturedMetadata!.directed).toBe(true);
    expect("conversation_id" in capturedMetadata!).toBe(false);
    expect("message_id" in capturedMetadata!).toBe(false);
  });
});
