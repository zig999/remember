// Unit tests for the conversation CRUD service — TC-02 / BR-22 / BR-35 /
// BR-36 / BR-37 / BR-40.
//
// Strategy: mock the repository module via `vi.mock` so we exercise the
// service-layer business invariants (cursor encoding, 404 mapping, usage
// pre-check) without spinning up Postgres. A fake `Pool` is used: every
// repository call gets a `PoolClient` whose `query` is a no-op stub — the
// repo mocks short-circuit before the SQL is issued.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool, PoolClient } from "pg";

// Mock the repository BEFORE importing the service under test.
vi.mock("../../repository/chat.repository.js", () => ({
  insertConversation: vi.fn(),
  getConversationById: vi.fn(),
  listConversations: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
  getConversationUsage: vi.fn(),
  listRecentMessages: vi.fn(),
}));

import * as repo from "../../repository/chat.repository.js";
import {
  createConversation,
  decodeCursor,
  deleteConversation,
  encodeCursor,
  getConversation,
  getConversationUsage,
  InvalidCursorError,
  listConversations,
  updateConversation,
} from "../conversation.service.js";
import { ConversationNotFoundError } from "../errors.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildFakePool(): Pool {
  // The service calls `withReadOnly(pool, fn)` / `withTransaction(pool, fn)`
  // which call `pool.connect()`. We hand back a PoolClient stub whose
  // `query` is a no-op (the repo mocks resolve before any SQL is issued).
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  } as unknown as PoolClient;
  const pool = {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool;
  return pool;
}

const ROW_A = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: null as string | null,
  summary_rolling: null as string | null,
  archived_at: null as string | null,
  created_at: "2026-06-20T12:00:00.000Z",
  updated_at: "2026-06-20T12:00:00.000Z",
} as const;

const ROW_B = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  title: "B",
  summary_rolling: null as string | null,
  archived_at: null as string | null,
  created_at: "2026-06-19T12:00:00.000Z",
  updated_at: "2026-06-19T12:00:00.000Z",
} as const;

beforeEach(() => {
  // Reset all repo mocks between tests so call counts are isolated.
  vi.mocked(repo.insertConversation).mockReset();
  vi.mocked(repo.getConversationById).mockReset();
  vi.mocked(repo.listConversations).mockReset();
  vi.mocked(repo.updateConversation).mockReset();
  vi.mocked(repo.deleteConversation).mockReset();
  vi.mocked(repo.getConversationUsage).mockReset();
});
afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Cursor encode / decode (BR-35)
// ---------------------------------------------------------------------------

describe("cursor encoding (BR-35)", () => {
  it("encode then decode round-trips the (createdAt, id) pair", () => {
    // BR-35: cursor is opaque to the client but self-describing to the
    // server. The round-trip is the most important invariant.
    const cursor = encodeCursor(ROW_A.created_at, ROW_A.id);
    expect(decodeCursor(cursor)).toEqual({
      createdAt: ROW_A.created_at,
      id: ROW_A.id,
    });
  });

  it("produces a URL-safe (base64url) string with no padding or `+`/`/`", () => {
    // BR-35: cursor must travel in a query string without escaping.
    const cursor = encodeCursor(ROW_A.created_at, ROW_A.id);
    expect(cursor).not.toMatch(/[+/=]/);
  });

  it("decode of a non-base64url string -> InvalidCursorError", () => {
    // BR-35: malformed cursor -> 422 VALIDATION_INVALID_FORMAT with
    // details.param = "cursor". The error class is the seam.
    expect(() => decodeCursor("!@#$ not base64")).toThrow(InvalidCursorError);
  });

  it("decode of a base64url string that decodes to non-JSON -> InvalidCursorError", () => {
    // The route handler must NOT pass JSON parse failures through to a 500.
    const garbage = Buffer.from("not json", "utf8").toString("base64url");
    expect(() => decodeCursor(garbage)).toThrow(InvalidCursorError);
  });

  it("decode of JSON missing `created_at` -> InvalidCursorError", () => {
    // Defensive: a cursor crafted by an external tool must not skip past
    // the shape check.
    const partial = Buffer.from(JSON.stringify({ id: "x" }), "utf8").toString(
      "base64url"
    );
    expect(() => decodeCursor(partial)).toThrow(InvalidCursorError);
  });

  it("InvalidCursorError carries statusCode=422 and code=VALIDATION_INVALID_FORMAT", () => {
    // BR-35: the route handler reads these properties to build the 422
    // envelope. They are part of the contract — change requires a CR.
    try {
      decodeCursor("!@#$");
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidCursorError);
      const err = e as InvalidCursorError;
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe("VALIDATION_INVALID_FORMAT");
      expect(err.param).toBe("cursor");
    }
  });
});

