// TC-04 integration tests — POST /api/v1/chat.
//
// Acceptance criteria covered (TC-04 validation.criteria):
//   1. Valid body + stubbed ChatAgentService -> 200 text/event-stream + frames.
//   2. Empty messages -> 422 VALIDATION_INVALID_FORMAT REST envelope (no SSE).
//   3. First message role=assistant -> 422 VALIDATION_INVALID_FORMAT.
//   4. CHAT_ENABLED=false -> 503 BUSINESS_CHAT_DISABLED REST envelope.
//   5. Factory throws -> 503 BUSINESS_CHAT_PROVIDER_UNAVAILABLE.
//   6. SSE stream closes with `reply.raw.end()` after the terminal frame.
//   7. pino INFO turn record emitted after stream closes with BR-19 fields.
//   8. buildChatToolCatalog returns undefined -> POST /api/v1/chat returns 404.
//
// Strategy: build a MINIMAL Fastify app that mirrors the production scope
// pattern (`/api/v1` with `requireNeonAuth` preHandler + global error
// handler) and register ONLY chat routes against a hand-rolled stub Anthropic
// factory whose stream emits scripted SDK events. We do NOT use `buildApp`
// here because that wires the full BFF surface (ingestion, knowledge-graph,
// curation) which TC-04 does not need — keeping the test surface small
// isolates failures to the chat handler.
//
// Spec refs: chat.back.md §1, §9, BR-01..BR-04, BR-14, BR-19, BR-21, BR-23;
// chat.spec.md §3 UC-01, UC-06; openapi.yaml POST /api/v1/chat.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
} from "fastify";
import pino from "pino";
import { z } from "zod";

import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from "jose";

import type { Env } from "../../../config/env.js";
import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import { buildNeonAuth, type NeonAuth } from "../../../middleware/auth.js";
import { buildErrorHandler } from "../../../middleware/error-handler.js";
import {
  CHAT_TOOL_NAMES,
  __resetChatToolCatalogForTests,
} from "../../../modules/chat/service/tool-catalog.js";
import { registerChatRoutes } from "../../../modules/chat/index.js";
import type {
  ChatAnthropicLike,
  ChatMessageRequest,
  ChatMessageStream,
} from "../../../modules/chat/service/chat-agent.service.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const silentLogger = pino({ level: "silent" });

const envFixture: Env = Object.freeze({
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
  CHAT_PROMPT_VERSION: "v1",
  MAX_HISTORY_MESSAGES: 40,
  MAX_ITERATIONS: 8,
  TURN_TIMEOUT_MS: 90_000,
  TOOL_TIMEOUT_MS: 15_000,
  TOOL_RESULT_MAX_CHARS: 8000,
}) as Env;

interface AuthFixture {
  publicJwk: JWK & { kid: string; alg: string };
  privateKey: CryptoKey;
}

async function buildAuthFixture(): Promise<AuthFixture> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  return {
    privateKey,
    publicJwk: { ...publicJwk, kid: "test-kid", alg: "RS256", use: "sig" },
  };
}

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

function buildAuth(fixture: AuthFixture): NeonAuth {
  return buildNeonAuth(envFixture, async () =>
    ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
  );
}

/**
 * Register the 13 chat tools on the MCP server registry with stub handlers
 * (catalog resolution path — BR-05). Each handler returns a trivial success
 * envelope; the loop is what drives Anthropic, not the tool bodies.
 */
function registerAllChatTools(mcp: McpServer): void {
  for (const name of CHAT_TOOL_NAMES) {
    mcp.registerTool("query", {
      name,
      description: `stub for ${name}`,
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: { stub: name } }),
    });
  }
}

// ---------------------------------------------------------------------------
// Anthropic stub
// ---------------------------------------------------------------------------

/**
 * Scripted Anthropic client stub. Each `stream(...)` call yields one or more
 * text deltas (synchronously via setImmediate) then resolves `finalMessage`
 * with a fixed `end_turn` stop_reason. Tests can override behaviour via the
 * factory closure.
 */
interface StubScript {
  /** Text deltas to emit BEFORE `end_turn`. Default: one delta `"hello"`. */
  readonly deltas?: readonly string[];
  /** Override the model id reported by `finalMessage()`. Default: request model. */
  readonly model?: string;
  /** Override stop_reason. Default: "end_turn". */
  readonly stopReason?: string;
}

