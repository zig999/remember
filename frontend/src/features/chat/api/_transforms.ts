import type {
  ChatMessage,
  ChatContentBlock,
  ChatMessageRole,
  ChatStopReason,
  Conversation,
  UsageData,
} from "../types";

export interface ConversationWire {
  readonly id: string;
  readonly title: string | null;
  readonly archived_at: string | null;
  readonly summary_rolling?: string | null;
  readonly created_at: string;
  readonly updated_at?: string;
}

export interface ConversationListWire {
  readonly items: ReadonlyArray<ConversationWire>;
  readonly next_cursor: string | null;
}

export interface ChatMessageWire {
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
  readonly created_at: string;
}

export interface MessageListWire {
  readonly items: ReadonlyArray<ChatMessageWire>;
  readonly next_before: string | null;
}

export interface UsageWire {
  readonly messages: number;
  readonly tokens_in: number;
  readonly tokens_out: number;
  readonly tool_calls: number;
}

export interface CancelWire {
  readonly cancelled: true;
}

export interface ConversationListResult {
  readonly items: ReadonlyArray<Conversation>;
  readonly nextCursor: string | null;
}

export interface MessageListResult {
  readonly items: ReadonlyArray<ChatMessage>;
  readonly nextBefore: string | null;
}

export function toConversation(wire: ConversationWire): Conversation {
  return {
    id: wire.id,
    title: wire.title,
    archivedAt: wire.archived_at !== null ? new Date(wire.archived_at) : null,
    createdAt: new Date(wire.created_at),
  };
}

export function toConversationList(
  wire: ConversationListWire,
): ConversationListResult {
  return {
    items: wire.items.map(toConversation),
    nextCursor: wire.next_cursor,
  };
}

export function toChatMessage(wire: ChatMessageWire): ChatMessage {
  return {
    id: wire.id,
    conversation_id: wire.conversation_id,
    role: wire.role,
    content: wire.content,
    stop_reason: wire.stop_reason,
    idempotency_key: wire.idempotency_key,
    model: wire.model,
    tokens_in: wire.tokens_in,
    tokens_out: wire.tokens_out,
    latency_ms: wire.latency_ms,
    createdAt: new Date(wire.created_at),
  };
}

export function toMessageList(wire: MessageListWire): MessageListResult {
  return {
    items: wire.items.map(toChatMessage),
    nextBefore: wire.next_before,
  };
}

export function toUsageData(wire: UsageWire): UsageData {
  return {
    messageCount: wire.messages,
    tokens_in: wire.tokens_in,
    tokens_out: wire.tokens_out,
    tool_calls: wire.tool_calls,
  };
}
