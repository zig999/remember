---
target: backend
implementation: sha256:29ed1a0546617a623218aca0a2eedce71dc1a89e8f07f7ed7fb86d8d603394a9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/alias-admission-admit-aliases-from-source-suite
title: Proof for alias admission against the source in the node-proposal service
summary: Service-level tests, over an in-memory stand-in for the store, that a node proposal records only aliases the source holds (directed runs exempt), names each refused alias with ALIAS_NOT_IN_SOURCE, adds only aliases to a matched node, and lets an admitted alias resolve a later proposal. No test runs the admission SQL against PostgreSQL.
tests:
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — acronym written in the source > creates the node with its canonical name and also holds the alias CNPq
  proves: 'Criteria 1 and 2, and the scenario: a proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node holding the canonical alias of that name and also the alias "CNPq".'
  fails_when: The created node lacks either the canonical alias or the alias "CNPq". That happens if the service does not attach the alias the store reports as admitted, if it asks the store about the wrong run or alias list, or if it attaches the alias with the wrong kind.
  demonstrates: scenarios/knowledge-base/acronym-in-source-is-admitted
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — alias absent from the source > takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  proves: 'Criteria 3, 4 and 10, and the scenario: "Petrobras" proposed against a source that says only "a estatal" is not recorded, the proposal still answers its node identity and resolution, and the answer names "Petrobras" with ALIAS_NOT_IN_SOURCE. The answer is read as serialized text, so the test does not pin the name of the result field.'
  fails_when: The alias is recorded on the node, or the proposal is refused or not resolved, or the node identity or resolution is missing from the answer, or the answer does not carry both the alias and the reason ALIAS_NOT_IN_SOURCE. Each of the four assertions carries a message naming the obligation it guards.
  demonstrates: scenarios/knowledge-base/alias-absent-from-source-not-admitted
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: 'alias admission — alias the source holds in another spelling or position > records the alias on the node when the source holds it with $label (5 rows: different case, different accents, different inner whitespace, surrounding whitespace on the alias, a paragraph other than the first)'
  proves: 'UNDERDETERMINED entries 1 and 3, and criteria 5 and 6 in their recorded half: an alias that differs from the source only in case, accents, inner whitespace or surrounding whitespace, or that occurs only in a paragraph other than the first, is recorded on the node. Recording is checked by normalized form, so the test does not pin whether the stored spelling is trimmed.'
  fails_when: An alias the source holds in one of these forms or positions is dropped, so the node does not hold it. This is the implementation the first UNDERDETERMINED entry names. It would also fail if the service scoped the check to a single chunk or fragment of the source.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — alias the source holds in another spelling or position, as answered > does not name the alias as not admitted when the source holds it with $label (same 5 rows)
  proves: 'Criteria 5 and 6: an alias that differs from the source only in case, accents or inner whitespace, or that occurs in another part of the source, is not refused as ALIAS_NOT_IN_SOURCE. The surrounding-whitespace row covers the trimming that rules/knowledge-base/name-normalization requires.'
  fails_when: The answer carries ALIAS_NOT_IN_SOURCE for an alias the source holds in one of these forms or positions.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — directed ingestion > records an alias that the source never writes on the node
  proves: 'UNDERDETERMINED entry 2 and the scenario: in a run opened with model "directed" and prompt version "directed-v1", an alias that no source text holds ("Petrobras") is recorded on the node.'
  fails_when: A directed run's alias is not recorded. That is an implementation that ignores aliases stated in a directed ingestion, which the second UNDERDETERMINED entry names. It also fails if the service stops asking the store to exempt the directed model and prompt version pair.
  demonstrates: scenarios/knowledge-base/directed-alias-admitted-without-source
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — directed ingestion > does not name an alias that the source never writes as not admitted
  proves: 'Criterion 7: within a directed ingestion, an alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.'
  fails_when: The answer to a directed proposal carries ALIAS_NOT_IN_SOURCE for an alias the source never writes. This is the implementation that records the alias but also lists it as refused.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — proposal resolved to an existing node > adds the admitted alias to the matched node
  proves: 'Criterion 8: a proposal that resolves to an existing node, here by exact normalized name match, adds each admitted alias ("CNPq") to that node.'
  fails_when: The admitted alias is not added to the matched node, for example because attaching aliases is skipped on the matched-existing path.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — proposal resolved to an existing node, name > does not add the proposed name to the matched node
  proves: 'Criterion 9: a proposal resolved to an existing node does not add its proposed name to that node. The proposed name differs from the held canonical alias only in case and accents.'
  fails_when: A second alias row whose normalized form equals the name is added to the matched node, so the proposed name is attached as an alias.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — proposal resolved to an existing node, alias absent from the source > does not add to the matched node an alias the source never writes
  proves: 'Criterion 3 on the matched-existing resolution: an alias not occurring in the source is not recorded on the existing node.'
  fails_when: A refused alias reaches the existing node. This is the matched-existing path attaching the proposed aliases without filtering by admission.
