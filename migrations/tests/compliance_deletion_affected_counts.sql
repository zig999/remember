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
  good constant jsonb := '{"chunks":3,"fragments":2,"links":1,"attributes":0}';
  k text;
  v text;
BEGIN
  IF pg_temp.is_refused(good) THEN
    RAISE EXCEPTION 'criterion 7: an affected value with the four integer counts was refused';
  END IF;

  FOREACH k IN ARRAY ARRAY['chunks', 'fragments', 'links', 'attributes'] LOOP
    IF NOT pg_temp.is_refused(good - k) THEN
      RAISE EXCEPTION 'criteria 1-4: an affected value lacking % was accepted', k;
    END IF;

    FOREACH v IN ARRAY ARRAY['"5"', '1.5', 'null', 'true', '{}', '[]'] LOOP
      IF NOT pg_temp.is_refused(jsonb_set(good, ARRAY[k], v::jsonb)) THEN
        RAISE EXCEPTION 'criterion 5: an affected value with % = % was accepted', k, v;
      END IF;
    END LOOP;
  END LOOP;
END
$$;

ROLLBACK;
