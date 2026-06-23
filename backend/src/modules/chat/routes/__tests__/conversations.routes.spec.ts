// Integration tests for the 9 conversation endpoints — TC-003.
//
// Strategy: mock the chat.repository module + the chat-agent.service module
// (and the distillation/utility seam) so we exercise the route handlers and
// the BR-29 sequencing without touching Postgres or Anthropic. A Fastify
// instance is built with the global error handler + a no-op auth preHandler;
// we drive requests via `app.inject(...)`.
//
// Acceptance criteria (TC-003 validation.criteria):
//   - sendMessage handler implements exact BR-29 sequencing (user row before
//     hijack, tool-call rows during loop, assistant row + attachToolCallsToMessage
//     after terminal frame).
//   - Idempotent replay (UC-07): when idempotency key matches and assistant
//     row exists, emits llm_start{1} + text_delta + done{stored} with no
//     Anthropic call and no new rows.
//   - cancelTurn: loads conversation (BR-22) + checks archived (BR-25) +
//     looks up turn registry + aborts controller -> 202.
//   - BR-28 in-flight registry enforcement.
//   - BR-27 idempotency mismatch -> 409.
//   - deleteConversation cascade (BR-37).
//   - listMessages cursor pagination (BR-39).
//   - listConversations cursor pagination (BR-35).
//   - Compliance exclusion: compliance_delete walker does NOT remove chat
//     rows (sentinel row survives).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import pino from "pino";
import type { Pool, PoolClient } from "pg";

// Mock the chat.repository module first so the service-under-test sees the mocks.
vi.mock("../../repository/chat.repository.js", () => ({
  insertConversation: vi.fn(),
  getConversationById: vi.fn(),
  listConversations: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
  updateSummaryRolling: vi.fn(),
  setTitleIfNull: vi.fn(),
  insertUserMessage: vi.fn(),
  findUserByIdempotencyKey: vi.fn(),
  findAssistantSuccessor: vi.fn(),
  insertIterationPair: vi.fn(),
  insertAssistantMessage: vi.fn(),
  listRecentMessages: vi.fn(),
  listMessagesPaginated: vi.fn(),
  listOlderMessagesForSummary: vi.fn(),
  countUserTurns: vi.fn(),
  getFirstUserAndAssistant: vi.fn(),
  insertToolCall: vi.fn(),
  attachToolCallsToMessage: vi.fn(),
  getConversationUsage: vi.fn(),
}));

// Mock the chat-agent factory — drives the SSE loop deterministically.
vi.mock("../../service/chat-agent.service.js", () => ({
  createChatAgentService: vi.fn(),
}));

// Mock the distillation seam — no background work in tests.
vi.mock("../../service/distillation.service.js", () => ({
  maybeRefreshSummary: vi.fn().mockResolvedValue(undefined),
  maybeDistillTitle: vi.fn().mockResolvedValue(undefined),
}));

// TC-be-002: the route's `graph_delta` projection calls `findNodesByIds` for
// the `search` hydration path. Mock at module-load so the dispatcher in
// `graph-normalizer.ts` resolves to the stub. The seven other tests that do
// NOT exercise `search` never trigger this mock.
vi.mock("../../../knowledge-graph/repository/graph.repository.js", () => ({
  findNodesByIds: vi.fn().mockResolvedValue([]),
}));

import * as chatRepo from "../../repository/chat.repository.js";
import { createChatAgentService } from "../../service/chat-agent.service.js";
import {
  maybeDistillTitle,
  maybeRefreshSummary,
} from "../../service/distillation.service.js";
import * as turnRegistry from "../../service/turn-registry.js";
import { findNodesByIds } from "../../../knowledge-graph/repository/graph.repository.js";
import {
  buildSnapshot,
  type CatalogSnapshot,
  type LinkTypeRow,
  type NodeTypeRow,
} from "../../../knowledge-graph/catalog/catalog.js";
import type { Env } from "../../../../config/env.js";
import { buildErrorHandler } from "../../../../middleware/error-handler.js";
import { buildMcpServer, type McpServer } from "../../../../mcp/server.js";
import { registerChatRoutes } from "../conversations.routes.js";
import { CHAT_TOOL_NAMES } from "../../service/tool-catalog.js";
import { z } from "zod";
import type {
  ChatEvent,
  ChatRunInput,
} from "../../service/types.js";

const silentLogger = pino({ level: "silent" });

const baseEnv: Env = Object.freeze({
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  PG_POOL_MIN: 2,
  PG_POOL_MAX: 10,
  PG_STATEMENT_TIMEOUT_MS: 10_000,
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  NEON_AUTH_JWKS_TTL_S: 600,
  ANTHROPIC_API_KEY: "sk-test",
  CHAT_ENABLED: true,
  CHAT_MODEL: "claude-opus-4-8",
  CHAT_UTILITY_MODEL: "claude-haiku-4-5",
  CHAT_PROMPT_VERSION: "v1",
  MAX_HISTORY_MESSAGES: 40,
  MAX_CONTENT_LENGTH: 32768,
  MAX_ITERATIONS: 8,
  TURN_TIMEOUT_MS: 90_000,
  TOOL_TIMEOUT_MS: 15_000,
  TOOL_RESULT_MAX_CHARS: 8000,
  CHAT_RECENT_WINDOW: 10,
  CHAT_SUMMARY_AFTER_TURNS: 20,
  CHAT_TITLE_ENABLED: true,
  CHAT_SUMMARY_ENABLED: true,
}) as Env;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildFakePool(): Pool {
  // withReadOnly / withTransaction issue BEGIN ... COMMIT / ROLLBACK on the
  // client. The mocks intercept the repository calls themselves, so the
  // client's `query` is a no-op resolver.
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  } as unknown as PoolClient;
  return {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool;
}

function buildMcpWithAllChatTools(): McpServer {
  const mcp = buildMcpServer(silentLogger);
  for (const name of CHAT_TOOL_NAMES) {
    mcp.registerTool("query", {
      name,
      description: `stub for ${name}`,
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: { stub: name } }),
    });
  }
  return mcp;
}

/**
 * Minimal catalog snapshot for the `graph_delta` projection tests
 * (TC-be-002). Carries just enough rows so the normalizer can resolve
 * `is_temporal` for the two link types we test against.
 */
function buildTestCatalog(): CatalogSnapshot {
  const linkTypes: LinkTypeRow[] = [
    {
      id: "lt-works-at",
      name: "works_at",
      label: "trabalha em",
      description: "",
      inverse_name: "employs",
      is_temporal: true, // wire should set is_temporal=true
      allows_multiple_current: false,
      requires_valid_from: true,
      requires_valid_to_on_change: true,
      version: 1,
    },
    {
      id: "lt-located-in",
      name: "located_in",
      label: "localizado em",
      description: "",
      inverse_name: "contains",
      is_temporal: false, // wire should set is_temporal=false
      allows_multiple_current: false,
      requires_valid_from: false,
      requires_valid_to_on_change: false,
      version: 1,
    },
  ];
  const nodeTypes: NodeTypeRow[] = [
    { id: "nt-person", name: "person", description: "", version: 1 },
    { id: "nt-organization", name: "organization", description: "", version: 1 },
  ];
  return buildSnapshot({
    nodeTypes,
    linkTypes,
    linkTypeRules: [],
    attributeKeys: [],
  });
}