- file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  name: alias admission — admitted acronym resolves a later proposal > resolves a later proposal named CNPq of the same node type to that node as matched_existing
  proves: 'Criterion 11 and the scenario: after "CNPq" is admitted on a node in one run, a proposal of the same node type named "CNPq" in a later run over another document resolves as matched_existing to that same node.'
  fails_when: The admitted alias is not persisted in a form the exact-alias step resolves, so the later proposal creates a new node or resolves to another one.
  demonstrates: scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
files:
- path: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  effect: The existing store stand-in answers the new admission query ("SELECT a.alias ...") by admitting every proposed alias. Without that branch, the pipeline-branch cases that pass aliases throw "unexpected SQL". Their intent (resolution branches and alias attachment) is unchanged, and admission is proved in the new spec.
- path: src/__tests__/integration/ingestion/propose-routes.spec.ts
  effect: The existing fake client answers the admission query by admitting every proposed alias. The propose-node happy path sends aliases, and without the branch it throws on the new query. The route behavior asserted is unchanged.
not_applicable:
- edge_case: needs_review and strong-unique trigram resolutions
  why: The obligations treat alias handling differently only between a created node and a matched node. needs_review follows the creation rule and strong-unique follows the matched rule, so the created_new and exact-match representatives stand for them.
- edge_case: absent or empty aliases list
  why: No criterion or node states behavior for it beyond what the existing pipeline tests already assert (no aliases, no alias rows). Whether the service issues an extra query is arrangement.
- edge_case: an alias already held by the node, or the same alias listed twice
  why: No criterion or node states behavior for duplicates. Alias inserts ignore conflicts by existing design, which this task does not change.
- edge_case: concurrent proposals of the same name
  why: The name lock is preserved unchanged and no criterion of this task reaches it.
- edge_case: a run whose status forbids proposals, an over-long name or alias, an unknown node type
  why: These refusals belong to the propose-node refusals of rules/knowledge-base/proposal-requires-running-run, node-name-length and node-type-in-catalog, not to this task's criteria.
- edge_case: a run that matches only one of model "directed" and prompt version "directed-v1"
  why: No criterion or node states the boundary of the directed exemption beyond the pair the task Notes give.
