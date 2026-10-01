---
contract_version: siegard-reconcile/8
title: Second review of the compliance_deletion.affected shape delivery
summary: The re-delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected
  under initiative fix-compliance-deletion-affected bound rules/knowledge-base/affected-counts-non-negative
  to migration 0007 without a source change; this conformance pass reads 0007 and the three proof scripts
  against the nodes the trace binds to them and the nodes the task implements.
target: database
files:
- path: 0007_compliance_deletion_affected_shape.sql
  change: Drops the '{}' default on compliance_deletion.affected and adds CHECK compliance_deletion_affected_ck,
    NOT VALID, requiring chunks, fragments, links and attributes each as a non-negative JSON integer;
    already applied to production, not edited by this delivery.
- path: tests/compliance_deletion_affected_absent.sql
  change: written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected
- path: tests/compliance_deletion_affected_counts.sql
  change: written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected
- path: tests/compliance_deletion_affected_non_negative.sql
  change: written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected
nodes:
- node: domain/knowledge-base/affected-counts
  conforms: false
  how: 'the fact left part of its ground: still held in 0007_compliance_deletion_affected_shape.sql, tests/compliance_deletion_affected_counts.sql,
    and tests/compliance_deletion_affected_non_negative.sql read `nowhere` — The file declares no shape
    for the affected counts. It passes them as a fixture value: `zeros constant jsonb := ''{"chunks":0,"fragments":0,"links":0,"attributes":0}''`
    and `INSERT INTO compliance_deletion (raw_information_id, reason, affected)`. The four key names match
    the node''s attributes, but a value handed to an insert does not declare their shape. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - 0007_compliance_deletion_affected_shape.sql
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: false
  how: 'the fact left part of its ground: still held in tests/compliance_deletion_affected_absent.sql,
    tests/compliance_deletion_affected_counts.sql, and 0007_compliance_deletion_affected_shape.sql read
    `nowhere` — The file declares no shape for compliance_deletion. It only alters the existing table,
    with "ALTER TABLE compliance_deletion ALTER COLUMN affected DROP DEFAULT;" and then adds a constraint
    on the affected column. The attributes executed_at and reason and the reference to raw-information
    are not declared here.; tests/compliance_deletion_affected_non_negative.sql read `nowhere` — The file
    declares no table or type for the aggregate. It only inserts into it: `INSERT INTO compliance_deletion
    (raw_information_id, reason, affected) SELECT id, ''test'', v FROM raw_information WHERE content_hash
    = repeat(''a'', 64);` — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - 0007_compliance_deletion_affected_shape.sql
  - tests/compliance_deletion_affected_absent.sql
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
- node: rules/knowledge-base/affected-counts-non-negative
  conforms: true
  how: '0007_compliance_deletion_affected_shape.sql: held at the CHECK constraint compliance_deletion_affected_ck
    (lines 3-9). The pattern ''^[0-9]+$'' admits only digit strings, so each count is zero or more. —
    ADD CONSTRAINT compliance_deletion_affected_ck CHECK ( COALESCE((affected -> ''chunks'')::text ~ ''^[0-9]+$'',
    false) AND ... ) NOT VALID;'
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  decided_by: test
  step: suite
  proof:
  - tests/compliance_deletion_affected_non_negative.sql
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/fix-compliance-deletion-affected-2.returns/.

  Certification of domain/knowledge-base/affected-counts did not hold: the auditor answered `partial`
  — The proof covers the shape of the value. It inserts a compliance deletion whose affected value carries
  chunks, fragments, links and attributes as integers, and that value is accepted. It then refuses the
  value with each of the four removed. It also refuses each of the four when set to a string, a fractional
  number, null, a boolean, an object or an array. The check is a real one: if the constraint were dropped,
  the missing-key insert would succeed and the block would raise. So "required" and "integer" are exercised
  for all four attributes. What goes unexercised is what the node says the four numbers are: how many
  raw chunks, information fragments, knowledge links and node attributes one compliance deletion marked
  deleted. No test in the set performs a compliance deletion and compares the recorded counts with the
  rows it marked deleted. The fixture records {"chunks":3,"fragments":2,"links":1,"attributes":0} against
  a raw information that has no chunks, fragments, links or attributes at all, and that is accepted. So
  a deletion that recorded any four integers would pass, even ones that do not match what it marked..
  The node is decided by reading, and a certification standing on it from an earlier reconciliation is
  released by the bind. The remainder is testable: One input against one expected result: run a compliance
  deletion over a raw information with a known number of raw chunks, information fragments, knowledge
  links and node attributes. Include some already superseded, which the deletion leaves alone. Then assert
  that the deletion''s recorded chunks, fragments, links and attributes equal the numbers of each that
  the deletion marked deleted..

  Certified rules/knowledge-base/affected-counts-non-negative as decided by step `suite`: tests/compliance_deletion_affected_non_negative.sql
  would fail if the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) domain/knowledge-base/compliance-deletion, domain/knowledge-base/affected-counts, rules/knowledge-base/affected-counts-non-negative,
  rules/knowledge-base/compliance-deletion-counts-what-it-marked were read on every file and answered
  for, and bound from nowhere here — a binding this record writes is one the trace already held.

  Candidates: 0 opened across 0 of 4 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/fix-compliance-deletion-affected-2.returns/`, which are the evidence behind every entry above.
