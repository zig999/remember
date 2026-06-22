-- Migration: add chat_graph_view table for per-conversation graph snapshot persistence
-- BR-42 (chat.back.md v2.3.0)
-- Apply AFTER 0004_chat_persistence.sql.
-- Do NOT apply automatically — owner applies to Neon via one-off pg script after pipeline.

CREATE TABLE chat_graph_view (
  conversation_id uuid        PRIMARY KEY
                              REFERENCES chat_conversation(id) ON DELETE CASCADE,
  snapshot        jsonb       NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