function buildStubAnthropicClient(script: StubScript = {}): ChatAnthropicLike {
  return {
    messages: {
      stream(req: ChatMessageRequest): ChatMessageStream {
        const listeners: Record<string, Array<(...args: unknown[]) => void>> = {
          text: [],
          error: [],
          end: [],
          abort: [],
        };
        const stream: ChatMessageStream = {
          on(event: string, handler: (...args: unknown[]) => void) {
            (listeners[event] ??= []).push(handler);
            return this;
          },
          abort() {
            for (const h of listeners.abort) h(new Error("aborted"));
          },
          async finalMessage() {
            return {
              id: "msg_test",
              type: "message",
              role: "assistant",
              model: script.model ?? req.model,
              content: [
                { type: "text", text: (script.deltas ?? ["hello"]).join("") },
              ],
              stop_reason:
                (script.stopReason as
                  | "end_turn"
                  | "max_tokens"
                  | "stop_sequence"
                  | undefined) ?? "end_turn",
              stop_sequence: null,
              usage: { input_tokens: 10, output_tokens: 5 },
            } as never;
          },
        };
        // Emit deltas + end on the microtask queue so the consumer can
        // subscribe BEFORE the events fire.
        setImmediate(() => {
          for (const delta of script.deltas ?? ["hello"]) {
            for (const h of listeners.text) h(delta, delta);
          }
          for (const h of listeners.end) h();
        });
        return stream;
      },
    },
  };
}

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

interface BuildAppOptions {
  /** Env override (default: `envFixture`). */
  readonly env?: Env;
  /** Inject all 13 chat tools onto the registry (default: true). */
  readonly populateCatalog?: boolean;
  /** Custom anthropic factory (default: scripted stub). */
  readonly anthropicFactory?: (apiKey: string) => ChatAnthropicLike;
  /** Custom mcp registry (default: fresh). Use to share with assertions. */
  readonly mcp?: McpServer;
  /** Logger override (default: silent pino). */
  readonly logger?: pino.Logger;
  /** AuthFixture for JWT signing. */
  readonly auth: AuthFixture;
}

async function buildChatApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  __resetChatToolCatalogForTests();
  const env = opts.env ?? envFixture;
  const mcp = opts.mcp ?? buildMcpServer(silentLogger);
  if (opts.populateCatalog !== false) {
    registerAllChatTools(mcp);
  }
  const logger = (opts.logger ?? silentLogger) as pino.Logger;

  const app = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
    bodyLimit: 11 * 1024 * 1024,
    disableRequestLogging: true,
  });
  app.setErrorHandler(buildErrorHandler(logger));

  const auth = buildAuth(opts.auth);
  await app.register(
    async (scoped) => {
      scoped.addHook("preHandler", auth.preHandler);
      await registerChatRoutes(scoped, {
        mcp,
        logger,
        env,
        ...(opts.anthropicFactory !== undefined
          ? {
              anthropicFactory: opts.anthropicFactory as never,
            }
          : {
              anthropicFactory: (() => buildStubAnthropicClient()) as never,
            }),
      });
    },
    { prefix: "/api/v1" }
  );
  return app;
}

// ---------------------------------------------------------------------------
// SSE parsing helper
// ---------------------------------------------------------------------------

interface SseFrame {
  readonly event: string;
  readonly data: unknown;
}

