-- 0002_original_input.sql — additive, reversible, no backfill.
--
-- TC-01 / BR-34: capture the verbatim user turn (chat-directed ingestion) on
-- the source row. The `content` column keeps holding the synthesised payload
-- (so `content_hash` and idempotency are untouched); `original_input` carries
-- the literal user turn for traceability (§13) and for §11 redaction.
--
-- Frozen decisions (owner-approved 2026-06-27):
--   - Nullable; NO default.
--   - NO tsvector / NO GIN — original_input is not searchable in v1.
--   - NO CHECK constraint.
--   - NOT included in content_hash (sha256Hex(content) stays as-is).
--   - Covered by `compliance_delete` (§11) — redaction handled by a separate
--     change (out of scope for this migration).

ALTER TABLE raw_information ADD COLUMN original_input text;
COMMENT ON COLUMN raw_information.original_input IS
  'Verbatim do turno de usuario que disparou uma ingestao dirigida (chat). Null fora do chat. Coberto por compliance_delete.';
