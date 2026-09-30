\set ON_ERROR_STOP on

BEGIN;

\ir ../0007_compliance_deletion_affected_shape.sql

INSERT INTO raw_information (source_type, content, content_hash)
VALUES ((enum_range(NULL::source_type))[1], 'fixture', repeat('a', 64));

DO $$
DECLARE
  refused boolean;
BEGIN
  refused := false;
  BEGIN
    INSERT INTO compliance_deletion (raw_information_id, reason)
    SELECT id, 'test' FROM raw_information WHERE content_hash = repeat('a', 64);
  EXCEPTION WHEN check_violation OR not_null_violation THEN
    refused := true;
  END;
  IF NOT refused THEN
    RAISE EXCEPTION 'criterion 6: a compliance deletion with the affected column omitted was accepted';
  END IF;

  refused := false;
  BEGIN
    INSERT INTO compliance_deletion (raw_information_id, reason, affected)
    SELECT id, 'test', NULL FROM raw_information WHERE content_hash = repeat('a', 64);
  EXCEPTION WHEN check_violation OR not_null_violation THEN
    refused := true;
  END;
  IF NOT refused THEN
    RAISE EXCEPTION 'criterion 6: a compliance deletion with an explicit null affected was accepted';
  END IF;
END
$$;

ROLLBACK;
