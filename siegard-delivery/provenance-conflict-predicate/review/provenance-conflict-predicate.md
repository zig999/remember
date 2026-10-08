---
target: backend
title: 'Provenance upserts repeat their partial-index predicate: review'
summary: What the coverage, conformance and standard passes found over the curation repository and the test written by the
  corrective increment provenance-conflict-predicate.
reviewed:
- src/modules/curation/repository/curation.repository.ts
- src/__tests__/unit/curation/curation-repository-provenance.spec.ts
tasks:
- task/provenance-conflict-predicate/record-provenance-once-per-fragment
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/provenance-conflict-predicate passed; there was no failure to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: An entity edit that records a new attribute records the fragment of the edit's operator note as the provenance
    of that attribute.
  state: uncovered
  tests:
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > appendProvenanceFragment
      > names the arbiter columns and the predicate of the partial unique index of a attribute, and skips the conflicting
      row
  why: In the set under review, the only test that reaches appendProvenanceFragment calls it with a fixed fragment id against
    a stand-in client that returns no rows. It then asserts only the ON CONFLICT clause of the SQL text. No entity edit runs
    and no operator note exists. Nothing checks which fragment, or which attribute, ends up in the provenance statement. The
    statement could bind a fragment other than the operator note's, or swap the attribute and fragment parameters, and this
    test would still pass. Outside the set, src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts ("the provenance
    of the attribute an entity edit records for a first value or an addition > is exactly one, pointing at the edit's information
    fragment") would fail if the recorded fragment were not the edit's. It runs against a stand-in that ignores the conflict
    clause. The set under review contributes nothing to this criterion.
- criterion: Recording a fragment as the provenance of an attribute that already holds it as provenance leaves one provenance
    entry for that attribute and that fragment.
  state: uncovered
  tests:
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > copyProvenance
      > names the arbiter columns and the predicate of the partial unique index of a attribute, and skips the conflicting
      row
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > appendProvenanceFragment
      > names the arbiter columns and the predicate of the partial unique index of a attribute, and skips the conflicting
      row
  why: 'Both tests assert the text of the ON CONFLICT clause: the columns (attribute_id, fragment_id), the predicate "attribute_id
    is not null", and DO NOTHING. Neither one records a fragment against an attribute that already holds it. The stand-in
    has no stored provenance, so the count of entries for that attribute and fragment is never observed. What keeps that count
    at one is the partial unique index provenance_attr_fragment_uq, and no test in the set looks at it. Dropping or changing
    the index would make the criterion stop holding while both tests pass. Going the other way, removing the ON CONFLICT clause
    fails both tests even though the criterion still holds: the index would raise and the operation would roll back, leaving
    one entry. That refusal path is UNDERDETERMINED entry 1 in the task. So these tests are tied to how the statement is written,
    not to the one-entry outcome. Over-assertion: by pinning DO NOTHING, the tests settle that a repeated fragment is skipped
    rather than refused. No criterion states that. It is the objective''s "without refusing", and the proof record itself
    notes that no node holds it. The tests also use toEqual on a one-element array, which asserts that each function sends
    exactly one statement, and no criterion asks for that.'
- criterion: Recording a fragment as the provenance of a link that already holds it as provenance leaves one provenance entry
    for that link and that fragment.
  state: uncovered
  tests:
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > copyProvenance
      > names the arbiter columns and the predicate of the partial unique index of a link, and skips the conflicting row
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > appendProvenanceFragment
      > names the arbiter columns and the predicate of the partial unique index of a link, and skips the conflicting row
  why: 'This is the same finding as the attribute criterion, for links. The tests assert the ON CONFLICT text, (fragment_id,
    link_id) WHERE "link_id is not null" DO NOTHING. They never record a fragment against a link that already holds it and
    never observe how many entries remain for that link and fragment. The one-entry outcome depends on provenance_link_fragment_uq,
    which the set does not touch. If that index were changed, the criterion would break and the tests would still pass. If
    the conflict clause were dropped, the tests would fail while the criterion still holds by refusal. The same over-assertion
    applies: DO NOTHING, which is skip rather than refuse and is stated by no criterion, and exactly one statement per call.'