untested:
- The admission predicate itself (norm(alias) occurring in norm(raw content), and the exemption for directed runs) lives in SQL, and this repository has no real-PostgreSQL harness. Every new test runs the service against an in-memory store stand-in that re-implements that predicate and the database norm(). The tests therefore prove what the service asks of the store and what it does with the answer. They do not prove the SQL, nor that the database norm() agrees with the stand-in. This is disclosed as a TST-03 divergence.
- 'UNDERDETERMINED entry 3 (an implementation that does not trim the proposed alias): the surrounding-whitespace rows exclude it only as far as the stand-in''s norm() trims. An implementation whose database norm() or comparison fails to trim would still pass here. Deciding this needs a test against a real database.'
- 'rules/knowledge-base/alias-admitted-only-from-source: an invariant over every alias, source and run. No finite test decides it whole, and the scenario and criterion tests sample it. The SQL predicate is not exercised (see the first item).'
- 'rules/knowledge-base/new-node-aliases: an invariant over every admitted alias of every new node. No finite test decides it whole. The acronym scenario test samples it.'
- 'rules/knowledge-base/matched-node-gains-only-aliases: an invariant over every admitted alias of every matched node. No finite test decides it whole. The three matched-node tests sample it.'
- 'rules/knowledge-base/name-normalization: it also governs entity resolution, the node listing and the node layer''s approximate match, which are other tasks. Its alias-admission clause is exercised only through the stand-in''s own normalization. The database norm() is never run, and the TypeScript twin in knowledge-graph/service/norm.ts is not used.'
- 'rules/knowledge-base/exact-alias-resolves: over every alias, node type and node status. The task criteria cover only the same-node-type case, and no criterion covers the "active" clause, which the task Notes record as another task''s remainder. No finite test of this task decides it.'
- 'contracts/knowledge-base/ingestion: it spans fourteen operations and their refusals. No finite test of this task decides it, and this task touches only the service result of propose-node. The wire answers belong to the sibling task.'
- 'Inference "aliases_not_admitted" as the result field name: the tests read the result as serialized text and pin neither the field name nor its shape. The implementation chose the name, the contract states none, and a node should settle it.'
- 'Inference: occurrence is a plain substring test of the normalized alias in the normalized content, with no word boundaries and no chunk scoping. The tests do not pin the absence of word boundaries (for example an alias inside a longer word). No node decides it.'
- 'Inference: an alias whose normalized form is empty is never admitted and is listed as not admitted. No node or criterion decides it, so it is not tested.'
- 'Inference: when the run or its raw information cannot be read, every alias is reported as not admitted (fail closed). No node decides it, so it is not tested.'
- 'An alias that equals the proposed name after normalization, listed on a matched node: the implementation excludes it from the aliases added. The node states "each admitted alias" and "never its proposed name" and does not say which prevails for an alias equal to the name. It is not pinned.'
- 'Inference: the directed model and prompt-version constants moved to directed-run.ts and are re-exported, and the trigram candidate limit became a bound parameter. Both are arrangement, so no test is written over them.'
contested: []
divergences:
- cites: TST-03
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  departure: The store stand-in computes alias admission itself, with a re-implemented database norm(), a substring test and the directed-run check. In this repository that decision is made by the store, but it is business logic, which the rule says a stand-in must not replace.
  why: The decision is made inside one SQL statement, and the repository has no real-database harness (the unit and integration suites all use stub clients). Without the stand-in the admission criteria could not be exercised at all. The consequence is stated under untested.
- cites: TYP-02
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  departure: The stand-in client is built with a double assertion (`as unknown as PoolClient`) and no guard narrows it.
  why: A stand-in for a pooled connection cannot be narrowed to PoolClient. The existing specs in this directory use the same form.
- cites: TST-04
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  departure: The file sits beside the existing entity-resolution.spec.ts under src/__tests__/unit/ingestion/ with a suffixed name, instead of being added to the file that mirrors entity-resolution.service.ts.
  why: The admission tests need their own store stand-in, which the existing file's stub is not shaped for. Folding them in would double a file that already tests another behavior. The directory already holds several suffixed specs, such as extraction-prompt-v5.spec.ts.
---

## What it is

Service-level tests, over an in-memory stand-in for the store, that a node proposal records only aliases the source holds (directed runs exempt), names each refused alias with ALIAS_NOT_IN_SOURCE, adds only aliases to a matched node, and lets an admitted alias resolve a later proposal. No test runs the admission SQL against PostgreSQL.

## Notes

No test runs the admission SQL against PostgreSQL: the repository has no real-database harness, so the predicate is exercised through an in-memory stand-in and disclosed as a TST-03 divergence.
