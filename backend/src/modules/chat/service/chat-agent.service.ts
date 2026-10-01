import type { Logger } from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import type {
  ChatAgentService,
  ChatAgentServiceDeps,
  ChatEvent,
  ChatRunInput,
  ChatRunStats,
  DoneStopReason,
  ErrorSyntheticStopReason,
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

export interface ChatMessageStream {
  on(event: "text", handler: (delta: string, snapshot: string) => void): this;
  on(event: "error", handler: (err: unknown) => void): this;
  on(event: "end", handler: () => void): this;
  on(event: "abort", handler: (err: unknown) => void): this;
  abort(): void;
  finalMessage(): Promise<Anthropic.Messages.Message>;
}

export interface ChatMessageRequest {
  readonly model: string;
  readonly system: string | readonly Anthropic.Messages.TextBlockParam[];
  readonly max_tokens: number;
  readonly tools: readonly Anthropic.Messages.Tool[];
  readonly tool_choice: {
    readonly type: "auto";
    readonly disable_parallel_tool_use: true;
  };
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
}

export interface ChatAnthropicLike {
  readonly messages: {
    stream(req: ChatMessageRequest): ChatMessageStream;
  };
}

const MAX_TOKENS_PER_ITERATION = 4096;

const TURN_TIMEOUT_REASON = "turn_timeout" as const;

export interface ChatAgentServiceFactoryDeps extends ChatAgentServiceDeps {
  readonly catalog: ResolvedChatToolCatalog;
}

export interface ChatAgentServiceWithStats extends ChatAgentService {
  readonly lastStats: ChatRunStats | undefined;
}

export function createChatAgentService(
  deps: ChatAgentServiceFactoryDeps
): ChatAgentServiceWithStats {
  const env = deps.env;
  const factory: AnthropicFactory =
    deps.anthropicFactory ?? defaultAnthropicFactory;
  const now = deps.now ?? Date.now;

  if (env.CHAT_ENABLED === false) {
    throw new ChatDisabledError();
  }

  let cachedClient: ChatAnthropicLike | undefined;
  function getClient(): ChatAnthropicLike {
    if (cachedClient !== undefined) return cachedClient;
    try {
      cachedClient = factory(env.ANTHROPIC_API_KEY) as unknown as ChatAnthropicLike;
    } catch (err) {
      deps.logger.error(
        { event: "chat.provider_factory_failed", error: serializeError(err) },
        "chat anthropic factory failed"
      );
      throw new ChatProviderUnavailableError();
    }
    return cachedClient;
  }

  const promptModule = selectChatPromptModule(env.CHAT_PROMPT_VERSION);

  const tools = buildToolDescriptors(deps.catalog, deps.logger);

  let stats: ChatRunStats | undefined;

  const service: ChatAgentServiceWithStats = {
    get lastStats(): ChatRunStats | undefined {
      return stats;
    },
    runTurn(input: ChatRunInput): AsyncIterable<ChatEvent> {
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

function runTurnIterable(ctx: RunTurnContext): AsyncIterable<ChatEvent> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<ChatEvent> {
      return runTurnGenerator(ctx);
    },
  };
}

async function* runTurnGenerator(
  ctx: RunTurnContext
): AsyncGenerator<ChatEvent, void, void> {
  const turnController = new AbortController();
  const turnTimeoutMs = ctx.env.TURN_TIMEOUT_MS;
  const turnTimer = setTimeout(() => {
    turnController.abort(TURN_TIMEOUT_REASON);
  }, turnTimeoutMs);

  const externalAbortListener = (): void => {
    if (!turnController.signal.aborted) {
      turnController.abort();
    }
  };
  if (ctx.input.abortSignal.aborted) {
    externalAbortListener();
  } else {
    ctx.input.abortSignal.addEventListener("abort", externalAbortListener);
  }

  const inLoopHistory: Anthropic.Messages.MessageParam[] = ctx.input.messages.map(
    (m) => ({
      role: m.role,
      content: m.content,
    })
  );

  const iterationBlocks: unknown[] = [];

  let activeStream: ChatMessageStream | undefined;

  const abortActive = (): void => {
    if (activeStream !== undefined) {
      try {
        activeStream.abort();
      } catch (err) {
        ctx.logger.debug(
          { cause_message: err instanceof Error ? err.message : "unknown" },
          "chat stream abort (on signal) no-op — stream already ended"
        );
      }
    }
  };

  turnController.signal.addEventListener("abort", abortActive);

  const invocationContext: Record<string, unknown> | undefined = (() => {
    const out: Record<string, unknown> = {};
    if (ctx.input.current_user_turn !== undefined) {
      out.source_excerpt = ctx.input.current_user_turn;
    }
    if (ctx.input.invocation_pointer !== undefined) {
      out.pointer = ctx.input.invocation_pointer;
    }
    return Object.keys(out).length === 0 ? undefined : out;
  })();

  let iteration = 0;
  let lastModel = ctx.input.model;

  try {
    while (true) {
      iteration += 1;
      if (iteration > ctx.env.MAX_ITERATIONS) {
        yield* terminate(
          ctx,
          "max_iterations",
          lastModel,
          turnTimer,
          externalAbortListener,
          iterationBlocks
        );
        return;
      }

      if (turnController.signal.aborted) {
        const reason = turnController.signal.reason;
        const stopReason: DoneStopReason =
          reason === TURN_TIMEOUT_REASON ? "turn_timeout" : "cancelled";
        yield* terminate(
          ctx,
          stopReason,
          lastModel,
          turnTimer,
          externalAbortListener,
          iterationBlocks
        );
        return;
      }

      yield { type: "llm_start", iteration } as const;
      ctx.accumulator.bumpIteration();
      ctx.publishStats(ctx.accumulator.snapshot());

      const systemParam: Anthropic.Messages.TextBlockParam[] =
        typeof ctx.input.system === "string"
          ? [
              {
                type: "text",
                text: ctx.input.system,
                cache_control: { type: "ephemeral" },
              },
            ]
          : (ctx.input.system as Anthropic.Messages.TextBlockParam[]);
      const stream = ctx.client.messages.stream({
        model: ctx.input.model,
        system: systemParam,
        max_tokens: MAX_TOKENS_PER_ITERATION,
        tools: ctx.tools as Anthropic.Messages.Tool[],
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
        messages: inLoopHistory,
      });
      activeStream = stream;

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
        if (delta.length === 0) return;
        const decision = inspectDelta(delta, ctx.logger);
        if (decision.drop) return;
        enqueue({ kind: "delta", delta });
      });
      stream.on("error", (err) => {
        enqueue({ kind: "error", err });
      });
      stream.on("abort", (err) => {
        enqueue({ kind: "error", err });
      });
      stream.on("end", () => {
        enqueue({ kind: "end" });
      });

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
          iterationBlocks.push({ type: "text", text: item.delta });
          yield { type: "text_delta", delta: item.delta } as const;
        } else if (item.kind === "end") {
          streamEnded = true;
        } else {
          streamErrored = item.err;
        }
      }

      let finalMessage: Anthropic.Messages.Message | undefined;
      try {
        finalMessage = await stream.finalMessage();
      } catch (err) {
        streamErrored = streamErrored ?? err;
      }
      activeStream = undefined;

      if (streamErrored !== undefined) {
        if (isAbortError(streamErrored) || turnController.signal.aborted) {
          const reason = turnController.signal.reason;
          const stopReason: DoneStopReason =
            reason === TURN_TIMEOUT_REASON ? "turn_timeout" : "cancelled";
          yield* terminate(
            ctx,
            stopReason,
            lastModel,
            turnTimer,
            externalAbortListener,
            iterationBlocks
          );
          return;
        }
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
          "provider_error",
          iterationBlocks
        );
        return;
      }

      if (finalMessage === undefined) {
        yield* terminateError(
          ctx,
          "SYSTEM_INTERNAL_ERROR",
          "chat stream produced no final message",
          turnTimer,
          externalAbortListener,
          "internal_error",
          iterationBlocks
        );
        return;
      }

      lastModel = finalMessage.model ?? lastModel;
      ctx.accumulator.addTokens(
        finalMessage.usage?.input_tokens ?? 0,
        finalMessage.usage?.output_tokens ?? 0
      );
      ctx.logger.info(
        {
          event: "chat.iteration_usage",
          iteration,
          model: finalMessage.model,
          input_tokens: finalMessage.usage?.input_tokens ?? 0,
          output_tokens: finalMessage.usage?.output_tokens ?? 0,
          cache_read_input_tokens:
            finalMessage.usage?.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens:
            finalMessage.usage?.cache_creation_input_tokens ?? 0,
        },
        "chat iteration token usage"
      );
      ctx.publishStats(ctx.accumulator.snapshot());

      const stop = finalMessage.stop_reason;

      inLoopHistory.push({ role: "assistant", content: finalMessage.content });

      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      if (stop === "tool_use" || toolUseBlocks.length > 0) {
        const toolResultBlocks: Anthropic.Messages.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          iterationBlocks.push(block);

          const toolName = block.name;
          const argsSummary = buildArgsSummary(toolName, block.input);
          yield {
            type: "tool_start",
            tool: toolName,
            args_summary: argsSummary,
          } as const;
          ctx.accumulator.addTool(toolName);
          ctx.publishStats(ctx.accumulator.snapshot());

          const toolStartedAt = ctx.now();

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
            toolEnvelope = await raceToolHandler(
              tool.handler,
              block.input,
              ctx.env.TOOL_TIMEOUT_MS,
              invocationContext
            );
          }

          const durationMs = ctx.now() - toolStartedAt;
          const isError = !toolEnvelope.ok;
          const errMsg =
            toolEnvelope.error?.message !== undefined &&
            typeof toolEnvelope.error.message === "string"
              ? toolEnvelope.error.message
              : null;
          yield {
            type: "tool_result",
            tool: toolName,
            ok: toolEnvelope.ok,
            arguments: block.input,
            result: toolEnvelope.ok ? (toolEnvelope.result ?? null) : null,
            is_error: isError,
            error_message: errMsg,
            duration_ms: durationMs,
          } as const;

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

        if (toolResultBlocks.length > 0) {
          inLoopHistory.push({ role: "user", content: toolResultBlocks });
        }

        yield {
          type: "iteration_end",
          iteration,
          assistant_content: iterationBlocks.slice(),
          tool_results: toolResultBlocks.slice(),
        } as const;
        iterationBlocks.length = 0;

        continue;
      }

      const mappedStop = mapStopReason(stop);
      yield* terminate(
        ctx,
        mappedStop,
        lastModel,
        turnTimer,
        externalAbortListener,
        iterationBlocks
      );
      return;
    }
  } catch (err) {
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
      "internal_error",
      iterationBlocks
    );
    return;
  } finally {
    clearTimeout(turnTimer);
    ctx.input.abortSignal.removeEventListener("abort", externalAbortListener);
    if (activeStream !== undefined) {
      try {
        activeStream.abort();
      } catch (err) {
        ctx.logger.debug(
          { cause_message: err instanceof Error ? err.message : "unknown" },
          "chat stream abort (cleanup) no-op — stream already ended"
        );
      }
    }
  }
}

