// Unit tests for context-builder — BR-31.
//
// The three branches BR-31 must cover:
//   1. No summary_rolling => system + recent messages only.
//   2. summary_rolling present => synthetic recap block prepended.
//   3. Empty conversation (zero recent messages) => system + only the
//      summary block (if any) OR an empty messages array.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool, PoolClient } from "pg";

vi.mock("../../repository/chat.repository.js", () => ({
  listRecentRealTurns: vi.fn(),
}));

import * as repo from "../../repository/chat.repository.js";
import {
  buildModelContext,
  SUMMARY_ROLLING_PREFIX,
} from "../context-builder.js";
import type { ConversationRow, MessageRow } from "../../repository/chat.repository.js";

function buildFakePool(): Pool {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  } as unknown as PoolClient;
  return {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool;
}

const SYSTEM_PROMPT = "TEST SYSTEM PROMPT BODY (fixture)";

const CONVERSATION_NO_SUMMARY: ConversationRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: null,
  summary_rolling: null,
  archived_at: null,
  created_at: "2026-06-20T12:00:00.000Z",
  updated_at: "2026-06-20T12:00:00.000Z",
};

const CONVERSATION_WITH_SUMMARY: ConversationRow = {
  ...CONVERSATION_NO_SUMMARY,
  summary_rolling: "O dono discutiu o orcamento de junho com Anna.",
};

function userMessage(id: string, text: string): MessageRow {
  return {
    id,
    conversation_id: CONVERSATION_NO_SUMMARY.id,
    role: "user",
    content: [{ type: "text", text }],
    stop_reason: null,
    idempotency_key: null,
    model: null,
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    created_at: "2026-06-20T12:00:00.000Z",
  };
}

function assistantMessage(id: string, text: string): MessageRow {
  return {
    id,
    conversation_id: CONVERSATION_NO_SUMMARY.id,
    role: "assistant",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    idempotency_key: null,
    model: "claude-opus-4-8",
    tokens_in: 10,
    tokens_out: 20,
    latency_ms: 1000,
    created_at: "2026-06-20T12:00:01.000Z",
  };
}

