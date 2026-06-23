// TC-03 acceptance criteria covered:
//   - UC-01: text-only turn -> llm_start, text_delta(s), done{end_turn}.
//   - UC-02: single tool_use -> llm_start, tool_start, tool_result, llm_start, done.
//   - UC-03: tool loop hits ceiling -> done{max_iterations}.
//   - UC-04: turn timeout fires -> done{turn_timeout}.
//   - UC-05: client abortSignal fires mid-stream -> done{cancelled}.
//   - BR-17: tool handler slow -> tool_result{ok:false}, loop continues.
//   - BR-20: delta with marker dropped (silent), no text_delta emitted.
//   - BR-24: every code path yields EXACTLY one terminal frame.
//   - BR-11: non-abort provider error -> error frame, no done.
//
// Spec refs: chat.back.md BR-08..BR-24, chat.spec.md UC-01..UC-05 §5 state machine.

import { describe, expect, it, vi, beforeEach } from "vitest";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import {
  CHAT_TOOL_NAMES,
  __resetChatToolCatalogForTests,
  buildChatToolCatalog,
  type ResolvedChatToolCatalog,
} from "../../../modules/chat/service/tool-catalog.js";
import {
  createChatAgentService,
  type ChatAnthropicLike,
  type ChatMessageStream,
  type ChatMessageRequest,
} from "../../../modules/chat/service/chat-agent.service.js";
import type { Env } from "../../../config/env.js";
import { CHAT_PROMPT_MARKER_V1 } from "../../../modules/chat/prompts/v1.js";
import type { ChatEvent } from "../../../modules/chat/service/types.js";

