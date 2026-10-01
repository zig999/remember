ALTER TABLE compliance_deletion ALTER COLUMN affected DROP DEFAULT;

ALTER TABLE compliance_deletion
  ADD CONSTRAINT compliance_deletion_affected_ck CHECK (
    COALESCE((affected -> 'chunks')::text     ~ '^[0-9]+$', false)
    AND COALESCE((affected -> 'fragments')::text  ~ '^[0-9]+$', false)
    AND COALESCE((affected -> 'links')::text      ~ '^[0-9]+$', false)
    AND COALESCE((affected -> 'attributes')::text ~ '^[0-9]+$', false)
  ) NOT VALID;
