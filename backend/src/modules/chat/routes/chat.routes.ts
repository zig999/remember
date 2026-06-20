// Fastify route handler for `POST /api/v1/chat` — the SSE transport that
// wraps the `ChatAgentService.runTurn(...)` AsyncIterable.
//
// What this file owns (chat.back.md §1.1):
//   - Zod parse of the request body (BR-01..BR-04).
//   - Kill-switch short-circuit (BR-14).
//   - Service construction + factory error handling (BR-21).
//   - `reply.hijack()` + SSE response headers (BR-23 boundary).
//   - `req.raw.on('close')` -> `AbortController.abort()` wiring (BR-12).
//   - Consumption of the `AsyncIterable<ChatEvent>` and serialisation of each
//     event as one SSE frame (`event: <name>\ndata: <JSON>\n\n` — BR-08).
//   - Post-stream pino INFO turn record (BR-19) + counter increment.
//   - Conditional route registration on the resolved tool catalog (BR-05).
//
// What this file does NOT own:
//   - The agentic loop, ceilings, tool dispatch, output guard, truncation,
//     args-summary builder — all live in `service/chat-agent.service.ts`
//     (TC-03).
//   - Auth — the `requireNeonAuth` preHandler is inherited from the
//     `/api/v1` scope (CLAUDE.md "Authentication"). No additional check here.
//
// Error boundary (BR-23): every error raised BEFORE `reply.hijack()` is
// rendered as the standard REST envelope (`reply.code(N).send({ok:false,
// error:{...}})`). Anything raised AFTER `reply.hijack()` flows through the
// service's AsyncIterable as a `ChatEvent.error` frame, which the consumer
// loop writes onto the wire before calling `reply.raw.end()`.

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Logger } from "pino";

import type { Env } from "../../../config/env.js";
import type { McpServer } from "../../../mcp/server.js";
import {
  buildChatToolCatalog,
  CHAT_TOOL_NAMES,
  type ResolvedChatToolCatalog,
} from "../service/tool-catalog.js";
import {
  createChatAgentService,
  type ChatAgentServiceWithStats,
} from "../service/chat-agent.service.js";
import {
  ChatDisabledError,
  ChatProviderUnavailableError,
  mapChatError,
} from "../service/errors.js";
import type {
  ChatEvent,
  ChatMessage,
  ChatRunInput,
  ChatRunStats,
  DoneStopReason,
  AnthropicFactory,
} from "../service/types.js";
import { buildChatTurnRequestSchema } from "./chat.schemas.js";

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/**
 * Dependencies wired by `app.ts`. The `anthropicFactory` is intentionally
 * optional — production uses the default from `extraction.service.ts` (BR-21);
 * tests inject a stub.
 */
export interface ChatRouteDeps {
  readonly mcp: McpServer;
  readonly logger: Logger;
  readonly env: Env;
  readonly anthropicFactory?: AnthropicFactory;
  readonly now?: () => number;
}

/**
 * Register the chat route on the supplied scope (called from `app.ts` inside
 * the `/api/v1` scope, so the auth preHandler is inherited).
 *
 * Boot order (chat.back.md §1.1 + §7): the `query`-toolset is populated by
 * `registerQueryToolset` / `registerQueryRetrievalToolset` AFTER the
 * `app.register(scoped, ...)` for `/api/v1` resolves. The registry is empty
 * at registration time, so the catalog resolution is performed LAZILY on the
 * first chat request and cached for the process lifetime (BR-05). Same
 * pattern as the MCP query/curation transports.
 *
 * The route IS unconditionally mounted; the soft conditions surface at
 * request time:
 *   - Catalog cannot resolve (a deployment bug, BR-05) -> 503 with a single
 *     boot-style ERROR log on the FIRST miss.
 *   - `env.CHAT_ENABLED === false` (BR-14) -> 503 `BUSINESS_CHAT_DISABLED`.
 *   - Anthropic factory throws on first request (BR-21) -> 503
 *     `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`.
 */
