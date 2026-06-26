// Repository layer for the chat module (chat.back.md v2.0.0 §3).
//
// All queries are parameterized (CLAUDE.md "Security"). Every function takes a
// `PoolClient` so callers can compose them inside `withTransaction(pool, ...)`
// or `withReadOnly(pool, ...)` (imported from
// `modules/curation/service/transaction.ts` — chat.back.md §3 "Reuse, not
// redefine"). The repository owns NO transaction boundary itself.
//
// Row shapes mirror the 0004_chat_persistence.sql column layout 1:1 in
// snake_case (chat.back.md §3, last paragraph). The service layer maps them to
// camelCase API shapes at the edge.
//
// BR map (chat.back.md v2.0.0 §4):
//   BR-26  user-row insert carries Idempotency-Key
//   BR-27  UNIQUE PARTIAL conflict on (conversation_id, idempotency_key) ->
//          caller decides replay vs mismatch
//   BR-29  user row insert pre-stream; assistant row insert post-terminal-frame
//   BR-31  context-builder reads via listRecentRealTurns (v2.9 turn-based
//          window). listRecentMessages preserved for back-compat.
//   BR-32  per-tool-call audit row + post-stream patch via
//          attachToolCallsToMessage
//   BR-33  rolling-summary inputs (countUserTurns,
//          listOlderMessagesForSummary) + write (updateSummaryRolling)
//   BR-34  title distillation read (getFirstUserAndAssistant) + idempotent
//          write (setTitleIfNull)
//   BR-35  cursor pagination on listConversations
//   BR-36  PATCH semantics on updateConversation (title and/or archived_at)
//   BR-37  cascade DELETE on deleteConversation (ON DELETE CASCADE in DDL)
//   BR-39  ASC `before`-cursor pagination on listMessagesPaginated
//   BR-40  single-statement aggregation in getConversationUsage

import type { PoolClient } from "pg";

// ---------------------------------------------------------------------------
// Row shapes (1:1 with the DDL columns)
// ---------------------------------------------------------------------------

export interface ConversationRow {
  readonly id: string;
  readonly title: string | null;
  readonly summary_rolling: string | null;
  readonly archived_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type ChatMessageRole = "user" | "assistant";

export type AssistantStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "max_iterations"
  | "turn_timeout"
  | "cancelled"
  | "provider_error"
  | "internal_error";

export interface MessageRow {
  readonly id: string;
  readonly conversation_id: string;
  readonly role: ChatMessageRole;
  readonly content: unknown[]; // jsonb — Anthropic content blocks
  readonly stop_reason: string | null;
  readonly idempotency_key: string | null;
  readonly model: string | null;
  readonly tokens_in: number | null;
  readonly tokens_out: number | null;
  readonly latency_ms: number | null;
  readonly created_at: string;
}

export interface ToolCallRow {
  readonly id: string;
  readonly conversation_id: string;
  readonly message_id: string | null;
  readonly tool_name: string;
  readonly arguments: unknown;
  readonly result: unknown | null;
  readonly is_error: boolean;
  readonly error_message: string | null;
  readonly duration_ms: number;
  readonly created_at: string;
}

export interface ConversationListPage {
  readonly items: ConversationRow[];
  readonly hasMore: boolean;
}

export interface MessageListPage {
  readonly items: MessageRow[];
  readonly hasMore: boolean;
}

export interface ConversationUsage {
  readonly messages: number;
  readonly tokens_in: number;
  readonly tokens_out: number;
  readonly tool_calls: number;
}

export interface FirstUserAndAssistant {
  readonly user: MessageRow | null;
  readonly assistant: MessageRow | null;
}

// ---------------------------------------------------------------------------
// Interface contract (chat.back.md §3)
// ---------------------------------------------------------------------------

export interface ChatRepository {
  // ---- Conversation CRUD ----------------------------------------------------
  insertConversation(
    client: PoolClient,
    input: { title: string | null }
  ): Promise<ConversationRow>;

  getConversationById(
    client: PoolClient,
    id: string
  ): Promise<ConversationRow | null>;

  listConversations(
    client: PoolClient,
    input: {
      limit: number;
      cursor: { createdAt: string; id: string } | null;
      includeArchived: boolean;
    }
  ): Promise<ConversationListPage>;

