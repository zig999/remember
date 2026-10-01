---
target: backend
title: Review of the proof-compliance-counts initiative
summary: Coverage, specification conformance, standard conformance and one node certification over the
  test the task wrote and the two standing compliance-audit files it proves, with the registry run green.
reviewed:
- src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
- src/modules/compliance-audit/repository/compliance-audit.repository.ts
- src/modules/compliance-audit/service/compliance-audit.service.ts
tasks:
- task/compliance-deletion-counts-proof/counts-match-marked
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/proof-compliance-counts passed; there was no failure to read
coverage:
- criterion: A compliance deletion is run on a target raw. The rows resting only on that raw are 1 raw
    chunk, 1 information fragment, 2 knowledge links and 3 node attributes. A fourth node attribute also
    has provenance in a second, active raw. A second raw chunk of the target raw is already superseded.
    The deletion records affected as {chunks 1, fragments 1, links 2, attributes 3}.
  state: partial
  tests:
  - file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
    name: records chunks 1, fragments 1, links 2 and attributes 3, equal to the rows whose status turned
      to deleted, leaving the shared attribute and the already superseded chunk out
  why: 'The fixture matches the criterion: one live chunk and one already-superseded chunk on the target
    raw, one fragment resting only on it, two links and three attributes resting only on it, and a fourth
    attribute that also has provenance through a fragment anchored in a second, active raw. The test then
    checks that the recorded affected value is {1, 1, 2, 3}. It would fail if the service sent the four
    cascade counts into the wrong affected fields, or if it dropped or changed them on the way. What it
    does not exercise is the deletion actually choosing those rows. No database is run, even though the
    file sits under integration/. Each UPDATE is answered by an in-test fake client, matched on a SQL
    substring ("UPDATE raw_chunk", "UPDATE node_attribute", ...). The fake decides on its own which rows
    to mark. It leaves out the superseded chunk only if the statement text contains "superseded_at IS
    NULL". It leaves out the shared attribute only if the text contains "ri.id <> $1", and the fake then
    checks the other raw''s status itself. It never evaluates the statement''s EXISTS / NOT EXISTS joins
    or where that predicate sits. So the outcome is tied to the SQL text, not to what the statement does.
    A statement that keeps those substrings but selects the wrong rows passes: a broken join, a guard
    on the wrong subquery, a missing `ri.status <> ''deleted''`. An equivalent statement worded differently
    fails. Nothing here runs the deletion against rows, so the claim that the shared attribute and the
    superseded chunk are left out and the rest are taken is unexercised.'
- criterion: For that same deletion, each recorded affected count equals the number of raw chunks, information
    fragments, knowledge links and node attributes whose status the deletion turned to deleted.
  state: partial
  tests:
  - file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
    name: records chunks 1, fragments 1, links 2 and attributes 3, equal to the rows whose status turned
      to deleted, leaving the shared attribute and the already superseded chunk out
  why: The test snapshots row statuses before and after. It counts, per kind, the rows whose status changed
    to deleted, and checks that this count and the recorded affected both equal {1, 1, 2, 3}. That would
    catch a service that records anything other than what each cascade UPDATE returned, field by field.
    But the "turned to deleted" side is the fake client's own doing. Its markDeleted reports rowCount
    as exactly the rows it just marked, so recorded and marked agree by how the fake is built, whatever
    the real statements do. The case where the two could really come apart never appears. No fragment,
    link or attribute in the fixture is already deleted before the deletion, so an UPDATE that matches
    already-deleted rows (and counts rows whose status did not change) never comes up. On top of that,
    the fake applies its own `status !== "deleted"` filter for fragments, links and attributes whether
    or not the statement has `status <> 'deleted'`. Taking `f.status <> 'deleted'`, `kl.status <> 'deleted'`
    or `na.status <> 'deleted'` out of the real SQL would still pass. Whether each recorded count equals
    the rows whose status actually changed, when some candidate row was already deleted, is unexercised.
    So is anything about the real statements' row counts.
