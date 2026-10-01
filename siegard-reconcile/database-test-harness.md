---
contract_version: siegard-reconcile/8
title: Review of the migrations test harness
summary: The deliveries of task/migration-test-harness/suite-substrate and task/migration-test-harness/tests-assume-applied-schema
  under initiative database-test-harness wrote the migrations suite substrate and rewrote the three 0007
  scripts to rely on the applied schema; this conformance pass reads each file against the nodes the trace
  binds to it and the nodes the tasks implement.
target: database
files:
- path: package-lock.json
  change: Pins the dependency tree npm ci installs, resolving neonctl 2.47.0 and pg 8.23.1. It was generated
    by npm (npm install --package-lock-only in migrations/) on the owner's authorization, outside the
    registry's commands and disclosed by the caller. I did not write it.
- path: package.json
  change: Declares the migrations target as a private ES-module package whose dependencies are pg and
    neonctl, so the install step has a manifest.
- path: tests/applied.txt
  change: Holds the marker 0007, the last migration production holds, which the runner reads to decide
    which root migrations to apply.
- path: tests/compliance_deletion_affected_absent.sql
  change: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture insert. It no longer loads 0007, so
    it checks that an omitted or null affected is refused against the applied schema and still ends in
    ROLLBACK.
- path: tests/compliance_deletion_affected_counts.sql
  change: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture raw_information insert. It no longer
    loads migration 0007, so it asserts the four-counts shape against the schema as already applied and
    still ends in ROLLBACK.
- path: tests/compliance_deletion_affected_non_negative.sql
  change: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture insert. It no longer loads 0007, so
    it checks the zero-count control and the refusal of -1 for each count against the applied schema and
    still ends in ROLLBACK.
- path: tests/run.mjs
  change: 'Suite runner. It reads the marker and the root-level NNNN_*.sql migrations above it, then creates
    the branch test-run-<timestamp>-<hex> in project spring-wind-69847430 with parent production through
    node_modules/.bin/neonctl. It gets that branch''s connection string for neondb/neondb_owner and refuses
    to connect unless the string''s endpoint is one the create call reported for the new branch. It applies
    the migrations above the marker in ascending order, then runs every tests/*.sql script on its own
    pg connection. The pg runner is its own psql-subset interpreter: it splits statements outside quotes,
    comments, dollar quoting and parentheses, honours \set ON_ERROR_STOP and \ir (relative to the including
    file), and rejects any other meta-command or \set variable. It deletes the branch by id in a finally
    block and on SIGINT/SIGTERM, and exits non-zero on any failed script, failed migration or failed setup.'
nodes:
- node: domain/knowledge-base/affected-counts
  conforms: false
  how: 'the fact left part of its ground: still held in tests/compliance_deletion_affected_counts.sql,
    and tests/compliance_deletion_affected_non_negative.sql read `nowhere` — The file does not declare
    the shape. It builds a fixture, `zeros constant jsonb := ''{"chunks":0,"fragments":0,"links":0,"attributes":0}''`,
    and loops over `ARRAY[''chunks'', ''fragments'', ''links'', ''attributes'']`. It passes values along
    to the table and asserts only the refusal of negatives, which the node does not state. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: false
  how: 'the fact left part of its ground: still held in tests/compliance_deletion_affected_absent.sql,
    and tests/compliance_deletion_affected_counts.sql read `nowhere` — The file declares no shape for
    compliance_deletion. It only inserts a row, `INSERT INTO compliance_deletion (raw_information_id,
    reason, affected) SELECT id, ''test'', v FROM raw_information WHERE content_hash = repeat(''a'', 64);`,
    to exercise the `affected` attribute. The attributes executed_at and reason and the reference to raw-information
    are not declared or asserted here.; tests/compliance_deletion_affected_non_negative.sql read `nowhere`
    — The file only inserts into the table: `INSERT INTO compliance_deletion (raw_information_id, reason,
    affected) SELECT id, ''test'', v FROM raw_information WHERE content_hash = repeat(''a'', 64);`. It
    declares none of the aggregate''s shape and asserts nothing about executed_at or reason. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - tests/compliance_deletion_affected_absent.sql
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
unstated:
- file: tests/compliance_deletion_affected_non_negative.sql
  where: the DO block, lines 28-32 (the FOREACH loop over the four count keys) and the failure message
    on line 30
  evidence: "IF NOT pg_temp.is_refused(jsonb_set(zeros, ARRAY[k], '-1'::jsonb)) THEN\n      RAISE EXCEPTION\
    \ 'criterion 6: an affected value with a negative % count was accepted', k;"
  cost: 'The test makes "a negative count is refused" a requirement of the schema. The nodes only say
    each count is an integer ("type: integer", "required: true"), and "How many ... marked deleted". Nothing
    in them, and no other node I found, says a count below zero is refused. The refusal therefore exists
    only in this test, and in whatever schema constraint the test forces. A later reader checking what
    a compliance deletion''s affected value may hold will read the specification, find only "integer",
    and miss the rule.'
unbound:
- package-lock.json
- package.json
- tests/applied.txt
- tests/run.mjs
notes: 'Judged by 7 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/database-test-harness.returns/.

  Certification of domain/knowledge-base/affected-counts did not hold: the auditor answered `partial`
  — The shape is exercised, and the proof would fail if any part of it stopped holding. The value has
  four counts: chunks, fragments, links and attributes. The proof inserts a compliance_deletion whose
  affected value carries all four. Each count is required: dropping any one of them must be refused. Each
  count is an integer: replacing any one with "5", 1.5, null, true, {} or [] must also be refused. What
  goes unexercised is what the counts mean. The node says each count is how many rows of that kind one
  compliance deletion marked deleted. Nothing in the proof runs a compliance deletion and compares affected
  against the chunks, fragments, links and attributes it actually marked deleted. The proof''s accepted
  value {chunks:3, fragments:2, links:1, attributes:0} is stored against a fixture raw_information that
  has no chunks, fragments, links or attributes. So the proof also asserts that the store accepts a reach
  no deletion could have produced. The node does not establish that. This test would break the day the
  store, or the operation that writes the row, ties the counts to what was actually deleted. The test''s
  failure message also calls the counts "non-negative integers". The node does not state non-negativity,
  and no assertion in the proof submits a negative count.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: One
  input: a compliance deletion over a raw_information that has a known number of chunks, fragments, links
  and attributes. One expected result: the recorded affected value equals those four numbers. That means
  chunks equals the raw chunks it marked deleted, fragments the information fragments, links the knowledge
  links, and attributes the node attributes..

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) domain/knowledge-base/compliance-deletion, domain/knowledge-base/affected-counts were
  read on every file and answered for, and bound from nowhere here — a binding this record writes is one
  the trace already held.

  Candidates: 1 opened across 1 of 7 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/database-test-harness.returns/`, which are the evidence behind every entry above.
