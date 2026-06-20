// Unit tests for distillation.service — BR-33 (rolling summary) + BR-34
// (title distillation).
//
// CRITICAL invariant exercised here: both functions return Promise<void>
// and NEVER throw. Every error path verifies the function still resolves
// and that nothing is persisted.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type { Pool, PoolClient } from "pg";

vi.mock("../../repository/chat.repository.js", () => ({
  countUserTurns: vi.fn(),
  listOlderMessagesForSummary: vi.fn(),
  updateSummaryRolling: vi.fn(),
  getConversationById: vi.fn(),
  getFirstUserAndAssistant: vi.fn(),
  setTitleIfNull: vi.fn(),
}));

import * as repo from "../../repository/chat.repository.js";
import {
  maybeDistillTitle,
  maybeRefreshSummary,
  type AnthropicUtilityLike,
  type DistillationEnv,
} from "../distillation.service.js";
import type {
  ConversationRow,
  MessageRow,
} from "../../repository/chat.repository.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const silentLogger = pino({ level: "silent" });

const CONV_ID = "11111111-1111-1111-1111-111111111111";

function buildFakePool(): Pool {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  } as unknown as PoolClient;
  return {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool;
}

const baseEnv: DistillationEnv = {
  CHAT_UTILITY_MODEL: "claude-haiku-4-5",
  CHAT_RECENT_WINDOW: 10,
  CHAT_SUMMARY_AFTER_TURNS: 20,
  CHAT_SUMMARY_ENABLED: true,
  CHAT_TITLE_ENABLED: true,
};