- criterion: A corrected attribute takes the provenance entries of the attribute it supersedes.
  state: uncovered
  tests:
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > copyProvenance
      > names the arbiter columns and the predicate of the partial unique index of a attribute, and skips the conflicting
      row
  why: 'In the set under review, the only test that reaches copyProvenance for an attribute checks its ON CONFLICT clause
    and nothing else. The stand-in holds no superseded attribute and no provenance, and the copy''s SELECT, its WHERE attribute_id
    = $1, and the order of the predecessor and successor parameters are never examined. The statement could copy from the
    wrong attribute, copy nothing, or swap predecessor and successor, and the test would still pass. Outside the set, src/__tests__/unit/curation/entity-edit-correction.spec.ts
    ("the provenance of the new attribute an entity edit records > holds the edit''s information fragment, and for a correction
    every provenance of the superseded attribute and no other") and the UC-10 case of src/__tests__/integration/curation/routes.spec.ts
    ("BR-18: predecessor.valid_to unchanged after correction", which asserts the two predecessor fragments on the new row)
    would fail if the carry-over stopped. The set under review contributes nothing to this criterion.'
- criterion: A corrected link takes the provenance entries of the link it supersedes.
  state: uncovered
  tests:
  - file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
    name: the provenance statement a repository function sends for an item that may already hold the fragment > copyProvenance
      > names the arbiter columns and the predicate of the partial unique index of a link, and skips the conflicting row
  why: Within the set, nothing corrects a link. The copyProvenance link case asserts only the conflict clause. It does not
    check that the statement selects the superseded link's entries or binds them to the new link, so a copy from the wrong
    link, or a swapped parameter, passes. The proof record names entity-edit-correction.spec.ts, entity-edit-new-attribute.spec.ts
    and the UC-10 case of routes.spec.ts as existing coverage of this criterion, but those cases correct attributes. In routes.spec.ts,
    the only item_kind "link" requests read here go to /items/reject, not /items/correct. So no test in the set or in the
    named context was found that would fail if a corrected link stopped taking the superseded link's provenance.
unpaired: []
findings:
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: the inline literal unions typing valid_from_source in ItemLockedRow (line 154), CorrectionMutationArgs (line 365),
    DisputedLinkRow (line 739) and DisputedAttributeRow (line 788) (node domain/knowledge-base/valid-from-basis)
  evidence: 'readonly valid_from_source: "stated" | "document" | "received" | null; (the same file also imports the vocabulary
    as a type, `ValidFromSource` from "../dto/enums.dto.js", and uses it in `readonly validFromSource: ValidFromSource | null;`
    at NewAttributeArgs)'
  cost: The vocabulary of what justifies a validity start is written out four times in this file beside the imported type
    that already names it. The node domain/knowledge-base/valid-from-basis is not bound to this file. If the node gains or
    renames a value, `--check` never reaches these declarations, and the next reader cannot tell which spelling was decided.
  correction: Type the four members with the imported ValidFromSource instead of a second literal union, so the vocabulary
    has one declaration, in the file the node is bound to.
  kind: contradicts
- pass: standard
  file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
  where: statementsOf, line 69
  cites: TYP-02
  evidence: return { query } as unknown as PoolClient;
  cost: The fake is a bare object with only `query`, and the double assertion tells the compiler it is a full PoolClient.
    If a repository function under test starts calling another client member (`release`, `connect`), the test compiles and
    then fails at run time with a TypeError. Nothing narrows the claim, so the type-checker cannot flag the mismatch.
  correction: Type the fake as the narrow shape the functions use (for example a `Pick<PoolClient, "query">` parameter on
    the repository functions), or build the stand-in so the compiler checks it, instead of asserting through `unknown`.
