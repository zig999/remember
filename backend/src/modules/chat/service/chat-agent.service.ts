// ChatAgentService — the agentic tool-use loop that drives the Anthropic
// streaming API, dispatches the 13 read-only `query`-toolset tools, enforces
// the wall-clock + iteration ceilings, and yields an `AsyncIterable<ChatEvent>`.
//
// Source: `docs/specs/domains/chat/back/chat.back.md` §1.2 + BR-06..BR-24
// (`runTurn` contract) and `docs/specs/domains/chat/chat.spec.md` §3 UC-01..05
// + §5 state machine (event ordering).
//
// What lives here, what does NOT:
//
//   - HERE: the per-turn loop, iteration counter, turn-timeout `setTimeout`,
//     abort propagation, tool dispatch via `McpTool.handler`, per-tool
//     wall-clock race, tool-result truncation, output-guard scrub, token
//     accumulation across iterations, terminal-frame guarantee (BR-24).
//
//   - NOT here: Zod parsing (route owns it — BR-01..04), `reply.hijack()` and
//     SSE framing (route owns it — `chat.back.md` §1.1), the pino INFO
//     turn record (route owns it — BR-19), pre-stream auth / kill-switch
//     short-circuit (route owns them — BR-14 / BR-23), database access
//     (delegated to the tool handlers — BR-06).
//
// The contract surface is intentionally narrow: ONE method `runTurn(input)`
// returns an `AsyncIterable<ChatEvent>`. The route consumes the iterable,
// serialises each event as a single SSE frame, and emits a single pino
// record after the iterator returns or throws.

import type { Logger } from "pino";
import type Anthropic from "@anthropic-ai/sdk";

import type {
  ChatAgentService,
  ChatAgentServiceDeps,
  ChatEvent,
  ChatRunInput,
  ChatRunStats,
  DoneStopReason,
} from "./types.js";
import type { ResolvedChatToolCatalog } from "./tool-catalog.js";
import { buildArgsSummary } from "./args-summary.js";
import { truncateToolResult } from "./truncate-tool-result.js";
import { inspectDelta } from "./output-guard.js";
import {
  ChatProviderUnavailableError,
  ChatDisabledError,
} from "./errors.js";
import { selectChatPromptModule } from "../prompts/index.js";
import { defaultAnthropicFactory } from "../../ingestion/service/extraction.service.js";
import type { AnthropicFactory } from "../../ingestion/service/extraction.service.js";

// ---------------------------------------------------------------------------
// Anthropic streaming-event surface — chat-local
//
// The chat module needs an `Anthropic.messages.stream(...)` whose returned
// stream supports the SDK's event-listener API (`on('text', ...)`,
// `on('error', ...)`, `on('end', ...)`, `abort()`, `finalMessage()`). The
// real `AnthropicClient` satisfies BOTH this shape AND `ingestion`'s
// `AnthropicLike` — we cast across at the boundary. Tests pass a structurally
// compatible stub via the same `AnthropicFactory` type and we cast on entry.
// ---------------------------------------------------------------------------

/**
 * Subset of `Anthropic.MessageStream` we consume. Mirrors the named events on
 * the SDK type plus the abort + final-message awaiters. The `[Symbol.iterator]`
 * is intentionally absent — we drive the stream entirely through event
 * listeners + `finalMessage()`, which is the most stable surface in the SDK.
 */
export interface ChatMessageStream {
  on(event: "text", handler: (delta: string, snapshot: string) => void): this;
  on(event: "error", handler: (err: unknown) => void): this;
  on(event: "end", handler: () => void): this;
  on(event: "abort", handler: (err: unknown) => void): this;
  abort(): void;
  finalMessage(): Promise<Anthropic.Messages.Message>;
}

/** Request shape passed to `messages.stream(...)` from the chat loop. */
export interface ChatMessageRequest {
  readonly model: string;
  readonly system: string;
  readonly max_tokens: number;
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly tool_choice: {
    readonly type: "auto";
    readonly disable_parallel_tool_use: true;
  };
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
}