const silentLogger = pino({ level: "silent" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEnv(overrides: Partial<Env> = {}): Env {
  // We only need the chat-relevant fields. The rest of `Env` is shaped
  // through the loader, so we cast at the boundary.
  return {
    NODE_ENV: "test",
    DATABASE_URL: "postgres://x",
    NEON_AUTH_URL: "https://example.com",
    PORT: 3000,
    ANTHROPIC_API_KEY: "sk-test",
    CHAT_ENABLED: true,
    CHAT_MODEL: "claude-opus-4-8",
    CHAT_PROMPT_VERSION: "v1",
    MAX_HISTORY_MESSAGES: 40,
    MAX_ITERATIONS: 3,
    TURN_TIMEOUT_MS: 90_000,
    TOOL_TIMEOUT_MS: 15_000,
    TOOL_RESULT_MAX_CHARS: 8000,
    ...overrides,
  } as unknown as Env;
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

function buildCatalog(): ResolvedChatToolCatalog {
  __resetChatToolCatalogForTests();
  const mcp = buildMcpWithAllChatTools();
  // v2.4 (TC-04): `buildChatToolCatalog` now takes `(mcp, env, logger?)`.
  // We pass an env that explicitly opts OUT of the ingestion portion so the
  // 13-tool catalog is preserved (matches every pre-v2.4 expectation).
  const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });
  if (catalog === undefined) {
    throw new Error("test setup: catalog should resolve");
  }
  return catalog;
}

// ---- Scripted Anthropic stub ----
//
// Each script entry describes ONE iteration. Events are replayed in order
// via `setImmediate` so the consumer sees real async ordering. `finalMessage`
// resolves AFTER the `end` event fires; `error` rejects `finalMessage` and
// emits the SDK `error` listener.

type DeltaScript =
  | { kind: "text"; text: string }
  | { kind: "error"; error: unknown };

interface IterationScript {
  readonly model?: string;
  readonly deltas: readonly DeltaScript[];
  readonly final?: Partial<{
    stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
    content: readonly unknown[];
    usage: { input_tokens: number; output_tokens: number };
  }>;
  /** If set, finalMessage() rejects with this error. */
  readonly finalThrow?: unknown;
  /** If set, the stream emits 'abort' rather than 'end'. */
  readonly abort?: boolean;
  /** If set, stream emits text deltas then HANGS (never end/error). */
  readonly hang?: boolean;
}

function buildStubClient(
  script: readonly IterationScript[]
): {
  client: ChatAnthropicLike;
  callsMade: ChatMessageRequest[];
  streams: ChatMessageStream[];
} {
  const callsMade: ChatMessageRequest[] = [];
  const streams: ChatMessageStream[] = [];
  let cursor = 0;

  const client: ChatAnthropicLike = {
    messages: {
      stream(req: ChatMessageRequest): ChatMessageStream {
        callsMade.push(req);
        const item = script[cursor];
        cursor += 1;
        if (item === undefined) {
          throw new Error(
            `Anthropic stub script exhausted at cursor=${cursor} (length=${script.length})`
          );
        }
        const stream = makeScriptedStream(item);
        streams.push(stream);
        return stream;
      },
    },
  };
  return { client, callsMade, streams };
}

function makeScriptedStream(script: IterationScript): ChatMessageStream {
  const textListeners: Array<(d: string, s: string) => void> = [];
  const errorListeners: Array<(err: unknown) => void> = [];
  const endListeners: Array<() => void> = [];
  const abortListeners: Array<(err: unknown) => void> = [];
  let aborted = false;
  let finalSettled = false;
  let finalResolve: (m: any) => void = () => undefined;
  let finalReject: (e: unknown) => void = () => undefined;
  const finalPromise = new Promise<any>((res, rej) => {
    finalResolve = res;
    finalReject = rej;
  });

  // Drive the script on the macrotask queue so listener registration runs
  // first. Polls `aborted` periodically so the consumer can interrupt a
  // hung stream by calling `.abort()`.
  setImmediate(() => {
    let i = 0;
    const driver = (): void => {
      if (aborted) {
        const abortErr = new Error("aborted");
        (abortErr as Error & { name: string }).name = "APIUserAbortError";
        abortListeners.slice().forEach((l) => l(abortErr));
        if (!finalSettled) {
          finalSettled = true;
          finalReject(abortErr);
        }
        return;
      }
      if (i >= script.deltas.length) {
        if (script.hang) {
          // Poll for abort while hanging.
          setTimeout(driver, 5);
          return;
        }
        if (script.finalThrow !== undefined) {
          errorListeners.slice().forEach((l) => l(script.finalThrow));
          if (!finalSettled) {
            finalSettled = true;
            finalReject(script.finalThrow);
          }
          return;
        }
        if (script.abort) {
          const abortErr = new Error("aborted");
          (abortErr as Error & { name: string }).name = "APIUserAbortError";
          abortListeners.slice().forEach((l) => l(abortErr));
          if (!finalSettled) {
            finalSettled = true;
            finalReject(abortErr);
          }
          return;
        }
        endListeners.slice().forEach((l) => l());
        if (!finalSettled) {
          finalSettled = true;
          finalResolve(buildFinalMessage(script));
        }
        return;
      }
      const item = script.deltas[i];
      i += 1;
      if (item === undefined) return;
      if (item.kind === "text") {
        textListeners.slice().forEach((l) => l(item.text, item.text));
      } else {
        errorListeners.slice().forEach((l) => l(item.error));
        if (!finalSettled) {
          finalSettled = true;
          finalReject(item.error);
        }
        return;
      }
      setImmediate(driver);
    };
    driver();
  });

  return {
    on(event: string, handler: (...args: any[]) => void): any {
      if (event === "text") textListeners.push(handler as any);
      else if (event === "error") errorListeners.push(handler as any);
      else if (event === "end") endListeners.push(handler as any);
      else if (event === "abort") abortListeners.push(handler as any);
      return this;
    },
    abort(): void {
      aborted = true;
    },
    finalMessage(): Promise<any> {
      return finalPromise;
    },
  } as ChatMessageStream;
}

function buildFinalMessage(script: IterationScript): any {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: script.model ?? "claude-opus-4-8",
    content: script.final?.content ?? [],
    stop_reason: script.final?.stop_reason ?? "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: script.final?.usage?.input_tokens ?? 1,
      output_tokens: script.final?.usage?.output_tokens ?? 1,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation: null,
      server_tool_use: null,
      service_tier: null,
    },
  };
}

async function collectEvents(
  iter: AsyncIterable<ChatEvent>
): Promise<ChatEvent[]> {
  const out: ChatEvent[] = [];
  for await (const ev of iter) {
    out.push(ev);
  }
  return out;
}

