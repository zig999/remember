/**
 * Chat wire→domain transforms.
 *
 * Spec ref: chat.feature.spec.md §4 "Response transforms" table.
 *
 * Why these tests matter:
 *  - Date casts: components compare/sort by Date, never by string. A regression
 *    that leaves an ISO string in the surface model is a silent type error.
 *  - Usage rename: the wire field is `messages` (count) but the SPA model is
 *    `messageCount` to avoid colliding with the messages ARRAY surfaced by
 *    `listMessages`. Reverting the rename silently shadows the array.
 */
import { describe, expect, it } from "vitest";
import {
  toConversation,
  toConversationList,
  toChatMessage,
  toMessageList,
  toUsageData,
  type ConversationWire,
  type ChatMessageWire,
  type UsageWire,
} from "../_transforms";

describe("toConversation", () => {
  const baseWire: ConversationWire = {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Reuniao Apollo",
    archived_at: null,
    summary_rolling: null,
    created_at: "2026-06-20T12:00:00Z",
    updated_at: "2026-06-20T12:00:00Z",
  };

  it("casts `created_at` string to a Date", () => {
    const out = toConversation(baseWire);
    expect(out.createdAt).toBeInstanceOf(Date);
    expect(out.createdAt.toISOString()).toBe("2026-06-20T12:00:00.000Z");
  });

  it("casts `archived_at` to Date when present", () => {
    const out = toConversation({
      ...baseWire,
      archived_at: "2026-06-20T13:30:00Z",
    });
    expect(out.archivedAt).toBeInstanceOf(Date);
    expect(out.archivedAt?.toISOString()).toBe("2026-06-20T13:30:00.000Z");
  });

  it("leaves `archivedAt` null when wire is null (preserves nullability)", () => {
    const out = toConversation(baseWire);
    expect(out.archivedAt).toBeNull();
  });

  it("passes title through verbatim — including null", () => {
    expect(toConversation(baseWire).title).toBe("Reuniao Apollo");
    expect(toConversation({ ...baseWire, title: null }).title).toBeNull();
  });
});

describe("toConversationList", () => {
  it("maps every item and preserves `next_cursor` as `nextCursor`", () => {
    const out = toConversationList({
      items: [
        {
          id: "id-a",
          title: "A",
          archived_at: null,
          summary_rolling: null,
          created_at: "2026-06-20T12:00:00Z",
        },
        {
          id: "id-b",
          title: null,
          archived_at: "2026-06-19T08:00:00Z",
          summary_rolling: null,
          created_at: "2026-06-19T07:00:00Z",
        },
      ],
      next_cursor: "opaque-cursor",
    });
    expect(out.items).toHaveLength(2);
    expect(out.items[0]?.createdAt).toBeInstanceOf(Date);
    expect(out.items[1]?.archivedAt).toBeInstanceOf(Date);
    expect(out.nextCursor).toBe("opaque-cursor");
  });
});

describe("toChatMessage", () => {
  const baseWire: ChatMessageWire = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    conversation_id: "11111111-1111-1111-1111-111111111111",
    role: "user",
    content: [{ type: "text", text: "Quem é o Rodrigo?" }],
    stop_reason: null,
    idempotency_key: "44444444-4444-4444-4444-444444444444",
    model: "claude-opus-4-8",
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    created_at: "2026-06-20T12:00:05Z",
  };

  it("casts `created_at` to a Date", () => {
    const out = toChatMessage(baseWire);
    expect(out.createdAt).toBeInstanceOf(Date);
    expect(out.createdAt.toISOString()).toBe("2026-06-20T12:00:05.000Z");
  });

  it("preserves wire snake_case fields verbatim (content / stop_reason / tokens)", () => {
    const out = toChatMessage({
      ...baseWire,
      role: "assistant",
      stop_reason: "end_turn",
      tokens_in: 1234,
      tokens_out: 78,
      latency_ms: 3210,
      content: [{ type: "text", text: "Olá" }],
    });
    expect(out.role).toBe("assistant");
    expect(out.stop_reason).toBe("end_turn");
    expect(out.tokens_in).toBe(1234);
    expect(out.tokens_out).toBe(78);
    expect(out.latency_ms).toBe(3210);
    expect(out.content).toEqual([{ type: "text", text: "Olá" }]);
  });
});

describe("toMessageList", () => {
  it("maps items and exposes `next_before` as `nextBefore`", () => {
    const out = toMessageList({
      items: [
        {
          id: "m-1",
          conversation_id: "c-1",
          role: "user",
          content: [{ type: "text", text: "Hi" }],
          stop_reason: null,
          idempotency_key: "k-1",
          model: null,
          tokens_in: null,
          tokens_out: null,
          latency_ms: null,
          created_at: "2026-06-20T12:00:00Z",
        },
      ],
      next_before: "2026-06-20T12:00:00Z",
    });
    expect(out.items).toHaveLength(1);
    expect(out.items[0]?.createdAt).toBeInstanceOf(Date);
    expect(out.nextBefore).toBe("2026-06-20T12:00:00Z");
  });

  it("handles an empty page (UI-09 empty state precondition)", () => {
    const out = toMessageList({ items: [], next_before: null });
    expect(out.items).toEqual([]);
    expect(out.nextBefore).toBeNull();
  });
});

describe("toUsageData", () => {
  it("renames `messages` → `messageCount` (spec §4 transforms)", () => {
    const wire: UsageWire = {
      messages: 18,
      tokens_in: 25430,
      tokens_out: 4980,
      tool_calls: 7,
    };
    const out = toUsageData(wire);
    expect(out.messageCount).toBe(18);
    // Guarantee the wire field name is GONE from the surface model — if a
    // future refactor accidentally spreads `...wire`, this will catch it.
    expect((out as unknown as { messages?: number }).messages).toBeUndefined();
  });

  it("passes the three numeric aggregates through verbatim", () => {
    const out = toUsageData({
      messages: 0,
      tokens_in: 0,
      tokens_out: 0,
      tool_calls: 0,
    });
    expect(out.tokens_in).toBe(0);
    expect(out.tokens_out).toBe(0);
    expect(out.tool_calls).toBe(0);
    expect(out.messageCount).toBe(0);
  });
});