/** Minimum surface chat expects on the SDK client. */
export interface ChatAnthropicLike {
  readonly messages: {
    stream(req: ChatMessageRequest): ChatMessageStream;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * `max_tokens` ceiling per Anthropic call. Chat is conversational — the model
 * rarely needs more than a few thousand output tokens per iteration. We use a
 * generous-but-finite ceiling so a runaway generation is bounded by the SDK,
 * not just by the per-turn wall-clock.
 */
const MAX_TOKENS_PER_ITERATION = 4096;

/**
 * Internal abort reason used by the turn-timeout `setTimeout`. The service
 * inspects the abort reason to distinguish a client-cancel (no reason — the
 * route's `AbortController.abort()` is called without an argument) from a
 * timeout (this constant).
 */
const TURN_TIMEOUT_REASON = "turn_timeout" as const;

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

/**
 * Service-level dependencies passed by the route registrar. The resolved tool
 * catalog is required — `registerChatRoutes(...)` does not mount the route
 * when `buildChatToolCatalog(mcp)` returns `undefined` (BR-05).
 */
export interface ChatAgentServiceFactoryDeps extends ChatAgentServiceDeps {
  readonly catalog: ResolvedChatToolCatalog;
}

/**
 * Public observable surface — the route handler reads these after the
 * iterator returns so it can build the §9 pino turn record. The `stats`
 * accessor is populated lazily by `runTurn` as the loop progresses.
 */
export interface ChatAgentServiceWithStats extends ChatAgentService {
  /**
   * Snapshot of the most recent run's accumulated stats. `undefined` when
   * `runTurn` has not yet been invoked. The reference is stable for the
   * lifetime of one turn; the route MUST read it AFTER consuming the iterable.
   */
  readonly lastStats: ChatRunStats | undefined;
}

/**
 * Build a `ChatAgentService` bound to the given dependencies. The factory
 * resolves the Anthropic client ONCE (BR-21) and caches it for the lifetime
 * of the service instance.
 */
export function createChatAgentService(
  deps: ChatAgentServiceFactoryDeps
): ChatAgentServiceWithStats {
  const env = deps.env;
  const factory: AnthropicFactory =
    deps.anthropicFactory ?? defaultAnthropicFactory;
  const now = deps.now ?? Date.now;

  // BR-14: defensive parallel guard. The route handler is the authoritative
  // owner of the kill-switch (it must short-circuit BEFORE `reply.hijack()`).
  // We surface a typed error so a misuse — the route forgot to check —
  // produces a deterministic failure rather than an unhealthy SSE.
  if (env.CHAT_ENABLED === false) {
    throw new ChatDisabledError();
  }

  // BR-21: construct the client once at first runTurn call (lazy). We cache
  // it here on the closure so concurrent turns share the same instance.
  let cachedClient: ChatAnthropicLike | undefined;
  function getClient(): ChatAnthropicLike {
    if (cachedClient !== undefined) return cachedClient;
    try {
      cachedClient = factory(env.ANTHROPIC_API_KEY) as unknown as ChatAnthropicLike;
    } catch (err) {
      // BR-21 pre-stream: factory throws. The route handler catches this and
      // emits the standard REST envelope (BR-23). The service NEVER folds
      // factory errors into an SSE frame because the SSE has not yet opened.
      deps.logger.error(
        { event: "chat.provider_factory_failed", error: serializeError(err) },
        "chat anthropic factory failed"
      );
      throw new ChatProviderUnavailableError();
    }
    return cachedClient;
  }

  // BR-18: resolve prompt module at service construction (fail-loud on a
  // misconfigured CHAT_PROMPT_VERSION — parallel to ingestion's behaviour).
  const promptModule = selectChatPromptModule(env.CHAT_PROMPT_VERSION);

  // BR-06: the `tools` array we send to Anthropic is the resolved catalog,
  // turned into the SDK's `Tool` shape via Zod-derived JSON Schema. We build
  // it once per service instance.
  const tools = buildToolDescriptors(deps.catalog);

  // `stats` is overwritten on each `runTurn` invocation. The route handler
  // reads it after consuming the iterable to build the pino INFO record.
  let stats: ChatRunStats | undefined;

  const service: ChatAgentServiceWithStats = {
    get lastStats(): ChatRunStats | undefined {
      return stats;
    },
    runTurn(input: ChatRunInput): AsyncIterable<ChatEvent> {
      // Build a fresh accumulator per turn — concurrent turns get isolated
      // stats. The accumulator is exposed via the closure-bound `stats`
      // variable so the route handler can read it after consumption.
      const accumulator = createStatsAccumulator();
      stats = accumulator.snapshot();

      const client = getClient();
      return runTurnIterable({
        client,
        catalog: deps.catalog,
        tools,
        promptModule,
        env,
        logger: deps.logger,
        now,
        input,
        accumulator,
        publishStats: (next) => {
          stats = next;
        },
      });
    },
  };

  return service;
}

// ---------------------------------------------------------------------------
// The agentic loop
// ---------------------------------------------------------------------------

interface RunTurnContext {
  readonly client: ChatAnthropicLike;
  readonly catalog: ResolvedChatToolCatalog;
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly promptModule: ReturnType<typeof selectChatPromptModule>;
  readonly env: ChatAgentServiceFactoryDeps["env"];
  readonly logger: Logger;
  readonly now: () => number;
  readonly input: ChatRunInput;
  readonly accumulator: StatsAccumulator;
  readonly publishStats: (next: ChatRunStats) => void;
}

/**
 * The core `runTurn` AsyncIterable. Written as an async generator so the
 * structural invariant of BR-24 ("exactly one terminal event per turn") is
 * enforced by `try { ... } finally { ... }` rather than by repeated yield
 * sites — the `yield* terminate(...)` helper always yields exactly one frame.
 */
function runTurnIterable(ctx: RunTurnContext): AsyncIterable<ChatEvent> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<ChatEvent> {
      return runTurnGenerator(ctx);
    },
  };
}