unpaired: []
findings:
- pass: conformance
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: the doc comments of tombstoneRawChunksOfRaw (line 85), tombstoneCascadedFragments (line 109),
    tombstoneCascadedLinks (line 143) and tombstoneCascadedAttributes (line 178)
  evidence: '" * Tombstone every raw_chunk anchored to the deleted raw. RETURNING.id count\n * feeds `affected.chunks`
    (BR-16)."

    " * RETURNING.id count feeds `affected.fragments` (BR-16)."

    " * RETURNING.id count feeds `affected.links` (BR-16)."

    " * RETURNING.id count feeds `affected.attributes` (BR-16)."'
  cost: Four comments say, outside any behavior, that each affected count is the number of rows the cascade
    marked deleted. The code already holds this fact in the `return res.rowCount ?? 0;` of each function
    and in the `jsonb_build_object` of insertComplianceDeletion. If the node moves, these comments stay
    as a second statement of it. Nothing checks them against the node, and the "BR-16" citation points
    at a back-spec identifier the specification root does not carry.
  correction: Remove the four comment sentences that restate the counts. The comment route does this,
    followed by /reconcile over this file. The fact stays held by the code and by the node.
- pass: conformance
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: line 57, the exported constant REDACTED_LITERAL
  evidence: export const REDACTED_LITERAL = "[REDACTED]" as const;
  cost: The rule that a compliance deletion replaces content and original input with the literal [REDACTED]
    is declared a second time here, in a file the node is not bound to. Nothing the service runs reads
    this constant. The redaction that executes is the SQL in compliance-audit.repository.ts (`SET content
    = '[REDACTED]'`), and the only importers of the constant are the re-export in compliance-audit/index.ts
    and a unit test. If the node's literal changes, the constant and its test keep passing against the
    old value while the repository does something else, so nobody can tell which one was decided.
  correction: The literal should be held in one place that executes, the repository SQL the node is bound
    to. This second declaration, and the test that pins it, would then go.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: the file's path and name
  evidence: 'src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts

    (the only unit it exercises: import { complianceDelete } from "../../../modules/compliance-audit/service/compliance-audit.service.js")'
  cost: The file is named for a behavior, not for the unit it covers. Someone opening the tests for compliance-audit.service.ts
    finds no file at a path that corresponds to it, so a second test of complianceDelete can easily be
    written beside it. The siblings are unit/compliance-audit/repository.spec.ts and integration/compliance-audit/routes.spec.ts,
    which name a layer. The file also sits in the integration subtree although the whole store is an in-memory
    fake.
  cites: TST-04
  correction: Place the file at a path that corresponds to compliance-audit.service.ts, in the subtree
    that matches what it exercises (it runs against a fake client, with no real store).
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: interface Counts (lines 7-12) and the use of Counts for EXPECTED_AFFECTED and RecordedDeletion.affected
  evidence: "interface Counts {\n  chunks: number;\n  fragments: number;\n  links: number;\n  attributes:\
    \ number;\n}"
  cost: The module's dto directory already holds ComplianceDeletionAffectedSchema, with the same four
    keys plus int and min(0) constraints. The test types its expected counts and the recorded row against
    its own copy. If a fifth count is added to the DTO, the test keeps compiling and still passes against
    a shape production no longer accepts.
  cites: DTO-04
  correction: Import ComplianceDeletionAffected (or ComplianceDeletionAffectedSchema) from ../../../modules/compliance-audit/dto/compliance-delete.dto.js
    in place of the local interface.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: function buildFixture (lines 93-136)
  evidence: "function buildFixture(): Store {\n  return {\n    raws: [\n      { id: TARGET_RAW, status:\
    \ \"active\" },\n...\n    compliance_deletions: [],\n  };\n}"
  cost: The function spans 44 lines, over the thirty-line limit. The raws, chunks, fragments, sources,
    links, attributes and provenance of the scenario are built in one body. To see which row is the shared
    attribute or the already-superseded chunk, a reader has to hold the whole literal in mind.
  cites: MNT-01
  correction: Split the fixture into named helpers (for example provenance rows and chunk rows), or build
    it from smaller named pieces.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: function isEligible (lines 158-171)
  evidence: "function isEligible(\n  store: Store,\n  sql: string,\n  rawIds: string[],\n  target: string\n\
    ): boolean {"
  cost: The function takes four positional parameters, over the limit of three. Two adjacent string-typed
    parameters (sql, target) and an array make a swapped call compile without any complaint.
  cites: MNT-01
  correction: Pass an options object, or extract a helper so that the function takes at most three.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: isEligible (158-171), tombstoneFragments (206-218) and tombstoneOwned (220-237), the stand-in
    handlers for UPDATE statements
  evidence: "if (!rawIds.includes(target)) return false;\nif (!sql.includes(OTHER_RAW_GUARD)) return true;\n\
    return !rawIds.some(\n  (id) =>\n    id !== target &&\n    store.raws.find((raw) => raw.id === id)?.status\
    \ !== \"deleted\"\n);"
  cost: The fake store does not just hold rows. It reimplements the cascade rule itself (a fragment, link
    or attribute is tombstoned only if no other live raw anchors it) and decides eligibility in JavaScript.
    The "marked" side of the assertion is therefore produced by the stand-in's copy of BR-06/BR-07, not
    by the repository's SQL. The only link to the real SQL is a substring check for "ri.id <> $1". A repository
    query whose predicate was wrong but still contained that text would pass, and the test would still
    show the shared attribute excluded.
  cites: TST-03
  correction: Limit the stand-in to what the store does (return rows and a rowCount for a statement),
    or exercise the real statements against a real store so the exclusion rule is decided by the SQL.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: the literal "deleted", at lines 169, 175, 191, 210, 228 and 306
  evidence: 'store.raws.find((raw) => raw.id === id)?.status !== "deleted"

    ...

    row.status = "deleted";

    ...

    fragment.status !== "deleted" &&

    ...

    ([id, status]) => status === "deleted" && before.get(id) !== "deleted"'
  cost: The tombstone status is spelled out six times, while the neighbouring guards (SUPERSEDED_GUARD,
    OTHER_RAW_GUARD) and the ids were made named constants. If the status value changes, the fake and
    the counter have to be changed in every place, and a missed one makes marked and recorded diverge
    in a way that looks like a service bug.
  cites: TYP-04
  correction: Introduce a named constant for the deleted status, as was done for the other guards in the
    same file.