export async function registerChatRoutes(
  scoped: FastifyInstance,
  deps: ChatRouteDeps
): Promise<void> {
  // Lazy service container — built on the first successful catalog resolution
  // and shared across all subsequent requests (BR-21 cache).
  let service: ChatAgentServiceWithStats | undefined;
  // Lazy catalog cache — sticky on miss (BR-05). Tri-state mirrors the
  // module-scope cache inside `tool-catalog.ts`.
  let catalogState: "unresolved" | "missing" | "resolved" = "unresolved";

  const requestSchema = buildChatTurnRequestSchema({
    maxHistoryMessages: deps.env.MAX_HISTORY_MESSAGES,
  });

  /**
   * Lazy initializer for the chat service. Returns the service when the
   * catalog resolves; otherwise records the miss (BR-05) and returns
   * `undefined`. Idempotent — subsequent calls return the cached state
   * without re-checking the registry.
   */
  function getServiceLazy(): ChatAgentServiceWithStats | undefined {
    if (service !== undefined) return service;
    if (catalogState === "missing") return undefined;
    const catalog = buildChatToolCatalog(deps.mcp);
    if (catalog === undefined) {
      catalogState = "missing";
      deps.logger.error(
        {
          event: "chat.catalog_unresolved",
          missing: computeMissingToolNames(deps.mcp),
          expected: [...CHAT_TOOL_NAMES],
        },
        "chat tool catalog is not fully resolved — chat requests return 503"
      );
      return undefined;
    }
    try {
      service = buildService(catalog, deps);
    } catch (err) {
      if (err instanceof ChatDisabledError) {
        // Soft — handler short-circuits on the kill-switch check; we leave
        // `service` undefined and the handler will respond with the
        // BUSINESS_CHAT_DISABLED envelope below.
        deps.logger.warn(
          { event: "chat.disabled_at_boot" },
          "chat surface is disabled by CHAT_ENABLED=false — requests return 503"
        );
        catalogState = "resolved"; // we resolved the catalog; the disabled state is independent.
        return undefined;
      }
      throw err;
    }
    catalogState = "resolved";
    return service;
  }

  scoped.post(
    "/chat",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // BR-01..BR-04 — body validation. `parse` throws `ZodError` which the
      // global error handler maps to 422 VALIDATION_INVALID_FORMAT
      // (`middleware/error-handler.ts` — `classify`).
      const body = requestSchema.parse(request.body);

      // BR-14 — kill-switch FIRST (precedence over catalog/provider checks so
      // a disabled surface returns a predictable code regardless of upstream
      // health).
      if (deps.env.CHAT_ENABLED === false) {
        const { statusCode, envelope } = mapChatError(new ChatDisabledError());
        return reply.code(statusCode).send(envelope);
      }

      // BR-05 — lazy catalog resolution. The toolsets register after this
      // route mounts (see app.ts boot order), so the first request triggers
      // the resolution. A miss is sticky; per BR-05 + §7 ("the route literally
      // does not exist") we surface 404 RESOURCE_NOT_FOUND so the SPA gets the
      // same response shape it would get if the route had not been mounted at
      // all. The boot diagnostic was already emitted inside `getServiceLazy`.
      const liveService = getServiceLazy();
      if (liveService === undefined && catalogState === "missing") {
        return reply.code(404).send({
          ok: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "chat surface is not available on this deployment",
          },
        });
      }
      if (liveService === undefined) {
        // catalogState === "resolved" but service is undefined => kill-switch
        // tripped during the lazy `createChatAgentService` call. Surface the
        // same envelope as the explicit kill-switch branch above.
        const { statusCode, envelope } = mapChatError(new ChatDisabledError());
        return reply.code(statusCode).send(envelope);
      }

      // Resolve model + build the AbortController BEFORE the iterable opens —
      // both are inputs to `runTurn` and must exist before the first
      // synchronous step (BR-12 / BR-21).
      const model =
        body.model !== undefined && body.model.length > 0
          ? body.model
          : deps.env.CHAT_MODEL;

      const abortController = new AbortController();
      const onSocketClose = (): void => {
        if (!abortController.signal.aborted) {
          // Cancellation from the client — distinguished from timeout inside
          // the service by the absence of an abort reason.
          abortController.abort();
        }
      };
      // Bind early so a fast disconnect (between hijack + first write) still
      // triggers the service abort path (BR-12).
      request.raw.on("close", onSocketClose);

      const input: ChatRunInput = {
        messages: body.messages as ReadonlyArray<ChatMessage>,
        model,
        abortSignal: abortController.signal,
      };

      // BR-21 (pre-stream) — `runTurn` is synchronous up to its first `await`,
      // and it synchronously calls `getClient()` (which constructs the
      // Anthropic SDK client). A factory failure surfaces as
      // `ChatProviderUnavailableError` BEFORE we touch the iterable — we must
      // catch it BEFORE `reply.hijack()` so the SPA gets the REST envelope,
      // not an SSE frame.
      let iterable: AsyncIterable<ChatEvent>;
      try {
        iterable = liveService.runTurn(input);
      } catch (err) {
        request.raw.removeListener("close", onSocketClose);
        if (err instanceof ChatProviderUnavailableError) {
          const { statusCode, envelope } = mapChatError(err);
          return reply.code(statusCode).send(envelope);
        }
        throw err; // unexpected — let the global handler do its job.
      }

      // From here we OWN the response. Past this point every error becomes an
      // in-stream `error` frame (BR-23).
      const turnStartedAt = (deps.now ?? Date.now)();
      reply.hijack();
      writeSseHeaders(reply);

      const stats = await drainIterable(reply, iterable, deps.logger);

      // BR-24 — terminal frame already written by the loop. Close the socket.
      try {
        if (!reply.raw.writableEnded) {
          reply.raw.end();
        }
      } catch (err) {
        // Socket already gone — swallow.
        deps.logger.debug(
          {
            event: "chat.raw_end_failed",
            cause_message: err instanceof Error ? err.message : "unknown",
          },
          "reply.raw.end() failed (socket already closed)"
        );
      }

      // Detach close listener — the iterable has terminated.
      request.raw.removeListener("close", onSocketClose);

      // BR-19 — single INFO record per turn, AFTER the iterable is drained.
      const latencyMs = (deps.now ?? Date.now)() - turnStartedAt;
      emitTurnLog({
        logger: deps.logger,
        requestId: String(request.id ?? ""),
        model,
        stats: liveService.lastStats,
        latencyMs,
        sseStats: stats,
      });
    }
  );
}

