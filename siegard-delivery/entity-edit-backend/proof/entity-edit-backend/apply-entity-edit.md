---
target: backend
title: Proof for applying an entity edit as one whole
summary: Unit tests over an in-memory transactional fake of pg prove that editEntityService answers node_id, action_id and one underscore-spelled applied entry per change. They also prove the edit writes its note, run, attributes and action together, and the order in which the checks refuse it.
implementation: sha256:8a096b11746230a9cfb509fd2d964ccf4d3211642f707b7f2f7e707876bd8c29
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-apply-entity-edit-suite
tests:
- file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  name: the answer to an accepted entity edit names the edited node's identity as node_id
  proves: An accepted edit answers the edited node's identity as node_id.
  fails_when: The answer's node_id is absent or is any identity other than the edited node's.
- file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  name: the answer to an accepted entity edit names the identity of the curation action the edit recorded as action_id
  proves: An accepted edit answers the identity of the curation action it recorded as action_id. The stored action is read back, so exactly one action must also exist.
  fails_when: action_id is absent, is not the identity of the stored curation action, or the edit stores zero or several actions.
- file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  name: the answer to an accepted entity edit writes every effect with an underscore for each hyphen of its enumeration value
  proves: Every effect crosses the wire with each hyphen written as an underscore, so first-value answers first_value. One edit produces all six effects, and each entry answers its change's effect. This is the UNDERDETERMINED entry on the spelling.
  fails_when: An applied entry answers an effect in its hyphenated enumeration form (first-value), or any of the six effects is answered under another spelling or is missing or misplaced.
  demonstrates: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
- file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  name: the answer to an accepted entity edit lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  proves: The edit answers exactly one applied entry per change, in the order given. Each entry names its key and effect. unchanged has null item_id and predecessor_id. first-value and addition have a recorded item_id and a null predecessor. removal has a null item_id and the removed attribute as predecessor. succession and correction have the new attribute as item_id and the superseded one as predecessor. Covers the UNDERDETERMINED entry on first-value, addition and correction identities.
  fails_when: An entry is missing, duplicated or reordered, names another key, carries a null where an identity belongs, carries an identity where null belongs, swaps item_id and predecessor_id, or carries any field other than the four.
  demonstrates: domain/knowledge-base/applied-change