async function* terminate(
  ctx: RunTurnContext,
  stopReason: DoneStopReason,
  model: string,
  turnTimer: NodeJS.Timeout,
  externalAbortListener: () => void,
  iterationBlocks: readonly unknown[]
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
    content: iterationBlocks.slice(),
  } as const;
}

async function* terminateError(
  ctx: RunTurnContext,
  code: string,
  message: string,
  turnTimer: NodeJS.Timeout,
  externalAbortListener: () => void,
  syntheticStopReason: ErrorSyntheticStopReason,
  iterationBlocks: readonly unknown[]
): AsyncGenerator<ChatEvent, void, void> {
  clearTimeout(turnTimer);
  ctx.input.abortSignal.removeEventListener("abort", externalAbortListener);
  ctx.accumulator.finalize(syntheticStopReason);
  ctx.publishStats(ctx.accumulator.snapshot());
  const snapshot = ctx.accumulator.snapshot();
  yield {
    type: "error",
    code,
    message,
    content: iterationBlocks.filter(
      (b) =>
        typeof b === "object" &&
        b !== null &&
        (b as { type?: unknown }).type === "text"
    ),
    tokens_in: snapshot.tokens_in,
    tokens_out: snapshot.tokens_out,
    synthetic_stop_reason: syntheticStopReason,
  } as const;
}

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

