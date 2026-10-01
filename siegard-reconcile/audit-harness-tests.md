---
contract_version: siegard-reconcile/8
title: Audit of the bindings on the three 0007 test scripts
summary: The source did not change; the claims are what is being re-read. The delivery of task/migration-test-harness/tests-assume-applied-schema
  bound compliance-deletion and affected-counts to the three scripts, and the review database-test-harness
  cleared neither; this audit re-reads whether each script still carries each node bound to it.
target: database
files:
- path: tests/compliance_deletion_affected_absent.sql
  change: Unchanged; asserts that an omitted or null affected is refused against the applied schema and
    rolls back.
- path: tests/compliance_deletion_affected_counts.sql
  change: Unchanged; asserts the four-count shape of affected against the applied schema and rolls back.
- path: tests/compliance_deletion_affected_non_negative.sql
  change: Unchanged; asserts that four zero counts are accepted and that a negative count is refused,
    and rolls back.
nodes:
- node: domain/knowledge-base/affected-counts
  conforms: true
  how: 'tests/compliance_deletion_affected_counts.sql: held at The DO block, lines 19-41. It builds a
    good `affected` value with exactly the four counts, `chunks`, `fragments`, `links` and `attributes`,
    and asserts that dropping any one is refused and that a non-integer value for any one is refused.
    — good constant jsonb := ''{"chunks":3,"fragments":2,"links":1,"attributes":0}''; FOREACH k IN ARRAY
    ARRAY[''chunks'', ''fragments'', ''links'', ''attributes''] LOOP IF NOT pg_temp.is_refused(good -
    k) THEN FOREACH v IN ARRAY ARRAY[''"5"'', ''1.5'', ''null'', ''true'', ''{}'', ''[]''] LOOP

    tests/compliance_deletion_affected_non_negative.sql: held at the DO block (lines 19-34): the `zeros`
    literal and the FOREACH loop over the four count keys, which exercises the four counts as the shape
    `affected` takes. — zeros constant jsonb := ''{"chunks":0,"fragments":0,"links":0,"attributes":0}'';
    FOREACH k IN ARRAY ARRAY[''chunks'', ''fragments'', ''links'', ''attributes''] LOOP IF NOT pg_temp.is_refused(jsonb_set(zeros,
    ARRAY[k], ''-1''::jsonb)) THEN The file declares no shape. It checks that the four-count value is
    accepted at zero and refused at -1 for each key. The specification holds the non-negativity in rules/knowledge-base/affected-counts-non-negative,
    which constrains this node. The test asserts that rule and does not restate it as its own authority.'
  encoded_at:
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "tests/compliance_deletion_affected_absent.sql: held at The DO block, lines 8-34. It makes two\
    \ inserts into compliance_deletion, one omitting `affected` and one passing an explicit NULL. It raises\
    \ unless each is refused with check_violation or not_null_violation. This is the node's `affected`\
    \ attribute (type affected-counts, required: true) asserted as required. — INSERT INTO compliance_deletion\
    \ (raw_information_id, reason)\n    SELECT id, 'test' FROM raw_information WHERE content_hash = repeat('a',\
    \ 64);\n  EXCEPTION WHEN check_violation OR not_null_violation THEN\n    refused := true;\n...\nINSERT\
    \ INTO compliance_deletion (raw_information_id, reason, affected)\n    SELECT id, 'test', NULL FROM\
    \ raw_information WHERE content_hash = repeat('a', 64);\n...\nRAISE EXCEPTION 'criterion 7: a compliance\
    \ deletion with an explicit null affected was accepted';\ntests/compliance_deletion_affected_counts.sql:\
    \ held at Lines 8-17, the `pg_temp.is_refused` function. It inserts into `compliance_deletion` the\
    \ `raw_information_id` reference, a `reason` and the `affected` value, and treats a check or not-null\
    \ violation as a refusal. — INSERT INTO compliance_deletion (raw_information_id, reason, affected)\n\
    \  SELECT id, 'test', v FROM raw_information WHERE content_hash = repeat('a', 64);\nEXCEPTION WHEN\
    \ check_violation OR not_null_violation THEN\n  RETURN true;\ntests/compliance_deletion_affected_non_negative.sql:\
    \ held at the insert inside pg_temp.is_refused (lines 11-12), which writes a compliance_deletion row\
    \ with raw_information_id, reason and affected, the three attributes the node lists. — INSERT INTO\
    \ compliance_deletion (raw_information_id, reason, affected) SELECT id, 'test', v FROM raw_information\
    \ WHERE content_hash = repeat('a', 64); The file only exercises the aggregate's refusal of a negative\
    \ count in `affected`. It declares nothing, and the rule that constrains this node and holds the fact\
    \ is rules/knowledge-base/affected-counts-non-negative."
  encoded_at:
  - tests/compliance_deletion_affected_absent.sql
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/audit-harness-tests.returns/.

  Staged as an audit: the source did not drift — every pair the trace held for these files was re-judged
  deliberately, standing claims included.

  Candidates: 0 opened across 0 of 3 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/audit-harness-tests.returns/`, which are the evidence behind every entry above.