/** The generator. See `runTurnIterable` for the rationale. */
async function* runTurnGenerator(
  ctx: RunTurnContext
): AsyncGenerator<ChatEvent, void, void> {
  // BR-16: turn-timeout `AbortController`. The reason argument is inspected
  // on cancel to distinguish "client closed" from "wall-clock expired".
  //
  // BR-12: we also forward `input.abortSignal` (the route bound it to
  // `req.raw.on('close')`) into our controller. Forwarding (vs. observing
  // both signals separately) keeps the inspection logic on a single source.
  const turnController = new AbortController();
  const turnTimeoutMs = ctx.env.TURN_TIMEOUT_MS;
  const turnTimer = setTimeout(() => {
    turnController.abort(TURN_TIMEOUT_REASON);
  }, turnTimeoutMs);

  const externalAbortListener = (): void => {
    // Client-cancel: forward to the turn controller WITHOUT a reason (so
    // we can distinguish from timeout via `.reason`).
    if (!turnController.signal.aborted) {
      turnController.abort();
    }
  };
  if (ctx.input.abortSignal.aborted) {
    // Pre-aborted: fire synchronously.
    externalAbortListener();
  } else {
    ctx.input.abortSignal.addEventListener("abort", externalAbortListener);
  }

  // BR-08 + BR-20: gather text deltas for the assistant turn fed back on the
  // next iteration. We accumulate the FILTERED text (after the output guard
  // dropped any marker-containing delta) so a leak never round-trips back
  // into the model.
  //
  // BR-22: tool_choice is unconditional `auto` + parallel tool use disabled.
  const inLoopHistory: Anthropic.Messages.MessageParam[] = ctx.input.messages.map(
    (m) => ({
      role: m.role,
      content: m.content,
    })
  );

  // The "currently active" stream — used by the abort handler to call
  // `stream.abort()` so the SDK tears down its socket promptly.
  let activeStream: ChatMessageStream | undefined;

  // Helper: tear down active stream on abort. Idempotent.
  const abortActive = (): void => {
    if (activeStream !== undefined) {
      try {
        activeStream.abort();
      } catch {
        // Swallow — the SDK may have already ended.
      }
    }
  };

  turnController.signal.addEventListener("abort", abortActive);

  let iteration = 0;
  let lastModel = ctx.input.model;

  try {
    // Outer loop — one iteration per Anthropic call.
    while (true) {
      // BR-15: enforce ceiling BEFORE opening iteration N+1. The check fires
      // when we are about to open a new iteration AFTER the ceiling has
      // already been reached, so the SSE sequence is `... tool_result -> done`.
      iteration += 1;
      if (iteration > ctx.env.MAX_ITERATIONS) {
        yield* terminate(
          ctx,
          "max_iterations",
          lastModel,
          turnTimer,
          externalAbortListener
        );
        return;
      }

      // Early-abort check — if the client cancelled before we even opened
      // this iteration, emit the cancel terminal without an `llm_start`.
      if (turnController.signal.aborted) {
        const reason = turnController.signal.reason;
        const stopReason: DoneStopReason =
          reason === TURN_TIMEOUT_REASON ? "turn_timeout" : "cancelled";
        yield* terminate(
          ctx,
          stopReason,
          lastModel,
          turnTimer,
          externalAbortListener
        );
        return;
      }

      yield { type: "llm_start", iteration } as const;
      ctx.accumulator.bumpIteration();
      ctx.publishStats(ctx.accumulator.snapshot());

      // Open the Anthropic stream + subscribe to text deltas. We collect
      // deltas into a queue (`deltaQueue`) and yield them as the generator
      // is pulled. Errors and ends are signalled via `streamSettled`.
      const stream = ctx.client.messages.stream({
        model: ctx.input.model,
        system: ctx.promptModule.system(),
        max_tokens: MAX_TOKENS_PER_ITERATION,
        tools: ctx.tools as Anthropic.Messages.Tool[],
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
        messages: inLoopHistory,
      });
      activeStream = stream;

      // BR-08 / BR-20: deltas are gathered as the SDK emits them and yielded
      // synchronously as the consumer pulls. We use a small async queue so
      // text events and the stream-end signal can be ordered by the consumer.
      type DeltaItem =
        | { kind: "delta"; delta: string }
        | { kind: "end" }
        | { kind: "error"; err: unknown };
      const queue: DeltaItem[] = [];
      let resume: (() => void) | undefined;
      const enqueue = (item: DeltaItem): void => {
        queue.push(item);
        if (resume !== undefined) {
          const r = resume;
          resume = undefined;
          r();
        }
      };
      stream.on("text", (delta) => {
        // BR-08: drop empty deltas before the guard sees them.
        if (delta.length === 0) return;
        // BR-20: output guard against system-prompt leakage.
        const decision = inspectDelta(delta, ctx.logger);
        if (decision.drop) return;
        enqueue({ kind: "delta", delta });
      });
      stream.on("error", (err) => {
        enqueue({ kind: "error", err });
      });
      stream.on("abort", (err) => {
        // SDK `abort` event — we treat it like a stream error so the
        // post-loop `finalMessage()` await can reject cleanly.
        enqueue({ kind: "error", err });
      });
      stream.on("end", () => {
        enqueue({ kind: "end" });
      });

      // Drain text deltas until the stream ends OR errors. We do NOT await
      // `finalMessage()` here so the consumer sees deltas in real time.
      let streamErrored: unknown | undefined;
      let streamEnded = false;
      while (!streamEnded && streamErrored === undefined) {
        if (queue.length === 0) {
          await new Promise<void>((res) => {
            resume = res;
          });
          continue;
        }
        const item = queue.shift()!;
        if (item.kind === "delta") {
          yield { type: "text_delta", delta: item.delta } as const;
        } else if (item.kind === "end") {
          streamEnded = true;
        } else {
          streamErrored = item.err;
        }
      }

      // After end/error: capture the final message + stop_reason + usage.
      // `finalMessage()` resolves once the stream has fully buffered. If the
      // stream errored we await it to surface the error; the SDK forwards
      // the same error there.
      let finalMessage: Anthropic.Messages.Message | undefined;
      try {
        finalMessage = await stream.finalMessage();
      } catch (err) {
        streamErrored = streamErrored ?? err;
      }
      activeStream = undefined;

      if (streamErrored !== undefined) {
        // BR-11 + BR-12 + BR-16: distinguish provider-error from abort.
        // The Anthropic SDK throws `APIUserAbortError` on abort; we detect
        // by name (the SDK's class is exported under several different
        // names across versions, so a name-based check is safer than
        // `instanceof`).
        if (isAbortError(streamErrored) || turnController.signal.aborted) {
          const reason = turnController.signal.reason;
          const stopReason: DoneStopReason =
            reason === TURN_TIMEOUT_REASON ? "turn_timeout" : "cancelled";
          yield* terminate(
            ctx,
            stopReason,
            lastModel,
            turnTimer,
            externalAbortListener
          );
          return;
        }
        // Non-abort provider error — BR-11.
        ctx.logger.warn(
          {
            event: "chat.provider_stream_error",
            error: serializeError(streamErrored),
            iteration,
          },
          "chat anthropic stream errored"
        );
        yield* terminateError(
          ctx,
          "BUSINESS_CHAT_PROVIDER_UNAVAILABLE",
          "chat provider is temporarily unavailable",
          turnTimer,
          externalAbortListener,
          "provider_error"
        );
        return;
      }

      if (finalMessage === undefined) {
        // Defensive — should not happen if the SDK is healthy.
        yield* terminateError(
          ctx,
          "SYSTEM_INTERNAL_ERROR",
          "chat stream produced no final message",
          turnTimer,
          externalAbortListener,
          "internal_error"
        );
        return;
      }

      lastModel = finalMessage.model ?? lastModel;
      ctx.accumulator.addTokens(
        finalMessage.usage?.input_tokens ?? 0,
        finalMessage.usage?.output_tokens ?? 0
      );
      ctx.publishStats(ctx.accumulator.snapshot());

      // Branch on stop_reason.
      const stop = finalMessage.stop_reason;

      // Append the assistant turn to the in-loop history (preserves
      // `tool_use` blocks for the next iteration's tool_result reply).
      inLoopHistory.push({ role: "assistant", content: finalMessage.content });

      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      if (stop === "tool_use" || toolUseBlocks.length > 0) {
        // BR-22 disables parallel tool use, so toolUseBlocks.length is at
        // most 1; we still iterate to be safe.
        const toolResultBlocks: Anthropic.Messages.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          const toolName = block.name;
          // BR-09: redacted args summary.
          const argsSummary = buildArgsSummary(toolName, block.input);
          yield {
            type: "tool_start",
            tool: toolName,
            args_summary: argsSummary,
          } as const;
          ctx.accumulator.addTool(toolName);
          ctx.publishStats(ctx.accumulator.snapshot());

          // BR-10: defensive guard for unknown tool name.
          const tool = ctx.catalog[toolName];
          let toolEnvelope: ToolEnvelope;
          if (tool === undefined) {
            toolEnvelope = {
              ok: false,
              error: {
                code: "VALIDATION_INVALID_FORMAT",
                message: "unknown tool name",
              },
            };
          } else {
            // BR-17: per-tool wall-clock race. Failure (timeout) feeds an
            // envelope back to the model and DOES NOT end the turn.
            toolEnvelope = await raceToolHandler(
              tool.handler,
              block.input,
              ctx.env.TOOL_TIMEOUT_MS
            );
          }

          yield {
            type: "tool_result",
            tool: toolName,
            ok: toolEnvelope.ok,
          } as const;

          // BR-13: truncate the JSON-serialised body before feeding back.
          const bodyJson = JSON.stringify(toolEnvelope);
          const truncated = truncateToolResult(
            bodyJson,
            ctx.env.TOOL_RESULT_MAX_CHARS
          );

          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: truncated.value,
            is_error: !toolEnvelope.ok,
          });
        }

        // Feed all tool_result blocks back as a single user turn (BR-13).
        if (toolResultBlocks.length > 0) {
          inLoopHistory.push({ role: "user", content: toolResultBlocks });
        }

        // Loop — open the next iteration.
        continue;
      }

      // No tool_use — terminate with the model's stop_reason mapped to our
      // DoneStopReason union (BR-24).
      const mappedStop = mapStopReason(stop);
      yield* terminate(
        ctx,
        mappedStop,
        lastModel,
        turnTimer,
        externalAbortListener
      );
      return;
    }
  } catch (err) {
    // BR-23 in-stream: any uncaught exception in the loop is mapped to a
    // SYSTEM_INTERNAL_ERROR SSE error frame.
    ctx.logger.error(
      {
        event: "chat.loop_internal_error",
        error: serializeError(err),
      },
      "chat agent loop threw"
    );
    yield* terminateError(
      ctx,
      "SYSTEM_INTERNAL_ERROR",
      "chat encountered an internal error",
      turnTimer,
      externalAbortListener,
      "internal_error"
    );
    return;
  } finally {
    // Belt-and-braces: ensure timer + listener are cleaned up even if a
    // consumer abandons the iterator mid-flight (e.g. `for await` break).
    clearTimeout(turnTimer);
    ctx.input.abortSignal.removeEventListener("abort", externalAbortListener);
    if (activeStream !== undefined) {
      try {
        activeStream.abort();
      } catch {
        // ignore
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Terminal-frame helpers — single source of truth for BR-24
// ---------------------------------------------------------------------------

async function* terminate(
  ctx: RunTurnContext,
  stopReason: DoneStopReason,
  model: string,
  turnTimer: NodeJS.Timeout,
  externalAbortListener: () => void
): AsyncGenerator<ChatEvent, void, void> {
  clearTimeout(turnTimer);
  ctx.input.abortSignal.removeEventListener("abort", externalAbortListener);
  ctx.accumulator.finalize(stopReason);
  ctx.publishStats(ctx.accumulator.snapshot());
  const snapshot = ctx.accumulator.snapshot();
  yield {
    type: "done",
    stop_reason: stopReason,
    model,
    tokens_in: snapshot.tokens_in,
    tokens_out: snapshot.tokens_out,
  } as const;
}

async function* terminateError(
  ctx: RunTurnContext,
  code: string,
  message: string,
  turnTimer: NodeJS.Timeout,
  externalAbortListener: () => void,
  statsStopReason: "provider_error" | "internal_error"
): AsyncGenerator<ChatEvent, void, void> {
  clearTimeout(turnTimer);
  ctx.input.abortSignal.removeEventListener("abort", externalAbortListener);
  ctx.accumulator.finalize(statsStopReason);
  ctx.publishStats(ctx.accumulator.snapshot());
  yield { type: "error", code, message } as const;
}

// ---------------------------------------------------------------------------
// Stats accumulator
// ---------------------------------------------------------------------------

interface StatsAccumulator {
  bumpIteration(): void;
  addTokens(inTok: number, outTok: number): void;
  addTool(name: string): void;
  finalize(stop: ChatRunStats["stop_reason"]): void;
  snapshot(): ChatRunStats;
}

function createStatsAccumulator(): StatsAccumulator {
  let tokens_in = 0;
  let tokens_out = 0;
  let iterations = 0;
  const tools_called: string[] = [];
  let stop_reason: ChatRunStats["stop_reason"] = "end_turn";
  return {
    bumpIteration: () => {
      iterations += 1;
    },
    addTokens: (i, o) => {
      tokens_in += i;
      tokens_out += o;
    },
    addTool: (name) => {
      tools_called.push(name);
    },
    finalize: (stop) => {
      stop_reason = stop;
    },
    snapshot: (): ChatRunStats => ({
      tokens_in,
      tokens_out,
      iterations,
      tools_called: tools_called.slice(),
      stop_reason,
    }),
  };
}

// ---------------------------------------------------------------------------
// Tool dispatch — BR-17 race
// ---------------------------------------------------------------------------

interface ToolEnvelope {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: { readonly code: string; readonly message: string; readonly details?: unknown };
}

/**
 * Race the tool handler against a wall-clock. On timeout, return a synthetic
 * failure envelope mapped to `SYSTEM_SERVICE_UNAVAILABLE` (BR-17). The
 * underlying handler promise is NOT cancelled — v1 accepts that the SQL
 * runs to completion (see `chat.back.md` §7 "Tool timeout does not cancel
 * the SQL").
 *
 * On a handler exception, we emit a synthetic failure envelope mapped to
 * `SYSTEM_INTERNAL_ERROR` so the loop does not crash. This is defensive —
 * the resolved tool handlers are expected to return envelopes themselves.
 */
async function raceToolHandler(
  handler: (input: unknown) => Promise<unknown>,
  input: unknown,
  timeoutMs: number
): Promise<ToolEnvelope> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<ToolEnvelope>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        ok: false,
        error: {
          code: "SYSTEM_SERVICE_UNAVAILABLE",
          message: "tool timeout",
        },
      });
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([
      handler(input).then(
        (envelope) => coerceEnvelope(envelope),
        (err) => synthesiseInternalErrorEnvelope(err)
      ),
      timeoutPromise,
    ]);
    return result;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Coerce an arbitrary handler return into the standard envelope. Tool
 * handlers already return `{ ok, result }` / `{ ok, error }` per the
 * `McpServer` contract; this is a defensive wrapper in case a handler
 * returned a bare value.
 */
function coerceEnvelope(value: unknown): ToolEnvelope {
  if (
    value !== null &&
    typeof value === "object" &&
    "ok" in (value as Record<string, unknown>) &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  ) {
    return value as ToolEnvelope;
  }
  // Bare value — wrap as success envelope.
  return { ok: true, result: value };
}

function synthesiseInternalErrorEnvelope(err: unknown): ToolEnvelope {
  return {
    ok: false,
    error: {
      code: "SYSTEM_INTERNAL_ERROR",
      message: errMessage(err) ?? "tool handler threw",
    },
  };
}

// ---------------------------------------------------------------------------
// Tool descriptor builder
// ---------------------------------------------------------------------------

/**
 * Build the Anthropic `Tool[]` descriptor array from the resolved catalog.
 * Each `McpTool` carries a Zod input schema; we convert to JSON Schema via
 * the Anthropic SDK's preferred form. For TC-03 we use a permissive schema
 * (object with no required fields) because the chat module does not own the
 * tool input schemas — the model receives the description and infers the
 * shape from there. Future work (TD): plumb the JSON Schema export from
 * each tool through `McpTool` so Anthropic gets the strict typing it needs.
 */
function buildToolDescriptors(
  catalog: ResolvedChatToolCatalog
): readonly Anthropic.Messages.Tool[] {
  const out: Anthropic.Messages.Tool[] = [];
  for (const name of Object.keys(catalog)) {
    const tool = catalog[name];
    if (tool === undefined) continue; // unreachable — catalog is dense by BR-05
    out.push({
      name,
      description: tool.description,
      // Permissive schema — the model is steered by the description and the
      // system prompt's "resolve ids before calling" rule. Each tool's Zod
      // schema is re-applied by the tool handler itself on dispatch, so an
      // invalid shape surfaces as a structured envelope (BR-07) rather than
      // an SDK validation rejection.
      input_schema: {
        type: "object",
        additionalProperties: true,
      } as unknown as Anthropic.Messages.Tool.InputSchema,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Misc utilities
// ---------------------------------------------------------------------------

function mapStopReason(
  stop: Anthropic.Messages.Message["stop_reason"] | null | undefined
): DoneStopReason {
  switch (stop) {
    case "end_turn":
      return "end_turn";
    case "max_tokens":
      return "max_tokens";
    case "stop_sequence":
      return "stop_sequence";
    default:
      // Any other stop reason (refusal, pause_turn, null, ...) collapses
      // to `end_turn` for the chat SSE — the model is signalling it has
      // nothing more to say. The accumulator still records the original
      // reason internally if a future requirement adds richer surfacing.
      return "end_turn";
  }
}

function isAbortError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  if (typeof name === "string") {
    if (name === "AbortError" || name === "APIUserAbortError") return true;
  }
  // DOMException check (some runtimes wrap aborts as DOMException with
  // name === 'AbortError'). The name check above already catches this.
  return false;
}

function errMessage(err: unknown): string | undefined {
  if (err === null || typeof err !== "object") return undefined;
  const m = (err as { message?: unknown }).message;
  return typeof m === "string" ? m : undefined;
}

function serializeError(err: unknown): { name?: string; message?: string } {
  if (err === null || typeof err !== "object") {
    return { message: String(err) };
  }
  const o = err as { name?: unknown; message?: unknown };
  const out: { name?: string; message?: string } = {};
  if (typeof o.name === "string") out.name = o.name;
  if (typeof o.message === "string") out.message = o.message;
  return out;
}