- pass: standard
  file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
  where: the file's path
  cites: TST-04
  evidence: 'src/__tests__/unit/curation/curation-repository-provenance.spec.ts

    (unit under test: src/modules/curation/repository/curation.repository.ts)'
  cost: The path does not mirror the unit's path. There is no `modules/curation/repository/` segment and the name is not `curation.repository.spec.ts`.
    Someone opening curation.repository.ts and looking for its test has to search by content. A second test of the same file
    could easily be written beside it, because nothing at the expected path says one already exists. This file does follow
    the layout of its sibling specs, which sit under `unit/<module>/` (for example `unit/curation/dto.spec.ts`). The rule
    as written asks for a full mirror, so the departure is reported as the rule states it.
  correction: Place the spec at the mirrored path of the repository file, or have the standard state the `unit/<module>/`
    layout the project already uses.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: the status list in rejectItem (257, 268), supersedePredecessor (379, 390), supersedeAttributeAtEdit (540) and rejectAttributeAtEdit
    (561)
  cites: TYP-04
  evidence: AND status IN ('active', 'uncertain', 'disputed')
  cost: The set of statuses from which an item may still be rejected or superseded is spelled out in six statements. Adding
    or renaming a status in that set means editing six SQL strings. Missing one makes that path refuse items the others accept,
    with no error pointing at the difference.
  correction: Name the set once (a constant, bound as an `= ANY($n::assertion_status[])` parameter, as loadAttributeIdsOfKeyForUpdate
    already does) and reuse it in the six statements.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: loadItemsForUpdate, lines 159-197 (39 lines)
  cites: MNT-01
  evidence: "export async function loadItemsForUpdate(\n  client: PoolClient,\n  itemKind: ItemKind,\n  itemIds: readonly\
    \ string[]\n): Promise<ItemLockedRow[]> {\n  if (itemIds.length === 0) return [];\n  if (itemKind === \"link\") {"
  cost: One function holds two full SELECT statements, one per item kind, in 39 lines. A change to the shared columns has
    to be made in both branches inside one body.
  correction: Extract one helper per item kind (loadLinksForUpdate and loadAttributesForUpdate) and let this function only
    choose between them.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: adjustItemPeriod, lines 328-334 (five positional parameters)
  cites: MNT-01
  evidence: "export async function adjustItemPeriod(\n  client: PoolClient,\n  itemKind: ItemKind,\n  itemId: string,\n  validFrom:\
    \ string | null,\n  validTo: string | null\n): Promise<number> {"
  cost: Two adjacent `string | null` positionals (validFrom, validTo) can be swapped at a call site without any type error.
    A swapped period reaches the database as a valid but wrong date range on a disputed item.
  correction: Take an object, as supersedeAttributeAtEdit and rejectAttributeAtEdit already do with their args types.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertCorrectedRow, lines 397-473 (77 lines)
  cites: MNT-01
  evidence: "export async function insertCorrectedRow(\n  client: PoolClient,\n  itemKind: ItemKind,\n  args: CorrectionMutationArgs\n\
    ): Promise<string> {\n  if (itemKind === \"link\") {"
  cost: The function holds two INSERT ... SELECT statements, each with its own parameter list and empty-row check. A reader
    has to take in 77 lines to see that the two branches differ only in table and columns, and a fix to the shared "no row
    returned" handling has to be made twice.
  correction: Extract insertCorrectedLink and insertCorrectedAttribute as named helpers, and keep this function as the dispatch.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertNewAttribute, lines 489-522 (34 lines)
  cites: MNT-01
  evidence: "export async function insertNewAttribute(\n  client: PoolClient,\n  args: NewAttributeArgs\n): Promise<string>\
    \ {\n  const res = await client.query<{ id: string }>("
  cost: The body is 34 lines. Most of it is the eleven-element parameter array, which has to be kept in step with the eleven
    placeholders by hand.
  correction: Extract the parameter-list construction into a named helper, or accept the length and have the standard say
    so.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: copyProvenance, lines 568-573 (four positional parameters)
  cites: MNT-01
  evidence: "export async function copyProvenance(\n  client: PoolClient,\n  itemKind: ItemKind,\n  predecessorId: string,\n\
    \  successorId: string\n): Promise<number> {"
  cost: predecessorId and successorId are both uuid strings in adjacent positions. A swapped call copies provenance from the
    new row onto the old one. It type-checks, and the provenance of the corrected item silently ends up empty.
  correction: Take an object ({ itemKind, predecessorId, successorId }) after the client.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: appendProvenanceFragment, lines 598-603 (four positional parameters)
  cites: MNT-01
  evidence: "export async function appendProvenanceFragment(\n  client: PoolClient,\n  itemKind: ItemKind,\n  successorId:\
    \ string,\n  fragmentId: string\n): Promise<number> {"
  cost: successorId and fragmentId are adjacent uuid strings. A swapped call inserts a provenance row naming the wrong parent.
    It type-checks, and the anti-hallucination link from item to fragment is wrong.
  correction: Take an object ({ itemKind, successorId, fragmentId }) after the client.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 848-930 (83 lines)
  cites: MNT-01
  evidence: "export async function aggregateCurationMetrics(\n  client: PoolClient\n): Promise<CurationMetricsRow> {\n  const\
    \ totalActionsRes = await client.query<{ total: string }>("
  cost: One function issues seven queries and the rate arithmetic in 83 lines. Whoever adds an eighth metric extends this
    body instead of adding a function, and each metric cannot be read or reasoned about on its own.
  correction: Extract one named helper per metric (acceptRate, rejectRateByCode, needsReviewCount, uncertainCount, disputedCount,
    disputedQueueCount) and have this function assemble them.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 855-865 and 877-880, with ACCEPT_ACTIONS at 830-836
  cites: ARC-04
  evidence: 'acceptRate = accepted / totalActions;

    ...

    rejectRateByCode[row.code] = Number(row.total) / totalActions;'
  cost: The repository decides which curation actions count as an acceptance (ACCEPT_ACTIONS) and computes the rates, so the
    definition of "accept rate" lives in the persistence layer. A service or job needing the same metric would reimplement
    it or have to call into the repository for policy. The repository cannot be tested as plain reads and writes.
  correction: The repository returns the counts (total, accepted, rejects by code). The service holds the list of accepting
    actions and does the division.
reconciliation: siegard-reconcile/provenance-conflict-predicate.md
run: run/provenance-conflict-predicate
---

## What it is

The review of the one task of the corrective increment provenance-conflict-predicate, over the curation repository and the test it wrote. The coverage, conformance and standard passes ran. The failures pass did not: the captured run `run/provenance-conflict-predicate` passed in all five steps, so there was no failure to read.

## Notes

- The standard pass reads whole files, so most of its findings are about code of the repository file that this change did not touch; the change itself is four lines.
- The coverage pass judged the set under review only, the one new test. It found the test reads the text of each statement and not the outcome the criteria state, and it did not count the existing tests that cover the edit and correction flows through a stand-in that ignores the conflict clause.
- No test in the tree reaches the PostgreSQL planner, so nothing observes whether a repeated fragment leaves one stored row; the EXPLAIN that showed the refusal was made in the session and no record holds it.
- The conformance pass over the repository file found one fact it takes for a second home of a vocabulary, and none concerning the four changed statements.
