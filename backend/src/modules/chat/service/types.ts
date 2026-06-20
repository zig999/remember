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

import type { Logger } from "pino";

import type { McpServer } from "../../../mcp/server.js";
import type { Env } from "../../../config/env.js";

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

/** Discriminated union — every event the agentic loop may emit. */
export type ChatEvent =
  | { readonly type: "llm_start"; readonly iteration: number }
  | { readonly type: "text_delta"; readonly delta: string }
  | { readonly type: "tool_start"; readonly tool: string; readonly args_summary: string }
  | { readonly type: "tool_result"; readonly tool: string; readonly ok: boolean }
  | {
      readonly type: "done";
      readonly stop_reason: DoneStopReason;
      readonly model: string;
      readonly tokens_in: number;
      readonly tokens_out: number;
    }
  | { readonly type: "error"; readonly code: string; readonly message: string };

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
// ChatRunInput — what the route handler hands to the agentic loop. The model
// has already been resolved (request override OR `env.CHAT_MODEL`) and the
// AbortSignal has already been wired to `req.raw.on('close')` (BR-12).
// ---------------------------------------------------------------------------

export interface ChatMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface ChatRunInput {
  readonly messages: ReadonlyArray<ChatMessage>;
  /** Resolved Anthropic model id (override OR `env.CHAT_MODEL`). */
  readonly model: string;
  /** Bound to `req.raw.on('close')` in the route handler (BR-12). */
  readonly abortSignal: AbortSignal;
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
