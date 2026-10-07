---
target: backend
implementation: sha256:d90edf2ababe4c308d12ac3a924dcc520446a84f71a39b957c89d02dbbcc6c6f
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/exact-alias-tie-break-order-exact-alias-lookup-suite
title: Proof of the exact-alias lookup order
summary: Seven tests decide the oldest-alias-then-lowest-identity order of the exact-alias lookup and the two underdetermined clauses, using a store stand-in that applies the query's own ORDER BY, LIMIT and null-time filter to rows it returns in an adversarial order.
tests:
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — homonym nodes with different creation times resolves to the node whose matching alias was created earliest even when its node identity is higher and it is stored second
  proves: Where two active nodes of the proposal's node type each hold an alias equal to the proposed name, the proposal resolves as matched-existing to the node whose matching alias has the earliest creation time.
  fails_when: The lookup picks the first stored row, orders by node identity alone, orders by creation time descending, or otherwise stops choosing the earliest-created matching alias. The earliest alias sits on the higher-identity node and is stored second, so each of those picks the other node.
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — homonym nodes with equal creation times resolves to the node with the lower node identity even when it is stored second
  proves: Where two active nodes of the proposal's node type hold matching aliases with equal creation times, the proposal resolves as matched-existing to the node with the lower node identity.
  fails_when: The lookup has no tie-break after creation time, so the first stored row wins, or it breaks ties toward the higher node identity. The lower-identity node is stored second, so either returns the other node.
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — the same homonym proposal repeated resolves to the same node on every repetition although the store returns candidate rows in a different order each time
  proves: Repeating the same homonym proposal against an unchanged graph resolves to the same node on every repetition. The store stand-in rotates the physical order of the candidate rows on each query, and the three homonyms include a tied pair.
  fails_when: Which node wins depends on the order in which the store happens to return rows, for example when the ordering is removed or leaves a tie unresolved. Across six repetitions the resolved node then differs.
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — a name equal to an alias of exactly one active node resolves the later proposal named CNPq to the node holding the canonical alias and the alias CNPq as matched_existing
  proves: A proposal whose name equals an alias of exactly one active node of its node type still resolves as matched-existing to that node. This is also the scenario's given, when and then, as stated.
  fails_when: A single matching node stops resolving as matched-existing, whether the ordering change drops it, the lookup returns nothing for a sole candidate, or the proposal falls through to creating a new node.
  demonstrates: scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — matching alias with no recorded creation time resolves to a node whose alias has a creation time rather than to a lower-identity node whose alias has none
  proves: 'The UNDERDETERMINED entry''s first clause: an alias with no recorded creation time counts as created after every alias that has one.'
  fails_when: The lookup orders by creation time ascending with the missing times first, or treats a missing time as equal to every other and falls through to node identity. The alias without a time sits on the lower-identity node, so either picks it.
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — matching alias with no recorded creation time still resolves to the node when its matching alias is the only candidate and has no creation time
  proves: 'The UNDERDETERMINED entry''s second clause: an alias with no recorded creation time still counts as a matching alias and is not excluded from the lookup.'
  fails_when: The lookup filters out aliases that have no creation time. The proposal then finds no exact match and creates a new node instead of resolving as matched_existing.
- file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  name: exact-alias lookup — every clause of the earliest-alias rule at once resolves to the earliest-created alias of an active node of the type, ties going to the lowest identity, alias with no time last, other types and inactive nodes ignored
  proves: The whole statement of the earliest-alias rule against one graph. It holds more than two homonyms, an alias with no time on the lowest identity, an earlier alias on a node of another type, an earlier alias on a merged node, a tied pair, and a later alias on a lower identity than the tied winner.
  fails_when: Any clause of the rule stops holding. Earliest alias, tie to the lowest identity, missing time last, restriction to the proposal's node type, restriction to active nodes, and handling of three or more homonyms each lead to a different resolved node.
  demonstrates: rules/knowledge-base/exact-alias-earliest-alias-wins
not_applicable:
- edge_case: Absent or empty proposal name
  why: Refused at the validation boundary before the service is reached, which this task does not touch. The lookup receives a validated name.
- edge_case: No matching alias (empty candidate set)
  why: The lookup returns no row and the proposal moves on to the trigram step exactly as before. The task changes only which row is chosen among several, and the existing resolution tests already cover the fall-through.
- edge_case: Duplicate alias on one node
  why: UNIQUE (node_id, alias_norm) on node_alias allows at most one matching alias per node, so two rows of the same node never compete. The unique constraint is the store's, not this task's.
- edge_case: A dependency that fails or answers slowly
  why: No criterion or node reaches a failure of the store in this lookup. Error handling is untouched by the task.
- edge_case: Two proposals for the same name at once
  why: The name advisory lock is acquired before the lookup and is not part of this task. The task owes only a deterministic choice against a given graph.
- edge_case: Operation against state that forbids it
  why: A non-active node is excluded by the unchanged filter. The all-clauses test places a merged homonym with the earliest time as a decoy, so that is covered there.
untested:
- 'rules/knowledge-base/exact-alias-resolves: the fact is an invariant over every name and every alias, and no finite test decides it whole. The sole-match test exercises one name and is not claimed for the node, so the node is left to a reading.'
- 'domain/knowledge-base/node-resolution: an enumeration of three values that this task neither changes nor declares. The task exercises only the matched case, so no test decides the set whole. The code spells the values with underscores and the node with hyphens, an encoding this task does not touch.'
- 'domain/knowledge-base/node-alias: an entity shape with attributes and a relationship. The task only reads created_at as a sort key, and no finite test of this task decides the shape.'
- 'domain/knowledge-base/knowledge-node: an aggregate shape with attributes and relationships. The task reads status, type and identity, and no finite test of this task decides the shape.'
- The criterion that the change adds no file under migrations/ rests on no specification node and is a delivery condition. A test over the contents of migrations/ would claim shared ground that sibling tasks may legitimately land in, so it is checked against the delivery's diff.
- The real Postgres ordering is not exercised, because the backend has no database test harness. The store stand-in applies only the query's ORDER BY items (created_at, node_id or id, ASC or DESC, NULLS FIRST or LAST), its LIMIT literal and a created_at IS NOT NULL filter. Another expression of the same order, such as COALESCE in the ORDER BY, makes the stand-in throw and fails these tests without the behavior being wrong.
- 'The two no-creation-time tests model a state the schema forbids: node_alias.created_at is NOT NULL in migrations/0001_init.sql. They prove the clause the rule states against the stand-in only. Against the real schema that clause cannot be reached, and nothing else in the proof exercises it.'
- The ADVISORY on three or more homonyms has no criterion. It is exercised only incidentally by the repetition test (three nodes) and the all-clauses test (four candidate nodes), not as an obligation of its own.
- The implementation's inferences are not tested as facts. They are the choice of na.node_id as the identity key, NULLS LAST written explicitly, and the native uuid order standing for 'lower node identity'. The stand-in compares identities as lowercase strings, which matches uuid byte order only for identically formatted ids, and no node states the identity order.
---

## What it is
Seven tests in one new unit file prove the exact-alias lookup order and the clauses the underdetermined note names.
The suite run that passed is the one this record points at.

## Notes
No earlier suite run failed before this one passed.
The test author recorded no disagreement with the implementation.