function parseSseStream(raw: string): SseFrame[] {
  const frames: SseFrame[] = [];
  const blocks = raw.split(/\n\n/).filter((b) => b.trim().length > 0);
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let dataLine = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) event = line.slice("event: ".length);
      else if (line.startsWith("data: ")) dataLine = line.slice("data: ".length);
    }
    frames.push({ event, data: dataLine.length > 0 ? JSON.parse(dataLine) : null });
  }
  return frames;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/chat (TC-04 integration)", () => {
  let authFx: AuthFixture;

  beforeAll(async () => {
    authFx = await buildAuthFixture();
  });

  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  afterEach(() => {
    __resetChatToolCatalogForTests();
  });

  // -------------------------------------------------------------------------
  // Happy path — UC-01 (text-only turn).
  // -------------------------------------------------------------------------

  it("UC-01: valid body returns 200, text/event-stream headers, and a llm_start..done frame sequence", async () => {
    const app = await buildChatApp({
      auth: authFx,
      anthropicFactory: () =>
        buildStubAnthropicClient({ deltas: ["Olá, ", "mundo."] }),
    });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
      expect(res.headers["cache-control"]).toBe("no-cache, no-transform");
      expect(res.headers["connection"]).toBe("keep-alive");
      expect(res.headers["x-accel-buffering"]).toBe("no");

      const frames = parseSseStream(res.body);
      // BR-08: 1 llm_start + 2 text_delta + 1 done.
      expect(frames.length).toBeGreaterThanOrEqual(3);
      expect(frames[0]?.event).toBe("llm_start");
      const textDeltas = frames.filter((f) => f.event === "text_delta");
      expect(textDeltas.length).toBe(2);
      expect((textDeltas[0]?.data as { delta: string }).delta).toBe("Olá, ");
      expect((textDeltas[1]?.data as { delta: string }).delta).toBe("mundo.");

      const terminal = frames[frames.length - 1];
      expect(terminal?.event).toBe("done");
      expect((terminal?.data as { stop_reason: string }).stop_reason).toBe(
        "end_turn"
      );
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-01..BR-04 validation failures (pre-stream REST envelope).
  // -------------------------------------------------------------------------

  it("BR-01: empty messages array returns 422 VALIDATION_INVALID_FORMAT (no SSE opened)", async () => {
    const app = await buildChatApp({ auth: authFx });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [] },
      });
      expect(res.statusCode).toBe(422);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  it("BR-02: first message role=assistant returns 422 VALIDATION_INVALID_FORMAT", async () => {
    const app = await buildChatApp({ auth: authFx });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: {
          messages: [{ role: "assistant", content: "Hi there" }],
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-14 — kill-switch.
  // -------------------------------------------------------------------------

  it("BR-14: CHAT_ENABLED=false returns 503 BUSINESS_CHAT_DISABLED (no SSE opened)", async () => {
    const disabledEnv = Object.freeze({
      ...envFixture,
      CHAT_ENABLED: false,
    }) as Env;
    const app = await buildChatApp({ auth: authFx, env: disabledEnv });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(503);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("BUSINESS_CHAT_DISABLED");
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-21 — Anthropic factory throws BEFORE the SSE opens.
  // -------------------------------------------------------------------------

  it("BR-21: factory throws -> 503 BUSINESS_CHAT_PROVIDER_UNAVAILABLE (no SSE opened)", async () => {
    const app = await buildChatApp({
      auth: authFx,
      anthropicFactory: () => {
        throw new Error("missing api key");
      },
    });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(503);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("BUSINESS_CHAT_PROVIDER_UNAVAILABLE");
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-05 — catalog returns undefined (missing tools) => 404.
  // -------------------------------------------------------------------------

  it("BR-05: catalog cannot resolve -> POST /api/v1/chat returns 404", async () => {
    // populateCatalog=false => MCP registry is empty; `buildChatToolCatalog`
    // returns undefined and the handler short-circuits with 404 + a stable
    // RESOURCE_NOT_FOUND envelope (chat.back.md §7).
    const app = await buildChatApp({ auth: authFx, populateCatalog: false });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-19 — pino INFO turn record after the stream closes.
  // -------------------------------------------------------------------------

  it("BR-19: pino INFO turn record is emitted after the stream closes with the BR-19 fields", async () => {
    const captured: Array<Record<string, unknown>> = [];
    // Build a capturing pino logger that hoovers the JSON output into
    // `captured`. We do NOT redirect the parent transport; instead we attach
    // a write hook via a custom dest.
    const logger = pino({
      level: "info",
    }, {
      write(chunk: string) {
        try {
          const parsed = JSON.parse(chunk);
          captured.push(parsed);
        } catch {
          // ignore non-JSON
        }
      },
    } as unknown as NodeJS.WritableStream);

    const app = await buildChatApp({
      auth: authFx,
      logger,
      anthropicFactory: () =>
        buildStubAnthropicClient({ deltas: ["hi"] }),
    });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(200);

      const record = captured.find((r) => r.event === "chat.turn");
      expect(record).toBeDefined();
      // BR-19 required fields:
      expect(record!.actor).toBe("owner");
      expect(record!.route).toBe("POST /api/v1/chat");
      expect(record!.model).toBe("claude-opus-4-8");
      expect(typeof record!.iterations).toBe("number");
      expect(Array.isArray(record!.tools_called)).toBe(true);
      expect(typeof record!.tokens_in).toBe("number");
      expect(typeof record!.tokens_out).toBe("number");
      expect(record!.stop_reason).toBe("end_turn");
      expect(typeof record!.latency_ms).toBe("number");
      expect(record!.aborted).toBe(false);
      // Counter increment co-emitted (chat.back.md §9).
      const counter = record!.counter as Record<string, unknown>;
      expect(counter.name).toBe("chat_turn_total");
      expect((counter.labels as { stop_reason: string }).stop_reason).toBe(
        "end_turn"
      );
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // BR-24 — terminal frame + reply.raw.end()
  // -------------------------------------------------------------------------

  it("BR-24: SSE stream closes after the terminal `done` frame (response body ends after `done`)", async () => {
    const app = await buildChatApp({
      auth: authFx,
      anthropicFactory: () =>
        buildStubAnthropicClient({ deltas: ["bye"] }),
    });
    try {
      const token = await signValidJwt(authFx.privateKey);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chat",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        payload: { messages: [{ role: "user", content: "Oi" }] },
      });
      expect(res.statusCode).toBe(200);
      const frames = parseSseStream(res.body);
      const terminal = frames[frames.length - 1];
      expect(terminal?.event).toBe("done");
      // `inject()` exposes a finished response — if `reply.raw.end()` was not
      // called the response would hang and `res.body` would not be fully
      // populated. The body terminates on the last frame's `\n\n`.
      expect(res.body.endsWith("\n\n")).toBe(true);
    } finally {
      await app.close();
    }
  });
});
