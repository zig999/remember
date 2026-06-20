-- =============================================================================
-- 0004_chat_persistence.sql
-- =============================================================================
-- SPEC ARTIFACT (not the migration itself). The dev team copies / adapts this
-- into `migrations/0004_chat_persistence.sql` and applies it under the
-- CLAUDE.md "Safety Rule — Database Changes Require Explicit Approval"
-- workflow. The file is owned by `docs/specs/domains/chat/back/` and is the
-- SOURCE OF TRUTH for the chat-persistence DDL.
--
-- Source: chat.spec.md v2.0.0 §6, BR-22, BR-25..BR-40
--         chat.back.md v2.0.0 §2
-- Compliance: chat_* tables are OUTSIDE the v7 §11 flow (chat stores
--             synthesised answers, not facts anchored to `raw_information`);
--             cascade DELETE is the only erasure path (BR-37). Therefore NO
--             `status` / `superseded_at` tombstone columns on these tables.
-- Single-owner: NO `user_id` column on any of the three tables (v7 §2.3 / A20).
-- Functions/triggers reused from `migrations/0001_init.sql`:
--   - `set_updated_at()` trigger function (line 108) — applied to chat_conversation.
--   - `gen_random_uuid()` from pgcrypto (already enabled in 0001).
--
-- Rollback: dropping the three tables + the enum cascades cleanly because no
-- other domain references chat tables. The compliance walker does NOT visit
-- chat_* (BR-37).
-- =============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Enum: chat_message_role
-- ----------------------------------------------------------------------------
-- Persisted role on a `chat_message` row. The transient `assistant(tool_use)`
-- / `user(tool_result)` blocks the agentic loop synthesises during an
-- iteration are NEVER persisted as their own messages (BR-02 of chat.spec.md).
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant');

