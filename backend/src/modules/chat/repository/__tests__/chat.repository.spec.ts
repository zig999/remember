// Unit tests for the chat repository (chat.back.md v2.0.0 §3).
//
// Acceptance criteria coverage (dev_tc_001 validation.criteria):
//   - BR-27 idempotency: pg `23505` UNIQUE PARTIAL conflict propagates to
//     caller (the repository does NOT swallow it).
//   - BR-35 cursor pagination on listConversations: null cursor -> all rows,
//     non-null cursor -> tuple comparison emitted, includeArchived toggle.
//   - BR-40 aggregation: getConversationUsage assembles the four sub-selects
//     into one row; null sums are coerced to 0 by COALESCE in SQL.
//   - BR-31 recent reads: listRecentMessages returns rows in ASC order and
//     respects `limit`.
//   - BR-29 tool-call patch: attachToolCallsToMessage patches multiple rows
//     in one UPDATE.
//
// The tests drive the repository against a fake PoolClient that records each
// query and returns canned `rows` / `rowCount`. We do NOT spin up Postgres —
// the repository surface is a thin SQL wrapper and the queries we assert on
// are the contract.

import { describe, expect, it, vi } from "vitest";
import type { PoolClient, QueryResult } from "pg";

import {
  attachToolCallsToMessage,
  deleteConversation,
  findUserByIdempotencyKey,
  getConversationUsage,
  insertConversation,
  insertUserMessage,
  listConversations,
  listOlderMessagesForSummary,
  listRecentMessages,
  setTitleIfNull,
  updateConversation,
  type ConversationRow,
  type MessageRow,
} from "../chat.repository.js";

// ---------------------------------------------------------------------------
// Fake PoolClient
// ---------------------------------------------------------------------------

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

type CannedResponse = QueryResult<any> | Error;

function makeClient(responses: CannedResponse[]): {
  client: PoolClient;
  recorded: RecordedQuery[];
} {
  const recorded: RecordedQuery[] = [];
  let i = 0;
  const queryImpl = vi.fn((sql: string, params: unknown[] = []) => {
    recorded.push({ sql, params });
    const next = responses[i++];
    if (next === undefined) {
      throw new Error(`fake client: no response queued for query ${i}: ${sql}`);
    }
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  });
  // The repository only consumes `client.query(...)` — the rest of the
  // PoolClient surface is unused, so a narrow cast is safe and isolated.
  const client = { query: queryImpl } as unknown as PoolClient;
  return { client, recorded };
}

function result<T>(rows: T[], rowCount?: number): QueryResult<T> {
  return {
    rows,
    rowCount: rowCount ?? rows.length,
    command: "",
    oid: 0,
    fields: [],
  } as QueryResult<T>;
}

// Canonical helpers — keep the fixtures small and explicit.
function makeConversation(overrides: Partial<ConversationRow> = {}): ConversationRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: null,
    summary_rolling: null,
    archived_at: null,
    created_at: "2026-06-20T12:00:00.000Z",
    updated_at: "2026-06-20T12:00:00.000Z",
    ...overrides,
  };
}

