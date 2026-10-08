---
target: backend
title: Second review of the backend delivery of the owner's entity edit (entity-edit-backend), over the two tasks re-delivered proof-only
summary: What four passes found over the four files of refuse-inactive-node and record-correction after their proofs were rewritten to close a testable remainder.
reviewed:
- src/__tests__/unit/curation/entity-edit-correction.spec.ts
- src/__tests__/unit/curation/entity-edit-node.spec.ts
- src/modules/curation/service/entity-edit-correction.ts
- src/modules/curation/service/entity-edit-node.ts
tasks:
- task/entity-edit-backend/record-correction
- task/entity-edit-backend/refuse-inactive-node
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/entity-edit-backend-again passed, so there was no failure for the pass to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: An edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused with RESOURCE_NOT_FOUND
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is applied to an active node, and refused with the node left as it stood for a node in needs_review, merged or deleted and for an identity at which no node is held
  why: 'Covered. Finding: the edit-operation test also asserts that the store is left unchanged after the refusal (storeChanged false). This criterion only names the refusal and its code. If the store assertion ever changes, this check changes with it.'
- criterion: An absent-node refusal names the node.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused with a message and details that name the node
- criterion: An edit naming a node whose status is needs-review is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused for needs_review, merged and deleted and not refused for active
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is applied to an active node, and refused with the node left as it stood for a node in needs_review, merged or deleted and for an identity at which no node is held
  why: 'Covered. Finding: the edit-operation test also asserts that the store is left unchanged after the refusal, which this criterion does not state.'
- criterion: An edit naming a node whose status is merged is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused for needs_review, merged and deleted and not refused for active
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is applied to an active node, and refused with the node left as it stood for a node in needs_review, merged or deleted and for an identity at which no node is held
  why: 'Covered. Finding: the edit-operation test also asserts that the store is left unchanged after the refusal, which this criterion does not state.'
- criterion: An edit naming a node whose status is deleted is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused for needs_review, merged and deleted and not refused for active
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is applied to an active node, and refused with the node left as it stood for a node in needs_review, merged or deleted and for an identity at which no node is held
  why: 'Covered. Finding: the edit-operation test also asserts that the store is left unchanged after the refusal, which this criterion does not state.'
- criterion: A not-active refusal names the node.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a needs_review node names the node
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a merged node names the node
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a deleted node names the node
- criterion: A not-active refusal names the node's current status.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a merged node names that status
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a deleted node names that status
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: for a node under review names the status as needs_review with its underscore, never as needs-review
  why: Covered against the refusal as it is written today. Two findings follow. First, a fixture hazard. Every fixture node's canonical_name is "no <status>", for example "no merged". The status check only asks whether the refusal's text contains the status string. If the refusal ever names the node's canonical name, these tests still pass even after the status is dropped. Second, an over-assertion. The needs_review test also asserts that the hyphenated "needs-review" never appears. The criterion only asks that the status be named, and the sibling criterion itself spells this status "needs-review". The test forbids a spelling the task's own text uses, which the criterion does not establish.
- criterion: An edit naming an active node is not refused by the active-node rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is refused for needs_review, merged and deleted and not refused for active
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is applied to an active node, and refused with the node left as it stood for a node in needs_review, merged or deleted and for an identity at which no node is held
  why: 'Covered. Finding: for the active node, the edit-operation test also asserts storeChanged true, meaning the edit was actually applied. That goes beyond "not refused by the active-node rule". It ties this criterion to the whole apply path, so a failure anywhere in applying the edit fails this check too.'
- criterion: The named attribute's status becomes superseded.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: becomes superseded
  why: The test's fake client does not read the UPDATE statement's text. supersedeStatement writes status "superseded" itself to any UPDATE on node_attribute whose first parameter names a live row. The test therefore fails only if no supersession update is issued for the named attribute. If the statement set any other status, the test would still pass. The status the code actually writes is never checked.
- criterion: The named attribute's supersession time is the moment of the supersession.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: is the moment of the supersession when the attribute holds no validity end
  why: 'The fake client sets superseded_at from the UPDATE''s third positional parameter and ignores the statement''s text. The test proves that the edit moment is passed in that position. It does not prove that the statement writes that value into superseded_at: a statement that wrote the third parameter elsewhere, or wrote now(), would still pass. The test also reads "the moment of the supersession" as the editedAt passed to the correction.'
- criterion: A correction of an attribute that already holds a validity end gives it the moment of the supersession as its supersession time.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: is the moment of the supersession when the attribute already holds a validity end
  why: Same limit as the previous criterion. With a predecessor that holds a validity end, the test proves that the edit moment is passed as the UPDATE's third parameter. Because the fake ignores the statement's text, it does not prove that the statement writes that value as the supersession time.
- criterion: The new attribute names the superseded attribute as the one it supersedes.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: names the superseded attribute as the one it supersedes
- criterion: An organization's active cnpj with no validity, corrected to another cnpj, keeps no validity end once superseded.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: keeps no validity end once superseded
  why: 'The fake client keeps valid_to as "second parameter, else the existing value". It does not evaluate the statement''s own valid_to expression. The test proves that no validity end is passed as the second parameter. It does not prove that the statement leaves valid_to empty: a statement that filled it from elsewhere, for example now(), would still pass.'