- pass: standard
  file: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  where: buildFakeClient, the return expression (lines 276-283)
  evidence: 'release: (): void => undefined,

    } as unknown as PoolClient;'
  cost: The double assertion tells the compiler the object is a PoolClient with nothing narrowing it.
    The fake carries only query and release. If complianceDelete or its repository starts to use another
    member of the client, the test compiles and then fails at runtime with a TypeError, far from the edit
    that caused it.
  cites: TYP-02
  correction: Type the fake against the subset of PoolClient the service uses, or narrow it with a guard
    instead of asserting through unknown.
- pass: standard
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: tombstoneRawInformation, the SET clause (lines 67-72)
  evidence: "SET content        = '[REDACTED]',\n    original_input = CASE WHEN original_input IS NULL\
    \ THEN NULL ELSE '[REDACTED]' END,"
  cost: The redaction value appears twice in one statement as a raw literal. The service defines `export
    const REDACTED_LITERAL = "[REDACTED]" as const;` precisely so a test can pin the exact bytes, but
    nothing in the repository uses it. The pinned constant and the value written to the database can drift
    apart with no failure, and the documented intent (a single named, pinned value) is not what is written
    to the rows.
  cites: TYP-04
  correction: Pass the redaction value into the statement as a parameter taken from the named constant,
    or define it once where both the service and the repository can use it.
- pass: standard
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: tombstoneCascadedAttributes (lines 180-207), copied from tombstoneCascadedLinks (145-172)
  evidence: "UPDATE node_attribute AS na\n        SET status        = 'deleted',\n            superseded_at\
    \ = now()\n      WHERE EXISTS (SELECT 1 FROM provenance p\n                      JOIN information_fragment\
    \ f ON f.id = p.fragment_id\n                      JOIN fragment_source fs ON fs.fragment_id = f.id\n\
    \                      JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id\n                     WHERE p.attribute_id\
    \ = na.id"
  cost: The cascade rule ("every provenance anchors only the deleted raw") is written twice, once for
    knowledge_link and once for node_attribute, differing only in table alias and provenance column. A
    fix to the exclusivity predicate in one function (for example how a shared owner is treated) has to
    be repeated in the other. If it is not, links and attributes follow different rules and the affected.links
    and affected.attributes counts diverge in meaning.
  cites: MNT-03
  correction: Build the two statements from one shared definition of the exclusivity predicate, parameterised
    by table and provenance column.