function makeMessage(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    conversation_id: "11111111-1111-1111-1111-111111111111",
    role: "user",
    content: [{ type: "text", text: "hi" }],
    stop_reason: null,
    idempotency_key: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    model: null,
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    created_at: "2026-06-20T12:00:01.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// insertConversation
// ---------------------------------------------------------------------------

describe("insertConversation", () => {
  it("inserts and returns the row (BR-30)", async () => {
    const row = makeConversation({ title: "test" });
    const { client, recorded } = makeClient([result([row])]);

    const out = await insertConversation(client, { title: "test" });

    expect(out).toEqual(row);
    expect(recorded[0]!.sql).toMatch(/INSERT INTO chat_conversation/);
    expect(recorded[0]!.params).toEqual(["test"]);
  });

  it("accepts a null title (empty body branch of BR-30)", async () => {
    const row = makeConversation({ title: null });
    const { client, recorded } = makeClient([result([row])]);

    const out = await insertConversation(client, { title: null });

    expect(out.title).toBeNull();
    expect(recorded[0]!.params).toEqual([null]);
  });
});

// ---------------------------------------------------------------------------
// insertUserMessage — BR-27 idempotency
// ---------------------------------------------------------------------------

describe("insertUserMessage (BR-27)", () => {
  it("returns the inserted row on success", async () => {
    const row = makeMessage();
    const { client, recorded } = makeClient([result([row])]);

    const out = await insertUserMessage(client, {
      conversation_id: row.conversation_id,
      content: [{ type: "text", text: "hi" }],
      idempotency_key: row.idempotency_key!,
      model: null,
    });

    expect(out).toEqual(row);
    expect(recorded[0]!.sql).toMatch(/role,\s*content,\s*idempotency_key,\s*model/);
    // content must be passed as a JSON string for the jsonb cast.
    expect(recorded[0]!.params[1]).toBe(JSON.stringify([{ type: "text", text: "hi" }]));
  });

  it("propagates the pg 23505 UNIQUE PARTIAL conflict — repository does NOT swallow it (BR-27)", async () => {
    const pgConflict = Object.assign(new Error("duplicate key value violates unique constraint"), {
      code: "23505",
    });
    const { client } = makeClient([pgConflict]);

    await expect(
      insertUserMessage(client, {
        conversation_id: "11111111-1111-1111-1111-111111111111",
        content: [{ type: "text", text: "hi" }],
        idempotency_key: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        model: null,
      })
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("findUserByIdempotencyKey returns null when no match", async () => {
    const { client } = makeClient([result<MessageRow>([])]);
    const out = await findUserByIdempotencyKey(
      client,
      "11111111-1111-1111-1111-111111111111",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    );
    expect(out).toBeNull();
  });

  it("findUserByIdempotencyKey returns the matching user row", async () => {
    const row = makeMessage();
    const { client, recorded } = makeClient([result([row])]);
    const out = await findUserByIdempotencyKey(
      client,
      row.conversation_id,
      row.idempotency_key!
    );
    expect(out).toEqual(row);
    expect(recorded[0]!.sql).toMatch(/role = 'user'/);
  });
});

// ---------------------------------------------------------------------------
// listConversations — BR-35 cursor pagination
// ---------------------------------------------------------------------------

describe("listConversations (BR-35)", () => {
  it("with null cursor: no tuple-compare clause, archived filter applied by default", async () => {
    const row = makeConversation();
    const { client, recorded } = makeClient([result([row])]);

    const page = await listConversations(client, {
      limit: 20,
      cursor: null,
      includeArchived: false,
    });

    expect(page.items).toEqual([row]);
    expect(page.hasMore).toBe(false);
    expect(recorded[0]!.sql).not.toMatch(/created_at, id\) </);
    expect(recorded[0]!.sql).toMatch(/archived_at IS NULL/);
    // limit + 1 always passed as last param.
    expect(recorded[0]!.params[recorded[0]!.params.length - 1]).toBe(21);
  });

  it("with non-null cursor: emits the (created_at, id) tuple comparison and binds both", async () => {
    const { client, recorded } = makeClient([result<ConversationRow>([])]);

    await listConversations(client, {
      limit: 5,
      cursor: { createdAt: "2026-06-19T00:00:00.000Z", id: "22222222-2222-2222-2222-222222222222" },
      includeArchived: false,
    });

    expect(recorded[0]!.sql).toMatch(/\(created_at, id\) < \(\$1::timestamptz, \$2::uuid\)/);
    expect(recorded[0]!.params).toEqual([
      "2026-06-19T00:00:00.000Z",
      "22222222-2222-2222-2222-222222222222",
      6, // limit + 1
    ]);
  });

  it("with includeArchived=true: does not filter on archived_at", async () => {
    const { client, recorded } = makeClient([result<ConversationRow>([])]);

    await listConversations(client, {
      limit: 10,
      cursor: null,
      includeArchived: true,
    });

    expect(recorded[0]!.sql).not.toMatch(/archived_at IS NULL/);
  });

  it("hasMore=true when limit+1 rows returned; trims the last row", async () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeConversation({ id: `0000000${i}-0000-0000-0000-000000000000` })
    );
    const { client } = makeClient([result(rows)]);

    const page = await listConversations(client, {
      limit: 2,
      cursor: null,
      includeArchived: false,
    });

    expect(page.hasMore).toBe(true);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]!.id).toBe(rows[0]!.id);
    expect(page.items[1]!.id).toBe(rows[1]!.id);
  });

  it("orders DESC and selects all conversation columns", async () => {
    const { client, recorded } = makeClient([result<ConversationRow>([])]);
    await listConversations(client, { limit: 10, cursor: null, includeArchived: true });
    expect(recorded[0]!.sql).toMatch(/ORDER BY created_at DESC, id DESC/);
    expect(recorded[0]!.sql).toMatch(/summary_rolling/);
  });
});