- file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  name: the curation action an accepted entity edit records is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
  proves: An accepted edit records one curation action of kind edit_entity on target kind node at the edited node's identity, with the reason and a payload whose applied list holds one entry per change in the order given, with underscore effects and nulls. Covers the UNDERDETERMINED entry on the action's content.
  fails_when: The action has another kind or target kind, no target_id or another one, an empty or differently shaped payload, hyphenated effects, a missing reason, or more or fewer than one action is stored.
  demonstrates: rules/knowledge-base/entity-edit-records-curation-action
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: a set change naming no attribute on a key whose node holds no live attribute is recorded as a new active attribute that names no predecessor, with the effect first_value
  proves: A first-value change records one new active attribute of the edited node and key that supersedes nothing, and the answer's effect is first_value.
  fails_when: No attribute is recorded, it is recorded in a status other than active, it names a predecessor, it belongs to another node or key, or the effect answered is not first_value.
  demonstrates: rules/knowledge-base/entity-edit-first-value
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: a remove change naming a live attribute marks that attribute deleted with the moment of the edit as its supersession time, records no attribute, and has the effect removal
  proves: A removal marks the named attribute deleted with the edit's moment as its superseded_at, records no new attribute, and answers removal. This covers the removal part of the UNDERDETERMINED entry on what each effect writes.
  fails_when: The named attribute stays active, is marked superseded rather than deleted, gets no supersession time or a time other than the edit's moment, a new attribute is recorded, or the effect is not removal.
  demonstrates: rules/knowledge-base/entity-edit-removal
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: a set change stating another value for a current attribute of a temporal key supersedes that attribute and records a new active attribute that names it as the one it supersedes, with the effect succession
  proves: A succession supersedes the named current attribute, records a new active attribute that names it as supersedes_attribute_id, and answers succession. This covers the succession part of the UNDERDETERMINED entry on what each effect writes.
  fails_when: The old attribute stays active, the new attribute is not recorded, is not active, does not point at the old one, or the effect is not succession.
  demonstrates: rules/knowledge-base/entity-edit-succession
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: what an accepted entity edit of several changes records as its note is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  proves: An accepted edit of six changes records one raw information, one raw chunk holding all of its content, and one accepted information fragment anchored to that chunk whose text is the reason. Covers the criterion 'records one raw information' and the UNDERDETERMINED entry on the note.
  fails_when: More or fewer than one raw information, chunk or fragment is stored, the chunk text is not the whole content, the fragment is left in a status other than accepted, its text is not the reason, or it is not anchored to the chunk.
  demonstrates: rules/knowledge-base/entity-edit-note
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: the LLM run an accepted entity edit of several changes opens is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
  proves: An accepted edit of six changes records exactly one LLM run of model operator and prompt version operator-edit-v1 whose status is completed, with no network call to a language model. Covers the criterion 'records one LLM run' and the UNDERDETERMINED entry on the run.
  fails_when: Zero or several runs are stored, the model or prompt version differs, the run is left running, or the edit calls fetch.
  demonstrates: rules/knowledge-base/entity-edit-run
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: the raw information of two edits with one reason made at one moment holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own
  proves: Each raw information's content holds the reason and the moment of the edit, and two edits with the same reason at the same frozen moment record two raw informations with distinct contents. A nonce-less implementation would collide on the content hash.
  fails_when: The content omits the reason or the moment, or carries no nonce, so that two edits with one reason and moment yield one identical content, or the second edit is rejected by the store's content-hash uniqueness.
  demonstrates: rules/knowledge-base/entity-edit-note-content
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: an accepted entity edit whose reason was sent surrounded by whitespace records its action's reason, its fragment's text and its note's content with the reason trimmed of that whitespace
  proves: A reason sent padded with tabs is recorded trimmed in the curation action's reason, in the fragment's text, and in the raw information's content. The body is handed to the service directly, because the DTO would trim it first.
  fails_when: Any of the three records keeps the surrounding whitespace, or the note's content does not hold the trimmed reason.
  demonstrates: rules/knowledge-base/entity-edit-reason-trimmed
