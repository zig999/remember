-- ============================================================================
-- 0003_compliance_status.sql — adds the tombstone columns on raw_information
-- required by the compliance-audit domain (TC-08, BR-04/BR-05).
--
-- Without these columns, UC-01 of compliance-audit cannot ship: BR-05 mandates
-- that a successful compliance_delete sets raw_information.status = 'deleted'
-- and raw_information.superseded_at = now() in the same SQL update that
-- redacts content.
--
-- The columns are added in a single forward-only migration:
--   1. status node_status NOT NULL DEFAULT 'active'
--      - Re-uses the existing enum created in 0001 (line 104-105). Every row
--        present at the time of the migration is BY DEFINITION still active
--        (the system has no other way to land a raw_information row).
--   2. superseded_at timestamptz (nullable; populated only on tombstone).
--
-- DDL rationale:
--  - DEFAULT 'active' backfills every existing row in one DDL statement —
--    the table is rewritten if it is non-empty (acceptable at our scale; see
--    `compliance-audit.back.md §7`).
--  - No new index: status is filtered AT MOST once per tombstone (UC-01) and
--    the FOR UPDATE on raw_information.id is the access path. The query-
--    retrieval domain will short-circuit via the same column.
--  - No CHECK constraint: the application is the gatekeeper (BR-12) and the
--    enum already restricts the column to four legal values.
--
-- SAFETY: irreversible. The columns can technically be dropped, but doing so
-- would lose every compliance_delete tombstone in production. There is no
-- DOWN migration.
-- ============================================================================

BEGIN;

ALTER TABLE raw_information
  ADD COLUMN status node_status NOT NULL DEFAULT 'active',
  ADD COLUMN superseded_at timestamptz;

COMMIT;