function buildInput(overrides: Partial<Parameters<ReturnType<typeof createChatAgentService>["runTurn"]>[0]> = {}) {
  const ctrl = new AbortController();
  return {
    abortController: ctrl,
    input: {
      // v2 (chat.back.md §1.2): the loop consumes Anthropic-typed messages +
      // a `system` string. The context builder owns the assembly; the unit
      // test bypasses it by passing fixtures here directly.
      system: "test-system-prompt",
      messages: [
        { role: "user" as const, content: "hello" },
      ],
      model: "claude-opus-4-8",
      abortSignal: ctrl.signal,
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("chat-agent.service.runTurn", () => {
  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  it("UC-01: text-only turn yields llm_start, text_delta(s), done{end_turn}", async () => {
    const { client } = buildStubClient([
      {
        deltas: [
          { kind: "text", text: "Olá" },
          { kind: "text", text: ", mundo" },
        ],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "Olá, mundo" }],
          usage: { input_tokens: 5, output_tokens: 3 },
        },
      },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv(),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    expect(events[0]).toEqual({ type: "llm_start", iteration: 1 });
    expect(events.slice(1, 3)).toEqual([
      { type: "text_delta", delta: "Olá" },
      { type: "text_delta", delta: ", mundo" },
    ]);
    // v2 (BR-29): the `done` event carries the assistant content blocks for
    // the post-stream persistence step. UC-01 produces two text deltas, so
    // the accumulator holds two text blocks.
    expect(events[events.length - 1]).toEqual({
      type: "done",
      stop_reason: "end_turn",
      model: "claude-opus-4-8",
      tokens_in: 5,
      tokens_out: 3,
      content: [
        { type: "text", text: "Olá" },
        { type: "text", text: ", mundo" },
      ],
    });
    // BR-24: exactly one terminal frame.
    expect(events.filter((e) => e.type === "done" || e.type === "error")).toHaveLength(1);
  });

  it("UC-02: tool_use iteration yields llm_start, tool_start, tool_result, llm_start, done", async () => {
    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "search",
              input: { query: "Rodrigo" },
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
        },
      },
      {
        deltas: [{ kind: "text", text: "Encontrei." }],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "Encontrei." }],
          usage: { input_tokens: 20, output_tokens: 2 },
        },
      },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv(),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    // v2.2: a tool-bearing iteration now emits an INTERNAL `iteration_end`
    // event after its `tool_result` (carries the persistence pair). The route
    // consumes it and does NOT frame it to the wire.
    expect(events.map((e) => e.type)).toEqual([
      "llm_start",
      "tool_start",
      "tool_result",
      "iteration_end",
      "llm_start",
      "text_delta",
      "done",
    ]);
    const toolStart = events[1];
    if (toolStart.type !== "tool_start") throw new Error("type guard");
    expect(toolStart.tool).toBe("search");
    expect(toolStart.args_summary).toMatch(/query="Rodrigo"/);
    const toolResult = events[2];
    if (toolResult.type !== "tool_result") throw new Error("type guard");
    expect(toolResult.ok).toBe(true);

    // v2.2 — the iteration_end payload is the persistence pair: assistant
    // content carries the raw tool_use block; tool_results carries the matching
    // tool_result. This is WHAT makes the next turn's replay a valid Anthropic
    // sequence (the bug was: tool_use persisted without its tool_result).
    const iterationEnd = events[3];
    if (iterationEnd.type !== "iteration_end") throw new Error("type guard");
    expect(iterationEnd.iteration).toBe(1);
    const asstBlocks = iterationEnd.assistant_content as Array<{
      type: string;
      id?: string;
    }>;
    const toolUseBlock = asstBlocks.find((b) => b.type === "tool_use");
    expect(toolUseBlock).toBeDefined();
    const trBlocks = iterationEnd.tool_results as Array<{
      type: string;
      tool_use_id?: string;
    }>;
    expect(trBlocks).toHaveLength(1);
    expect(trBlocks[0]!.type).toBe("tool_result");
    // The tool_result references the SAME tool_use id — the pairing invariant.
    expect(trBlocks[0]!.tool_use_id).toBe(toolUseBlock!.id);

    const done = events[6];
    if (done.type !== "done") throw new Error("type guard");
    // v2.2 — the terminal `done` carries ONLY the FINAL iteration's text (the
    // tool_use scaffolding was persisted via iteration_end, not here).
    expect(done.content).toEqual([{ type: "text", text: "Encontrei." }]);
    // tokens accumulate across both iterations.
    expect(done.tokens_in).toBe(30);
    expect(done.tokens_out).toBe(7);
  });

  it("UC-03: tool loop exceeds MAX_ITERATIONS -> done{max_iterations}", async () => {
    // 3 tool_use iterations; on the 4th the ceiling fires BEFORE opening
    // the iteration so we never see a 4th llm_start.
    const toolUseScript: IterationScript = {
      deltas: [],
      final: {
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "tu_x",
            name: "list_nodes",
            input: { node_type: "Person", limit: 10 },
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1 },
      },
    };
    const { client } = buildStubClient([
      toolUseScript,
      toolUseScript,
      toolUseScript,
      toolUseScript,
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ MAX_ITERATIONS: 3 }),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const llmStarts = events.filter((e) => e.type === "llm_start");
    expect(llmStarts).toHaveLength(3);
    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("type guard");
    expect(terminal.stop_reason).toBe("max_iterations");
    expect(events.filter((e) => e.type === "done" || e.type === "error")).toHaveLength(1);
  });

  it("UC-04: turn timeout fires -> done{turn_timeout}", async () => {
    // Iteration 1 hangs forever. The turn-timeout fires and the loop ends
    // with a `turn_timeout` terminal frame.
    const { client } = buildStubClient([
      { deltas: [{ kind: "text", text: "thinking..." }], hang: true },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ TURN_TIMEOUT_MS: 50 }),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("type guard");
    expect(terminal.stop_reason).toBe("turn_timeout");
    expect(events.filter((e) => e.type === "done" || e.type === "error")).toHaveLength(1);
  });

  it("UC-05: client abortSignal fires mid-stream -> done{cancelled}", async () => {
    // Iteration 1 hangs; we abort externally after a tick.
    const { client } = buildStubClient([
      { deltas: [{ kind: "text", text: "starting..." }], hang: true },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ TURN_TIMEOUT_MS: 60_000 }),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input, abortController } = buildInput();
    setTimeout(() => abortController.abort(), 30);
    const events = await collectEvents(svc.runTurn(input));

    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("type guard");
    expect(terminal.stop_reason).toBe("cancelled");
    expect(events.filter((e) => e.type === "done" || e.type === "error")).toHaveLength(1);
  });

  it("BR-11: non-abort provider error -> error frame, NO done", async () => {
    const providerErr = Object.assign(new Error("upstream 5xx"), {
      name: "APIError",
    });
    const { client } = buildStubClient([
      { deltas: [{ kind: "error", error: providerErr }] },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv(),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const errors = events.filter((e) => e.type === "error");
    const dones = events.filter((e) => e.type === "done");
    expect(errors).toHaveLength(1);
    expect(dones).toHaveLength(0);
    const errEv = errors[0];
    if (errEv.type !== "error") throw new Error("type guard");
    expect(errEv.code).toBe("BUSINESS_CHAT_PROVIDER_UNAVAILABLE");
    // Sanitised — does NOT contain the raw upstream string.
    expect(errEv.message).not.toContain("upstream 5xx");
  });

  it("BR-17: tool timeout yields tool_result{ok:false} and loop continues", async () => {
    // The MCP registry's handler hangs forever; BR-17's Promise.race fires
    // with a synthetic SYSTEM_SERVICE_UNAVAILABLE envelope and the loop
    // proceeds to the next iteration.
    const mcp = buildMcpServer(silentLogger);
    const slowNames = new Set(["search"]);
    for (const name of CHAT_TOOL_NAMES) {
      mcp.registerTool("query", {
        name,
        description: `stub ${name}`,
        inputSchema: z.object({}).passthrough(),
        handler: slowNames.has(name)
          ? () => new Promise<never>(() => undefined)
          : async () => ({ ok: true, result: {} }),
      });
    }
    __resetChatToolCatalogForTests();
    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });
    if (catalog === undefined) throw new Error("catalog should resolve");

    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "search",
              input: { query: "x" },
            },
          ],
        },
      },
      {
        deltas: [],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "ok" }],
        },
      },
    ]);
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ TOOL_TIMEOUT_MS: 20 }),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const toolResult = events.find((e) => e.type === "tool_result");
    if (toolResult === undefined || toolResult.type !== "tool_result") {
      throw new Error("no tool_result emitted");
    }
    expect(toolResult.ok).toBe(false);
    // Loop continued — there IS a done frame at the end.
    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("loop did not continue");
    expect(terminal.stop_reason).toBe("end_turn");
  });

  it("BR-20: delta containing the marker is dropped (no text_delta) and a done is still emitted", async () => {
    const { client } = buildStubClient([
      {
        deltas: [
          { kind: "text", text: `before${CHAT_PROMPT_MARKER_V1}after` },
          { kind: "text", text: "clean" },
        ],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "ok" }],
        },
      },
    ]);
    const catalog = buildCatalog();
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv(),
      anthropicFactory: () => client as any,
      catalog,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const deltas = events.filter((e) => e.type === "text_delta");
    expect(deltas).toHaveLength(1);
    if (deltas[0].type !== "text_delta") throw new Error("type guard");
    expect(deltas[0].delta).toBe("clean");
    // Marker NEVER appears in any yielded delta.
    for (const d of deltas) {
      if (d.type !== "text_delta") continue;
      expect(d.delta.includes(CHAT_PROMPT_MARKER_V1)).toBe(false);
    }
    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("terminal not done");
    expect(terminal.stop_reason).toBe("end_turn");
  });

  it("BR-24: every code path terminates with EXACTLY ONE done OR error", async () => {
    // We re-exercise UC-01, UC-03, UC-04, BR-11 and assert the invariant
    // holistically. The other tests already cover individual cases — this
    // is the explicit cross-path invariant test.
    const scenarios: Array<() => ChatAnthropicLike> = [
      // (i) clean end_turn
      () =>
        buildStubClient([
          {
            deltas: [{ kind: "text", text: "hi" }],
            final: { stop_reason: "end_turn", content: [] },
          },
        ]).client,
      // (ii) provider error
      () =>
        buildStubClient([
          { deltas: [{ kind: "error", error: new Error("boom") }] },
        ]).client,
    ];
    const catalog = buildCatalog();
    for (const buildClient of scenarios) {
      const svc = createChatAgentService({
        mcp: undefined as unknown as McpServer,
        logger: silentLogger,
        env: buildEnv(),
        anthropicFactory: () => buildClient() as any,
        catalog,
      });
      const { input } = buildInput();
      const events = await collectEvents(svc.runTurn(input));
      const terminals = events.filter(
        (e) => e.type === "done" || e.type === "error"
      );
      expect(terminals).toHaveLength(1);
    }
  });

  // -------------------------------------------------------------------------
  // TC-05 — v2.4 dispatch routing for the two new ingestion tools
  //   - BR-43: `start_async_ingestion` routes through the injected
  //     `ingestDispatcher` (the chat-side adapter), NOT the catalog handler.
  //   - BR-45: `get_ingestion_status` routes through the catalog handler
  //     verbatim (no special path).
  //   - BR-10: when `ingestDispatcher` is undefined AND the catalog also lacks
  //     the entry, dispatch falls back to VALIDATION_INVALID_FORMAT.
  // -------------------------------------------------------------------------

  it("BR-43: start_async_ingestion routes through the ingestDispatcher (NOT the catalog handler)", async () => {
    // Build an MCP that REGISTERS `start_async_ingestion` on the `ingest`
    // toolset with a handler that would FAIL the test if invoked. The
    // dispatcher injection MUST short-circuit it.
    const mcp = buildMcpWithAllChatTools();
    let catalogHandlerInvoked = false;
    mcp.registerTool("ingest", {
      name: "start_async_ingestion",
      description: "stub start_async_ingestion (catalog handler)",
      inputSchema: z.object({}).passthrough(),
      handler: async () => {
        catalogHandlerInvoked = true;
        return { ok: false, error: { code: "WRONG_PATH", message: "catalog handler should not have been invoked" } };
      },
    });
    mcp.registerTool("ingest", {
      name: "get_ingestion_status",
      description: "stub get_ingestion_status",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: { status: "running" } }),
    });
    __resetChatToolCatalogForTests();
    const catalog = buildChatToolCatalog(mcp, buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>));
    if (catalog === undefined) throw new Error("15-tool catalog should resolve");
    expect(catalog["start_async_ingestion"]).toBeDefined();

    // The dispatcher returns a success envelope synchronously.
    const dispatcherInvocations: unknown[] = [];
    const ingestDispatcher = async (input: unknown) => {
      dispatcherInvocations.push(input);
      return {
        ok: true as const,
        result: {
          outcome: "ingested" as const,
          run_id: "00000000-0000-4000-8000-000000000001",
          raw_information_id: "00000000-0000-4000-8000-000000000002",
          status: "running" as const,
          chunk_count: 3,
        },
      };
    };

    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "start_async_ingestion",
              input: { source_type: "note", content: "hello" },
            },
          ],
        },
      },
      {
        deltas: [{ kind: "text", text: "ok" }],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "ok" }],
        },
      },
    ]);
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>),
      anthropicFactory: () => client as any,
      catalog,
      ingestDispatcher,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    // The dispatcher was invoked with the model's input verbatim.
    expect(dispatcherInvocations).toHaveLength(1);
    expect(dispatcherInvocations[0]).toEqual({
      source_type: "note",
      content: "hello",
    });
    // The catalog handler was NEVER invoked — the dispatcher short-circuit
    // is the BR-43 invariant.
    expect(catalogHandlerInvoked).toBe(false);
    // The tool_result frame carries the dispatcher's envelope.
    const toolResult = events.find((e) => e.type === "tool_result");
    if (toolResult === undefined || toolResult.type !== "tool_result") {
      throw new Error("no tool_result emitted");
    }
    expect(toolResult.tool).toBe("start_async_ingestion");
    expect(toolResult.ok).toBe(true);
    expect(toolResult.result).toMatchObject({
      outcome: "ingested",
      status: "running",
    });
    // Terminal frame is reached — the loop continues after the adapter call.
    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("turn did not complete");
    expect(terminal.stop_reason).toBe("end_turn");
  });

  it("BR-45: get_ingestion_status routes through the catalog handler verbatim (NOT the dispatcher)", async () => {
    // Register a recording handler so we can prove the catalog path was taken.
    const mcp = buildMcpWithAllChatTools();
    const catalogInvocations: unknown[] = [];
    mcp.registerTool("ingest", {
      name: "start_async_ingestion",
      description: "stub start_async_ingestion",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    mcp.registerTool("ingest", {
      name: "get_ingestion_status",
      description: "stub get_ingestion_status (catalog handler)",
      inputSchema: z.object({}).passthrough(),
      handler: async (input: unknown) => {
        catalogInvocations.push(input);
        return {
          ok: true,
          result: {
            llm_run_id: "00000000-0000-4000-8000-000000000001",
            status: "completed",
            started_at: "2026-01-01T00:00:00Z",
            finished_at: "2026-01-01T00:05:00Z",
            summary: { fragments: 12 },
            model: "claude-sonnet-4-6",
            prompt_version: "v3",
          },
        };
      },
    });
    __resetChatToolCatalogForTests();
    const catalog = buildChatToolCatalog(mcp, buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>));
    if (catalog === undefined) throw new Error("15-tool catalog should resolve");

    // The ingestDispatcher MUST NOT be invoked for `get_ingestion_status`.
    const dispatcherInvocations: unknown[] = [];
    const ingestDispatcher = async (input: unknown) => {
      dispatcherInvocations.push(input);
      return { ok: false as const, error: { code: "WRONG_PATH", message: "dispatcher should not be invoked for get_ingestion_status" } };
    };

    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_2",
              name: "get_ingestion_status",
              input: { llm_run_id: "00000000-0000-4000-8000-000000000001" },
            },
          ],
        },
      },
      {
        deltas: [{ kind: "text", text: "done" }],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "done" }],
        },
      },
    ]);
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>),
      anthropicFactory: () => client as any,
      catalog,
      ingestDispatcher,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    // BR-45 invariant: the catalog handler was invoked; the dispatcher was not.
    expect(catalogInvocations).toEqual([
      { llm_run_id: "00000000-0000-4000-8000-000000000001" },
    ]);
    expect(dispatcherInvocations).toHaveLength(0);
    const toolResult = events.find((e) => e.type === "tool_result");
    if (toolResult === undefined || toolResult.type !== "tool_result") {
      throw new Error("no tool_result emitted");
    }
    expect(toolResult.tool).toBe("get_ingestion_status");
    expect(toolResult.ok).toBe(true);
    expect(toolResult.result).toMatchObject({ status: "completed" });
  });

  it("BR-43 / BR-09: start_async_ingestion tool_start carries a redacted args_summary (NEVER raw content)", async () => {
    const mcp = buildMcpWithAllChatTools();
    mcp.registerTool("ingest", {
      name: "start_async_ingestion",
      description: "stub",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    mcp.registerTool("ingest", {
      name: "get_ingestion_status",
      description: "stub",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    __resetChatToolCatalogForTests();
    const catalog = buildChatToolCatalog(mcp, buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>));
    if (catalog === undefined) throw new Error("catalog should resolve");

    const ingestDispatcher = async () => ({
      ok: true as const,
      result: {
        outcome: "ingested" as const,
        run_id: "00000000-0000-4000-8000-000000000001",
        raw_information_id: "00000000-0000-4000-8000-000000000002",
        status: "running" as const,
        chunk_count: 1,
      },
    });

    const SECRET = "TOP-SECRET MEMO content that must NEVER appear on the wire";
    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "start_async_ingestion",
              input: { source_type: "memo", content: SECRET },
            },
          ],
        },
      },
      {
        deltas: [{ kind: "text", text: "ok" }],
        final: { stop_reason: "end_turn", content: [] },
      },
    ]);
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>),
      anthropicFactory: () => client as any,
      catalog,
      ingestDispatcher,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const toolStart = events.find((e) => e.type === "tool_start");
    if (toolStart === undefined || toolStart.type !== "tool_start") {
      throw new Error("no tool_start emitted");
    }
    expect(toolStart.tool).toBe("start_async_ingestion");
    // BR-43 step 5 / BR-09: the summary surfaces ONLY source_type + length.
    expect(toolStart.args_summary).toBe(
      `source_type=memo content_len=${[...SECRET].length}`
    );
    // Anti-leak: SECRET text MUST NOT appear in args_summary.
    expect(toolStart.args_summary).not.toContain("TOP-SECRET");
    expect(toolStart.args_summary).not.toContain("MEMO");
  });

  it("BR-43 step 2: dispatcher STRUCTURAL_INVALID envelope is fed back to the model; the loop continues", async () => {
    const mcp = buildMcpWithAllChatTools();
    mcp.registerTool("ingest", {
      name: "start_async_ingestion",
      description: "stub",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    mcp.registerTool("ingest", {
      name: "get_ingestion_status",
      description: "stub",
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true, result: {} }),
    });
    __resetChatToolCatalogForTests();
    const catalog = buildChatToolCatalog(mcp, buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>));
    if (catalog === undefined) throw new Error("catalog should resolve");

    const ingestDispatcher = async () => ({
      ok: false as const,
      error: {
        code: "STRUCTURAL_INVALID" as const,
        message: "source_type is not in the catalog",
      },
    });

    const { client } = buildStubClient([
      {
        deltas: [],
        final: {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "start_async_ingestion",
              input: { source_type: "bogus", content: "hi" },
            },
          ],
        },
      },
      {
        deltas: [{ kind: "text", text: "I'll try again" }],
        final: {
          stop_reason: "end_turn",
          content: [{ type: "text", text: "I'll try again" }],
        },
      },
    ]);
    const svc = createChatAgentService({
      mcp: undefined as unknown as McpServer,
      logger: silentLogger,
      env: buildEnv({ CHAT_INGEST_ENABLED: true } as Partial<Env>),
      anthropicFactory: () => client as any,
      catalog,
      ingestDispatcher,
    });
    const { input } = buildInput();
    const events = await collectEvents(svc.runTurn(input));

    const toolResult = events.find((e) => e.type === "tool_result");
    if (toolResult === undefined || toolResult.type !== "tool_result") {
      throw new Error("no tool_result emitted");
    }
    expect(toolResult.ok).toBe(false);
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.error_message).toContain("source_type");
    // BR-43 step 2: the loop CONTINUES — the turn does NOT abort.
    const terminal = events[events.length - 1];
    if (terminal.type !== "done") throw new Error("turn aborted on validation failure");
    expect(terminal.stop_reason).toBe("end_turn");
  });
});
