// Public types of the chat module — the contract that the route handler,
// the agentic-loop service, and the tests all program against.
//
// Source: `docs/specs/domains/chat/back/chat.back.md` §1.2 ("ChatAgentService
// contract"). The illustrative TypeScript in the spec is the normative source;
// this file lifts it into a real module surface.
//
// Boundary rule (chat.back.md §1.1): nothing inside `modules/chat/` imports
// from `query-retrieval` or `knowledge-graph` directly. The only coupling is
// the in-process `McpServer` registry, threaded through `ChatAgentServiceDeps`.
//
// `AnthropicFactory` re-export: chat reuses the SAME factory signature as
// ingestion to keep the single Anthropic-SDK seam (`extraction.service.ts`
// lines 169-177). The factory type itself is module-agnostic: it produces an
// `AnthropicLike` object whose `.messages.stream(...)` shape is request-driven.
// Importing the bare type does NOT pull ingestion's `ExtractionMessageRequest`
// into the chat surface — that lives behind the factory's return type and is
// the orchestrator's concern, not the type signature exported here.

import type Anthropic from "@anthropic-ai/sdk";
import type { Logger } from "pino";

import type { McpServer } from "../../../mcp/server.js";
import type { Env } from "../../../config/env.js";
import type {
  GraphLinkWire,
  GraphNodeWire,
} from "./graph-normalizer.js";

// Single import seam to the ingestion module — re-export ONLY the factory type
// (BR-21). This avoids maintaining two diverging definitions while keeping the
// chat domain free of any concrete dependency on extraction code (it pulls a
// type alias, not a value).
export type { AnthropicFactory } from "../../ingestion/service/extraction.service.js";

// ---------------------------------------------------------------------------
// ChatEvent — discriminated union yielded by `ChatAgentService.runTurn(...)`.
// The route handler serializes each variant as one SSE frame
// (`event: <type>\ndata: <JSON>\n\n`). State-machine guarantees of chat.back.md
// §4 (ST-01): exactly one terminal frame (`done` OR `error`) per turn.
// ---------------------------------------------------------------------------

/** Terminal stop reasons (chat.back.md §1.2 + §9 pino schema). */
export type DoneStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "max_iterations"
  | "turn_timeout"
  | "cancelled";

/**
 * Synthetic stop_reason persisted on the assistant row when the SSE
 * terminated with an `error` frame (chat.back.md §10 / BR-29). Never appears
 * as a `done.stop_reason` — only on the persisted `chat_message.stop_reason`.
 */
export type ErrorSyntheticStopReason = "provider_error" | "internal_error";

/**
 * Discriminated union — every event the agentic loop may emit.
 *
 * v2 (chat.back.md §1.2): the `tool_result`, `done`, and `error` variants
 * carry the persistence payload (BR-29 / BR-32). The route handler uses
 * those extra fields to write `chat_tool_call` rows (BR-32) and the
 * post-stream `chat_message` assistant row (BR-29). The SSE wire frame is a
 * PROJECTION of these variants — the route handler explicitly drops the
 * persistence-only fields before serialising (BR-09).
 */
export type ChatEvent =
  | { readonly type: "llm_start"; readonly iteration: number }
  | { readonly type: "text_delta"; readonly delta: string }
  | { readonly type: "tool_start"; readonly tool: string; readonly args_summary: string }
  | {
      readonly type: "tool_result";
      readonly tool: string;
      readonly ok: boolean;
      // v2 additions (BR-32 persistence payload). NOT sent on the SSE wire —
      // the route handler projects to `{tool, ok}` before framing.
      readonly arguments: unknown;
      readonly result: unknown | null;
      readonly is_error: boolean;
      readonly error_message: string | null;
      readonly duration_ms: number;
    }
  | {
      readonly type: "done";
      readonly stop_reason: DoneStopReason;
      readonly model: string;
      readonly tokens_in: number;
      readonly tokens_out: number;
      // v2 addition (BR-29 assistant-row payload). NOT sent on the SSE wire.
      readonly content: ReadonlyArray<unknown>;
    }
  | {
      readonly type: "error";
      readonly code: string;
      readonly message: string;
      // v2 additions (BR-29 error-path assistant row). NOT sent on the SSE wire.
      readonly content: ReadonlyArray<unknown>;
      readonly tokens_in: number;
      readonly tokens_out: number;
      readonly synthetic_stop_reason: ErrorSyntheticStopReason;
    }
  // v2.2 (chat.back.md — faithful multi-row persistence). Emitted by the loop
  // AFTER a tool-bearing iteration completes (every `tool_result` for that
  // iteration has been yielded). Carries the iteration's assistant content
  // (guarded text blocks + the raw `tool_use` block(s)) and the matching
  // `tool_result` block(s). The ROUTE persists this as an atomic pair of
  // `chat_message` rows — assistant `[text?, tool_use]` then synthetic user
  // `[tool_result]` (BR-29 step 6.d) — so the NEXT turn's context replay is a
  // valid Anthropic sequence. INTERNAL ONLY: never serialised to the SSE wire
  // (`projectSseFrame` skips it; the route `continue`s before framing).
  | {
      readonly type: "iteration_end";
      readonly iteration: number;
      readonly assistant_content: ReadonlyArray<unknown>;
      readonly tool_results: ReadonlyArray<unknown>;
    }
  // v3 / TC-be-002 — `graph_delta` is synthesised by the ROUTE handler (NOT
  // by the agentic loop) immediately after a graph-producing `tool_result`,
  // by running the tool envelope through `service/graph-normalizer.ts`. It
  // lives in this union purely so `projectSseFrame` stays exhaustive (the
  // service never yields it). It is NOT persisted (no `chat_tool_call` row)
  // — it is a pure projection of the preceding `tool_result`.
  | {
      readonly type: "graph_delta";
      readonly source_tool: string;
      readonly nodes: ReadonlyArray<GraphNodeWire>;
      readonly links: ReadonlyArray<GraphLinkWire>;
    };