beforeEach(() => {
  vi.mocked(repo.listRecentRealTurns).mockReset();
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("buildModelContext (BR-31)", () => {
  it("BR-31 step 1: returns the caller-supplied system prompt as `system`", async () => {
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    // The caller resolves selectChatPromptModule(...).system() — the
    // builder just threads it through. Identity equality is the contract.
    expect(ctx.system).toBe(SYSTEM_PROMPT);
  });

  it("no summary + no messages -> empty messages array", async () => {
    // BR-31 — degenerate but legal state: fresh conversation, distillation
    // hasn't run yet. Builder returns an empty messages list (the route
    // inserted the user row BEFORE this call in normal flow).
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    expect(ctx.messages).toEqual([]);
  });

  it("no summary + recent messages -> messages mapped 1:1 in ASC order", async () => {
    // BR-31 step 4: the repository already returns ASC order; the builder
    // does NOT reorder. The 1:1 mapping preserves role + content (jsonb
    // already in Anthropic block shape per BR-29).
    const u1 = userMessage("u1-2222-2222-2222-222222222222", "Quem e Anna?");
    const a1 = assistantMessage(
      "a1-2222-2222-2222-222222222222",
      "Anna e a esposa do dono."
    );
    const u2 = userMessage("u2-2222-2222-2222-222222222222", "E o aniversario?");
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([u1, a1, u2]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    expect(ctx.messages).toHaveLength(3);
    expect(ctx.messages[0]).toEqual({ role: "user", content: u1.content });
    expect(ctx.messages[1]).toEqual({ role: "assistant", content: a1.content });
    expect(ctx.messages[2]).toEqual({ role: "user", content: u2.content });
  });

  it("BR-31 step 3: summary_rolling != null prepends a synthetic user block with the prefix", async () => {
    // The synthetic block uses role="user" so the model reads it as
    // context. The header text is the constant SUMMARY_ROLLING_PREFIX —
    // tests assert the verbatim concatenation.
    const u1 = userMessage("u1-3333-3333-3333-333333333333", "Continua?");
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([u1]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_WITH_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    expect(ctx.messages).toHaveLength(2);
    const recap = ctx.messages[0];
    expect(recap.role).toBe("user");
    expect(recap.content).toEqual([
      {
        type: "text",
        text: SUMMARY_ROLLING_PREFIX + CONVERSATION_WITH_SUMMARY.summary_rolling,
      },
    ]);
    // Recent messages follow the recap.
    expect(ctx.messages[1]).toEqual({ role: "user", content: u1.content });
  });

  it("BR-31 step 3: summary_rolling alone (empty recent window) still yields the recap block", async () => {
    // Edge: empty recent slice + a summary -> messages = [recap_block].
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_WITH_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].role).toBe("user");
    expect(ctx.messages[0].content).toEqual([
      {
        type: "text",
        text: SUMMARY_ROLLING_PREFIX + CONVERSATION_WITH_SUMMARY.summary_rolling,
      },
    ]);
  });

  it("forwards `recentLimit` to repository.listRecentRealTurns", async () => {
    // BR-31 step 4: the caller's recentLimit (typically
    // env.CHAT_RECENT_WINDOW) is honored end-to-end.
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([]);
    const pool = buildFakePool();
    await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 3,
    });
    expect(repo.listRecentRealTurns).toHaveBeenCalledWith(
      expect.anything(),
      CONVERSATION_NO_SUMMARY.id,
      3
    );
  });

  // -------------------------------------------------------------------------
  // v2.2 — faithful multi-row persistence: replay-validity regression.
  //
  // This is THE regression for the bug that broke the 2nd turn. A tool-bearing
  // turn is now persisted as separate rows; the builder must replay them as a
  // VALID Anthropic sequence (every `tool_use` immediately followed by its
  // `tool_result`), and must trim a window that was cut mid-turn.
  // -------------------------------------------------------------------------

  function toolUseRow(id: string, toolUseId: string): MessageRow {
    return {
      id,
      conversation_id: CONVERSATION_NO_SUMMARY.id,
      role: "assistant",
      content: [
        { type: "tool_use", id: toolUseId, name: "list_node_types", input: {} },
      ],
      stop_reason: null, // intermediate row — NOT terminal
      idempotency_key: null,
      model: "claude-opus-4-8",
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.500Z",
    };
  }
  function toolResultRow(id: string, toolUseId: string): MessageRow {
    return {
      id,
      conversation_id: CONVERSATION_NO_SUMMARY.id,
      role: "user",
      content: [{ type: "tool_result", tool_use_id: toolUseId, content: "10" }],
      stop_reason: null,
      idempotency_key: null, // synthetic — NOT a real user turn
      model: null,
      tokens_in: null,
      tokens_out: null,
      latency_ms: null,
      created_at: "2026-06-20T12:00:00.600Z",
    };
  }

  it("replays a persisted tool-turn as a VALID Anthropic sequence (the turn-2 bug)", async () => {
    // Rows as persisted by a completed turn 1 that called a tool, then the new
    // turn-2 user prompt at the tail (BR-29 step 3 inserts it before this call).
    const u1 = userMessage("u1-3333-3333-3333-333333333333", "Quantos tipos de nó?");
    const aToolUse = toolUseRow("a1-3333-3333-3333-333333333333", "toolu_X");
    const uToolResult = toolResultRow("r1-3333-3333-3333-333333333333", "toolu_X");
    const aText = assistantMessage("a2-3333-3333-3333-333333333333", "Existem 10.");
    const u2 = userMessage("u2-3333-3333-3333-333333333333", "E os link types?");
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([
      u1,
      aToolUse,
      uToolResult,
      aText,
      u2,
    ]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });

    // The assistant tool_use is immediately followed by the user tool_result —
    // the invariant whose violation produced the 400 on turn 2.
    expect(ctx.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
      "user",
    ]);
    const asst = ctx.messages[1];
    const usr = ctx.messages[2];
    expect((asst.content as Array<{ type: string }>)[0]!.type).toBe("tool_use");
    expect((usr.content as Array<{ type: string; tool_use_id?: string }>)[0]!.type).toBe(
      "tool_result"
    );
    expect(
      (usr.content as Array<{ tool_use_id?: string }>)[0]!.tool_use_id
    ).toBe("toolu_X");
  });

  it("BR-31 v2.9: forwards recentLimit as K REAL TURNS to listRecentRealTurns (turn-based, not row-based)", async () => {
    // The contract changed in chat-context-fidelity TC-01: recentLimit is
    // now a turn count, not a row count. The builder is dumb about it — the
    // repository owns the K-turn boundary; the builder just threads the
    // integer through. This regression guards against a future refactor
    // that accidentally re-introduces a row-based read.
    const anchor1 = userMessage(
      "u1-4444-4444-4444-444444444444",
      "Quem e Anna?"
    );
    anchor1.created_at as unknown; // (type-only — anchor structure stays)
    const finalAssistant = assistantMessage(
      "a1-4444-4444-4444-444444444444",
      "Anna e a esposa do dono."
    );
    const anchor2 = userMessage(
      "u2-4444-4444-4444-444444444444",
      "E o aniversario?"
    );
    // The fixture: 2 selected turns -> 3 rows. The builder must replay all 3
    // in ASC order and pass K=2 (not 3) to the repository.
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([
      anchor1,
      finalAssistant,
      anchor2,
    ]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 2,
    });
    expect(repo.listRecentRealTurns).toHaveBeenCalledWith(
      expect.anything(),
      CONVERSATION_NO_SUMMARY.id,
      2
    );
    expect(ctx.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    // The first user message is the anchor of the 2nd-oldest selected turn
    // (which, with K=2 against the fixture, is the OLDEST selected turn).
    expect(ctx.messages[0]).toEqual({ role: "user", content: anchor1.content });
  });

  it("trims a recent window that was cut MID-PAIR (leading orphan tool_result)", async () => {
    // The window LIMIT sliced off the assistant[tool_use], leaving the
    // user[tool_result] orphaned at the front — feeding it verbatim 400s
    // Anthropic ("tool_result ... without tool_use").
    const orphanToolResult = toolResultRow(
      "r9-3333-3333-3333-333333333333",
      "toolu_GONE"
    );
    const u2 = userMessage("u9-3333-3333-3333-333333333333", "E os link types?");
    vi.mocked(repo.listRecentRealTurns).mockResolvedValueOnce([
      orphanToolResult,
      u2,
    ]);
    const pool = buildFakePool();
    const ctx = await buildModelContext({
      pool,
      conversation: CONVERSATION_NO_SUMMARY,
      systemPrompt: SYSTEM_PROMPT,
      recentLimit: 10,
    });
    // The orphan is trimmed; the sequence starts on a clean user turn.
    expect(ctx.messages.map((m) => m.role)).toEqual(["user"]);
    expect(
      (ctx.messages[0].content as Array<{ type: string }>)[0]!.type
    ).toBe("text");
  });
});
