\set ON_ERROR_STOP on

BEGIN;

\ir ../0007_compliance_deletion_affected_shape.sql

INSERT INTO raw_information (source_type, content, content_hash)
VALUES ((enum_range(NULL::source_type))[1], 'fixture', repeat('a', 64));

CREATE FUNCTION pg_temp.is_refused(v jsonb) RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO compliance_deletion (raw_information_id, reason, affected)
  SELECT id, 'test', v FROM raw_information WHERE content_hash = repeat('a', 64);
  RETURN false;
EXCEPTION WHEN check_violation OR not_null_violation THEN
  RETURN true;
END
$$;

DO $$
DECLARE
  zeros constant jsonb := '{"chunks":0,"fragments":0,"links":0,"attributes":0}';
  k text;
BEGIN
  IF pg_temp.is_refused(zeros) THEN
    RAISE EXCEPTION 'control: four zero counts were refused, so a refusal of -1 would prove nothing';
  END IF;

  FOREACH k IN ARRAY ARRAY['chunks', 'fragments', 'links', 'attributes'] LOOP
    IF NOT pg_temp.is_refused(jsonb_set(zeros, ARRAY[k], '-1'::jsonb)) THEN
      RAISE EXCEPTION 'rules/knowledge-base/compliance-deletion-counts-what-it-marked: a negative % count was accepted', k;
    END IF;
  END LOOP;
END
$$;

ROLLBACK;