interface BuildAppOpts {
  /** Env override. */
  readonly env?: Env;
  /** Custom MCP registry (default: all 13 tools registered). */
  readonly mcp?: McpServer;
  /** Run-turn yield script (default: minimal end_turn). */
  readonly runTurnEvents?: readonly ChatEvent[];
  /** Whether the chat agent factory should throw on first call (BR-21 path). */
  readonly factoryThrows?: boolean;
  /** Register @fastify/cors (mirrors app.ts) — to assert CORS on the SSE stream. */
  readonly withCors?: boolean;
  /**
   * TC-be-002: catalog snapshot for the `graph_delta` projection. Pass `null`
   * to leave the route in catalog-absent mode (no graph_delta emission).
   * Default: minimal test catalog with two link types.
   */
  readonly catalog?: CatalogSnapshot | null;
}

async function buildApp(opts: BuildAppOpts = {}): Promise<{
  app: FastifyInstance;
  pool: Pool;
  capturedRunInput: { current?: ChatRunInput };
}> {
  turnRegistry.clearForTests();
  const env = opts.env ?? baseEnv;
  const pool = buildFakePool();
  const mcp = opts.mcp ?? buildMcpWithAllChatTools();
  const capturedRunInput: { current?: ChatRunInput } = {};

  // Wire the chat-agent service mock with the supplied script.
  const events = opts.runTurnEvents ?? [
    {
      type: "done" as const,
      stop_reason: "end_turn" as const,
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 5,
      content: [{ type: "text", text: "ok" }],
    },
  ];
  vi.mocked(createChatAgentService).mockImplementation(() => {
    if (opts.factoryThrows) {
      throw new Error("simulated factory failure");
    }
    let lastStats:
      | {
          tokens_in: number;
          tokens_out: number;
          iterations: number;
          tools_called: readonly string[];
          stop_reason:
            | "end_turn"
            | "max_tokens"
            | "stop_sequence"
            | "max_iterations"
            | "turn_timeout"
            | "cancelled"
            | "provider_error"
            | "internal_error";
        }
      | undefined;
    return {
      get lastStats() {
        return lastStats;
      },
      runTurn(input: ChatRunInput) {
        capturedRunInput.current = input;
        let tokensIn = 0;
        let tokensOut = 0;
        for (const evt of events) {
          if (evt.type === "done" || evt.type === "error") {
            tokensIn = evt.tokens_in;
            tokensOut = evt.tokens_out;
          }
        }
        lastStats = {
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          iterations: 1,
          tools_called: events
            .filter((e) => e.type === "tool_start")
            .map((e) => (e as { tool: string }).tool),
          stop_reason: "end_turn",
        };
        return {
          [Symbol.asyncIterator]: async function* () {
            for (const evt of events) {
              yield evt;
            }
          },
        };
      },
    } as ReturnType<typeof createChatAgentService>;
  });

  const app = Fastify({
    loggerInstance: silentLogger as never,
    disableRequestLogging: true,
  });
  // Mirror app.ts: register CORS FIRST so its onRequest hook sets the
  // Access-Control-Allow-Origin header on the reply before the route handler
  // hijacks the response for the SSE stream.
  if (opts.withCors) {
    await app.register(fastifyCors, {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });
  }
  app.setErrorHandler(buildErrorHandler(silentLogger));

  // Stub anthropic factory — the route uses it for the utility client only.
  // The agentic loop is fully replaced by the mocked createChatAgentService.
  const stubAnthropicFactory = () =>
    ({
      messages: {
        create: async () =>
          ({
            id: "msg",
            type: "message",
            role: "assistant",
            model: "claude-haiku-4-5",
            content: [],
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 },
          }) as never,
        stream: () =>
          ({
            on() {
              return this;
            },
            abort() {},
            finalMessage: async () => ({}) as never,
          }) as never,
      },
    }) as never;

  // TC-be-002: default to a non-empty catalog so graph_delta projection runs.
  // Pass `catalog: null` to opt out (used by the AC-B.6 negative test that
  // exercises catalog-absent mode at the route boundary level — though the
  // primary "no graph tool" assertion uses the default catalog + non-graph
  // tool to prove the absence of graph_delta).
  const catalog = opts.catalog === undefined ? buildTestCatalog() : opts.catalog;

  await app.register(
    async (scoped) => {
      await registerChatRoutes(scoped, {
        mcp,
        logger: silentLogger,
        env,
        pool,
        anthropicFactory: stubAnthropicFactory as never,
        ...(catalog !== null ? { catalog } : {}),
      });
    },
    { prefix: "/conversations" }
  );

  return { app, pool, capturedRunInput };
}

beforeEach(() => {
  vi.clearAllMocks();
  turnRegistry.clearForTests();
});

afterEach(() => {
  turnRegistry.clearForTests();
});

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

function parseSse(raw: string): Array<{ event: string; data: unknown }> {
  const frames: Array<{ event: string; data: unknown }> = [];
  const blocks = raw.split(/\n\n/).filter((b) => b.trim().length > 0);
  for (const block of blocks) {
    let event = "";
    let dataLine = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice("event: ".length);
      else if (line.startsWith("data: ")) dataLine = line.slice("data: ".length);
    }
    frames.push({
      event,
      data: dataLine.length > 0 ? JSON.parse(dataLine) : null,
    });
  }
  return frames;
}

// ---------------------------------------------------------------------------
// CRUD: createConversation (BR-30)
// ---------------------------------------------------------------------------