- criterion: In that same edit the new attribute holds the other cnpj.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: is replaced in that edit by a new attribute holding the other cnpj
- criterion: The new attribute holds every provenance of the superseded attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: holds the edit's information fragment, and for a correction every provenance of the superseded attribute and no other
  why: Covered. Two findings follow. First, an over-assertion. The test requires the correction's provenance to be exactly the edit's fragment plus the superseded attribute's fragments ("and no other"). The criterion only says the new attribute holds every provenance of the superseded one. A sibling task that legitimately added another provenance would break this check. Second, bundling. The same single expect also asserts the provenance of the first-value path (recordNewAttribute), which no criterion here states. If that half changes, this criterion's check changes with it.
- criterion: The new attribute holds a provenance pointing at the edit's information fragment.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: holds the edit's information fragment, and for a correction every provenance of the superseded attribute and no other
  why: Covered through the correction half of the combined expect. The same exactness ("and no other") over-assertion and the bundling with the first-value path apply, as recorded for the previous criterion.
unpaired:
- test:
    file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: is active even when the superseded attribute was uncertain and held a validity end
  asserts: When a deadline attribute with status uncertain and a validity end is corrected, the new attribute the correction records has status "active".
- test:
    file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is answered HTTP 404 over REST
  asserts: The absent-node refusal maps to HTTP status 404 with envelope error code RESOURCE_NOT_FOUND.
- test:
    file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: is answered HTTP 409 over REST
  asserts: The not-active refusal for a needs_review node maps to HTTP status 409 with envelope error code BUSINESS_NODE_NOT_ACTIVE.
findings:
- pass: conformance
  file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  where: line 36, the LIVE_STATUSES constant, used by supersedeStatement at line 128
  evidence: 'const LIVE_STATUSES: readonly string[] = ["active", "uncertain", "disputed"];'
  cost: This is the enumeration that domain/knowledge-base/live-assertion-status holds, declared a second time in a file that node is not bound to. The test double decides which rows the supersede statement touches from this copy. If the node's values move, the double keeps applying the old set. The tests then pass against a vocabulary nobody decided, and `--check` never reaches this file through the node.
  correction: Bind this file to domain/knowledge-base/live-assertion-status so the node answers for the vocabulary here. The alternative is for the double not to carry its own list of live statuses.
  kind: contradicts
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  where: buildClient, the object returned on line 215
  cites: TYP-02
  evidence: 'return { client: { query } as unknown as PoolClient, store };'
  cost: The fake exposes only `query`, but the double assertion tells the compiler it is a full `PoolClient`. If `recordCorrection` or a repository helper it calls starts using `client.release` or `client.connect`, the test does not fail at compile time. It fails at run time with "not a function", far from the assertion that made the claim. Nothing narrows the cast.
  correction: Narrow the stand-in with a guard, or type the repository helpers against a minimal `Pick<PoolClient, "query">` so the fake needs no assertion.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  where: buildClient, the return on line 74
  cites: TYP-02
  evidence: return { query } as unknown as PoolClient;
  cost: The same unguarded double assertion as in the correction spec. The fake is declared a `PoolClient` while holding only `query`, so a later use of any other client member in `loadActiveNodeForEdit` is caught at run time instead of by the type-checker.
  correction: Guard the cast, or give the guard function a parameter type of `Pick<PoolClient, "query">` so no assertion is needed.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  where: refusalOf (lines 77-89) and outcomeOf (lines 91-101)
  cites: MNT-03
  evidence: "try {\n    await loadActiveNodeForEdit(buildClient(), nodeId);\n  } catch (error) {\n    if (error instanceof ResourceNotFoundError || error instanceof ConflictError) {\n(This appears twice with the same body. refusalOf returns `error` and outcomeOf returns `error.code`.)"
  cost: The call-and-narrow-the-two-refusal-types block exists twice in one file. If a third refusal type is added to the guard, both copies must be edited. The one that is missed lets that error fall into `throw error` as an apparent crash in only some of the tests.
  correction: Have outcomeOf call refusalOf and read `.code`, treating the "expected the edit to be refused" throw as the accepted outcome. Alternatively, extract one helper that returns the refusal or undefined.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  where: NOT_FOUND_CODE (line 192) against the literal on lines 111 and 127
  cites: TYP-04
  evidence: 'const NOT_FOUND_CODE = "RESOURCE_NOT_FOUND"; (Elsewhere in the same file: `expect(refusal.code).toBe("RESOURCE_NOT_FOUND");` and `code: "RESOURCE_NOT_FOUND",`.)'
  cost: The file names this code as a constant for the last test but spells it out twice in the earlier ones. A rename of the code has three sites to change in one file, and a reader cannot tell whether the literal and the constant are meant to be the same value.
  correction: Declare NOT_FOUND_CODE alongside NOT_ACTIVE_CODE at the top and use it in all three places.
reconciliation: siegard-reconcile/entity-edit-backend-again.md
run: run/entity-edit-backend-again
---

## What it is

The second review of the entity-edit-backend initiative, over the two tasks whose proofs were rewritten whole to close a remainder the first review refused as testable, and the four files those tasks wrote. Coverage and the standard pass ran once each; the conformance pass ran once per file, four judgments, folded into siegard-reconcile/entity-edit-backend-again.md. The captured run run/entity-edit-backend-again passed, so the failures pass had nothing to read.

## Notes

The first review is review/entity-edit-backend.md. Both nodes certified here, rules/knowledge-base/entity-edit-names-an-active-node and rules/knowledge-base/entity-edit-provenance, were judged covered by a test; the two remainders the first review left are closed.

The standard judge reports that its in-scope rule TST-07 found no violating test it could name for the invariant branch of recordCorrection, because it could not tell from the file set whether the specification states that invariant.
