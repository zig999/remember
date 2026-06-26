// Unit tests for distillation.service — BR-33 v2.9 (rolling summary —
// incremental fold + refresh-on-overflow) + BR-34 (title distillation).
//
// CRITICAL invariant exercised here: both functions return Promise<void>
// and NEVER throw. Every error path verifies the function still resolves
// and that nothing is persisted.
//
// BR-33 v2.9 changes vs v2.0–v2.8 covered here:
//   - The gate is overflow (`countRealTurnsOlderThanRecentWindow > 0`), NOT
//     a turn-count threshold. `CHAT_SUMMARY_AFTER_TURNS` is RETIRED as a
//     gate — its value is IGNORED at runtime.
//   - The slice comes from `listOlderMessagesForSummaryBounded`, capped at
//     `CHAT_SUMMARY_OVERLAP_M` rows and cut on real-turn boundaries by the
//     repository slicer.
//   - The fold is incremental: `summary_new = summarize(summary_prev + slice)`.
//     The prompt module's `buildUserTurn(summary_prev, slice)` composes the
//     messages[] passed to Anthropic. `summary_prev` comes from
//     `chat_conversation.summary_rolling` via `getConversationById`.
//   - Hard cap 2000 chars on `summary_new` — oversize -> WARN
//     `chat.summary_refresh_overflow` and NO write.
//   - Errors are caught with a `phase ∈ {fetch_slice, model_call, persist}`
//     discriminator on WARN `chat.summary_refresh_failure`.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type { Pool, PoolClient } from "pg";