  updateConversation(
    client: PoolClient,
    id: string,
    patch: { title?: string | null; archived_at?: string | null }
  ): Promise<ConversationRow | null>;

  deleteConversation(client: PoolClient, id: string): Promise<number>;

  // ---- Conversation summary maintenance -------------------------------------
  updateSummaryRolling(
    client: PoolClient,
    id: string,
    summary: string
  ): Promise<void>;

  setTitleIfNull(
    client: PoolClient,
    id: string,
    title: string
  ): Promise<string | null>;

  // ---- Message persistence --------------------------------------------------
  insertUserMessage(
    client: PoolClient,
    input: {
      conversation_id: string;
      content: unknown[];
      idempotency_key: string;
      model: string | null;
    }
  ): Promise<MessageRow>;

  findUserByIdempotencyKey(
    client: PoolClient,
    conversation_id: string,
    idempotency_key: string
  ): Promise<MessageRow | null>;

  findAssistantSuccessor(
    client: PoolClient,
    conversation_id: string,
    after_created_at: string
  ): Promise<MessageRow | null>;

  insertIterationPair(
    client: PoolClient,
    input: {
      conversation_id: string;
      assistant_content: unknown[];
      tool_result_content: unknown[];
      model: string | null;
    }
  ): Promise<{ assistant: MessageRow; user: MessageRow }>;

  insertAssistantMessage(
    client: PoolClient,
    input: {
      conversation_id: string;
      content: unknown[];
      stop_reason: AssistantStopReason;
      model: string | null;
      tokens_in: number | null;
      tokens_out: number | null;
      latency_ms: number | null;
    }
  ): Promise<MessageRow>;

  listRecentMessages(
    client: PoolClient,
    conversation_id: string,
    limit: number
  ): Promise<MessageRow[]>;

  // BR-31 v2.9: turn-based recent window. Returns every chat_message row that
  // belongs to one of the last `turn_count` REAL turns (a real turn is anchored
  // by a `role='user' AND idempotency_key IS NOT NULL` row), in chronological
  // ASC order — including all scaffolding rows (intermediate
  // `assistant[tool_use]` rows and synthetic `user[tool_result]` rows) and the
  // terminal assistant row of each selected turn. When fewer than `turn_count`
  // real turns exist, all rows from the available turns are returned (no error,
  // no padding).
  listRecentRealTurns(
    client: PoolClient,
    conversation_id: string,
    turn_count: number
  ): Promise<MessageRow[]>;

  // BR-33 v2.9 trigger predicate. Counts REAL anchor rows (user,
  // `idempotency_key IS NOT NULL`) whose `created_at` is strictly OLDER than
  // the anchor at position K from the tail. Returns 0 when the conversation
  // has K or fewer real turns (no overflow). Used by the refresh-on-overflow
  // gate of BR-33 v2.9 step 1.
  countRealTurnsOlderThanRecentWindow(
    client: PoolClient,
    conversation_id: string,
    turn_count: number
  ): Promise<number>;

  listMessagesPaginated(
    client: PoolClient,
    conversation_id: string,
    input: { limit: number; before: string | null }
  ): Promise<MessageListPage>;

  listOlderMessagesForSummary(
    client: PoolClient,
    conversation_id: string,
    exclude_recent: number
  ): Promise<MessageRow[]>;

  countUserTurns(
    client: PoolClient,
    conversation_id: string
  ): Promise<number>;

  getFirstUserAndAssistant(
    client: PoolClient,
    conversation_id: string
  ): Promise<FirstUserAndAssistant>;

  // ---- Tool-call persistence ------------------------------------------------
  insertToolCall(
    client: PoolClient,
    input: {
      conversation_id: string;
      message_id: string | null;
      tool_name: string;
      arguments: unknown;
      result: unknown | null;
      is_error: boolean;
      error_message: string | null;
      duration_ms: number;
    }
  ): Promise<ToolCallRow>;

  attachToolCallsToMessage(
    client: PoolClient,
    tool_call_ids: string[],
    message_id: string
  ): Promise<void>;

  // ---- Aggregates -----------------------------------------------------------
  getConversationUsage(
    client: PoolClient,
    conversation_id: string
  ): Promise<ConversationUsage>;