-- ----------------------------------------------------------------------------
-- 2. Table: chat_conversation (aggregate root)
-- ----------------------------------------------------------------------------
-- One row per Conversation. Single-owner — no user_id column.
--   - `title`            NULL until set by the Owner OR by the title-distillation
--                        job (BR-34); length 1..200 enforced at the BFF (Zod
--                        ChatTurnRequest mirror).
--   - `summary_rolling`  NULL until the rolling-summary policy fires after
--                        `CHAT_SUMMARY_AFTER_TURNS` user turns (BR-33).
--   - `archived_at`      NULL = active; non-NULL = archived (BR-25). Writes
--                        (`sendMessage`, `cancelTurn`) refused while archived.
--   - `created_at`/`updated_at`  managed by the `set_updated_at` trigger
--                                (same trigger function defined in
--                                `migrations/0001_init.sql` line 108).
CREATE TABLE chat_conversation (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NULL,
  summary_rolling text        NULL,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_chat_conversation_set_updated_at
  BEFORE UPDATE ON chat_conversation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- BR-35: `listConversations` orders by `(created_at DESC, id DESC)`. The
-- `created_at` axis is the dominant cursor; `id` breaks ties deterministically.
-- The PK already indexes `id`. A descending composite index speeds the
-- cursor-paginated read.
CREATE INDEX idx_chat_conversation_created_at_id_desc
  ON chat_conversation (created_at DESC, id DESC);

-- ----------------------------------------------------------------------------
-- 3. Table: chat_message
-- ----------------------------------------------------------------------------
-- One row per persisted message. Two roles: user (request) + assistant
-- (terminal response of one turn). The transient tool_use / tool_result
-- blocks inside an iteration are NOT persisted here (they live in
-- `chat_tool_call`).
--
-- Persistence sequencing (BR-29):
--   - The user row is inserted BEFORE the SSE opens (durable on any later
--     failure: provider error, internal error, cancellation, timeout).
--   - The assistant row is inserted AFTER the terminal SSE frame is emitted
--     (or after the iterator throws). It carries the resolved `stop_reason`
--     (including the synthetic codes `provider_error`, `internal_error`,
--     `max_iterations`, `turn_timeout`, `cancelled`), `tokens_in`,
--     `tokens_out`, `latency_ms`, and `model`.
--
-- `idempotency_key`:
--   - Always non-null on user rows (BR-26: header is REQUIRED).
--   - Always null on assistant rows (the key lives on the triggering user row).
--   - Enforced by the UNIQUE PARTIAL index below (BR-27).
--
-- `content`: jsonb array of Anthropic-style content blocks
-- (`[{type:"text", text:"..."}]` in v1, but the column accepts arbitrary
-- shapes so the schema does not need to evolve when the provider adds new
-- block types).
CREATE TABLE chat_message (
  id              uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid               NOT NULL REFERENCES chat_conversation(id) ON DELETE CASCADE,
  role            chat_message_role  NOT NULL,
  content         jsonb              NOT NULL,
  stop_reason     text               NULL,  -- One of: end_turn|max_tokens|stop_sequence
                                            -- |max_iterations|turn_timeout|cancelled
                                            -- |provider_error|internal_error  (assistant rows only)
  idempotency_key uuid               NULL,  -- BR-26: non-null on user rows; null on assistant rows.
  model           text               NULL,  -- Resolved Anthropic model id; null on legacy rows.
  tokens_in       int                NULL,  -- Sum across iterations (assistant only).
  tokens_out      int                NULL,  -- Sum across iterations (assistant only).
  latency_ms      int                NULL,  -- Wall-clock from first llm_start to terminal frame (assistant only).
  created_at      timestamptz        NOT NULL DEFAULT now()
);

-- BR-31 / BR-39: chronological reads — context reconstruction (recent window)
-- and `listMessages` both walk this index.
CREATE INDEX idx_chat_message_conversation_created_at
  ON chat_message (conversation_id, created_at);

-- BR-27: idempotency. The UNIQUE PARTIAL index enforces "at most one user row
-- per (conversation_id, idempotency_key)" without forcing idempotency_key to
-- be UNIQUE across the full table (assistant rows carry NULL).
CREATE UNIQUE INDEX idx_chat_message_idempotency
  ON chat_message (conversation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. Table: chat_tool_call
-- ----------------------------------------------------------------------------
-- One row per tool dispatch inside an agentic turn (BR-32). Auditable record
-- of the FULL input/output (NOT truncated — BR-13 truncation applies only to
-- the body fed back into the next Anthropic iteration, not to persistence).
--
--   - `message_id`  NULLABLE because the assistant row id is only known AFTER
--                   the terminal SSE frame (BR-29). Implementations may either
--                   insert the chat_tool_call rows with `message_id = NULL`
--                   during the loop and patch them on assistant-row insert,
--                   OR insert them in a single batch after the assistant row
--                   exists. `ON DELETE SET NULL` keeps the tool-call audit
--                   trail intact even if the assistant row is later deleted
--                   (e.g. by a future repair path).
--   - `tool_name`   one of the 13 names of the `query` toolset (BR-05).
--   - `arguments`   full jsonb input passed to the tool.
--   - `result`      full jsonb success body; NULL on error.
--   - `is_error`    true when the tool returned `{ ok: false, ... }` OR timed
--                   out (BR-17).
--   - `error_message`  short human-readable string from the tool envelope's
--                       `error.message`; NULL on success.
--   - `duration_ms`  wall-clock per-tool latency in ms.
CREATE TABLE chat_tool_call (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES chat_conversation(id) ON DELETE CASCADE,
  message_id      uuid        NULL REFERENCES chat_message(id) ON DELETE SET NULL,
  tool_name       text        NOT NULL,
  arguments       jsonb       NOT NULL,
  result          jsonb       NULL,
  is_error        boolean     NOT NULL DEFAULT false,
  error_message   text        NULL,
  duration_ms     int         NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- BR-40: `getConversationUsage` counts rows by `conversation_id`. Also speeds
-- audit reads scoped to a conversation. Per-message audit reads are served by
-- the FK on `message_id` (PostgreSQL creates no implicit index on FKs; if
-- per-message reads become hot, add `idx_chat_tool_call_message_id` in a
-- follow-up migration).
CREATE INDEX idx_chat_tool_call_conversation
  ON chat_tool_call (conversation_id);

COMMIT;

-- =============================================================================
-- End of 0004_chat_persistence.sql
-- =============================================================================