// ---------------------------------------------------------------------------
// Helpers — kept local to the route file so the boundary stays explicit.
// ---------------------------------------------------------------------------

/**
 * Construct the chat service. Pulled into a helper so the registrar can
 * differentiate `ChatDisabledError` (soft — mount + 503 per request) from any
 * other constructor failure (hard — re-throw and refuse to boot).
 */
function buildService(
  catalog: ResolvedChatToolCatalog,
  deps: ChatRouteDeps
): ChatAgentServiceWithStats {
  return createChatAgentService({
    mcp: deps.mcp,
    logger: deps.logger,
    env: deps.env,
    catalog,
    ...(deps.anthropicFactory !== undefined
      ? { anthropicFactory: deps.anthropicFactory }
      : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  });
}

/** Computes which of the 13 expected tool names are absent on the registry. */
function computeMissingToolNames(mcp: McpServer): string[] {
  const missing: string[] = [];
  for (const name of CHAT_TOOL_NAMES) {
    if (mcp.getTool("query", name) === undefined) missing.push(name);
  }
  return missing;
}

/**
 * Write the SSE response headers. Must be called AFTER `reply.hijack()` and
 * BEFORE the first frame so the proxy / browser commits to the event-stream
 * MIME type. Headers per chat.back.md §1.1 ("Streaming transport").
 */
function writeSseHeaders(reply: FastifyReply): void {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

/**
 * Serialise a single `ChatEvent` as one SSE frame (`event: <name>\ndata:
 * <JSON>\n\n`). Returns the bytes to write — the caller is responsible for
 * `reply.raw.write(...)` and for swallowing write failures (the socket may
 * close mid-write, BR-12).
 */
export function frameChatEvent(evt: ChatEvent): string {
  // Discriminate on `type` and project to the OpenAPI payload shape (data:
  // line). The `type` itself becomes the `event:` line — clients use it for
  // dispatch.
  const { type, ...rest } = evt as ChatEvent & { type: string };
  return `event: ${type}\ndata: ${JSON.stringify(rest)}\n\n`;
}

/** Aggregate observability counters collected during drain. */
interface DrainStats {
  /** Terminal frame type — `done` | `error` — or `none` if the iterable ran out without terminating (defensive). */
  terminalKind: "done" | "error" | "none";
  /** Bytes successfully written; informational. */
  bytesWritten: number;
  /** Whether the socket was already closed when we tried to write the terminal frame. */
  truncated: boolean;
  /** When type=`done`, the stop_reason carried by the frame. */
  doneStopReason: DoneStopReason | undefined;
  /** When type=`error`, the error code carried by the frame. */
  errorCode: string | undefined;
}

/**
 * Drain the iterable, writing each frame to `reply.raw`. Best-effort: a
 * failed write does NOT throw; the iterator is given a chance to terminate
 * cleanly so the service can release timers and listeners (BR-12).
 */
async function drainIterable(
  reply: FastifyReply,
  iterable: AsyncIterable<ChatEvent>,
  logger: Logger
): Promise<DrainStats> {
  const stats: DrainStats = {
    terminalKind: "none",
    bytesWritten: 0,
    truncated: false,
    doneStopReason: undefined,
    errorCode: undefined,
  };

  try {
    for await (const evt of iterable) {
      // Record terminal stats BEFORE attempting the write so an early socket
      // close still surfaces the right stop_reason in the pino record.
      if (evt.type === "done") {
        stats.terminalKind = "done";
        stats.doneStopReason = evt.stop_reason;
      } else if (evt.type === "error") {
        stats.terminalKind = "error";
        stats.errorCode = evt.code;
      }

      const frame = frameChatEvent(evt);
      const ok = tryWrite(reply, frame);
      if (ok) {
        stats.bytesWritten += Buffer.byteLength(frame, "utf8");
      } else {
        stats.truncated = true;
        // Don't break — the service must run to completion to release timers
        // and the abort listener (BR-12). Subsequent writes will also fail,
        // which is fine.
      }
    }
  } catch (err) {
    // BR-23 (in-stream) — anything that escapes the service iterable is a
    // SYSTEM_INTERNAL_ERROR. The service is supposed to fold its own errors
    // into `ChatEvent.error`, so this is a defensive last resort.
    logger.error(
      {
        event: "chat.iterable_uncaught",
        cause_message: err instanceof Error ? err.message : "unknown",
        cause_name: err instanceof Error ? err.name : "unknown",
      },
      "chat AsyncIterable threw — emitting synthetic error frame"
    );
    const synthetic: ChatEvent = {
      type: "error",
      code: "SYSTEM_INTERNAL_ERROR",
      message: "chat encountered an internal error",
    };
    stats.terminalKind = "error";
    stats.errorCode = synthetic.code;
    const ok = tryWrite(reply, frameChatEvent(synthetic));
    if (!ok) stats.truncated = true;
  }

  return stats;
}

/**
 * Best-effort write to `reply.raw`. Returns false if the socket is no longer
 * writable. Per BR-12 the route MUST NOT throw on a closed socket — the
 * client already disconnected and any frame is irrelevant.
 */
function tryWrite(reply: FastifyReply, frame: string): boolean {
  if (reply.raw.writableEnded || reply.raw.destroyed) return false;
  try {
    return reply.raw.write(frame);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Turn log (BR-19)
// ---------------------------------------------------------------------------

interface EmitTurnLogArgs {
  readonly logger: Logger;
  readonly requestId: string;
  readonly model: string;
  /** Service-supplied stats (`runTurn` accumulator snapshot). Undefined if the iterable failed before the first `llm_start`. */
  readonly stats: ChatRunStats | undefined;
  readonly latencyMs: number;
  /** Stats derived from the SSE drain — independent of the service stats. */
  readonly sseStats: DrainStats;
}

/**
 * Emit the §9 pino INFO turn record + counter increment (BR-19). Single
 * record per turn, regardless of terminal kind. NEVER includes
 * `messages[i].content`, `args_summary` raw values, or tool result bodies.
 */
function emitTurnLog(args: EmitTurnLogArgs): void {
  const stopReason = resolveStopReason(args);
  const aborted =
    stopReason === "cancelled" || stopReason === "turn_timeout";
  const record = {
    event: "chat.turn",
    request_id: args.requestId,
    actor: "owner" as const,
    route: "POST /api/v1/chat",
    model: args.model,
    iterations: args.stats?.iterations ?? 0,
    tools_called: args.stats?.tools_called ?? [],
    tokens_in: args.stats?.tokens_in ?? 0,
    tokens_out: args.stats?.tokens_out ?? 0,
    stop_reason: stopReason,
    latency_ms: args.latencyMs,
    aborted,
    // Counter — emitted on the same record so the pino transport can split
    // metrics off the log stream (same pattern as the ingestion metrics).
    counter: {
      name: "chat_turn_total",
      labels: { stop_reason: stopReason },
      value: 1,
    },
  };
  args.logger.info(record, "chat.turn");
}

/**
 * Resolve the terminal `stop_reason` for the pino record. Preference order:
 *   1. The `done.stop_reason` carried by the terminal SSE frame.
 *   2. `"provider_error"` / `"internal_error"` when the terminal was an
 *      `error` frame and the service stats already carry that mapped form.
 *   3. Defensive fallback for an iterable that ran out without terminating.
 */
function resolveStopReason(args: EmitTurnLogArgs): string {
  if (args.sseStats.terminalKind === "done") {
    return args.sseStats.doneStopReason ?? "end_turn";
  }
  if (args.sseStats.terminalKind === "error") {
    // The service may have flagged the in-loop accumulator with the mapped
    // reason ("provider_error" / "internal_error"). Prefer that when present.
    const fromService = args.stats?.stop_reason;
    if (fromService === "provider_error" || fromService === "internal_error") {
      return fromService;
    }
    // Otherwise derive from the SSE error code.
    return args.sseStats.errorCode === "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"
      ? "provider_error"
      : "internal_error";
  }
  // Defensive fallback — iterable closed without a terminal frame.
  return "internal_error";
}