- file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  name: the writes of an accepted entity edit of several changes run on one connection inside one transaction that commits, with no statement outside it
  proves: The edit's writes run inside one database transaction. The fake pool shows one connection, one BEGIN, one COMMIT, no ROLLBACK, writes inside the transaction, and no statement outside it.
  fails_when: The edit uses more than one connection, writes before BEGIN or after COMMIT, never begins or never commits, or rolls back an accepted edit.
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit that changes nothing is refused exactly when no change has an effect other than unchanged, whether every change is unchanged or the list is empty
  proves: An edit whose every change is unchanged is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES. The same holds for an empty list on an active node. An edit with one unchanged change and one first value is not refused by that rule.
  fails_when: An all-unchanged or empty edit is accepted or refused with another code, or an edit holding one unchanged change and one first value is refused as changing nothing.
  demonstrates: rules/knowledge-base/entity-edit-changes-something
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit that changes nothing records nothing when every one of its changes is unchanged
  proves: An edit refused for changing nothing records no raw information (nor any run, action or attribute). The store after the refusal equals the store before it, and the refusal code is BUSINESS_ENTITY_EDIT_NO_CHANGES.
  fails_when: Any raw information, chunk, fragment, run, attribute, provenance or action survives the refusal, or the refusal code differs.
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit that changes nothing is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes
  proves: An edit of an active node with a reason and an empty list of changes is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES, not as malformed, and records no raw information, no LLM run and no curation action.
  fails_when: The empty list is accepted, is refused with another code, or leaves any record in the store.
  demonstrates: scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit refused after an earlier change would have been recorded leaves no attribute, raw information, LLM run or curation action of the earlier change
  proves: An edit whose second change is refused leaves no attribute its first change would have recorded. A refused edit leaves no LLM run and no curation action. The first change is effectful, so a note and an attribute would have been written before the refusal.
  fails_when: The refusal code is not BUSINESS_UNKNOWN_ATTRIBUTE_KEY, or any attribute, raw information, run, fragment, provenance or action of the first change remains after the refusal.
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit whose set change names a superseded deadline attribute is refused as a conflict and records nothing of the edit
  proves: A superseded deadline attribute named by a set change is refused with BUSINESS_ENTITY_EDIT_CONFLICT and nothing of the edit is recorded. This also covers the criterion that such a refusal leaves no raw information.
  fails_when: The edit is accepted, is refused with another code, or any record of it, raw information included, remains.
  demonstrates: scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: a change naming an attribute that another operation superseded while the edit waited for its lock is refused as a conflict
  proves: A change naming an attribute that another operation superseded while the edit waited for its lock is refused with BUSINESS_ENTITY_EDIT_CONFLICT. The fake flips the attribute's status on the first locking read, so only a decision taken on the state read under the lock refuses.
  fails_when: The edit decides on the attribute's state from before the lock, or reads the named attribute without locking it, and records a succession over a superseded attribute, or refuses with another code.
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: a write that a uniqueness guard of the store refuses is answered as a temporal incoherence
  proves: A write the store refuses with a uniqueness violation (SQLSTATE 23505) is answered BUSINESS_TEMPORAL_INCOHERENT rather than leaking as a driver error.
  fails_when: The driver error reaches the caller, or is answered with another code.
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit whose last write fails after every other record was written leaves no raw information, chunk, fragment, run, attribute, provenance or action, and restores every superseded attribute
  proves: An edit whose curation action write fails, after the note, run, new attributes, provenance and supersessions were written, leaves the store as it was before the edit. The failure's own code reaches the caller, which shows the action write was reached.
  fails_when: Any record of the edit remains after the failure (the note committed on a separate transaction, an attribute left written, a superseded attribute not restored), or the failure is swallowed or recoded.
  demonstrates: constraints/entity-edit-is-atomic
- file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  name: an entity edit failing more than one check failing %s is refused by the check that comes first
  proves: The precedence criteria the service can show. Per change, the key is checked before validity and before the held attributes. The value type is checked before validity. The allowed values are checked before the held attributes and before validity. Validity is checked before the held attributes. An unheld node is refused before any change, as is a node in needs_review. A first change is refused before a second change whose own check would also fail. The cases 'an unknown key and a validity start after its end', 'an unknown key and a superseded attribute', 'a value that does not read as its type and a validity start after its end' and 'a value outside the allowed values and a superseded attribute' are named after criteria. The case 'a value outside the allowed values and a validity stated on a stable key' protects the adjacent allowed-values-before-validity pair of the node's ordering.
  fails_when: Any pair of failing checks is refused by the later check's code, or a later change's refusal wins over an earlier change's.
- file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
  name: a set change whose value is the value the node already holds is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
  proves: Over twelve inputs. A named change with the same value is unchanged and records nothing for each live status (active, uncertain, disputed). It is refused as a conflict for superseded and deleted. A value differing only in case, or only in accents, is not unchanged (correction). With no attribute named on a multiple-current key, an active or uncertain holder of the same value gives unchanged with nothing recorded. A disputed holder gives addition, a superseded holder gives first_value, and another value or a differing case gives addition. Covers the criterion 'An unchanged change records no attribute' and the UNDERDETERMINED entry on the comparison.
  fails_when: The comparison is normalized (case or accents), a superseded or deleted named attribute with its own value is reported unchanged instead of a conflict, a live named attribute of the same value is not reported unchanged, an unchanged change records an attribute, or a disputed or superseded unnamed holder counts as holding the value.
  demonstrates: rules/knowledge-base/entity-edit-unchanged-records-nothing