// ---------------------------------------------------------------------------
// updateConversation — BR-36 PATCH semantics
// ---------------------------------------------------------------------------

describe("updateConversation (BR-36)", () => {
  it("undefined fields are not touched; only `title` SET emitted when only `title` provided", async () => {
    const row = makeConversation({ title: "new" });
    const { client, recorded } = makeClient([result([row])]);

    const out = await updateConversation(client, row.id, { title: "new" });

    expect(out).toEqual(row);
    expect(recorded[0]!.sql).toMatch(/SET title = \$1\s+WHERE/);
    // No archived_at clause in the SET list (RETURNING projects all columns).
    expect(recorded[0]!.sql).not.toMatch(/SET[^]*archived_at = /);
    expect(recorded[0]!.params).toEqual(["new", row.id]);
  });

  it("null title sets the column to NULL (BR-36 null branch)", async () => {
    const row = makeConversation({ title: null });
    const { client, recorded } = makeClient([result([row])]);

    await updateConversation(client, row.id, { title: null });

    expect(recorded[0]!.params).toEqual([null, row.id]);
  });

  it("both title and archived_at present: two SET clauses, both bound", async () => {
    const row = makeConversation();
    const { client, recorded } = makeClient([result([row])]);

    await updateConversation(client, row.id, {
      title: "x",
      archived_at: "2026-06-20T00:00:00.000Z",
    });

    expect(recorded[0]!.sql).toMatch(/title = \$1, archived_at = \$2::timestamptz/);
    expect(recorded[0]!.params).toEqual(["x", "2026-06-20T00:00:00.000Z", row.id]);
  });

  it("returns null when row absent (rowCount 0)", async () => {
    const { client } = makeClient([result<ConversationRow>([], 0)]);
    const out = await updateConversation(client, "doesnt-exist", { title: "x" });
    expect(out).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// deleteConversation — BR-37
// ---------------------------------------------------------------------------

describe("deleteConversation (BR-37)", () => {
  it("returns 1 on hit, 0 on miss", async () => {
    const { client: c1 } = makeClient([result([], 1)]);
    expect(await deleteConversation(c1, "id-1")).toBe(1);

    const { client: c2 } = makeClient([result([], 0)]);
    expect(await deleteConversation(c2, "id-2")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// setTitleIfNull — BR-34 idempotent guard
// ---------------------------------------------------------------------------

describe("setTitleIfNull (BR-34)", () => {
  it("returns the new title when UPDATE wrote a row", async () => {
    const { client, recorded } = makeClient([
      result<{ title: string }>([{ title: "Distilled" }]),
    ]);
    const out = await setTitleIfNull(client, "id", "Distilled");
    expect(out).toBe("Distilled");
    expect(recorded[0]!.sql).toMatch(/title IS NULL/);
  });

  it("returns null when title was already set (concurrent set or non-null)", async () => {
    const { client } = makeClient([result<{ title: string }>([])]);
    const out = await setTitleIfNull(client, "id", "Distilled");
    expect(out).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listRecentMessages — BR-31
// ---------------------------------------------------------------------------

describe("listRecentMessages (BR-31)", () => {
  it("returns rows already in ASC order (inner DESC limited, outer ASC sort)", async () => {
    const m1 = makeMessage({ id: "11", created_at: "2026-06-20T12:00:01.000Z" });
    const m2 = makeMessage({ id: "22", created_at: "2026-06-20T12:00:02.000Z" });
    const m3 = makeMessage({ id: "33", created_at: "2026-06-20T12:00:03.000Z" });
    const { client, recorded } = makeClient([result([m1, m2, m3])]);

    const out = await listRecentMessages(client, "conv-1", 10);

    expect(out).toEqual([m1, m2, m3]);
    expect(recorded[0]!.sql).toMatch(/ORDER BY created_at DESC, id DESC\s+LIMIT \$2/);
    expect(recorded[0]!.sql).toMatch(/ORDER BY created_at ASC, id ASC/);
    expect(recorded[0]!.params).toEqual(["conv-1", 10]);
  });
});

// ---------------------------------------------------------------------------
// listOlderMessagesForSummary — BR-33
// ---------------------------------------------------------------------------

describe("listOlderMessagesForSummary (BR-33)", () => {
  it("uses created_at < (DESC OFFSET exclude_recent-1 LIMIT 1) boundary subquery", async () => {
    const { client, recorded } = makeClient([result<MessageRow>([])]);
    await listOlderMessagesForSummary(client, "conv-1", 10);
    expect(recorded[0]!.sql).toMatch(/OFFSET \$2/);
    // offset = exclude_recent - 1 (0-based).
    expect(recorded[0]!.params).toEqual(["conv-1", 9]);
  });

  it("exclude_recent <= 0: returns the entire history (defensive fallback)", async () => {
    const m1 = makeMessage();
    const { client, recorded } = makeClient([result([m1])]);
    const out = await listOlderMessagesForSummary(client, "conv-1", 0);
    expect(out).toEqual([m1]);
    expect(recorded[0]!.sql).not.toMatch(/OFFSET/);
  });
});

// ---------------------------------------------------------------------------
// attachToolCallsToMessage — BR-29 step 8 / BR-32
// ---------------------------------------------------------------------------

describe("attachToolCallsToMessage (BR-29 / BR-32)", () => {
  it("patches multiple rows in ONE UPDATE using ANY($1::uuid[])", async () => {
    const { client, recorded } = makeClient([result([], 3)]);

    await attachToolCallsToMessage(
      client,
      ["aa", "bb", "cc"],
      "msg-id"
    );

    expect(recorded).toHaveLength(1);
    expect(recorded[0]!.sql).toMatch(/UPDATE chat_tool_call/);
    expect(recorded[0]!.sql).toMatch(/id = ANY\(\$2::uuid\[\]\)/);
    expect(recorded[0]!.params).toEqual(["msg-id", ["aa", "bb", "cc"]]);
  });

  it("empty id array short-circuits — no query issued", async () => {
    const { client, recorded } = makeClient([]);
    await attachToolCallsToMessage(client, [], "msg-id");
    expect(recorded).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getConversationUsage — BR-40
// ---------------------------------------------------------------------------

describe("getConversationUsage (BR-40)", () => {
  it("returns the aggregate tuple from the four sub-selects", async () => {
    const { client, recorded } = makeClient([
      result([{ messages: 7, tokens_in: 100, tokens_out: 200, tool_calls: 3 }]),
    ]);

    const out = await getConversationUsage(client, "conv-1");

    expect(out).toEqual({ messages: 7, tokens_in: 100, tokens_out: 200, tool_calls: 3 });
    // Single round-trip (BR-40 calls for one aggregation query).
    expect(recorded).toHaveLength(1);
    // All four sub-selects are present.
    expect(recorded[0]!.sql).toMatch(/count\(\*\)::int FROM chat_message/);
    expect(recorded[0]!.sql).toMatch(/COALESCE\(sum\(tokens_in\),\s*0\)::int/);
    expect(recorded[0]!.sql).toMatch(/COALESCE\(sum\(tokens_out\),\s*0\)::int/);
    expect(recorded[0]!.sql).toMatch(/count\(\*\)::int FROM chat_tool_call/);
    // Assistant-only filter on the token sums.
    expect(recorded[0]!.sql).toMatch(/role = 'assistant'/);
  });

  it("returns zeros on an empty conversation (COALESCE handles NULL sums in SQL)", async () => {
    // pg returns the row already coerced (COALESCE in the query).
    const { client } = makeClient([
      result([{ messages: 0, tokens_in: 0, tokens_out: 0, tool_calls: 0 }]),
    ]);
    const out = await getConversationUsage(client, "conv-empty");
    expect(out).toEqual({ messages: 0, tokens_in: 0, tokens_out: 0, tool_calls: 0 });
  });
});