vi.mock("../../repository/chat.repository.js", () => ({
  countUserTurns: vi.fn(),
  countRealTurnsOlderThanRecentWindow: vi.fn(),
  listOlderMessagesForSummary: vi.fn(),
  listOlderMessagesForSummaryBounded: vi.fn(),
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

// BR-33 v2.9: `CHAT_SUMMARY_AFTER_TURNS` is INERT at runtime — set to a
// value high enough that the LEGACY gate (if it were still active) would
// always block, so any refresh that does fire proves the OVERFLOW gate is
// in charge (BR-33 v2.9 step 1).
const baseEnv: DistillationEnv = {
  CHAT_UTILITY_MODEL: "claude-haiku-4-5",
  CHAT_RECENT_WINDOW: 6,
  CHAT_SUMMARY_AFTER_TURNS: 9999,
  CHAT_SUMMARY_ENABLED: true,
  CHAT_TITLE_ENABLED: true,
  CHAT_SUMMARY_OVERLAP_M: 40,
  CHAT_SUMMARY_PROMPT_VERSION: "v2",
};

function userAnchor(text: string, idempotency_key: string): MessageRow {
  // A "real" user turn — `idempotency_key IS NOT NULL` marks it as an anchor
  // row (BR-31 v2.9). The repository slicer cuts on these rows.
  return {
    id: "u" + Math.random().toString(16).slice(2, 14),
    conversation_id: CONV_ID,
    role: "user",
    content: [{ type: "text", text }],
    stop_reason: null,
    idempotency_key,
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

// Legacy helper kept for the title-distillation tests below — those still
// take a free-form user row (the BR-34 path reads the FIRST real user via
// `getFirstUserAndAssistant`, which itself filters on idempotency_key).
function userMessage(text: string): MessageRow {
  return userAnchor(text, "idem-" + Math.random().toString(16).slice(2, 14));
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

const CONVERSATION_WITH_PREV_SUMMARY: ConversationRow = {
  ...CONVERSATION_NO_TITLE,
  summary_rolling:
    "O dono falou sobre o projeto Apollo e mencionou a esposa Anna. " +
    "Decidiu adiar o lancamento para o proximo trimestre. " +
    "Pendente: definir orcamento revisado.",
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
  vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockReset();
  vi.mocked(repo.listOlderMessagesForSummary).mockReset();
  vi.mocked(repo.listOlderMessagesForSummaryBounded).mockReset();
  vi.mocked(repo.updateSummaryRolling).mockReset();
  vi.mocked(repo.getConversationById).mockReset();
  vi.mocked(repo.getFirstUserAndAssistant).mockReset();
  vi.mocked(repo.setTitleIfNull).mockReset();
});
afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// maybeRefreshSummary — BR-33 v2.9 (refresh-on-overflow + incremental fold)
// ---------------------------------------------------------------------------

describe("maybeRefreshSummary (BR-33 v2.9)", () => {
  it("returns void WITHOUT a model call when overflow=0 (no real turn older than the recent window)", async () => {
    // BR-33 v2.9 step 1: gate is `countRealTurnsOlderThanRecentWindow > 0`.
    // When the recent window covers every real turn, the fold has nothing
    // new to absorb — refresh is a no-op.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(0);
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
    expect(repo.listOlderMessagesForSummaryBounded).not.toHaveBeenCalled();
  });

  it("CHAT_SUMMARY_AFTER_TURNS is RETIRED — its value is IGNORED at runtime (BR-33 v2.9 deprecation)", async () => {
    // Sets the legacy threshold to 1 (would always trip in the OLD gate)
    // but `countRealTurnsOlderThanRecentWindow` returns 0 — proves the
    // service consults the OVERFLOW gate, not the legacy counter.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(0);
    const { client, create } = buildAnthropicStub("summary");
    const pool = buildFakePool();

    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: { ...baseEnv, CHAT_SUMMARY_AFTER_TURNS: 1 },
      logger: silentLogger,
    });

    expect(repo.countUserTurns).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("calls the summariser with (summary_prev, bounded_slice) and persists summary_new (BR-33 v2.9 step 3-5)", async () => {
    // Wire the v2.9 path end-to-end: overflow gate fires, bounded slice
    // returns rows, conversation carries a prior summary, fold composes the
    // user turn, and the UPDATE writes the new summary.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(2);
    const slice = [
      userAnchor("pergunta antiga", "idem-old-1"),
      assistantMessage("resposta antiga"),
    ];
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce(slice);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_WITH_PREV_SUMMARY
    );
    vi.mocked(repo.updateSummaryRolling).mockResolvedValueOnce(undefined);
    const { client, create } = buildAnthropicStub("novo resumo combinado");
    const pool = buildFakePool();

    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });

    expect(create).toHaveBeenCalledTimes(1);
    const req = create.mock.calls[0]![0];
    expect(req.model).toBe(baseEnv.CHAT_UTILITY_MODEL);
    expect(req.stream).toBe(false);
    // The composed user turn (BR-46 buildUserTurn) is a single user message
    // whose text contains BOTH the prior summary AND the slice contents.
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0].role).toBe("user");
    const composed = req.messages[0].content[0].text as string;
    expect(composed).toContain("Resumo anterior:");
    expect(composed).toContain(CONVERSATION_WITH_PREV_SUMMARY.summary_rolling!);
    expect(composed).toContain("Mensagens novas a incorporar");
    expect(composed).toContain("pergunta antiga");
    expect(composed).toContain("resposta antiga");
    // Slice cap is honoured by the repository call (M=40 in baseEnv).
    expect(repo.listOlderMessagesForSummaryBounded).toHaveBeenCalledWith(
      expect.anything(),
      CONV_ID,
      baseEnv.CHAT_RECENT_WINDOW,
      baseEnv.CHAT_SUMMARY_OVERLAP_M
    );
    expect(repo.updateSummaryRolling).toHaveBeenCalledWith(
      expect.anything(),
      CONV_ID,
      "novo resumo combinado"
    );
  });

  it("accepts summary_prev=null on the conversation's first refresh (composed text renders '(vazio)')", async () => {
    // BR-46: `summary_prev: string | null` — null is valid on the very first
    // refresh of a conversation. The composed template renders "(vazio)" in
    // that case so the summariser sees a stable shape.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([
      userAnchor("pergunta", "idem-a"),
    ]);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    vi.mocked(repo.updateSummaryRolling).mockResolvedValueOnce(undefined);
    const { client, create } = buildAnthropicStub("primeiro resumo");
    const pool = buildFakePool();

    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: silentLogger,
    });

    const composed = create.mock.calls[0]![0].messages[0].content[0].text as string;
    expect(composed).toContain("Resumo anterior:");
    expect(composed).toContain("(vazio)");
  });

  it("refuses to write when summary_new > 2000 chars; logs WARN chat.summary_refresh_overflow (BR-33 v2.9 step 4)", async () => {
    // Hard cap: oversize output keeps `summary_prev` UNCHANGED and emits a
    // dedicated WARN event. Tests the entire failure path of step 4.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([
      userAnchor("pergunta", "idem-x"),
    ]);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
    const oversize = "a".repeat(2001);
    const { client } = buildAnthropicStub(oversize);
    const pool = buildFakePool();
    const warns: Array<Record<string, unknown>> = [];
    const captureLogger = pino(
      { level: "warn" },
      {
        write(line: string): void {
          warns.push(JSON.parse(line) as Record<string, unknown>);
        },
      }
    );

    await maybeRefreshSummary({
      pool,
      conversationId: CONV_ID,
      anthropic: client,
      env: baseEnv,
      logger: captureLogger,
    });

    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
    // The WARN must carry the canonical event name AND the offending size.
    const overflow = warns.find((w) => w.event === "chat.summary_refresh_overflow");
    expect(overflow).toBeDefined();
    expect(overflow!.chars).toBe(2001);
    expect(overflow!.conversation_id).toBe(CONV_ID);
  });

  it("early-returns when CHAT_SUMMARY_ENABLED is false (BR-33)", async () => {
    // BR-33: disabled => permanent NULL. No DB reads beyond the no-op
    // short-circuit; no LLM call.
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
    expect(repo.countRealTurnsOlderThanRecentWindow).not.toHaveBeenCalled();
  });

  it("NEVER throws when the utility model rejects; WARN carries phase='model_call' (BR-33 v2.9 fire-and-forget)", async () => {
    // BR-33 v2.9: errors are caught and logged WARN with a `phase`
    // discriminator. The route already returned to the client.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([
      userAnchor("anything", "idem-fail"),
    ]);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(CONVERSATION_NO_TITLE);
    const create = vi.fn().mockRejectedValue(new Error("provider 503"));
    const client = { messages: { create } } as AnthropicUtilityLike;
    const pool = buildFakePool();
    const warns: Array<Record<string, unknown>> = [];
    const captureLogger = pino(
      { level: "warn" },
      {
        write(line: string): void {
          warns.push(JSON.parse(line) as Record<string, unknown>);
        },
      }
    );

    await expect(
      maybeRefreshSummary({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: captureLogger,
      })
    ).resolves.toBeUndefined();

    // Persistence MUST NOT happen on failure.
    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
    const failure = warns.find((w) => w.event === "chat.summary_refresh_failure");
    expect(failure).toBeDefined();
    expect(failure!.phase).toBe("model_call");
  });

  it("NEVER throws when the UPDATE rejects; WARN carries phase='persist'", async () => {
    // BR-33 v2.9: even a DB write failure post-LLM-success must be absorbed.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([
      userAnchor("anything", "idem-persist-fail"),
    ]);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(CONVERSATION_NO_TITLE);
    vi.mocked(repo.updateSummaryRolling).mockRejectedValueOnce(
      new Error("connection lost")
    );
    const { client } = buildAnthropicStub("resumo valido");
    const pool = buildFakePool();
    const warns: Array<Record<string, unknown>> = [];
    const captureLogger = pino(
      { level: "warn" },
      {
        write(line: string): void {
          warns.push(JSON.parse(line) as Record<string, unknown>);
        },
      }
    );

    await expect(
      maybeRefreshSummary({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: captureLogger,
      })
    ).resolves.toBeUndefined();

    const failure = warns.find((w) => w.event === "chat.summary_refresh_failure");
    expect(failure).toBeDefined();
    expect(failure!.phase).toBe("persist");
  });

  it("NEVER throws when the slice fetch rejects; WARN carries phase='fetch_slice'", async () => {
    // The `countRealTurnsOlderThanRecentWindow` read itself is part of the
    // fetch_slice phase — a DB error there must be absorbed.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockRejectedValueOnce(
      new Error("conn closed")
    );
    const { client, create } = buildAnthropicStub("never called");
    const pool = buildFakePool();
    const warns: Array<Record<string, unknown>> = [];
    const captureLogger = pino(
      { level: "warn" },
      {
        write(line: string): void {
          warns.push(JSON.parse(line) as Record<string, unknown>);
        },
      }
    );

    await expect(
      maybeRefreshSummary({
        pool,
        conversationId: CONV_ID,
        anthropic: client,
        env: baseEnv,
        logger: captureLogger,
      })
    ).resolves.toBeUndefined();

    expect(create).not.toHaveBeenCalled();
    const failure = warns.find((w) => w.event === "chat.summary_refresh_failure");
    expect(failure).toBeDefined();
    expect(failure!.phase).toBe("fetch_slice");
  });

  it("returns early when listOlderMessagesForSummaryBounded yields an empty slice (defensive)", async () => {
    // The bounded slicer can legitimately return [] if the M-row tail has no
    // anchors — defensive guard against shipping `messages: []` to Anthropic.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([]);
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
    expect(repo.updateSummaryRolling).not.toHaveBeenCalled();
  });

  it("drops an empty summary_new silently (no DB write)", async () => {
    // If the utility model returns whitespace, the trim leaves an empty
    // string — we MUST NOT persist "" as the rolling summary.
    vi.mocked(repo.countRealTurnsOlderThanRecentWindow).mockResolvedValueOnce(1);
    vi.mocked(repo.listOlderMessagesForSummaryBounded).mockResolvedValueOnce([
      userAnchor("anything", "idem-empty"),
    ]);
    vi.mocked(repo.getConversationById).mockResolvedValueOnce(
      CONVERSATION_NO_TITLE
    );
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
// maybeDistillTitle (BR-34) — UNCHANGED contract; tests preserved verbatim.
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
