// Zod schema tests for the v2 chat surface (TC-003 acceptance).
//
// Coverage:
//   - CreateConversationRequest (BR-30): empty body OK; title 1..200 chars; rejects empty / over-200.
//   - UpdateConversationRequest (BR-36): at-least-one .refine; title null / archived_at null accepted; non-iso archived_at rejected.
//   - buildSendMessageRequestSchema (BR-01): non-empty content; over-max rejected; optional model override.
//   - ListConversationsQuery (BR-35): default limit 20; max 100; include_archived coercion; cursor optional.
//   - ListMessagesQuery (BR-39): default limit 50; max 200; `before` must be RFC3339.
//   - IdempotencyKeyHeader (BR-26): UUID required; non-UUID rejected.
//   - ConversationIdParam: UUID required.

import { describe, expect, it } from "vitest";

import {
  buildSendMessageRequestSchema,
  ConversationIdParam,
  CreateConversationRequest,
  IdempotencyKeyHeader,
  ListConversationsQuery,
  ListMessagesQuery,
  UpdateConversationRequest,
} from "../chat.schemas.js";

describe("CreateConversationRequest (BR-30)", () => {
  it("accepts an empty body", () => {
    const parsed = CreateConversationRequest.parse({});
    expect(parsed.title).toBeUndefined();
  });

  it("accepts a title within 1..200 chars", () => {
    const parsed = CreateConversationRequest.parse({ title: "Reuniao Apollo" });
    expect(parsed.title).toBe("Reuniao Apollo");
  });

  it("rejects an empty title", () => {
    expect(() => CreateConversationRequest.parse({ title: "" })).toThrow();
  });

  it("rejects a title over 200 chars", () => {
    expect(() =>
      CreateConversationRequest.parse({ title: "x".repeat(201) })
    ).toThrow();
  });
});

describe("UpdateConversationRequest (BR-36)", () => {
  it("accepts a body with only `title`", () => {
    const parsed = UpdateConversationRequest.parse({ title: "Apollo retro" });
    expect(parsed.title).toBe("Apollo retro");
    expect(parsed.archived_at).toBeUndefined();
  });

  it("accepts a body with only `archived_at`", () => {
    const parsed = UpdateConversationRequest.parse({
      archived_at: "2026-06-20T12:00:00Z",
    });
    expect(parsed.archived_at).toBe("2026-06-20T12:00:00Z");
  });

  it("accepts `title: null` (clears the title)", () => {
    const parsed = UpdateConversationRequest.parse({ title: null });
    expect(parsed.title).toBeNull();
  });

  it("accepts `archived_at: null` (un-archives)", () => {
    const parsed = UpdateConversationRequest.parse({ archived_at: null });
    expect(parsed.archived_at).toBeNull();
  });

  it("rejects an empty body via .refine", () => {
    expect(() => UpdateConversationRequest.parse({})).toThrow();
  });

  it("rejects a non-iso `archived_at`", () => {
    expect(() =>
      UpdateConversationRequest.parse({ archived_at: "not-a-date" })
    ).toThrow();
  });
});

describe("buildSendMessageRequestSchema (BR-01)", () => {
  const schema = buildSendMessageRequestSchema({ maxContentLength: 100 });

  it("accepts a non-empty content", () => {
    const parsed = schema.parse({ content: "hello" });
    expect(parsed.content).toBe("hello");
  });

  it("accepts a model override", () => {
    const parsed = schema.parse({ content: "hello", model: "claude-opus-4-8" });
    expect(parsed.model).toBe("claude-opus-4-8");
  });

  it("rejects empty content", () => {
    expect(() => schema.parse({ content: "" })).toThrow();
  });

  it("rejects content over maxContentLength", () => {
    expect(() => schema.parse({ content: "x".repeat(101) })).toThrow();
  });

  it("rejects missing content", () => {
    expect(() => schema.parse({})).toThrow();
  });
});

describe("ListConversationsQuery (BR-35)", () => {
  it("uses default limit=20 and include_archived=false", () => {
    const parsed = ListConversationsQuery.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.include_archived).toBe(false);
    expect(parsed.cursor).toBeUndefined();
  });

  it("coerces limit from string", () => {
    const parsed = ListConversationsQuery.parse({ limit: "50" });
    expect(parsed.limit).toBe(50);
  });

  it("rejects limit > 100", () => {
    expect(() => ListConversationsQuery.parse({ limit: 101 })).toThrow();
  });

  it("rejects limit < 1", () => {
    expect(() => ListConversationsQuery.parse({ limit: 0 })).toThrow();
  });

  it("coerces include_archived 'true' / 'false' strings", () => {
    expect(
      ListConversationsQuery.parse({ include_archived: "true" }).include_archived
    ).toBe(true);
    expect(
      ListConversationsQuery.parse({ include_archived: "false" })
        .include_archived
    ).toBe(false);
  });
});

describe("ListMessagesQuery (BR-39)", () => {
  it("uses default limit=50", () => {
    const parsed = ListMessagesQuery.parse({});
    expect(parsed.limit).toBe(50);
  });

  it("rejects limit > 200", () => {
    expect(() => ListMessagesQuery.parse({ limit: 201 })).toThrow();
  });

  it("accepts an iso8601 `before`", () => {
    const parsed = ListMessagesQuery.parse({ before: "2026-06-20T12:00:00Z" });
    expect(parsed.before).toBe("2026-06-20T12:00:00Z");
  });

  it("rejects a non-iso `before`", () => {
    expect(() => ListMessagesQuery.parse({ before: "yesterday" })).toThrow();
  });
});

describe("IdempotencyKeyHeader (BR-26)", () => {
  it("accepts a valid UUID", () => {
    const parsed = IdempotencyKeyHeader.parse(
      "11111111-1111-4111-8111-111111111111"
    );
    expect(parsed).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects a non-UUID string", () => {
    expect(() => IdempotencyKeyHeader.parse("not-a-uuid")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => IdempotencyKeyHeader.parse("")).toThrow();
  });
});

describe("ConversationIdParam", () => {
  it("requires the id to be a UUID", () => {
    const parsed = ConversationIdParam.parse({
      id: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.id).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("rejects a non-UUID id", () => {
    expect(() => ConversationIdParam.parse({ id: "not-uuid" })).toThrow();
  });
});
