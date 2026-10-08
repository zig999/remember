---
target: backend
title: Proof for recording a first value or an addition as a new attribute
summary: Unit tests over an in-memory fake pg client prove the state, run, provenance and validity of a new attribute recorded for a first value or an addition, and that the helper updates no other attribute.
implementation: sha256:921fcaf2e367a569532580a4b5406183dafbc1cae82967e7b7f4d43c5428f828
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-new-attribute-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: the status of the attribute an entity edit records for a first value or an addition is active
  proves: The new attribute's status is active.
  fails_when: recordNewAttribute writes the new attribute with any status other than active, for example uncertain or proposed.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: the confidence of the attribute an entity edit records for a first value or an addition is 1.0
  proves: The new attribute's confidence is 1.0.
  fails_when: the new attribute is written with a confidence other than 1.0, for example the fragment's confidence or a threshold value.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: the run of the attribute an entity edit records for a first value or an addition is the LLM run of the edit's note
  proves: The new attribute is recorded under the edit's LLM run.
  fails_when: created_by_run_id is left empty or set to anything but the llmRunId of the note record passed in.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: the provenance of the attribute an entity edit records for a first value or an addition is exactly one, pointing at the edit's information fragment
  proves: The new attribute holds a provenance pointing at the edit's information fragment.
  fails_when: no provenance row is written, it points at a different attribute or fragment such as the raw information or chunk, or more than one row is written.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a set change to a temporal key that states no validity start, in a server zone behind UTC is recorded with today's UTC calendar date as the start and the basis received
  proves: A set change to a temporal key that states no validity start is recorded with today as its validity start, and with the basis received. The date is the UTC calendar date of the moment of the edit, tested at the first instant of a UTC day under America/Sao_Paulo. This also covers the first UNDERDETERMINED note.
  fails_when: the unstated start is read in the server's local time zone, so the previous day is recorded at the first instant of a UTC day; or the start is any other date; or the basis is anything but received.
  demonstrates: rules/knowledge-base/entity-edit-start-defaults-to-today
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a set change to a temporal key that states no validity start, in a server zone ahead of UTC is recorded with the UTC calendar date of the edit as the start
  proves: The UTC boundary on the other side. The unstated start is the UTC calendar date at the last instant of a UTC day under Pacific/Kiritimati, not the next local day.
  fails_when: the unstated start is read in a zone ahead of UTC, so the following day is recorded at the last instant of a UTC day.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a set change that states a validity start is recorded with that start and the basis stated
  proves: A set change that states a validity start is recorded with that start, and with the basis stated.
  fails_when: the stated start is replaced by today's date or altered, or the basis recorded is anything but stated, for example received.
  demonstrates: rules/knowledge-base/entity-edit-stated-start-is-stated
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a set change to a temporal key and the validity end it states is recorded holding that end, or none when it states none, whether or not it states a start
  proves: The new attribute holds the validity end the set change states, and none when the change states none, tested with a stated start and end, with an end and a defaulted start, and with neither. This is the second UNDERDETERMINED note.
  fails_when: the stated end is dropped or replaced by another date such as the start or today, in either start branch; or an end is invented when none is stated.
  demonstrates: rules/knowledge-base/entity-edit-stated-end-is-held
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a new attribute of a key that is not temporal holds no validity start, no validity end and no basis, whether or not the change states a validity
  proves: An attribute recorded for a key that is not temporal holds no validity start, no validity end and no basis. A first value of a stable key such as cnpj is tested, both bare and with a validity stated. This is the third UNDERDETERMINED note.
  fails_when: every new attribute without a stated start gets today's date and the basis received whatever its key's temporality, or a stated start or end is copied onto a stable key's attribute.
  demonstrates: rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: a first value names no attribute it supersedes and leaves the key's historical attribute as it was
  proves: A first value supersedes no attribute. A key whose only attribute is superseded history is the representative.
  fails_when: the new attribute names an earlier attribute as the one it supersedes, for example the latest historical one, or an existing row is changed by the recording.
- file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  name: an addition leaves every other attribute of its key, and of other keys and nodes, as it was
  proves: An addition leaves every other attribute of its key as it was. A multi-valued key holding an active and an uncertain attribute is tested, with rows of another key and another node alongside.
  fails_when: the recording closes, supersedes, rejects or otherwise changes any pre-existing attribute row of its key, of another key, or of another node.
not_applicable:
- edge_case: absent or empty input, such as a set change with no value
  why: The DTO schema refuses a set change without a value before the helper is reached, and no criterion or node states a refusal in the helper itself.