files:
- path: src/__tests__/unit/curation/edit-entity-world.ts
  effect: Shared fixture for the four edit-entity specs. It holds an in-memory transactional fake of the pg pool and client that answers the exact statements the edit's helpers issue, and snapshots on BEGIN and restores on ROLLBACK. It logs begin, commit, rollback, read and write events per connection. It can fail one table's insert with a chosen code, and can supersede an attribute on the first locking read to model another operation winning the lock. It builds a catalog of one node type with five attribute keys, seeds one active node and one in needs_review, and offers change and edit builders, the mixed six-effect edit with its expected entries, and the clock helpers. No real database is touched.
not_applicable:
- edge_case: absent reason, reason of 1001 characters, malformed valid_from, kind outside set and remove, and malformed identifiers
  why: These are boundary refusals of EditEntityBodySchema (standard DTO-01, EDG-01) and the service receives only a typed body. They belong to the route task and the DTO's own spec, and are listed under untested as the five unmet criteria.
- edge_case: node status merged or deleted instead of needs_review
  why: The not-active rule and its statuses are defined by refuse-inactive-node, which this task only orders. One representative (needs_review, as the criterion names) shows the position of the check, and a second status is the same class.
- edge_case: a validity start equal to the validity end, or only one end stated
  why: The boundaries of the validity rules belong to check-change-validity and are exercised in attribute-change-validity.spec.ts. This task only orders the validity check against the others.
- edge_case: the store unreachable at connect time or a statement timing out
  why: The service does not map availability errors. It rolls back and rethrows whatever the store raises. One representative store failure (the last write failing) is tested for atomicity, and the HTTP rendering of unavailability belongs to the route and the error handler.
- edge_case: two changes of one edit naming the same attribute, or two edits of one node at once
  why: What the edit answers for the first is an implementation inference (see untested), and true concurrency needs a real database. No node decides either.
untested:
- Five criteria expecting VALIDATION_INVALID_FORMAT ahead of the node and change checks have no service-level test, because the implementation records them as unmet. They are a valid_from not written YYYY-MM-DD with an uncatalogued key; no reason with an unheld node; a 1001-character reason with a merged node; a malformed valid_from with an unheld node; and a first change with an uncatalogued key and a second change whose kind is neither set nor remove. The service receives an already typed EditEntityBody (DTO-01), so the code cannot be produced there, and a test calling the DTO schema would prove the DTO task's schema. They can only be shown where the body is parsed, in the route task.
- contracts/knowledge-base/entity-editing is not decided by a finite service test. Its transport clauses (POST /api/v1/nodes/{node_id}/edit, HTTP 200 with no envelope, the HTTP status of each refusal, the VALIDATION_INVALID_FORMAT message and details.issues, the key, item and status the conflict and not-active refusals name) belong to the route and the error mapping, and many of its refusals belong to rules this task does not implement. The accepted-answer shape and the service-level refusal codes are covered by the tests above without claiming the node.
- domain/knowledge-base/entity-edit and domain/knowledge-base/edit-effect are structural declarations (reason plus changes under one node, and a closed set of six effects). They are realized by EditEntityBodySchema and EditEffectSchema, delivered and tested by earlier tasks, and no behavior of this service decides them whole. The edit's six effects are observed in the mixed edit but not asserted as a closed set.
- rules/knowledge-base/entity-edit-check-order is not decided whole. Its first clause, the well-formed request and reason length checked before the node, is a boundary check the service cannot receive. The node-before-changes and change-by-change clauses are tested in the precedence cases without claiming the node.
- rules/knowledge-base/entity-edit-change-check-order is not decided whole. Its first clause (a well-formed change) is the DTO's. The adjacent pairs key-then-value-type and value-type-then-allowed-values cannot be told apart through the service, because both value checks answer BUSINESS_INVALID_ATTRIBUTE_VALUE (and an unknown key has no type to fail). The other pairs are tested without claiming the node.
- 'Implementation inference, behavior, no node decides it: the note, with its raw information, run, chunk and fragment, is recorded lazily at the first effectful change. Final state after rollback is identical either way, and the removal-only edit records no note under it. No test pins this.'
- 'Implementation inference, behavior, no node decides it: each change is checked and recorded before the next is checked. Two changes naming the same attribute therefore refuse the second with BUSINESS_ENTITY_EDIT_CONFLICT. The check-order node says only ''change by change''.'
- 'Implementation inference, behavior, no node decides it: the changes-something refusal is evaluated after every change has passed its checks, so every per-change refusal wins over BUSINESS_ENTITY_EDIT_NO_CHANGES. entity-edit-check-order lists no position for it.'
- 'Implementation inference, behavior, no node decides it: one new Date() taken at the start is the moment of the edit for defaults, supersession times and note content. Tests freeze the clock and assert the moment where a node requires one (removal''s supersession time, the note''s content), not that a single read is shared.'
- 'Implementation inference, behavior, no node decides it: a node type absent from the catalog snapshot is an InvariantError (500) rather than a domain refusal.'
- 'Implementation inference about arrangement: the service signature, its dependency object, the one info log line, and the exported appliedEntry. No test is written over them.'
- 'Facts only a real database decides: that FOR UPDATE actually serializes two concurrent edits, that a real lock wait observes the other operation''s committed state, that a real uniqueness or exclusion constraint raises 23505 where the fake is told to, and that a real ROLLBACK undoes every statement. The fake models a lock wait by flipping state on the first locking read and models rollback by snapshot restore, so these tests show the service''s use of the transaction and its reading under the lock, not Postgres.'
- End-to-end trimming through the route is not shown. EditEntityBodySchema already trims the reason, so the trimming test hands the service a padded body directly to prove the service and its helpers trim as the criteria state. Whether the route parse and the service together trim is the route task's.
- The ADVISORY on counting the 1001-character limit in UTF-16 code units rather than characters concerns the boundary and is not shown here.
contested:
- what: The task lists five VALIDATION_INVALID_FORMAT precedence criteria as its own, while the implementation records them unmet because the service receives a typed body.
  why: The two cannot both hold. Standard DTO-01 puts validation at the boundary, so the service ought not to meet them, but the task's criteria state them against the whole edit as owed here. The criteria likely belong to the route task. Until the plan moves them or the route proves them, this task's criteria are not all provable, and this proof does not pretend otherwise.