// ---------------------------------------------------------------------------
// ChatRunStats — observability payload aggregated across iterations; consumed
// by the route handler's pino INFO record (BR-19) and the counter increments
// listed in chat.back.md §9.
// ---------------------------------------------------------------------------

export interface ChatRunStats {
  readonly tokens_in: number;
  readonly tokens_out: number;
  readonly iterations: number;
  readonly tools_called: readonly string[];
  readonly stop_reason: DoneStopReason | "provider_error" | "internal_error";
}

// ---------------------------------------------------------------------------
// ChatRunInput — what the route handler hands to the agentic loop.
//
// v2 (chat.back.md §1.2): the route handler builds `system` + `messages` via
// `context-builder.buildModelContext` (BR-31) BEFORE handing them over. The
// loop is therefore decoupled from the prompt registry — it consumes whatever
// the context builder produced. The legacy `ChatMessage` shape (`{role,
// content: string}`) is GONE; the loop only sees Anthropic-typed messages.
// ---------------------------------------------------------------------------

export interface ChatRunInput {
  /**
   * From `context-builder.buildModelContext().system`.
   *
   * BR-47 v2.9: the chat agent receives the FULLY ASSEMBLED two-block
   * `TextBlockParam[]` (BlockA cached + BlockB dynamic-datetime) and
   * forwards it VERBATIM to `anthropic.messages.create` on every iteration
   * of the turn. The `string` form is kept for back-compat with stub
   * fixtures that predate the v2.9 deviation; production callers (the
   * route handler) always pass an array.
   */
  readonly system: string | ReadonlyArray<Anthropic.Messages.TextBlockParam>;
  /** From `context-builder.buildModelContext().messages`. */
  readonly messages: ReadonlyArray<Anthropic.Messages.MessageParam>;
  /** Resolved Anthropic model id (override OR `env.CHAT_MODEL`). */
  readonly model: string;
  /** Bound to `req.raw.on('close')` AND to `cancelTurn` (BR-12, BR-38). */
  readonly abortSignal: AbortSignal;
  /**
   * Verbatim operator turn (TC-02 / BR-34 — Path 1 capture). The route threads
   * `body.content` here unmodified; the chat agent forwards it to ALL tool
   * handlers via `invocation_context.source_excerpt`. Only `ingest_directed`
   * consumes it; the other 13 read-only handlers ignore it. Absent when the
   * route did not thread a value (e.g. legacy tests) — the agent then omits
   * `source_excerpt` from the invocation_context payload entirely.
   */
  readonly current_user_turn?: string;
  /**
   * Non-PII pointer back to the chat row that originated this turn
   * (TC-02 / BR-34). When present, the chat agent forwards it to all tool
   * handlers via `invocation_context.pointer`; only `ingest_directed`
   * consumes it (merges into `RawInformation.metadata`). Required ids:
   * `conversation_id` (the route param) + `message_id` (the user
   * chat_message row id).
   */
  readonly invocation_pointer?: {
    readonly conversation_id: string;
    readonly message_id: string;
  };
}

// ---------------------------------------------------------------------------
// ChatAgentService — the single entry point. Implementations live in
// `chat-agent.service.ts` (not part of TC-01 — added in subsequent TCs).
// ---------------------------------------------------------------------------

export interface ChatAgentService {
  /**
   * Run one chat turn. Yields `ChatEvent`s in the order defined by the §4
   * state machine (chat.back.md ST-01). Always terminates with EXACTLY ONE
   * `done` OR `error` event (BR-24). The route handler is responsible for
   * SSE framing and the final pino record; the service owns the loop, the
   * timers, the tool dispatch, and the output guard.
   */
  runTurn(input: ChatRunInput): AsyncIterable<ChatEvent>;
}

// ---------------------------------------------------------------------------
// ChatAgentServiceDeps — wired up by `registerChatRoutes(scoped, deps)`.
// The `mcp` registry is the ONLY coupling to other domains (chat.back.md §1.1);
// tool catalog resolution flows through `buildChatToolCatalog(mcp)`. The
// `anthropicFactory` and `now` injections are test seams (BR-21).
// ---------------------------------------------------------------------------

export interface ChatAgentServiceDeps {
  /** In-process MCP registry. Read-only consumer (BR-05 / §1.1). */
  readonly mcp: McpServer;
  /** pino logger; the service emits DEBUG-level structural diagnostics only. */
  readonly logger: Logger;
  /** Resolved environment — chat-specific keys are §8. */
  readonly env: Env;
  /** Optional Anthropic factory injection (tests). Defaults to ingestion's `defaultAnthropicFactory` (BR-21). */
  readonly anthropicFactory?: import("../../ingestion/service/extraction.service.js").AnthropicFactory;
  /** Optional wall-clock injection (tests). Defaults to `Date.now`. */
  readonly now?: () => number;
}