function userMessage(text: string): MessageRow {
  return {
    id: "u" + Math.random().toString(16).slice(2, 14),
    conversation_id: CONV_ID,
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

function assistantMessage(text: string): MessageRow {
  return {
    id: "a" + Math.random().toString(16).slice(2, 14),
    conversation_id: CONV_ID,
    role: "assistant",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    idempotency_key: null,
    model: "claude-opus-4-8",
    tokens_in: 5,
    tokens_out: 10,
    latency_ms: 500,
    created_at: "2026-06-20T12:00:01.000Z",
  };
}

const CONVERSATION_NO_TITLE: ConversationRow = {
  id: CONV_ID,
  title: null,
  summary_rolling: null,
  archived_at: null,
  created_at: "2026-06-20T12:00:00.000Z",
  updated_at: "2026-06-20T12:00:00.000Z",
};

const CONVERSATION_WITH_TITLE: ConversationRow = {
  ...CONVERSATION_NO_TITLE,
  title: "ja existe um titulo",
};

// Anthropic stub: returns a fixed text response. Configurable text per test.
function buildAnthropicStub(
  responseText: string
): {
  client: AnthropicUtilityLike;
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn().mockResolvedValue({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5",
    content: [{ type: "text", text: responseText }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 50 },
  });
  return { client: { messages: { create } } as AnthropicUtilityLike, create };
}

beforeEach(() => {
  vi.mocked(repo.countUserTurns).mockReset();
  vi.mocked(repo.listOlderMessagesForSummary).mockReset();
  vi.mocked(repo.updateSummaryRolling).mockReset();
  vi.mocked(repo.getConversationById).mockReset();
  vi.mocked(repo.getFirstUserAndAssistant).mockReset();
  vi.mocked(repo.setTitleIfNull).mockReset();
});
afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// maybeRefreshSummary (BR-33)
// ---------------------------------------------------------------------------

describe("maybeRefreshSummary (BR-33)", () => {
  it("returns void without calling the utility model when user count <= threshold", async () => {
    // BR-33 step 2: count <= threshold => no work. Verifies the policy
    // gate (the most important business invariant — premature firing would
    // throw away history while the recent window still covers it).
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(5);
    const { client, create } = buildAnthropicStub("summary");
    const pool = buildFakePool();
    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
  });

  it("calls the utility model with stream:false when count > threshold AND enabled", async () => {
    // BR-33 steps 3-5: read older slice, call messages.create, persist
    // via updateSummaryRolling.
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(25);
    vi.mocked(repo.listOlderMessagesForSummary).mockResolvedValueOnce([
      userMessage("oldest user msg"),
      assistantMessage("oldest assistant msg"),
    ]);
    vi.mocked(repo.updateSummaryRolling).mockResolvedValueOnce(undefined);
    const { client, create } = buildAnthropicStub("o trecho fala de orcamento");
    const pool = buildFakePool();

    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });

    expect(create).toHaveBeenCalledTimes(1);
    const req = create.mock.calls[0][0];
    expect(req.model).toBe(baseEnv.CHAT_UTILITY_MODEL);
    expect(req.stream).toBe(false);
    expect(req.messages).toHaveLength(2);
    expect(repo.updateSummaryRolling).toHaveBeenCalledWith(
      expect.anything(),
      CONV_ID,
      "o trecho fala de orcamento"
    );
  });

  it("early-returns when CHAT_SUMMARY_ENABLED is false (BR-33)", async () => {
    // BR-33 last paragraph: disabled => permanent NULL. No DB reads beyond
    // the no-op short-circuit; no LLM call.
    const { client, create } = buildAnthropicStub("summary");
    const pool = buildFakePool();
    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: { ...baseEnv, CHAT_SUMMARY_ENABLED: false },
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
    expect(repo.countUserTurns).not.toHaveBeenCalled();
  });

  it("NEVER throws when the utility model rejects (BR-33 fire-and-forget)", async () => {
    // BR-33: errors are logged WARN, never thrown. The route already
    // returned to the client — an unhandled rejection here would crash the
    // process.
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(25);
    vi.mocked(repo.listOlderMessagesForSummary).mockResolvedValueOnce([
      userMessage("anything"),
    ]);
    const create = vi.fn().mockRejectedValue(new Error("provider 503"));
    const client = { messages: { create } } as AnthropicUtilityLike;
    const pool = buildFakePool();
    await expect(
      maybeRefreshSummary({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: silentLogger,
      })
    ).resolves.toBeUndefined();
    // Persistence MUST NOT happen on failure.
    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
  });

  it("NEVER throws when the repository write rejects", async () => {
    // BR-33: even a DB write failure post-LLM-success must be absorbed.
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(25);
    vi.mocked(repo.listOlderMessagesForSummary).mockResolvedValueOnce([
      userMessage("anything"),
    ]);
    vi.mocked(repo.updateSummaryRolling).mockRejectedValueOnce(
      new Error("connection lost")
    );
    const { client } = buildAnthropicStub("resumo");
    const pool = buildFakePool();
    await expect(
      maybeRefreshSummary({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: silentLogger,
      })
    ).resolves.toBeUndefined();
  });

  it("returns early when listOlderMessagesForSummary yields an empty slice", async () => {
    // Defensive: even though count > threshold, an empty older slice means
    // nothing to summarize. Avoid feeding an empty messages array to the
    // utility model (Anthropic rejects).
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(25);
    vi.mocked(repo.listOlderMessagesForSummary).mockResolvedValueOnce([]);
    const { client, create } = buildAnthropicStub("never called");
    const pool = buildFakePool();
    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("drops an empty summary silently (no DB write)", async () => {
    // If the utility model returns whitespace, the trim leaves an empty
    // string — we MUST NOT persist "" as the rolling summary.
    vi.mocked(repo.countUserTurns).mockResolvedValueOnce(25);
    vi.mocked(repo.listOlderMessagesForSummary).mockResolvedValueOnce([
      userMessage("anything"),
    ]);
    const { client } = buildAnthropicStub("   ");
    const pool = buildFakePool();
    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// maybeDistillTitle (BR-34)
// ---------------------------------------------------------------------------

describe("maybeDistillTitle (BR-34)", () => {
  it("early-returns when CHAT_TITLE_ENABLED is false", async () => {
    // BR-34 step 2: feature gate.
    const { client, create } = buildAnthropicStub("nope");
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: { ...baseEnv, CHAT_TITLE_ENABLED: false },
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
    expect(repo.getConversationById).not.toHaveBeenCalled();
  });

  it("early-returns when the conversation already has a title (idempotent)", async () => {
    // BR-34 step 1: title IS NOT NULL => no work. The IF NULL guard in
    // setTitleIfNull is the second line of defense; we test the policy
    // short-circuit here.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_WITH_TITLE
    );
    const { client, create } = buildAnthropicStub("never");
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
    expect(repo.setTitleIfNull).not.toHaveBeenCalled();
  });

  it("early-returns when first user OR first assistant is missing", async () => {
    // BR-34 step 3: the conversation does not yet have a completed turn —
    // distillation cannot run.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("only user"),
      assistant: null,
    });
    const { client, create } = buildAnthropicStub("title");
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("on success: calls setTitleIfNull with the trimmed model output", async () => {
    // BR-34 step 5-6: trim, then setTitleIfNull(conversation_id, title).
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("Quem e Anna?"),
      assistant: assistantMessage("Anna e a esposa do dono."),
    });
    vi.mocked(repo.setTitleIfNull).mockResolvedValueOnce("Quem e Anna");
    const { client, create } = buildAnthropicStub("  Quem e Anna  ");
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(repo.setTitleIfNull).toHaveBeenCalledWith(
      expect.anything(),
      CONV_ID,
      "Quem e Anna"
    );
  });

  it("BR-34 step 5: silently drops a title longer than 80 characters", async () => {
    // The route handler must NOT persist a > 80 char title. The constant
    // 80 is locked by the spec; future relaxation requires a CR.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("?"),
      assistant: assistantMessage("."),
    });
    const oversized = "a".repeat(81);
    const { client } = buildAnthropicStub(oversized);
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(repo.setTitleIfNull).not.toHaveBeenCalled();
  });

  it("BR-34 step 5: silently drops an empty (post-trim) title", async () => {
    // Whitespace-only output is treated as "no title" — never persisted.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("?"),
      assistant: assistantMessage("."),
    });
    const { client } = buildAnthropicStub("   \n   ");
    const pool = buildFakePool();
    await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(repo.setTitleIfNull).not.toHaveBeenCalled();
  });

  it("NEVER throws when the utility model rejects", async () => {
    // BR-34: errors are logged WARN, never thrown.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("?"),
      assistant: assistantMessage("."),
    });
    const create = vi.fn().mockRejectedValue(new Error("provider 503"));
    const client = { messages: { create } } as AnthropicUtilityLike;
    const pool = buildFakePool();
    await expect(
      maybeDistillTitle({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: silentLogger,
      })
    ).resolves.toBeUndefined();
    expect(repo.setTitleIfNull).not.toHaveBeenCalled();
  });

  it("returns void (not the assigned title) — caller must not consume the result", async () => {
    // BR-34: the contract is `Promise<void>`. A future caller that ever
    // tries to `await` the returned title would be wrong; we encode the
    // shape in the test.
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.getFirstUserAndAssistant).mockResolvedValueOnce({
      user: userMessage("?"),
      assistant: assistantMessage("."),
    });
    vi.mocked(repo.setTitleIfNull).mockResolvedValueOnce("Anna");
    const { client } = buildAnthropicStub("Anna");
    const pool = buildFakePool();
    const ret = await maybeDistillTitle({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });
    expect(ret).toBeUndefined();
  });
});
