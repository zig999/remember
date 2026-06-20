/**
 * Chat feature — domain types.
 *
 * Spec references:
 *  - docs/specs/domains/chat/openapi.yaml v2.0.0 (wire schemas Conversation,
 *    ChatMessage, ChatContentBlock, UsageResponse)
 *  - docs/specs/front/features/chat.feature.spec.md §4 (transforms — cast
 *    date strings to Date; rename `messages` → `messageCount`) and §4
 *    "Composed models" (`ActiveConversation`)
 *
 * Naming policy:
 *  - Wire payloads use snake_case (preserved verbatim in `ChatMessage` /
 *    `ChatContentBlock` since the SPA renders persisted history straight from
 *    the wire `content[]` blocks). Surface aggregate types (`Conversation`,
 *    `UsageData`, `ActiveConversation`) use camelCase, applied by the api
 *    layer transforms. This matches the §4 transforms table.
 */

/* -------------------------------------------------------------------------
 * Conversation aggregate (camelCase, surface-side)
 * ------------------------------------------------------------------------- */

export interface Conversation {
  readonly id: string;
  /** May be null until the auto-distillation job fires (BR-34). */
  readonly title: string | null;
  /** Null when the conversation is active. */
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
}

/* -------------------------------------------------------------------------
 * Chat message (wire shape preserved — `content[]` blocks are rendered
 * verbatim by ChatBubble, joined per spec §7 adapter).
 * ------------------------------------------------------------------------- */

export type ChatMessageRole = "user" | "assistant";

export type ChatStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "max_iterations"
  | "turn_timeout"
  | "cancelled"
  | "provider_error"
  | "internal_error";

/**
 * One element of the Anthropic-style `content[]` array. The wire allows
 * arbitrary additional fields (`additionalProperties: true`); v1 emits only
 * `text` blocks.
 */
export interface ChatContentBlock {
  readonly type: string;
  readonly text?: string;
  readonly [key: string]: unknown;
}

/**
 * A persisted `chat_message` row. `created_at` is cast to a Date (spec §4
 * transforms table). All other timestamps on this entity (idempotency_key,
 * stop_reason, …) are passed through verbatim.
 */
export interface ChatMessage {
  readonly id: string;
  readonly conversation_id: string;
  readonly role: ChatMessageRole;
  readonly content: ReadonlyArray<ChatContentBlock>;
  readonly stop_reason: ChatStopReason | null;
  readonly idempotency_key: string | null;
  readonly model: string | null;
  readonly tokens_in: number | null;
  readonly tokens_out: number | null;
  readonly latency_ms: number | null;
  readonly createdAt: Date;
}

/* -------------------------------------------------------------------------
 * Tool call data — accumulated from SSE `tool_start` / `tool_result` frames
 * for the in-flight assistant bubble. Persisted history does NOT include
 * tool calls in the v2 wire (BR-32 keeps them server-side only).
 * ------------------------------------------------------------------------- */

export interface ToolCallData {
  readonly tool: string;
  readonly argsSummary: string;
  /** null = pending (saw `tool_start`, awaiting `tool_result`). */
  readonly ok: boolean | null;
}

/* -------------------------------------------------------------------------
 * Usage aggregate — wire `messages` is renamed to `messageCount` per spec
 * §4 transforms ("rename: messages → messageCount, flatten result to root").
 * ------------------------------------------------------------------------- */

export interface UsageData {
  readonly messageCount: number;
  readonly tokens_in: number;
  readonly tokens_out: number;
  readonly tool_calls: number;
}

/* -------------------------------------------------------------------------
 * Composed model — `ActiveConversation` is assembled at the feature level
 * from `getConversation` + `listMessages` + `getConversationUsage`. The
 * `usage` slot is optional because §4 marks the usage fetch "lazy"
 * (sequential after #2) — the conversation surface renders before usage
 * arrives.
 * ------------------------------------------------------------------------- */

export interface ActiveConversation {
  readonly id: string;
  readonly title: string | null;
  /** Derived: `archivedAt !== null`. */
  readonly isArchived: boolean;
  readonly archivedAt: Date | null;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly usage: UsageData | null;
}
