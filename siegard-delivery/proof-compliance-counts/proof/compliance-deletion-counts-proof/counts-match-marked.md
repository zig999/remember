---
title: Proof that a compliance deletion's affected counts are the rows it marked deleted
summary: One test runs a compliance deletion over a fixture mixing target-only rows, a shared attribute
  and an already superseded chunk. It checks that affected is {chunks 1, fragments 1, links 2, attributes
  3} and that those numbers equal the rows whose status turned to deleted.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
tests:
- file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  name: Compliance deletion — affected counts are the rows it marked deleted > records chunks 1, fragments
    1, links 2 and attributes 3, equal to the rows whose status turned to deleted, leaving the shared
    attribute and the already superseded chunk out
  proves: 'Criterion 1: a compliance deletion on a target raw whose only-dependent rows are 1 chunk, 1
    fragment, 2 links and 3 attributes records affected as {chunks 1, fragments 1, links 2, attributes
    3}. The fixture adds a fourth attribute with provenance in a second active raw and a second chunk
    of the target raw that is already superseded. Criterion 2: those recorded counts equal the number
    of raw chunks, fragments, links and attributes whose status the deletion turned to deleted. The counts
    of marked rows come from a before/after diff of the store''s statuses, not from the deletion''s own
    return. The remainder''s assertion is the same input, answered with those numbers and matched to the
    marked rows.'
  fails_when: Any recorded count stops being the number of rows marked. That happens if the count of the
    shared attribute or of the already superseded chunk is included (attributes 4 or chunks 2) while those
    rows are left unmarked or marked. It also happens if a count is taken from something other than the
    rows the UPDATE marked, or if counts are swapped between keys or dropped (the four values 1, 1, 2,
    3 are distinct). It fails too if the cascade stops excluding the shared attribute or the already superseded
    chunk, so that the marked rows themselves diverge from 1, 1, 2, 3.
  demonstrates: rules/knowledge-base/compliance-deletion-counts-what-it-marked
not_applicable:
- edge_case: raw not found, or raw already deleted (idempotent no-op, legacy orphan)
  why: These are other paths of the deletion. Neither this task's criteria nor the node's fact reaches
    them, since they mark no rows and record no new counts.
- edge_case: absent or empty reason, malformed raw id
  why: Refused at the validation boundary before the service runs. No criterion or node of this task states
    it.
- edge_case: a raw with no dependent rows (all counts 0)
  why: The node's fact is the same equality. A zero-row input is the same class as the mixed fixture and
    adds no boundary the obligation changes at.
- edge_case: a fragment or link shared with another raw
  why: Cross-source survival is the subject of rules/knowledge-base/compliance-deletion-propagates, which
    the task's Notes decline to claim. The shared attribute in the fixture is the one cross-source case
    this task's criterion names.
- edge_case: concurrent deletions of one raw, database failure mid-cascade
  why: No criterion or node of this task states concurrent or failure behavior. The caller owns the transaction.
untested:
- The cascade predicates (which fragments, links and attributes rest only on the target raw) are decided
  by the fake pool's reading of the SQL text, as in the existing compliance-audit suite. The suite has
  no real database, so the SQL's own semantics are not decided here. The fake follows the "superseded_at
  IS NULL" guard on chunks and the "ri.id <> $1" guard on fragments, links and attributes only when the
  statement contains them. A rewrite of those statements that keeps the text but breaks the semantics
  is not caught.
- The task's two ADVISORY Notes (rules/knowledge-base/compliance-deletion-tombstones and rules/knowledge-base/compliance-deletion-propagates,
  outside the epic's covers) are not obligations. The fixture follows them only where criterion 1 states
  the numbers, and no test is written for either node.
divergences:
- cites: TST-03
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  departure: The fake client replaying the UPDATE statements embeds the cascade selection (which rows
    rest only on the target raw) as an in-memory predicate, so a stand-in carries part of a business rule
    instead of only the store.
  why: No database is reachable from the suite, and the sibling routes.spec.ts fakes the pool the same
    way. The counts can only be decided against a store whose UPDATEs mark rows and return them. The service
    and repository under test still compute and record the counts themselves.
target: backend
implementation: sha256:a5a571f764bb66604bde9e8bf1e2a05af579b2c5b93005a37a393fc5d5423308
run: run/compliance-deletion-counts-proof-counts-match-marked-suite
---
## What it is
One integration test that runs a compliance deletion over a fixture mixing rows that rest only on the target raw with a shared attribute and an already superseded chunk, and checks affected against the expected numbers and against the rows whose status turned to deleted.

## Notes
This proof answers the testable remainder that siegard-reconcile/certify-counts-what-it-marked.md left on rules/knowledge-base/compliance-deletion-counts-what-it-marked, and names that node under demonstrates.
The suite has no real database, so the test decides the counts against a fake pool that replays the repository's UPDATE statements; the SQL's own semantics are not decided here.
The suite passed on its first captured run.