- edge_case: a duplicate of the value or of the provenance
  why: The helper always inserts a fresh row and a provenance for that new id. No criterion or node states uniqueness for this task, and the effect decision that makes a change a first value or an addition belongs to assign-change-effect.
- edge_case: two edits against one node at once
  why: Locking and succession ordering belong to the caller's transaction and to other tasks. This helper takes no lock, and no criterion or node of this task states concurrent behavior.
- edge_case: the pg client failing partway, with the attribute inserted and the provenance not
  why: Rolling back a multi-statement edit is the caller's transaction, which no entry point yet wires. No criterion or node of this task states it, so a test would pin behavior nobody decided.
- edge_case: a validity start after the validity end, or a stable key stating a validity
  why: These are refused earlier by checkChangeValidity, which has its own proof. The stable-key case is exercised here only as the node states what is held.
untested:
- 'rules/knowledge-base/entity-edit-new-attribute-state: states that every new attribute an entity edit records is active at confidence 1.0 under the edit''s run. Succession and correction attributes are not recorded by this task and no entry point exists, so no finite test decides the whole fact. The first-value and addition half is exercised by the three criterion tests, which name no node.'
- 'rules/knowledge-base/entity-edit-first-value: only the recording half (a new active attribute naming no superseded attribute) is exercised. The condition (no live attribute of the key) and the effect label first-value belong to assign-change-effect, so no test here decides the whole fact.'
- 'rules/knowledge-base/entity-edit-addition: only the recording half (a new active attribute beside the others, closing none) is exercised. The condition (multi-valued key, value not held by an active or uncertain attribute) and the effect label addition belong to assign-change-effect.'
- 'rules/knowledge-base/entity-edit-provenance: the fragment provenance of a first value or an addition is tested, but the fact also states the copied provenance of the superseded attribute for a correction. Nothing in this task records a correction, so no test over this task decides the whole fact.'
- 'rules/knowledge-base/unrecorded-temporality-is-not-temporal: constrains how any reader treats an attribute key. The helper''s AttributeKeyRow types is_temporal as a boolean, so a key with no recorded temporality cannot be built without a type assertion. The non-temporal branch is proven for is_temporal false only, and the reading of a missing flag is unproven here.'
- 'domain/knowledge-base/node-attribute: a shape (aggregate-root attributes and relationships) with no finite behavioral test. The tests exercise the fields the task writes, but the declared structure and the schema are not decided here.'
- 'domain/knowledge-base/attribute-change: a value-object shape. The helper reads value, valid_from and valid_to of a set change, and no finite test decides the structure as the node states it.'
- 'Database constraints (valid_from_source required when valid_from is set, valid_from < valid_to, supersedes_attribute_id distinct from id, enum casts on the INSERT): only a real database decides these, and the shared Neon database was not touched. The fake client parses the INSERT''s column list and values positionally.'
- 'Inference, behavior: the value is stored as the change states it, with no canonicalisation and with the value type from the key''s catalog row. No node decides it, so no test pins it.'
- 'Inference, behavior: recorded_at is left to the column default and not taken from the edit moment. No node ties recorded_at to the edit''s moment, so it is unproven.'
- 'Inference, behavior: recordNewAttribute does not check that the change is a first value or an addition, and it throws an InvariantError when a set change states no value. Neither is stated by a criterion or node, so neither is pinned.'
- 'Inference, arrangement: the status and confidence constants live in the helper''s own file and not in OPERATOR_NOTE_CONFIDENCE. This is a naming and placement choice, not behavior, and gets no test.'
- 'Inference, behavior: any stated start on a temporal key gets the basis stated because the change carries no basis field. The stated-start test exercises this and names its node entity-edit-stated-start-is-stated, which does state it, so it is not an unspecified inference.'
- The three UNDERDETERMINED notes are all closed by tests named above. The two REMAINDER notes assigned to record-succession, record-correction and assign-change-effect are not this task's obligations and have no test here.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  departure: The spec file sits in src/__tests__/unit/curation/ and does not mirror the unit's path src/modules/curation/service/ under the unit subtree.
  why: Every sibling spec for the entity-edit helpers (entity-edit-note, entity-edit-attributes, entity-edit-effect) sits flat in src/__tests__/unit/curation/. Mirroring the path for this one file would split the suite across two layouts.
---
## What it is
Unit tests over an in-memory fake pg client prove the state, run, provenance and validity of a new attribute recorded for a first value or an addition, and that the helper updates no other attribute.

## Notes
None.