  // ---- Graph view persistence (BR-42) ---------------------------------------
  getConversationGraphView(
    client: PoolClient,
    conversationId: string
  ): Promise<GraphViewRow | null>;

  upsertConversationGraphView(
    client: PoolClient,
    conversationId: string,
    snapshot: unknown
  ): Promise<{ updated_at: string }>;
}

// ---------------------------------------------------------------------------
// Column projections (kept as constants so every read returns the same shape)
// ---------------------------------------------------------------------------

const CONVERSATION_COLS =
  "id, title, summary_rolling, archived_at, created_at, updated_at";

const MESSAGE_COLS =
  "id, conversation_id, role, content, stop_reason, idempotency_key, " +
  "model, tokens_in, tokens_out, latency_ms, created_at";

const TOOL_CALL_COLS =
  "id, conversation_id, message_id, tool_name, arguments, result, " +
  "is_error, error_message, duration_ms, created_at";

// ---------------------------------------------------------------------------
// Conversation CRUD
// ---------------------------------------------------------------------------

export async function insertConversation(
  client: PoolClient,
  input: { title: string | null }
): Promise<ConversationRow> {
  const res = await client.query<ConversationRow>(
    `INSERT INTO chat_conversation (title)
     VALUES ($1)
     RETURNING ${CONVERSATION_COLS}`,
    [input.title]
  );
  return res.rows[0]!;
}

export async function getConversationById(
  client: PoolClient,
  id: string
): Promise<ConversationRow | null> {
  const res = await client.query<ConversationRow>(
    `SELECT ${CONVERSATION_COLS}
       FROM chat_conversation
      WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

// BR-35: cursor-paginated DESC list. `cursor` is the (created_at, id) pair of
// the previous page's last row. The composite key tuple comparison `(a, b) <
// (c, d)` lets the query plan walk `idx_chat_conversation_created_at_id_desc`
// directly. We fetch `limit + 1` rows to detect a next page without a second
// COUNT round-trip.
export async function listConversations(
  client: PoolClient,
  input: {
    limit: number;
    cursor: { createdAt: string; id: string } | null;
    includeArchived: boolean;
  }
): Promise<ConversationListPage> {
  const { limit, cursor, includeArchived } = input;
  const conds: string[] = [];
  const params: unknown[] = [];

  if (cursor !== null) {
    params.push(cursor.createdAt, cursor.id);
    conds.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }
  if (!includeArchived) {
    conds.push(`archived_at IS NULL`);
  }

  const where = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";
  params.push(limit + 1);
  const limitParam = `$${params.length}`;

  const res = await client.query<ConversationRow>(
    `SELECT ${CONVERSATION_COLS}
       FROM chat_conversation
       ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limitParam}`,
    params
  );

  const rows = res.rows;
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, hasMore };
}

// BR-36: PATCH semantics. `undefined` in the patch means "do not change",
// `null` means "set NULL", any other value sets the column literally. The
// `set_updated_at` trigger bumps `updated_at` whenever any column changes.
// Empty body is rejected at the route layer (BR-36), so we always have at
// least one SET clause here.
export async function updateConversation(
  client: PoolClient,
  id: string,
  patch: { title?: string | null; archived_at?: string | null }
): Promise<ConversationRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (Object.prototype.hasOwnProperty.call(patch, "title")) {
    params.push(patch.title ?? null);
    sets.push(`title = $${params.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "archived_at")) {
    params.push(patch.archived_at ?? null);
    sets.push(`archived_at = $${params.length}::timestamptz`);
  }

  if (sets.length === 0) {
    // Defensive: the route validator already rejects this case (BR-36), but
    // guard against accidental misuse. Return the row as-is.
    return getConversationById(client, id);
  }

  params.push(id);
  const res = await client.query<ConversationRow>(
    `UPDATE chat_conversation
        SET ${sets.join(", ")}
      WHERE id = $${params.length}
      RETURNING ${CONVERSATION_COLS}`,
    params
  );
  return res.rows[0] ?? null;
}

// BR-37: cascade DELETE is enforced by ON DELETE CASCADE on
// chat_message.conversation_id and chat_tool_call.conversation_id (DDL §2.3,
// §2.4). No application-side iteration.
export async function deleteConversation(
  client: PoolClient,
  id: string
): Promise<number> {
  const res = await client.query(
    `DELETE FROM chat_conversation WHERE id = $1`,
    [id]
  );
  return res.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Conversation summary maintenance
// ---------------------------------------------------------------------------

export async function updateSummaryRolling(
  client: PoolClient,
  id: string,
  summary: string
): Promise<void> {
  await client.query(
    `UPDATE chat_conversation
        SET summary_rolling = $1
      WHERE id = $2`,
    [summary, id]
  );
}

// BR-34: idempotent — only writes when `title IS NULL`. Returns the value
// written, or NULL when nothing was written (concurrent set won, or title was
// already non-null).
export async function setTitleIfNull(
  client: PoolClient,
  id: string,
  title: string
): Promise<string | null> {
  const res = await client.query<{ title: string }>(
    `UPDATE chat_conversation
        SET title = $1
      WHERE id = $2
        AND title IS NULL
      RETURNING title`,
    [title, id]
  );
  return res.rows[0]?.title ?? null;
}

// ---------------------------------------------------------------------------
// Message persistence
// ---------------------------------------------------------------------------

// BR-26 / BR-27: insert the user row with its idempotency_key. The UNIQUE
// PARTIAL index `idx_chat_message_idempotency` raises pg error code `23505`
// on conflict. This function does NOT catch the conflict — callers
// (sendMessage handler) catch it and translate via `findUserByIdempotencyKey`
// into either UC-07 replay or `BUSINESS_IDEMPOTENCY_MISMATCH`.
export async function insertUserMessage(
  client: PoolClient,
  input: {
    conversation_id: string;
    content: unknown[];
    idempotency_key: string;
    model: string | null;
  }
): Promise<MessageRow> {
  const res = await client.query<MessageRow>(
    `INSERT INTO chat_message
       (conversation_id, role, content, idempotency_key, model)
     VALUES ($1, 'user', $2::jsonb, $3, $4)
     RETURNING ${MESSAGE_COLS}`,
    [input.conversation_id, JSON.stringify(input.content), input.idempotency_key, input.model]
  );
  return res.rows[0]!;
}

export async function findUserByIdempotencyKey(
  client: PoolClient,
  conversation_id: string,
  idempotency_key: string
): Promise<MessageRow | null> {
  const res = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1
        AND idempotency_key = $2
        AND role = 'user'
      LIMIT 1`,
    [conversation_id, idempotency_key]
  );
  return res.rows[0] ?? null;
}

// BR-27 / UC-07: locate the TERMINAL assistant row that answered a user turn.
// `idx_chat_message_conversation_created_at` serves this lookup; ties break on
// `id ASC`. v2.2: a tool-bearing turn now persists INTERMEDIATE assistant rows
// (the `[text?, tool_use]` half of each iteration pair) which carry
// `stop_reason IS NULL`. The idempotent-replay answer is the FINAL assistant
// row, which always carries a non-null `stop_reason` — so we filter on it to
// skip the intermediate rows and return the actual answer.
export async function findAssistantSuccessor(
  client: PoolClient,
  conversation_id: string,
  after_created_at: string
): Promise<MessageRow | null> {
  const res = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1
        AND role = 'assistant'
        AND stop_reason IS NOT NULL
        AND created_at > $2::timestamptz
      ORDER BY created_at ASC, id ASC
      LIMIT 1`,
    [conversation_id, after_created_at]
  );
  return res.rows[0] ?? null;
}

// BR-29 step 6.d (v2.2 — faithful multi-row persistence): persist ONE
// tool-bearing iteration as the atomic pair of rows that reproduces the
// Anthropic message sequence — an INTERMEDIATE assistant row carrying
// `[text?, tool_use]` (stop_reason NULL → not a terminal row) immediately
// followed by a SYNTHETIC user row carrying `[tool_result]` (idempotency_key
// NULL → not a real user turn). Both rows are stamped with `clock_timestamp()`
// — NOT the transaction's `now()`, which returns the SAME instant for every
// statement in a transaction. With identical `created_at` the `(created_at
// ASC, id ASC)` read order would tiebreak on the random `id`, replaying the
// pair in EITHER order and re-introducing the dangling-`tool_use` bug.
// `clock_timestamp()` advances between the two sequential statements, so the
// assistant row sorts STRICTLY BEFORE its `tool_result`. The caller MUST wrap
// this in a single `withTransaction` so a crash never leaves a half-pair.
export async function insertIterationPair(
  client: PoolClient,
  input: {
    conversation_id: string;
    assistant_content: unknown[];
    tool_result_content: unknown[];
    model: string | null;
  }
): Promise<{ assistant: MessageRow; user: MessageRow }> {
  const assistantRes = await client.query<MessageRow>(
    `INSERT INTO chat_message
       (conversation_id, role, content, model, created_at)
     VALUES ($1, 'assistant', $2::jsonb, $3, clock_timestamp())
     RETURNING ${MESSAGE_COLS}`,
    [
      input.conversation_id,
      JSON.stringify(input.assistant_content),
      input.model,
    ]
  );
  const userRes = await client.query<MessageRow>(
    `INSERT INTO chat_message
       (conversation_id, role, content, created_at)
     VALUES ($1, 'user', $2::jsonb, clock_timestamp())
     RETURNING ${MESSAGE_COLS}`,
    [input.conversation_id, JSON.stringify(input.tool_result_content)]
  );
  return { assistant: assistantRes.rows[0]!, user: userRes.rows[0]! };
}

// BR-29 step 8: insert the TERMINAL assistant row AFTER the terminal frame.
export async function insertAssistantMessage(
  client: PoolClient,
  input: {
    conversation_id: string;
    content: unknown[];
    stop_reason: AssistantStopReason;
    model: string | null;
    tokens_in: number | null;
    tokens_out: number | null;
    latency_ms: number | null;
  }
): Promise<MessageRow> {
  const res = await client.query<MessageRow>(
    `INSERT INTO chat_message
       (conversation_id, role, content, stop_reason, model,
        tokens_in, tokens_out, latency_ms)
     VALUES ($1, 'assistant', $2::jsonb, $3, $4, $5, $6, $7)
     RETURNING ${MESSAGE_COLS}`,
    [
      input.conversation_id,
      JSON.stringify(input.content),
      input.stop_reason,
      input.model,
      input.tokens_in,
      input.tokens_out,
      input.latency_ms,
    ]
  );
  return res.rows[0]!;
}

// BR-31: context reconstruction. Walks the `(conversation_id, created_at)`
// index DESC, then reverses to ASC so Anthropic gets messages[] in
// chronological order. The DESC scan is needed to honor `limit` against the
// MOST RECENT messages without sorting the whole conversation.
export async function listRecentMessages(
  client: PoolClient,
  conversation_id: string,
  limit: number
): Promise<MessageRow[]> {
  const res = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM (
         SELECT ${MESSAGE_COLS}
           FROM chat_message
          WHERE conversation_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2
       ) AS recent
      ORDER BY created_at ASC, id ASC`,
    [conversation_id, limit]
  );
  return res.rows;
}

// BR-31 v2.9: turn-based recent-window selection. Two-phase plan, both phases
// scoped to ONE conversation and bounded:
//   Phase 1 — DESC scan over the `(conversation_id, created_at, id)` index
//     filtered on the REAL-turn anchor predicate
//     `role='user' AND idempotency_key IS NOT NULL`, LIMIT `turn_count`. The
//     row at the bottom of the result (or NULL when fewer than `turn_count`
//     anchors exist) gives the inclusive boundary `created_at` from which the
//     window starts.
//   Phase 2 — bounded range scan over the same index returning ALL rows whose
//     `created_at >= boundary` (so scaffolding rows persisted between the
//     anchor and the terminal assistant row are included by construction; see
//     BR-29 v2.2 faithful multi-row persistence), ordered ASC.
// When `turn_count <= 0` we return an empty list defensively — callers
// shouldn't pass that, but the guard avoids an OFFSET-style edge case in the
// boundary subquery. When the conversation has 0 real turns the boundary
// subquery returns NULL and the outer WHERE evaluates `created_at >= NULL ->
// UNKNOWN`, filtering everything out; for that case we short-circuit too so
// the caller never has to reason about it.
export async function listRecentRealTurns(
  client: PoolClient,
  conversation_id: string,
  turn_count: number
): Promise<MessageRow[]> {
  if (turn_count <= 0) return [];

  // The Kth-from-tail anchor's `created_at` is the inclusive lower bound. We
  // express it as a scalar subquery so the whole plan stays in one round-trip.
  // OFFSET `turn_count - 1` walks back exactly K rows from the most-recent
  // anchor; LIMIT 1 returns the boundary. If fewer than K anchor rows exist,
  // the subquery returns no row -> COALESCE to the conversation's earliest
  // `created_at` (still bounded to this conversation), which selects "all rows
  // of all available turns" — the BR-31 v2.9 contract for the under-K branch.
  const offset = turn_count - 1;
  const res = await client.query<MessageRow>(
    `WITH boundary AS (
       SELECT created_at AS at
         FROM chat_message
        WHERE conversation_id = $1
          AND role = 'user'
          AND idempotency_key IS NOT NULL
        ORDER BY created_at DESC, id DESC
        LIMIT 1 OFFSET $2
     ),
     fallback AS (
       SELECT min(created_at) AS at
         FROM chat_message
        WHERE conversation_id = $1
     )
     SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1
        AND created_at >= COALESCE(
          (SELECT at FROM boundary),
          (SELECT at FROM fallback)
        )
      ORDER BY created_at ASC, id ASC`,
    [conversation_id, offset]
  );
  return res.rows;
}

// BR-33 v2.9 step 1: count REAL anchor rows that fell OUT of the K-most-recent
// window. The boundary is the same K-from-tail anchor used by
// listRecentRealTurns; an anchor strictly OLDER than that boundary is "out".
// Returns 0 when there are <= K real turns (the boundary subquery returns no
// row -> the WHERE filter drops everything).
export async function countRealTurnsOlderThanRecentWindow(
  client: PoolClient,
  conversation_id: string,
  turn_count: number
): Promise<number> {
  if (turn_count <= 0) {
    // Defensive: treat as "no window" -> every anchor is older.
    const all = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM chat_message
        WHERE conversation_id = $1
          AND role = 'user'
          AND idempotency_key IS NOT NULL`,
      [conversation_id]
    );
    return Number(all.rows[0]?.count ?? "0");
  }

  const offset = turn_count - 1;
  const res = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM chat_message
      WHERE conversation_id = $1
        AND role = 'user'
        AND idempotency_key IS NOT NULL
        AND created_at < (
          SELECT created_at
            FROM chat_message
           WHERE conversation_id = $1
             AND role = 'user'
             AND idempotency_key IS NOT NULL
           ORDER BY created_at DESC, id DESC
           LIMIT 1 OFFSET $2
        )`,
    [conversation_id, offset]
  );
  return Number(res.rows[0]?.count ?? "0");
}

// BR-39: ASC pagination with optional `before` cursor (walks backwards in
// time so the SPA can lazy-load older messages). Fetch `limit + 1` to detect
// next page.
export async function listMessagesPaginated(
  client: PoolClient,
  conversation_id: string,
  input: { limit: number; before: string | null }
): Promise<MessageListPage> {
  const { limit, before } = input;
  const params: unknown[] = [conversation_id];
  let beforeClause = "";
  if (before !== null) {
    params.push(before);
    beforeClause = ` AND created_at < $${params.length}::timestamptz`;
  }
  params.push(limit + 1);
  const limitParam = `$${params.length}`;

  // v2.2: this is the human-facing conversation view (SPA). It returns ONLY
  // the DISPLAY rows — real user turns (`idempotency_key IS NOT NULL`) and
  // TERMINAL assistant answers (`stop_reason IS NOT NULL`). The intermediate
  // tool-scaffolding rows added by faithful multi-row persistence (assistant
  // `[tool_use]` + synthetic user `[tool_result]`) are hidden — they exist for
  // the model's context replay, not for display, and the structured per-call
  // payload lives in `chat_tool_call` (BR-32). Live tool activity is shown via
  // the `tool_start`/`tool_result` SSE frames during streaming.
  const displayFilter =
    " AND ((role = 'user' AND idempotency_key IS NOT NULL)" +
    " OR (role = 'assistant' AND stop_reason IS NOT NULL))";

  const res = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1${beforeClause}${displayFilter}
      ORDER BY created_at ASC, id ASC
      LIMIT ${limitParam}`,
    params
  );

  const rows = res.rows;
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, hasMore };
}

// BR-33: input for the rolling-summary distillation. Returns messages OLDER
// than the last `exclude_recent` rows in chronological ASC order. The
// subquery resolves the boundary timestamp by walking DESC, OFFSETing by
// `exclude_recent - 1` (0-based) and LIMITing to 1. Any row strictly OLDER
// than that boundary is the "older slice".
export async function listOlderMessagesForSummary(
  client: PoolClient,
  conversation_id: string,
  exclude_recent: number
): Promise<MessageRow[]> {
  if (exclude_recent <= 0) {
    // Defensive: caller asked to exclude nothing -> return entire history.
    const all = await client.query<MessageRow>(
      `SELECT ${MESSAGE_COLS}
         FROM chat_message
        WHERE conversation_id = $1
        ORDER BY created_at ASC, id ASC`,
      [conversation_id]
    );
    return all.rows;
  }

  const offset = exclude_recent - 1;
  const res = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1
        AND created_at < (
          SELECT created_at
            FROM chat_message
           WHERE conversation_id = $1
           ORDER BY created_at DESC, id DESC
           LIMIT 1 OFFSET $2
        )
      ORDER BY created_at ASC, id ASC`,
    [conversation_id, offset]
  );
  return res.rows;
}

// BR-33 trigger predicate. Counts REAL user turns only. v2.2: synthetic user
// rows carrying `tool_result` blocks (idempotency_key NULL) are NOT user turns
// — counting them would trip the summary threshold far too early (one extra
// "turn" per tool call). The `idempotency_key IS NOT NULL` filter selects only
// genuine user messages.
export async function countUserTurns(
  client: PoolClient,
  conversation_id: string
): Promise<number> {
  const res = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM chat_message
      WHERE conversation_id = $1
        AND role = 'user'
        AND idempotency_key IS NOT NULL`,
    [conversation_id]
  );
  return Number(res.rows[0]?.count ?? "0");
}

// BR-34 trigger: first REAL user + first TERMINAL assistant rows by
// `created_at ASC, id ASC`. v2.2: filter the user side to genuine turns
// (`idempotency_key IS NOT NULL`, never a synthetic `tool_result` row) and the
// assistant side to the answer row (`stop_reason IS NOT NULL`, never an
// intermediate `tool_use` row). Without these filters the title prompt would
// receive a dangling `tool_use` (assistant) or a `tool_result` (user) and the
// utility model call would 400.
export async function getFirstUserAndAssistant(
  client: PoolClient,
  conversation_id: string
): Promise<FirstUserAndAssistant> {
  const userRes = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1 AND role = 'user'
        AND idempotency_key IS NOT NULL
      ORDER BY created_at ASC, id ASC
      LIMIT 1`,
    [conversation_id]
  );
  const assistantRes = await client.query<MessageRow>(
    `SELECT ${MESSAGE_COLS}
       FROM chat_message
      WHERE conversation_id = $1 AND role = 'assistant'
        AND stop_reason IS NOT NULL
      ORDER BY created_at ASC, id ASC
      LIMIT 1`,
    [conversation_id]
  );
  return {
    user: userRes.rows[0] ?? null,
    assistant: assistantRes.rows[0] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Tool-call persistence (BR-32)
// ---------------------------------------------------------------------------

export async function insertToolCall(
  client: PoolClient,
  input: {
    conversation_id: string;
    message_id: string | null;
    tool_name: string;
    arguments: unknown;
    result: unknown | null;
    is_error: boolean;
    error_message: string | null;
    duration_ms: number;
  }
): Promise<ToolCallRow> {
  const res = await client.query<ToolCallRow>(
    `INSERT INTO chat_tool_call
       (conversation_id, message_id, tool_name, arguments, result,
        is_error, error_message, duration_ms)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)
     RETURNING ${TOOL_CALL_COLS}`,
    [
      input.conversation_id,
      input.message_id,
      input.tool_name,
      JSON.stringify(input.arguments),
      input.result === null ? null : JSON.stringify(input.result),
      input.is_error,
      input.error_message,
      input.duration_ms,
    ]
  );
  return res.rows[0]!;
}

// Single UPDATE patches all rows whose id is in the supplied array (BR-29
// step 8). Caller already knows the inserted ids from the in-loop
// `insertToolCall` calls.
export async function attachToolCallsToMessage(
  client: PoolClient,
  tool_call_ids: string[],
  message_id: string
): Promise<void> {
  if (tool_call_ids.length === 0) return;
  await client.query(
    `UPDATE chat_tool_call
        SET message_id = $1
      WHERE id = ANY($2::uuid[])`,
    [message_id, tool_call_ids]
  );
}

// ---------------------------------------------------------------------------
// Aggregates (BR-40)
// ---------------------------------------------------------------------------

// Single round-trip; pg returns `count(*)::int` as a JS number, and the
// `COALESCE(sum(...), 0)::int` casts shield us from null aggregates on empty
// conversations. The four sub-selects all hit the index on
// `(conversation_id, ...)`.
interface UsageRow {
  messages: number;
  tokens_in: number;
  tokens_out: number;
  tool_calls: number;
}

export async function getConversationUsage(
  client: PoolClient,
  conversation_id: string
): Promise<ConversationUsage> {
  const res = await client.query<UsageRow>(
    `SELECT
       (SELECT count(*)::int FROM chat_message
         WHERE conversation_id = $1)                                            AS messages,
       (SELECT COALESCE(sum(tokens_in),  0)::int FROM chat_message
         WHERE conversation_id = $1 AND role = 'assistant')                     AS tokens_in,
       (SELECT COALESCE(sum(tokens_out), 0)::int FROM chat_message
         WHERE conversation_id = $1 AND role = 'assistant')                     AS tokens_out,
       (SELECT count(*)::int FROM chat_tool_call
         WHERE conversation_id = $1)                                            AS tool_calls`,
    [conversation_id]
  );
  const row = res.rows[0]!;
  return {
    messages: row.messages,
    tokens_in: row.tokens_in,
    tokens_out: row.tokens_out,
    tool_calls: row.tool_calls,
  };
}

// ---------------------------------------------------------------------------
// Default export: object implementing the interface, for callers that prefer
// the dependency-injection shape over individual function imports.
// ---------------------------------------------------------------------------

export const chatRepository: ChatRepository = {
  insertConversation,
  getConversationById,
  listConversations,
  updateConversation,
  deleteConversation,
  updateSummaryRolling,
  setTitleIfNull,
  insertUserMessage,
  findUserByIdempotencyKey,
  findAssistantSuccessor,
  insertIterationPair,
  insertAssistantMessage,
  listRecentMessages,
  listRecentRealTurns,
  countRealTurnsOlderThanRecentWindow,
  listMessagesPaginated,
  listOlderMessagesForSummary,
  countUserTurns,
  getFirstUserAndAssistant,
  insertToolCall,
  attachToolCallsToMessage,
  getConversationUsage,
  getConversationGraphView,
  upsertConversationGraphView,
};

// ---------------------------------------------------------------------------
// Graph view persistence (BR-42)
// ---------------------------------------------------------------------------

export interface GraphViewRow {
  readonly conversation_id: string;
  readonly snapshot: unknown;
  readonly updated_at: string;
}

const GRAPH_VIEW_COLS = "conversation_id, snapshot, updated_at";

// BR-42: read the last-saved graph snapshot for a conversation. Returns null
// when no snapshot has been saved yet (normal path for new conversations).
export async function getConversationGraphView(
  client: PoolClient,
  conversationId: string
): Promise<GraphViewRow | null> {
  const res = await client.query<GraphViewRow>(
    `SELECT ${GRAPH_VIEW_COLS}
       FROM chat_graph_view
      WHERE conversation_id = $1`,
    [conversationId]
  );
  return res.rows[0] ?? null;
}

// BR-42: upsert the last-presented graph snapshot. ON CONFLICT overwrites
// (single-row-per-conversation memento). Returns the updated_at timestamp.
export async function upsertConversationGraphView(
  client: PoolClient,
  conversationId: string,
  snapshot: unknown
): Promise<{ updated_at: string }> {
  const res = await client.query<{ updated_at: string }>(
    `INSERT INTO chat_graph_view (conversation_id, snapshot)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (conversation_id) DO UPDATE
       SET snapshot   = EXCLUDED.snapshot,
           updated_at = now()
     RETURNING updated_at`,
    [conversationId, JSON.stringify(snapshot)]
  );
  return res.rows[0]!;
}