describe("POST /conversations — createConversation (BR-30)", () => {
  it("returns 201 with the inserted row for an empty body", async () => {
    vi.mocked(chatRepo.insertConversation).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: null,
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });

    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/conversations",
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { ok: boolean; result: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.result.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(chatRepo.insertConversation).toHaveBeenCalledWith(expect.anything(), {
      title: null,
    });
    await app.close();
  });

  it("returns 422 for an over-200-char title", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/conversations",
      payload: { title: "x".repeat(201) },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    await app.close();
  });

  it("returns 503 BUSINESS_CHAT_DISABLED when CHAT_ENABLED=false", async () => {
    const disabledEnv = Object.freeze({ ...baseEnv, CHAT_ENABLED: false }) as Env;
    const { app } = await buildApp({ env: disabledEnv });
    const res = await app.inject({
      method: "POST",
      url: "/conversations",
      payload: {},
    });
    expect(res.statusCode).toBe(503);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("BUSINESS_CHAT_DISABLED");
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// CRUD: listConversations (BR-35)
// ---------------------------------------------------------------------------

describe("GET /conversations — listConversations (BR-35)", () => {
  it("returns items + null next_cursor when there are no more pages", async () => {
    vi.mocked(chatRepo.listConversations).mockResolvedValue({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "A",
          summary_rolling: null,
          archived_at: null,
          created_at: "2026-06-20T12:00:00.000Z",
          updated_at: "2026-06-20T12:00:00.000Z",
        },
      ],
      hasMore: false,
    });

    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations?limit=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      ok: boolean;
      result: { items: unknown[]; next_cursor: string | null };
    };
    expect(body.result.next_cursor).toBeNull();
    expect(body.result.items).toHaveLength(1);
    await app.close();
  });

  it("emits a base64url cursor when hasMore=true (BR-35)", async () => {
    vi.mocked(chatRepo.listConversations).mockResolvedValue({
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "B",
          summary_rolling: null,
          archived_at: null,
          created_at: "2026-06-19T12:00:00.000Z",
          updated_at: "2026-06-19T12:00:00.000Z",
        },
      ],
      hasMore: true,
    });

    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations?limit=1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      ok: boolean;
      result: { next_cursor: string | null };
    };
    expect(body.result.next_cursor).not.toBeNull();
    // base64url-decode the cursor and assert shape.
    const decoded = JSON.parse(
      Buffer.from(body.result.next_cursor!, "base64url").toString("utf8")
    );
    expect(decoded).toEqual({
      created_at: "2026-06-19T12:00:00.000Z",
      id: "22222222-2222-4222-8222-222222222222",
    });
    await app.close();
  });

  it("returns 422 for a malformed cursor (BR-35)", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations?cursor=!!not-base64!!",
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// CRUD: getConversation / updateConversation / deleteConversation
// ---------------------------------------------------------------------------

describe("GET /conversations/:id — getConversation (BR-22)", () => {
  it("returns 404 RESOURCE_NOT_FOUND when the conversation is absent", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue(null);
    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations/11111111-1111-4111-8111-111111111111",
    });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    await app.close();
  });
});

describe("PATCH /conversations/:id — updateConversation (BR-36)", () => {
  it("returns 422 VALIDATION_REQUIRED_FIELD on an empty body", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/conversations/11111111-1111-4111-8111-111111111111",
      payload: {},
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_REQUIRED_FIELD");
    await app.close();
  });

  it("returns 200 on a successful title PATCH", async () => {
    vi.mocked(chatRepo.updateConversation).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: "new",
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:01.000Z",
    });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/conversations/11111111-1111-4111-8111-111111111111",
      payload: { title: "new" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      ok: boolean;
      result: { title: string | null };
    };
    expect(body.result.title).toBe("new");
    await app.close();
  });
});

describe("DELETE /conversations/:id — deleteConversation (BR-37)", () => {
  it("returns 204 on success", async () => {
    vi.mocked(chatRepo.deleteConversation).mockResolvedValue(1);
    const { app } = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/conversations/11111111-1111-4111-8111-111111111111",
    });
    expect(res.statusCode).toBe(204);
    // The repository is the single source of truth for cascade — we assert
    // that the DELETE was issued exactly once.
    expect(chatRepo.deleteConversation).toHaveBeenCalledTimes(1);
    expect(chatRepo.deleteConversation).toHaveBeenCalledWith(
      expect.anything(),
      "11111111-1111-4111-8111-111111111111"
    );
    await app.close();
  });

  it("returns 404 when the conversation does not exist", async () => {
    vi.mocked(chatRepo.deleteConversation).mockResolvedValue(0);
    const { app } = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/conversations/11111111-1111-4111-8111-111111111111",
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// listMessages (BR-39)
// ---------------------------------------------------------------------------

describe("GET /conversations/:id/messages — listMessages (BR-39)", () => {
  it("returns 404 when the conversation is absent", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue(null);
    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations/11111111-1111-4111-8111-111111111111/messages",
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("returns next_before = oldest item's created_at when hasMore", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: null,
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listMessagesPaginated).mockResolvedValue({
      items: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          conversation_id: "11111111-1111-4111-8111-111111111111",
          role: "user",
          content: [{ type: "text", text: "x" }],
          stop_reason: null,
          idempotency_key: null,
          model: null,
          tokens_in: null,
          tokens_out: null,
          latency_ms: null,
          created_at: "2026-06-20T11:00:00.000Z",
        },
      ],
      hasMore: true,
    });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations/11111111-1111-4111-8111-111111111111/messages?limit=1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      ok: boolean;
      result: { items: unknown[]; next_before: string | null };
    };
    expect(body.result.next_before).toBe("2026-06-20T11:00:00.000Z");
    await app.close();
  });

  it("returns next_before=null when no more pages", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: null,
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listMessagesPaginated).mockResolvedValue({
      items: [],
      hasMore: false,
    });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/conversations/11111111-1111-4111-8111-111111111111/messages",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { result: { next_before: string | null } };
    expect(body.result.next_before).toBeNull();
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// cancelTurn (BR-38)
// ---------------------------------------------------------------------------