interface ToolEnvelope {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: { readonly code: string; readonly message: string; readonly details?: unknown };
}

export async function raceToolHandler(
  handler: (
    input: unknown,
    invocation_context?: Record<string, unknown>
  ) => Promise<unknown>,
  input: unknown,
  timeoutMs: number,
  invocation_context?: Record<string, unknown>
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
    const invocation = invocation_context === undefined
      ? handler(input)
      : handler(input, invocation_context);
    const result = await Promise.race([
      invocation.then(
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

function coerceEnvelope(value: unknown): ToolEnvelope {
  if (
    value !== null &&
    typeof value === "object" &&
    "ok" in (value as Record<string, unknown>) &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  ) {
    return value as ToolEnvelope;
  }
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

const PERMISSIVE_INPUT_SCHEMA: Anthropic.Messages.Tool.InputSchema = {
  type: "object",
  additionalProperties: true,
} as unknown as Anthropic.Messages.Tool.InputSchema;

function toolInputSchemaFromZod(
  toolName: string,
  inputSchema: unknown,
  logger: Logger
): Anthropic.Messages.Tool.InputSchema | undefined {
  try {
    const raw = z.toJSONSchema(inputSchema as Parameters<typeof z.toJSONSchema>[0], {
      target: "draft-7",
    });
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      logger.warn(
        { event: "chat.tool_schema_invalid_root", tool: toolName },
        "tool input schema did not convert to a JSON Schema object"
      );
      return undefined;
    }
    const record = raw as Record<string, unknown>;
    if (record["type"] !== "object") {
      logger.warn(
        {
          event: "chat.tool_schema_non_object_root",
          tool: toolName,
          received_type: record["type"],
        },
        "tool input schema root is not type:object — Anthropic requires object"
      );
      return undefined;
    }
    if ("$defs" in record || "definitions" in record) {
      logger.warn(
        { event: "chat.tool_schema_has_defs", tool: toolName },
        "tool input schema contains $defs/definitions — Anthropic may reject"
      );
      return undefined;
    }
    const clean: Record<string, unknown> = { ...record };
    delete clean["$schema"];
    return clean as unknown as Anthropic.Messages.Tool.InputSchema;
  } catch (err) {
    logger.warn(
      {
        event: "chat.tool_schema_conversion_failed",
        tool: toolName,
        error: serializeError(err),
      },
      "z.toJSONSchema threw — falling back to permissive schema"
    );
    return undefined;
  }
}

export function buildToolDescriptors(
  catalog: ResolvedChatToolCatalog,
  logger: Logger
): readonly Anthropic.Messages.Tool[] {
  const out: Anthropic.Messages.Tool[] = [];
  for (const name of Object.keys(catalog)) {
    const tool = catalog[name];
    if (tool === undefined) continue;
    const derived = toolInputSchemaFromZod(name, tool.inputSchema, logger);
    out.push({
      name,
      description: tool.description,
      input_schema: derived ?? PERMISSIVE_INPUT_SCHEMA,
    });
  }
  return out;
}

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
      return "end_turn";
  }
}

function isAbortError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  if (typeof name === "string") {
    if (name === "AbortError" || name === "APIUserAbortError") return true;
  }
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