// ---------------------------------------------------------------------------
// createConversation (UC-01 / BR-30)
// ---------------------------------------------------------------------------

describe("createConversation (UC-01)", () => {
  it("delegates to repo.insertConversation under withTransaction", async () => {
    // BR-30: insert with the provided title (or null).
    vi.mocked(repo.insertConversation).mockResolvedValueOnce(ROW_A);
    const pool = buildFakePool();
    const out = await createConversation(pool, { title: null });
    expect(repo.insertConversation).toHaveBeenCalledWith(expect.anything(), {
      title: null,
    });
    expect(out).toBe(ROW_A);
  });
});

// ---------------------------------------------------------------------------
// listConversations (UC-04 / BR-35)
// ---------------------------------------------------------------------------

describe("listConversations (UC-04 / BR-35)", () => {
  it("forwards `cursor: null` to the repository for the first page", async () => {
    // BR-35: first page is requested without a cursor.
    vi.mocked(repo.listConversations).mockResolvedValueOnce({
      items: [ROW_A],
      hasMore: false,
    });
    const pool = buildFakePool();
    const out = await listConversations(pool, {
      limit: 20,
      cursor: null,
      includeArchived: false,
    });
    expect(repo.listConversations).toHaveBeenCalledWith(expect.anything(), {
      limit: 20,
      cursor: null,
      includeArchived: false,
    });
    expect(out.nextCursor).toBeNull();
  });

  it("decodes an incoming cursor and forwards the (createdAt, id) pair", async () => {
    // BR-35: the opaque cursor sent by the client is decoded at the
    // service boundary before reaching the SQL layer.
    const cursor = encodeCursor(ROW_A.created_at, ROW_A.id);
    vi.mocked(repo.listConversations).mockResolvedValueOnce({
      items: [ROW_B],
      hasMore: false,
    });
    const pool = buildFakePool();
    await listConversations(pool, {
      limit: 10,
      cursor,
      includeArchived: true,
    });
    expect(repo.listConversations).toHaveBeenCalledWith(expect.anything(), {
      limit: 10,
      cursor: { createdAt: ROW_A.created_at, id: ROW_A.id },
      includeArchived: true,
    });
  });

  it("emits a next_cursor encoding the LAST row when hasMore is true", async () => {
    // BR-35: the BFF returns next_cursor=<(created_at, id) of last item>
    // when more pages remain.
    vi.mocked(repo.listConversations).mockResolvedValueOnce({
      items: [ROW_A, ROW_B],
      hasMore: true,
    });
    const pool = buildFakePool();
    const out = await listConversations(pool, {
      limit: 2,
      cursor: null,
      includeArchived: false,
    });
    expect(out.nextCursor).not.toBeNull();
    const decoded = decodeCursor(out.nextCursor!);
    expect(decoded).toEqual({ createdAt: ROW_B.created_at, id: ROW_B.id });
  });

  it("emits next_cursor=null when hasMore is false (no extra page)", async () => {
    // BR-35: the SPA stops paginating when next_cursor is null.
    vi.mocked(repo.listConversations).mockResolvedValueOnce({
      items: [ROW_A],
      hasMore: false,
    });
    const pool = buildFakePool();
    const out = await listConversations(pool, {
      limit: 20,
      cursor: null,
      includeArchived: false,
    });
    expect(out.nextCursor).toBeNull();
  });

  it("propagates InvalidCursorError when the input cursor is malformed", async () => {
    // BR-35: the service raises BEFORE touching the DB.
    const pool = buildFakePool();
    await expect(
      listConversations(pool, {
        limit: 20,
        cursor: "!@#$",
        includeArchived: false,
      })
    ).rejects.toBeInstanceOf(InvalidCursorError);
    expect(repo.listConversations).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getConversation (BR-22)
// ---------------------------------------------------------------------------

describe("getConversation (BR-22)", () => {
  it("returns the row when the repository finds it", async () => {
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(ROW_A);
    const pool = buildFakePool();
    const out = await getConversation(pool, ROW_A.id);
    expect(out).toBe(ROW_A);
  });

  it("throws ConversationNotFoundError when the repository returns null", async () => {
    // BR-22: lookup miss maps to 404 RESOURCE_NOT_FOUND at the route layer.
    // The service-level seam is the typed error class.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(null);
    const pool = buildFakePool();
    await expect(
      getConversation(pool, "deadbeef-0000-0000-0000-000000000000")
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("ConversationNotFoundError carries statusCode=404 and code=RESOURCE_NOT_FOUND", async () => {
    // BR-22: the route handler reads these properties to build the
    // envelope. Change requires a CR.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(null);
    const pool = buildFakePool();
    try {
      await getConversation(pool, ROW_A.id);
      throw new Error("expected throw");
    } catch (e) {
      const err = e as ConversationNotFoundError;
      expect(err).toBeInstanceOf(ConversationNotFoundError);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("RESOURCE_NOT_FOUND");
      expect(err.conversationId).toBe(ROW_A.id);
    }
  });
});

// ---------------------------------------------------------------------------
// updateConversation (BR-36)
// ---------------------------------------------------------------------------

describe("updateConversation (BR-36)", () => {
  it("returns the patched row on a successful update", async () => {
    const patched = { ...ROW_A, title: "renamed" };
    vi.mocked(repo.updateConversation).mockResolvedValueOnce(patched);
    const pool = buildFakePool();
    const out = await updateConversation(pool, ROW_A.id, { title: "renamed" });
    expect(out).toBe(patched);
    expect(repo.updateConversation).toHaveBeenCalledWith(
      expect.anything(),
      ROW_A.id,
      { title: "renamed" }
    );
  });

  it("throws ConversationNotFoundError when the repository returns null", async () => {
    // BR-22 / BR-36: an update on a missing conversation is 404.
    vi.mocked(repo.updateConversation).mockResolvedValueOnce(null);
    const pool = buildFakePool();
    await expect(
      updateConversation(pool, "deadbeef-0000-0000-0000-000000000000", {
        title: "x",
      })
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// deleteConversation (BR-37)
// ---------------------------------------------------------------------------

describe("deleteConversation (BR-37)", () => {
  it("succeeds when the repository reports rowCount=1", async () => {
    // BR-37: cascade is enforced by ON DELETE CASCADE; the service only
    // checks the affected-row count.
    vi.mocked(repo.deleteConversation).mockResolvedValueOnce(1);
    const pool = buildFakePool();
    await expect(deleteConversation(pool, ROW_A.id)).resolves.toBeUndefined();
  });

  it("throws ConversationNotFoundError when rowCount=0", async () => {
    // BR-22 / BR-37: deleting an absent conversation is 404, not 204.
    vi.mocked(repo.deleteConversation).mockResolvedValueOnce(0);
    const pool = buildFakePool();
    await expect(
      deleteConversation(pool, "deadbeef-0000-0000-0000-000000000000")
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// getConversationUsage (BR-40 + BR-22 pre-check)
// ---------------------------------------------------------------------------

describe("getConversationUsage (BR-40)", () => {
  it("confirms existence FIRST then runs the aggregation", async () => {
    // BR-22 + BR-40: existence check precedes the aggregation so an absent
    // conversation returns 404 rather than 200 with zero counts.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(ROW_A);
    vi.mocked(repo.getConversationUsage).mockResolvedValueOnce({
      messages: 0,
      tokens_in: 0,
      tokens_out: 0,
      tool_calls: 0,
    });
    const pool = buildFakePool();
    const out = await getConversationUsage(pool, ROW_A.id);
    expect(repo.getConversationById).toHaveBeenCalledTimes(1);
    expect(repo.getConversationUsage).toHaveBeenCalledTimes(1);
    expect(out).toEqual({
      messages: 0,
      tokens_in: 0,
      tokens_out: 0,
      tool_calls: 0,
    });
  });

  it("throws ConversationNotFoundError and skips the aggregation when absent", async () => {
    // BR-22 — 404 short-circuit.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(null);
    const pool = buildFakePool();
    await expect(
      getConversationUsage(pool, "deadbeef-0000-0000-0000-000000000000")
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    expect(repo.getConversationUsage).not.toHaveBeenCalled();
  });
});