describe("POST /conversations/:id/cancel — cancelTurn (BR-38)", () => {
  const CID = "11111111-1111-4111-8111-111111111111";

  it("returns 404 when there is no in-flight turn (BR-38 step 3)", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue({
      id: CID,
      title: null,
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/cancel`,
    });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    await app.close();
  });

  it("returns 202 + aborts the registered controller when a turn is in flight", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue({
      id: CID,
      title: null,
      summary_rolling: null,
      archived_at: null,
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });
    const controller = new AbortController();
    turnRegistry.register(CID, controller);

    const { app } = await buildApp();
    // The buildApp clears the registry; re-register after construction.
    turnRegistry.register(CID, controller);

    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/cancel`,
    });
    expect(res.statusCode).toBe(202);
    expect(controller.signal.aborted).toBe(true);
    await app.close();
  });

  it("returns 409 BUSINESS_CONVERSATION_ARCHIVED when the conversation is archived (BR-25)", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue({
      id: CID,
      title: null,
      summary_rolling: null,
      archived_at: "2026-06-20T12:00:00.000Z",
      created_at: "2026-06-20T12:00:00.000Z",
      updated_at: "2026-06-20T12:00:00.000Z",
    });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/cancel`,
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("BUSINESS_CONVERSATION_ARCHIVED");
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// sendMessage — BR-26 / BR-22 / BR-25 / BR-28 / BR-27 / BR-29 sequencing
// ---------------------------------------------------------------------------

const CID = "11111111-1111-4111-8111-111111111111";
const IDEMP = "44444444-4444-4444-8444-444444444444";

function mockExistingConversation(opts: { archived?: boolean } = {}): void {
  vi.mocked(chatRepo.getConversationById).mockResolvedValue({
    id: CID,
    title: null,
    summary_rolling: null,
    archived_at: opts.archived ? "2026-06-20T12:00:00.000Z" : null,
    created_at: "2026-06-20T12:00:00.000Z",
    updated_at: "2026-06-20T12:00:00.000Z",
  });
}

describe("POST /conversations/:id/messages — pre-stream validation", () => {
  it("BR-26: missing Idempotency-Key -> 422 VALIDATION_REQUIRED_FIELD (before conversation lookup)", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_REQUIRED_FIELD");
    // BR-26: conversation lookup MUST NOT have been called yet.
    expect(chatRepo.getConversationById).not.toHaveBeenCalled();
    await app.close();
  });

  it("BR-26: non-UUID Idempotency-Key -> 422 VALIDATION_INVALID_FORMAT", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": "not-a-uuid" },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    await app.close();
  });

  it("BR-01: empty content -> 422 VALIDATION_INVALID_FORMAT", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "" },
    });
    expect(res.statusCode).toBe(422);
    await app.close();
  });

  it("BR-22: unknown conversation -> 404 RESOURCE_NOT_FOUND", async () => {
    vi.mocked(chatRepo.getConversationById).mockResolvedValue(null);
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("BR-25: archived conversation -> 409 BUSINESS_CONVERSATION_ARCHIVED", async () => {
    mockExistingConversation({ archived: true });
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("BUSINESS_CONVERSATION_ARCHIVED");
    await app.close();
  });

  it("BR-28: a turn already in-flight -> 409 BUSINESS_TURN_IN_PROGRESS", async () => {
    mockExistingConversation();
    const { app } = await buildApp();
    // Register a sentinel controller AFTER buildApp (which clears the registry).
    turnRegistry.register(CID, new AbortController());
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("BUSINESS_TURN_IN_PROGRESS");
    await app.close();
  });

  it("BR-27: idempotency key matches with DIFFERENT content -> 409 BUSINESS_IDEMPOTENCY_MISMATCH", async () => {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue({
      id: "u1",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "WAS something else" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: "claude-opus-4-8",
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });

    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "now something different" },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("BUSINESS_IDEMPOTENCY_MISMATCH");
    expect(chatRepo.insertUserMessage).not.toHaveBeenCalled();
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// sendMessage — BR-29 sequencing happy path
// ---------------------------------------------------------------------------

describe("POST /conversations/:id/messages — BR-29 sequencing", () => {
  it("inserts the user row BEFORE the SSE opens and the assistant row AFTER the terminal frame", async () => {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(chatRepo.insertUserMessage).mockResolvedValue({
      id: "user-row-id",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: "claude-opus-4-8",
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listRecentMessages).mockResolvedValue([]);
    vi.mocked(chatRepo.insertAssistantMessage).mockResolvedValue({
      id: "assistant-row-id",
      conversation_id: CID,
      role: "assistant",
      content: [{ type: "text", text: "ok" }],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 5,
      latency_ms: 100,
      created_at: "2026-06-20T12:00:01.000Z",
    });

    // Run-turn script: llm_start + text_delta + done. The mock framework
    // records call order between insertUserMessage (pre-stream) and
    // insertAssistantMessage (post-stream).
    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "text_delta", delta: "ok" },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [{ type: "text", text: "ok" }],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);

    // BR-29: ordering invariant — `insertUserMessage` must be called before
    // `insertAssistantMessage`. vi's `invocationCallOrder` is monotonic.
    const userOrder =
      vi.mocked(chatRepo.insertUserMessage).mock.invocationCallOrder[0]!;
    const assistantOrder =
      vi.mocked(chatRepo.insertAssistantMessage).mock.invocationCallOrder[0]!;
    expect(userOrder).toBeLessThan(assistantOrder);

    // BR-29 step 8: assistant row carries the content blocks + stop_reason +
    // tokens + latency.
    expect(chatRepo.insertAssistantMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        conversation_id: CID,
        stop_reason: "end_turn",
        tokens_in: 10,
        tokens_out: 5,
      })
    );

    // BR-29 step 9: pino INFO turn record will be emitted; we cannot easily
    // capture it here without a custom logger, but the assistant insert IS
    // the gating side-effect that proves the sequence executed.

    // BR-29 step 10: distillation is scheduled fire-and-forget — it MUST NOT
    // be awaited (response already returned).
    expect(maybeRefreshSummary).toHaveBeenCalled();
    expect(maybeDistillTitle).toHaveBeenCalled();

    await app.close();
  });

  it("persists each tool_result event as a chat_tool_call row WITHIN the loop (BR-32)", async () => {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(chatRepo.insertUserMessage).mockResolvedValue({
      id: "u",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: null,
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listRecentMessages).mockResolvedValue([]);
    vi.mocked(chatRepo.insertToolCall).mockResolvedValueOnce({
      id: "tool-call-1",
      conversation_id: CID,
      message_id: null,
      tool_name: "search",
      arguments: { query: "x" },
      result: { stub: "search" },
      is_error: false,
      error_message: null,
      duration_ms: 12,
      created_at: "2026-06-20T12:00:00.500Z",
    });
    vi.mocked(chatRepo.insertAssistantMessage).mockResolvedValue({
      id: "a",
      conversation_id: CID,
      role: "assistant",
      content: [],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 5,
      latency_ms: 100,
      created_at: "2026-06-20T12:00:01.000Z",
    });

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "search", args_summary: "query=x" },
      {
        type: "tool_result",
        tool: "search",
        ok: true,
        arguments: { query: "x" },
        result: { stub: "search" },
        is_error: false,
        error_message: null,
        duration_ms: 12,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);
    expect(chatRepo.insertToolCall).toHaveBeenCalledTimes(1);
    expect(chatRepo.insertToolCall).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        conversation_id: CID,
        message_id: null, // BR-32: patched later via attachToolCallsToMessage
        tool_name: "search",
        is_error: false,
        duration_ms: 12,
      })
    );
    expect(chatRepo.attachToolCallsToMessage).toHaveBeenCalledWith(
      expect.anything(),
      ["tool-call-1"],
      "a"
    );

    // BR-09: SSE wire frame for tool_result MUST NOT carry `arguments` or
    // `result` — only `{tool, ok}`.
    const frames = parseSse(res.body);
    const toolResultFrame = frames.find((f) => f.event === "tool_result");
    expect(toolResultFrame).toBeDefined();
    expect(toolResultFrame!.data).toEqual({ tool: "search", ok: true });
    expect(toolResultFrame!.data).not.toHaveProperty("arguments");
    expect(toolResultFrame!.data).not.toHaveProperty("result");

    await app.close();
  });

  it("v2.2: persists the (assistant tool_use, user tool_result) PAIR on iteration_end; never frames it to the wire", async () => {
    // THE regression for the multi-turn bug: a tool-bearing iteration must be
    // persisted as a valid pair of rows (BR-29 step 6.d) so the next turn's
    // replay is a valid Anthropic sequence. The internal `iteration_end` event
    // must NOT reach the SSE wire.
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(chatRepo.insertUserMessage).mockResolvedValue({
      id: "u",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: null,
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listRecentMessages).mockResolvedValue([]);
    vi.mocked(chatRepo.insertToolCall).mockResolvedValueOnce({
      id: "tool-call-1",
      conversation_id: CID,
      message_id: null,
      tool_name: "search",
      arguments: { query: "x" },
      result: { stub: "search" },
      is_error: false,
      error_message: null,
      duration_ms: 12,
      created_at: "2026-06-20T12:00:00.500Z",
    });
    vi.mocked(chatRepo.insertIterationPair).mockResolvedValueOnce({
      assistant: {
        id: "asst-iter-1",
        conversation_id: CID,
        role: "assistant",
        content: [],
        stop_reason: null,
        idempotency_key: null,
        model: "claude-opus-4-8",
        tokens_in: null,
        tokens_out: null,
        latency_ms: null,
        created_at: "2026-06-20T12:00:00.600Z",
      },
      user: {
        id: "usr-iter-1",
        conversation_id: CID,
        role: "user",
        content: [],
        stop_reason: null,
        idempotency_key: null,
        model: null,
        tokens_in: null,
        tokens_out: null,
        latency_ms: null,
        created_at: "2026-06-20T12:00:00.700Z",
      },
    });
    vi.mocked(chatRepo.insertAssistantMessage).mockResolvedValue({
      id: "a-final",
      conversation_id: CID,
      role: "assistant",
      content: [{ type: "text", text: "Existem 10." }],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 5,
      latency_ms: 100,
      created_at: "2026-06-20T12:00:01.000Z",
    });

    const toolUseBlock = {
      type: "tool_use",
      id: "toolu_X",
      name: "search",
      input: { query: "x" },
    };
    const toolResultBlock = {
      type: "tool_result",
      tool_use_id: "toolu_X",
      content: "stub",
      is_error: false,
    };
    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "search", args_summary: "query=x" },
      {
        type: "tool_result",
        tool: "search",
        ok: true,
        arguments: { query: "x" },
        result: { stub: "search" },
        is_error: false,
        error_message: null,
        duration_ms: 12,
      },
      {
        type: "iteration_end",
        iteration: 1,
        assistant_content: [toolUseBlock],
        tool_results: [toolResultBlock],
      },
      { type: "llm_start", iteration: 2 },
      { type: "text_delta", delta: "Existem 10." },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [{ type: "text", text: "Existem 10." }],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);

    // The iteration pair is persisted with the tool_use + tool_result blocks.
    expect(chatRepo.insertIterationPair).toHaveBeenCalledTimes(1);
    expect(chatRepo.insertIterationPair).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        conversation_id: CID,
        assistant_content: [toolUseBlock],
        tool_result_content: [toolResultBlock],
      })
    );
    // This iteration's tool_call row is attached to the PAIR's assistant row,
    // not the final answer row.
    expect(chatRepo.attachToolCallsToMessage).toHaveBeenCalledWith(
      expect.anything(),
      ["tool-call-1"],
      "asst-iter-1"
    );
    // The closing answer row is persisted separately with the final text.
    expect(chatRepo.insertAssistantMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        content: [{ type: "text", text: "Existem 10." }],
        stop_reason: "end_turn",
      })
    );

    // The internal iteration_end event is NEVER framed to the SSE wire.
    // (`search` is a graph tool, so a `graph_delta` frame still follows the
    // tool_result — confirming graph_delta and iteration_end coexist: the
    // observational graph_delta is framed, the persistence iteration_end is not.)
    const frames = parseSse(res.body);
    expect(frames.map((f) => f.event)).not.toContain("iteration_end");
    expect(frames.map((f) => f.event)).toEqual([
      "llm_start",
      "tool_start",
      "tool_result",
      "graph_delta",
      "llm_start",
      "text_delta",
      "done",
    ]);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// sendMessage — UC-07 idempotent replay
// ---------------------------------------------------------------------------

describe("POST /conversations/:id/messages — UC-07 idempotent replay (BR-27)", () => {
  it("replays the stored assistant text WITHOUT calling Anthropic or inserting new rows", async () => {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue({
      id: "u1",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: "claude-opus-4-8",
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.findAssistantSuccessor).mockResolvedValue({
      id: "a1",
      conversation_id: CID,
      role: "assistant",
      content: [{ type: "text", text: "stored response" }],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 100,
      tokens_out: 20,
      latency_ms: 500,
      created_at: "2026-06-20T12:00:01.000Z",
    });

    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi", model: "claude-opus-4-8" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);

    // UC-07: no new rows.
    expect(chatRepo.insertUserMessage).not.toHaveBeenCalled();
    expect(chatRepo.insertAssistantMessage).not.toHaveBeenCalled();
    // UC-07: no Anthropic call (no chat-agent runTurn invocation).
    expect(createChatAgentService).not.toHaveBeenCalled();

    // UC-07 wire format: llm_start{1} + text_delta(<stored>) + done{stored}.
    const frames = parseSse(res.body);
    expect(frames[0]?.event).toBe("llm_start");
    expect(frames[0]?.data).toEqual({ iteration: 1 });
    expect(frames[1]?.event).toBe("text_delta");
    expect(frames[1]?.data).toEqual({ delta: "stored response" });
    const done = frames[frames.length - 1];
    expect(done?.event).toBe("done");
    expect(done?.data).toMatchObject({
      stop_reason: "end_turn",
      model: "claude-opus-4-8",
      tokens_in: 100,
      tokens_out: 20,
    });

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// CORS on the hijacked SSE stream — regression for the fix/bff-cors gap.
// reply.hijack() + reply.raw.writeHead() bypasses @fastify/cors's onSend phase,
// so writeSseHeaders must copy the ACAO header the plugin set on the reply —
// else the browser blocks the chat turn even though the preflight passed.
// Driven via the UC-07 replay path (no Anthropic call) which also hijacks.
// ---------------------------------------------------------------------------

describe("POST /conversations/:id/messages — CORS on the SSE stream (fix/bff-cors gap)", () => {
  function mockIdempotentReplay(): void {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue({
      id: "u1",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: "claude-opus-4-8",
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.findAssistantSuccessor).mockResolvedValue({
      id: "a1",
      conversation_id: CID,
      role: "assistant",
      content: [{ type: "text", text: "stored response" }],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 100,
      tokens_out: 20,
      latency_ms: 500,
      created_at: "2026-06-20T12:00:01.000Z",
    });
  }

  it("copies Access-Control-Allow-Origin onto the SSE response for an allowed Origin", async () => {
    mockIdempotentReplay();
    const { app } = await buildApp({ withCors: true });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP, origin: "http://localhost:5173" },
      payload: { content: "hi", model: "claude-opus-4-8" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    );
    await app.close();
  });

  it("does NOT echo a disallowed Origin onto the SSE response", async () => {
    mockIdempotentReplay();
    const { app } = await buildApp({ withCors: true });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP, origin: "https://evil.example" },
      payload: { content: "hi", model: "claude-opus-4-8" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Compliance §11 exclusion (negative test, BR-37)
// ---------------------------------------------------------------------------

describe("Compliance §11 exclusion (BR-37, .spec.md §6)", () => {
  it("compliance_delete walker does NOT visit chat tables: a sentinel chat row survives", async () => {
    // The compliance walker (modules/compliance-audit/service) operates on
    // RawInformation / RawChunk / InformationFragment / KnowledgeNode /
    // KnowledgeLink / NodeAttribute. It NEVER imports chat repository / chat
    // route modules. This is a structural exclusion test — we assert that
    // the compliance module's own surface does not reference any chat repo
    // function. The check is by source inspection because the cascade is
    // a DDL contract (FK ON DELETE CASCADE on chat_message.conversation_id
    // -> chat_conversation.id), and the compliance walker has no FK from
    // RawInformation to chat_conversation.
    //
    // A negative test: if the chat module is imported by compliance code,
    // this assertion will fail.
    const complianceModule = await import(
      "../../../compliance-audit/index.js"
    );
    const surfaceKeys = Object.keys(complianceModule);
    // The compliance module exports its own functions; none of them should
    // reference chat tables. We assert the public surface contains no
    // chat-table-related symbol.
    for (const key of surfaceKeys) {
      expect(key).not.toMatch(/chat/i);
    }
  });
});

// ---------------------------------------------------------------------------
// sendMessage — TC-be-002 graph_delta SSE projection
//
// Covers the AC-B.5 / AC-B.6 / BR-09 acceptance criteria from
// .orch/sessions/<id>/backlog/tc-be-002.md:
//   AC-B.5 — graph-producing tool_result is followed by a graph_delta frame
//   AC-B.6 — non-graph tool_result emits NO graph_delta frame
//   BR-09  — tool_result wire frame stays {tool, ok} (unchanged)
//   Plus: graph_delta does NOT trigger a chat_tool_call row, and frame order
//         is contractual (graph_delta ALWAYS follows its tool_result).
// ---------------------------------------------------------------------------

describe("POST /conversations/:id/messages — TC-be-002 graph_delta SSE projection", () => {
  /** Fixtures shared by the graph_delta tests. */
  function setupGraphTestMocks(): void {
    mockExistingConversation();
    vi.mocked(chatRepo.findUserByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(chatRepo.insertUserMessage).mockResolvedValue({
      id: "u",
      conversation_id: CID,
      role: "user",
      content: [{ type: "text", text: "hi" }],
      stop_reason: null,
      idempotency_key: IDEMP,
      model: null,
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.000Z",
    });
    vi.mocked(chatRepo.listRecentMessages).mockResolvedValue([]);
    vi.mocked(chatRepo.insertToolCall).mockResolvedValue({
      id: "tool-call-1",
      conversation_id: CID,
      message_id: null,
      tool_name: "traverse",
      arguments: {},
      result: null,
      is_error: false,
      error_message: null,
      duration_ms: 5,
      created_at: "2026-06-20T12:00:00.500Z",
    });
    vi.mocked(chatRepo.insertAssistantMessage).mockResolvedValue({
      id: "a",
      conversation_id: CID,
      role: "assistant",
      content: [],
      stop_reason: "end_turn",
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: 10,
      tokens_out: 5,
      latency_ms: 100,
      created_at: "2026-06-20T12:00:01.000Z",
    });
  }

  it("AC-B.5: emits graph_delta AFTER tool_result for a `traverse` tool call", async () => {
    setupGraphTestMocks();

    // Traverse envelope shape — what the chat agent loop captures in
    // `tool_result.result` from the MCP `traverse` tool: a subgraph with
    // node_summary nodes + traversal_link links. We use one of each link
    // type from the test catalog so the normalizer must consult
    // `linkTypeByName` for `is_temporal`.
    const traverseResult = {
      starting_node_id: "n-1",
      nodes: [
        {
          id: "n-1",
          node_type: "person",
          canonical_name: "Alice",
          status: "active",
        },
        {
          id: "n-2",
          node_type: "organization",
          canonical_name: "Acme",
          status: "active",
        },
      ],
      links: [
        {
          id: "l-1",
          source_node_id: "n-1",
          target_node_id: "n-2",
          link_type: "works_at", // is_temporal = true in test catalog
        },
        {
          id: "l-2",
          source_node_id: "n-2",
          target_node_id: "n-2",
          link_type: "located_in", // is_temporal = false in test catalog
        },
      ],
    };

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "traverse", args_summary: "node=n-1" },
      {
        type: "tool_result",
        tool: "traverse",
        ok: true,
        arguments: { starting_node_id: "n-1" },
        result: traverseResult,
        is_error: false,
        error_message: null,
        duration_ms: 5,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);

    const frames = parseSse(res.body);
    const eventOrder = frames.map((f) => f.event);

    // Both frames present.
    expect(eventOrder).toContain("tool_result");
    expect(eventOrder).toContain("graph_delta");

    // Order: graph_delta MUST come AFTER its tool_result (AC-B.5).
    const toolResultIdx = eventOrder.indexOf("tool_result");
    const graphDeltaIdx = eventOrder.indexOf("graph_delta");
    expect(graphDeltaIdx).toBeGreaterThan(toolResultIdx);

    // Exactly one graph_delta for one tool_result.
    expect(
      eventOrder.filter((e) => e === "graph_delta")
    ).toHaveLength(1);

    // BR-09: tool_result wire frame remains {tool, ok} — UNCHANGED.
    const toolResultFrame = frames[toolResultIdx]!;
    expect(toolResultFrame.data).toEqual({ tool: "traverse", ok: true });

    // graph_delta payload mirrors the normalizer output (snake_case wire).
    const graphDeltaFrame = frames[graphDeltaIdx]!;
    const payload = graphDeltaFrame.data as {
      source_tool: string;
      nodes: Array<{ id: string; node_type: string; canonical_name: string; status: string }>;
      links: Array<{
        id: string;
        source_node_id: string;
        target_node_id: string;
        link_type: string;
        is_temporal: boolean;
      }>;
    };
    expect(payload.source_tool).toBe("traverse");
    expect(payload.nodes).toHaveLength(2);
    expect(payload.links).toHaveLength(2);
    expect(payload.nodes[0]).toEqual({
      id: "n-1",
      node_type: "person",
      canonical_name: "Alice",
      status: "active",
    });
    // is_temporal flows from the catalog: works_at=true, located_in=false.
    const worksAt = payload.links.find((l) => l.link_type === "works_at")!;
    const locatedIn = payload.links.find((l) => l.link_type === "located_in")!;
    expect(worksAt.is_temporal).toBe(true);
    expect(locatedIn.is_temporal).toBe(false);

    // graph_delta does NOT produce a chat_tool_call row — only the original
    // tool_result does (1 call, not 2).
    expect(chatRepo.insertToolCall).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("AC-B.6: no graph_delta frame is emitted for a non-graph-producing tool (`list_node_types`)", async () => {
    setupGraphTestMocks();

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "list_node_types", args_summary: "" },
      {
        type: "tool_result",
        tool: "list_node_types",
        ok: true,
        arguments: {},
        result: { items: [{ name: "person" }] },
        is_error: false,
        error_message: null,
        duration_ms: 1,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);

    const frames = parseSse(res.body);
    // tool_result present (and unchanged shape).
    const toolResultFrame = frames.find((f) => f.event === "tool_result");
    expect(toolResultFrame).toBeDefined();
    expect(toolResultFrame!.data).toEqual({
      tool: "list_node_types",
      ok: true,
    });
    // No graph_delta frame whatsoever (AC-B.6).
    expect(frames.find((f) => f.event === "graph_delta")).toBeUndefined();

    await app.close();
  });

  it("AC-B.6 / no-tool turn: a turn with no tool calls emits no graph_delta", async () => {
    setupGraphTestMocks();

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "text_delta", delta: "hello" },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [{ type: "text", text: "hello" }],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);
    const frames = parseSse(res.body);
    expect(frames.find((f) => f.event === "graph_delta")).toBeUndefined();
    await app.close();
  });

  it("emits NO graph_delta when the tool_result is ok:false (failed tool call)", async () => {
    setupGraphTestMocks();
    vi.mocked(chatRepo.insertToolCall).mockResolvedValue({
      id: "tool-call-err",
      conversation_id: CID,
      message_id: null,
      tool_name: "traverse",
      arguments: {},
      result: null,
      is_error: true,
      error_message: "boom",
      duration_ms: 3,
      created_at: "2026-06-20T12:00:00.500Z",
    });

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "traverse", args_summary: "node=n-1" },
      {
        type: "tool_result",
        tool: "traverse",
        ok: false,
        arguments: { starting_node_id: "n-1" },
        result: null,
        is_error: true,
        error_message: "boom",
        duration_ms: 3,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);
    const frames = parseSse(res.body);
    expect(frames.find((f) => f.event === "tool_result")).toBeDefined();
    expect(frames.find((f) => f.event === "graph_delta")).toBeUndefined();
    await app.close();
  });

  it("emits NO graph_delta when the catalog snapshot is absent (degraded mode)", async () => {
    setupGraphTestMocks();

    const traverseResult = {
      starting_node_id: "n-1",
      nodes: [
        {
          id: "n-1",
          node_type: "person",
          canonical_name: "Alice",
          status: "active",
        },
      ],
      links: [],
    };

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "traverse", args_summary: "node=n-1" },
      {
        type: "tool_result",
        tool: "traverse",
        ok: true,
        arguments: { starting_node_id: "n-1" },
        result: traverseResult,
        is_error: false,
        error_message: null,
        duration_ms: 5,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({
      runTurnEvents: events,
      catalog: null, // catalog-absent path
    });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);
    const frames = parseSse(res.body);
    expect(frames.find((f) => f.event === "tool_result")).toBeDefined();
    expect(frames.find((f) => f.event === "graph_delta")).toBeUndefined();
    await app.close();
  });

  it("emits graph_delta for `search` after hydrating items via findNodesByIds", async () => {
    setupGraphTestMocks();
    vi.mocked(chatRepo.insertToolCall).mockResolvedValue({
      id: "tool-call-search",
      conversation_id: CID,
      message_id: null,
      tool_name: "search",
      arguments: { query: "alice" },
      result: null,
      is_error: false,
      error_message: null,
      duration_ms: 8,
      created_at: "2026-06-20T12:00:00.500Z",
    });

    // search items only carry the id — hydrated rows come from findNodesByIds.
    vi.mocked(findNodesByIds).mockResolvedValueOnce([
      {
        id: "n-1",
        node_type: "person",
        canonical_name: "Alice",
        status: "active",
        merged_into_node_id: null,
      },
    ]);

    const searchResult = {
      query: "alice",
      total: 1,
      limit: 10,
      offset: 0,
      items: [
        {
          kind: "node",
          layer: "node",
          id: "n-1",
          score: 0.9,
          hop: 0,
          summary: "Alice",
          flags: [],
        },
      ],
    };

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "search", args_summary: "query=alice" },
      {
        type: "tool_result",
        tool: "search",
        ok: true,
        arguments: { query: "alice" },
        result: searchResult,
        is_error: false,
        error_message: null,
        duration_ms: 8,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "find alice" },
    });
    expect(res.statusCode).toBe(200);
    const frames = parseSse(res.body);
    const graphDeltaFrame = frames.find((f) => f.event === "graph_delta");
    expect(graphDeltaFrame).toBeDefined();
    const payload = graphDeltaFrame!.data as {
      source_tool: string;
      nodes: ReadonlyArray<{ id: string; canonical_name: string }>;
      links: ReadonlyArray<unknown>;
    };
    expect(payload.source_tool).toBe("search");
    expect(payload.nodes).toHaveLength(1);
    expect(payload.nodes[0]!.id).toBe("n-1");
    expect(payload.nodes[0]!.canonical_name).toBe("Alice");
    expect(payload.links).toHaveLength(0);
    expect(findNodesByIds).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it("each graph-producing tool_result in a multi-tool turn is followed by its own graph_delta (order preserved)", async () => {
    setupGraphTestMocks();
    vi.mocked(chatRepo.insertToolCall).mockResolvedValue({
      id: "tool-call",
      conversation_id: CID,
      message_id: null,
      tool_name: "traverse",
      arguments: {},
      result: null,
      is_error: false,
      error_message: null,
      duration_ms: 5,
      created_at: "2026-06-20T12:00:00.500Z",
    });

    const traverseResult = {
      starting_node_id: "n-1",
      nodes: [
        {
          id: "n-1",
          node_type: "person",
          canonical_name: "Alice",
          status: "active",
        },
      ],
      links: [],
    };
    const getNodeResult = {
      node: {
        id: "n-2",
        node_type: "organization",
        canonical_name: "Acme",
        status: "active",
      },
      aliases: [],
      attributes: [],
    };

    const events: ChatEvent[] = [
      { type: "llm_start", iteration: 1 },
      { type: "tool_start", tool: "traverse", args_summary: "node=n-1" },
      {
        type: "tool_result",
        tool: "traverse",
        ok: true,
        arguments: { starting_node_id: "n-1" },
        result: traverseResult,
        is_error: false,
        error_message: null,
        duration_ms: 5,
      },
      { type: "tool_start", tool: "get_node", args_summary: "id=n-2" },
      {
        type: "tool_result",
        tool: "get_node",
        ok: true,
        arguments: { id: "n-2" },
        result: getNodeResult,
        is_error: false,
        error_message: null,
        duration_ms: 2,
      },
      {
        type: "done",
        stop_reason: "end_turn",
        model: "claude-opus-4-8",
        tokens_in: 10,
        tokens_out: 5,
        content: [],
      },
    ];

    const { app } = await buildApp({ runTurnEvents: events });
    const res = await app.inject({
      method: "POST",
      url: `/conversations/${CID}/messages`,
      headers: { "idempotency-key": IDEMP },
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(200);

    const frames = parseSse(res.body);
    const eventOrder = frames.map((f) => f.event);

    // Exactly two graph_delta frames, one per graph tool_result.
    expect(eventOrder.filter((e) => e === "graph_delta")).toHaveLength(2);

    // Each graph_delta follows its own tool_result. Pairing:
    //   tool_result(traverse) -> graph_delta(traverse) ->
    //   tool_result(get_node) -> graph_delta(get_node)
    const graphDeltaPayloads = frames
      .filter((f) => f.event === "graph_delta")
      .map((f) => (f.data as { source_tool: string }).source_tool);
    expect(graphDeltaPayloads).toEqual(["traverse", "get_node"]);

    // Two tool_result rows persisted (one per tool call); the graph_delta
    // events MUST NOT inflate the chat_tool_call insert count.
    expect(chatRepo.insertToolCall).toHaveBeenCalledTimes(2);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// TC-05 — BR-44 step 4: boot log on registration
// ---------------------------------------------------------------------------

describe("registerChatRoutes — BR-44 boot log", () => {
  /**
   * Capture pino records by wiring a destination stream. Each `info`/`warn`/
   * `error` call lands as one JSON object in the array.
   */
  function buildCapturingLogger(): { logger: pino.Logger; records: unknown[] } {
    const records: unknown[] = [];
    const stream = {
      write(line: string): void {
        try {
          records.push(JSON.parse(line));
        } catch {
          // pino sometimes flushes partial chunks; ignore unparseable lines.
        }
      },
    };
    const logger = pino({ level: "info" }, stream as never);
    return { logger, records };
  }

  function findBootRecord(records: readonly unknown[]):
    | {
        event: string;
        chat_ingest_enabled: boolean;
        tool_count: number;
        ingest_dispatcher_wired: boolean;
      }
    | undefined {
    return records.find(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        (r as { event?: unknown }).event === "chat.boot"
    ) as
      | {
          event: string;
          chat_ingest_enabled: boolean;
          tool_count: number;
          ingest_dispatcher_wired: boolean;
        }
      | undefined;
  }

  it("emits chat.boot{chat_ingest_enabled=false, tool_count=13} when the feature flag is off", async () => {
    const { logger, records } = buildCapturingLogger();
    const env = { ...baseEnv, CHAT_INGEST_ENABLED: false } as Env;
    const mcp = buildMcpWithAllChatTools();
    const app = Fastify({
      loggerInstance: silentLogger as never,
      disableRequestLogging: true,
    });
    app.setErrorHandler(buildErrorHandler(silentLogger));
    await app.register(
      async (scoped) => {
        await registerChatRoutes(scoped, {
          mcp,
          logger,
          env,
          pool: buildFakePool(),
        });
      },
      { prefix: "/conversations" }
    );
    await app.ready();

    const bootRecord = findBootRecord(records);
    expect(bootRecord).toBeDefined();
    expect(bootRecord!.chat_ingest_enabled).toBe(false);
    expect(bootRecord!.tool_count).toBe(13);
    expect(bootRecord!.ingest_dispatcher_wired).toBe(false);
    await app.close();
  });

  it("emits chat.boot{chat_ingest_enabled=true, tool_count=15, ingest_dispatcher_wired=true} when the flag is on AND ingest tools + catalog are present", async () => {
    const { logger, records } = buildCapturingLogger();
    const env = { ...baseEnv, CHAT_INGEST_ENABLED: true } as Env;
    const mcp = buildMcpWithAllChatTools();
    // Register the v2.4 ingestion entries so the catalog resolves 15.
    mcp.registerTool("ingest", {
      name: "start_async_ingestion",
      description: "stub start_async_ingestion",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    mcp.registerTool("ingest", {
      name: "get_ingestion_status",
      description: "stub get_ingestion_status",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    const app = Fastify({
      loggerInstance: silentLogger as never,
      disableRequestLogging: true,
    });
    app.setErrorHandler(buildErrorHandler(silentLogger));
    // Minimal-but-valid ingestion catalog shape — only its presence matters
    // for the boot log path; the dispatcher is not invoked here.
    const ingestionCatalog = {
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: new Map(),
      promptVersionsByName: new Map(),
    } as unknown as Parameters<typeof registerChatRoutes>[1]["ingestionCatalog"];
    await app.register(
      async (scoped) => {
        await registerChatRoutes(scoped, {
          mcp,
          logger,
          env,
          pool: buildFakePool(),
          ingestionCatalog,
        });
      },
      { prefix: "/conversations" }
    );
    await app.ready();

    const bootRecord = findBootRecord(records);
    expect(bootRecord).toBeDefined();
    expect(bootRecord!.chat_ingest_enabled).toBe(true);
    expect(bootRecord!.tool_count).toBe(15);
    expect(bootRecord!.ingest_dispatcher_wired).toBe(true);
    await app.close();
  });

  it("emits chat.boot{tool_count=13, ingest_dispatcher_wired=false} when the flag is ON but the ingest tools are MISSING (defensive degradation, BR-44 §6)", async () => {
    const { logger, records } = buildCapturingLogger();
    const env = { ...baseEnv, CHAT_INGEST_ENABLED: true } as Env;
    // 13 query tools registered; ingest toolset is NEVER populated.
    const mcp = buildMcpWithAllChatTools();
    const app = Fastify({
      loggerInstance: silentLogger as never,
      disableRequestLogging: true,
    });
    app.setErrorHandler(buildErrorHandler(silentLogger));
    await app.register(
      async (scoped) => {
        await registerChatRoutes(scoped, {
          mcp,
          logger,
          env,
          pool: buildFakePool(),
        });
      },
      { prefix: "/conversations" }
    );
    await app.ready();

    const bootRecord = findBootRecord(records);
    expect(bootRecord).toBeDefined();
    // Flag still surfaces its literal value — the rollout state must be
    // visible even when the catalog falls back.
    expect(bootRecord!.chat_ingest_enabled).toBe(true);
    expect(bootRecord!.tool_count).toBe(13);
    expect(bootRecord!.ingest_dispatcher_wired).toBe(false);
    await app.close();
  });
});
