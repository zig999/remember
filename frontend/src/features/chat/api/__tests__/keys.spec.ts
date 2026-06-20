/**
 * conversationKeys — query key factory shape + uniqueness.
 *
 * Spec ref: chat.feature.spec.md §"Data Layer Notes" — the factory shape is
 * normative. These tests pin it so a refactor cannot drift silently and
 * cause silent cache collisions across feature wave TCs.
 */
import { describe, expect, it } from "vitest";
import { conversationKeys } from "../keys";

describe("conversationKeys", () => {
  it("exposes the five normative entries", () => {
    expect(conversationKeys.all).toBeDefined();
    expect(typeof conversationKeys.list).toBe("function");
    expect(typeof conversationKeys.detail).toBe("function");
    expect(typeof conversationKeys.messages).toBe("function");
    expect(typeof conversationKeys.usage).toBe("function");
  });

  it("`all` is the literal prefix ['conversations']", () => {
    expect(conversationKeys.all).toEqual(["conversations"]);
  });

  it("`list` encodes the includeArchived filter as part of the key", () => {
    // The filters object is what separates the include_archived=true cache
    // entry from include_archived=false. Two different filters must
    // produce keys that fail array-deep equality.
    const a = conversationKeys.list({ includeArchived: true });
    const b = conversationKeys.list({ includeArchived: false });
    expect(a).not.toEqual(b);
    expect(a).toEqual(["conversations", "list", { includeArchived: true }]);
    expect(b).toEqual(["conversations", "list", { includeArchived: false }]);
  });

  it("detail / messages / usage all start with the conversation id segment", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(conversationKeys.detail(id)).toEqual(["conversations", id]);
    expect(conversationKeys.messages(id)).toEqual([
      "conversations",
      id,
      "messages",
    ]);
    expect(conversationKeys.usage(id)).toEqual([
      "conversations",
      id,
      "usage",
    ]);
  });

  it("different conversation ids produce distinct detail keys", () => {
    const a = conversationKeys.detail("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    const b = conversationKeys.detail("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(a).not.toEqual(b);
  });

  it("messages and usage for the SAME id are distinct (no collision)", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    // Both share the [conversations, id] prefix on purpose (so the `all`
    // root invalidation covers them), but their leaf segment differs so
    // `invalidateQueries({ queryKey: messages(id) })` does NOT collaterally
    // wipe the usage cache.
    expect(conversationKeys.messages(id)).not.toEqual(
      conversationKeys.usage(id),
    );
  });

  it("detail(id) is a PREFIX of messages(id) and usage(id)", () => {
    // This lets a caller invalidate the whole conversation by passing
    // `conversationKeys.detail(id)` — TanStack Query treats it as a
    // prefix match by default.
    const id = "11111111-1111-1111-1111-111111111111";
    const detail = conversationKeys.detail(id) as readonly unknown[];
    const messages = conversationKeys.messages(id) as readonly unknown[];
    const usage = conversationKeys.usage(id) as readonly unknown[];
    expect(messages.slice(0, detail.length)).toEqual([...detail]);
    expect(usage.slice(0, detail.length)).toEqual([...detail]);
  });
});