- what: BUSINESS_UNKNOWN_ATTRIBUTE_KEY is mapped to HTTP 404 in shared/error-mapping.ts, while contracts/knowledge-base/entity-editing states HTTP 422 over REST for the attribute-key refusal.
  why: The implementation record defers this to the route task. The node states 422 and the table says 404, so the REST answer will contradict the contract until one is changed. No service-level test can show it, since the service raises the code and not the status.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  departure: The file sits flat beside the curation module's other specs in src/__tests__/unit/curation/ instead of mirroring src/modules/curation/service/edit-entity.service.ts under a service subtree.
  why: Every existing spec in that directory, including the sibling entity-edit-*.spec.ts files, sits flat there. Moving only these would split the module's suite across two layouts.
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  departure: The file sits flat in src/__tests__/unit/curation/ instead of mirroring the service's path.
  why: It follows the curation suite's existing flat layout, as the sibling specs do.
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  departure: The file sits flat in src/__tests__/unit/curation/ instead of mirroring the service's path.
  why: It follows the curation suite's existing flat layout, as the sibling specs do.
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
  departure: The file sits flat in src/__tests__/unit/curation/ instead of mirroring the service's path.
  why: It follows the curation suite's existing flat layout, as the sibling specs do.
- cites: TST-04
  file: src/__tests__/unit/curation/edit-entity-world.ts
  departure: The shared fixture sits flat in src/__tests__/unit/curation/ and mirrors no single unit, since it fakes the store for the whole edit service and its helpers.
  why: It is shared by the four edit-entity specs, and the ingestion suite already keeps shared worlds flat beside its specs (reaffirm-consolidation-world.ts, retried-run-world.ts).
---
## What it is
Unit tests over an in-memory transactional fake of pg prove that editEntityService answers node_id, action_id and one underscore-spelled applied entry per change. They also prove the edit writes its note, run, attributes and action together, and the order in which the checks refuse it.

## Notes
None.