- pass: standard
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: function listComplianceDeletions (lines 310-346)
  evidence: "export async function listComplianceDeletions(\n  client: PoolClient,\n  f: ListComplianceDeletionsFilters\n\
    ): Promise<ListComplianceDeletionsResult> {\n  const where: string[] = [];\n...\n  return { items:\
    \ dataRes.rows, total };\n}"
  cost: The function runs to 37 lines, over the thirty-line limit. Filter assembly, placeholder numbering,
    the data query and the count query are all in one body. The placeholder counter `i` is shared across
    all of them, so adding a filter in the middle shifts every later parameter number.
  cites: MNT-01
  correction: Extract the filter and placeholder assembly, and the data and count queries, into named
    helpers.
- pass: standard
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: function listCurationActions (lines 430-474)
  evidence: "export async function listCurationActions(\n  client: PoolClient,\n  f: ListCurationActionsFilters\n\
    ): Promise<ListCurationActionsResult> {\n  const where: string[] = [];\n...\n  return { items: dataRes.rows,\
    \ total };\n}"
  cost: The function runs to 45 lines, over the thirty-line limit, with five conditional filter blocks,
    the data query and the count query in one body. Anyone adding a sixth filter extends a function that
    is already past what can be held in view.
  cites: MNT-01
  correction: Extract the condition assembly and the paging queries into named helpers.
- pass: standard
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: listCurationActions (lines 430-474), copied from listComplianceDeletions (310-346)
  evidence: "const whereClause = where.length > 0 ? `WHERE ${where.join(\" AND \")}` : \"\";\n\nconst\
    \ dataParams = [...params, f.limit, f.offset];\n...\nconst countSql = `SELECT count(*)::int AS total\n\
    \                    FROM curation_action\n                    ${whereClause}`;\nconst countRes =\
    \ await client.query<{ total: number }>(countSql, params);\nconst total = countRes.rows[0]?.total\
    \ ?? 0;"
  cost: The sequence "accumulate where fragments and a positional counter, build a LIMIT/OFFSET data query,
    run a separate count(*), return items and total" is written out twice. A fix to the placeholder numbering,
    the count or the paging in one function has to be found and made in the other, or the two listings
    page differently.
  cites: MNT-03
  correction: Extract the shared where-and-paging mechanics into one helper that both listings call.
- pass: standard
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: function complianceDelete (lines 81-199)
  evidence: "export async function complianceDelete(\n  deps: ComplianceAuditServiceDeps,\n  client: PoolClient,\n\
    \  body: ComplianceDeleteRequest\n): Promise<ComplianceDeleteResponse> {"
  cost: The function runs to about 118 lines, almost four times the thirty-line limit. It holds the not-found
    refusal, the already-deleted no-op, the legacy-orphan alarm, the tombstone and the four-step cascade,
    both audit rows and two log calls. A reader tracing why affected.links is what it is has to read past
    all of it. The next added branch has nowhere to go but this body.
  cites: MNT-01
  correction: Extract named helpers, for example the idempotent-no-op path and the cascade-and-count step,
    so the main function reads as the sequence of steps.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
reconciliation: siegard-reconcile/proof-compliance-counts.md
run: run/proof-compliance-counts
---
## What it is
The review of the proof task over the test it wrote and the two standing compliance-audit files it proves, read by coverage, conformance and standard judgments, one node certification and one green registry run.

## Notes
The failures pass did not run because the captured run passed every step.
The certification of rules/knowledge-base/compliance-deletion-counts-what-it-marked came back partial with a testable remainder, so the node stays decided by reading; trace.py --owed lists the assertion that would close it.
The standard judge was delegated twice: the first delegation received an unexpanded placeholder instead of the finding contract and returned nothing usable, then answered again after a correction message with 15 findings; the second, fresh delegation received the contract pasted and is the one recorded here.
The conformance pass bound the node to its two files; the other eighteen node-file pairs on those files were omitted as already judged at these bytes.
This framework does not review runtime behavior beyond the project's own suite, performance, security beyond the rules the standard states, or whether the fake client agrees with a real database.
