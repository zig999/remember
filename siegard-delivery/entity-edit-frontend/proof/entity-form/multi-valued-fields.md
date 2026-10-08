---
target: frontend
title: Proof for multi-valued keys as lists of fields
summary: Tests render the real EntityForm and drive its add and remove controls, and two pure tests cover the field state; together they cover the four criteria and the two UNDERDETERMINED entries, with one node claimed.
implementation: sha256:2b03160b3bb2bd006cb7e372e6298208057eef6c86e614b9b922002930f84af5
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-multi-valued-fields-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: shows one field for each current attribute the node holds of the key and none for a non-current one
  proves: A key that allows multiple current values shows one field for each current attribute the node holds of it.
  fails_when: a multi-valued key renders one field only, renders a field for the non-current attribute, or renders any count other than the number of current attributes.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: starts each field of the key with the value of its own attribute
  proves: Each of those fields starts with the value of its own attribute.
  fails_when: any field of the key starts empty, or with another attribute's value, so that the values read at open are not exactly the held values (for example every field showing the first value).
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: adds one field to the key when the owner adds a field
  proves: The owner can add a field to a key that allows multiple current values.
  fails_when: pressing the add control adds no field, or adds more than one.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: starts an added field empty, whatever values the key already holds, and leaves the held fields as they were
  proves: 'UNDERDETERMINED entry 1: No criterion says that a field the owner adds starts empty and from no current attribute. Passes: an add action that fills the new field with a held value or ties it to a current attribute. This test covers the empty-start half, observed on the rendered field.'
  fails_when: the add action fills the new field with a value the key already holds, or disturbs the values of the held fields.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: removes the field the owner removes and leaves the others holding their own values
  proves: The owner can remove a field from a key that allows multiple current values. The test removes the middle one of three, so it also distinguishes removing the right field from removing the first or last.
  fails_when: the remove control removes no field, removes a field other than the one it belongs to, or changes the values of the remaining fields.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: keeps what the owner typed in a field when another field of the key is removed
  proves: 'UNDERDETERMINED entry 2: the criteria require only each field''s starting value, not that each field stays tied to its own attribute with item_id and started_with. Passes: a list of plain strings with no item_id or started_with per field. This test covers the behaviour half: each field keeps its own state across a removal.'
  fails_when: removing one field resets the remaining field to its starting value, shifts the removed field's value onto it, or otherwise lets state leak between fields.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: offers no add or remove control on a key that does not allow multiple current values
  proves: The rule a-multi-valued-key-is-a-list-of-fields gives the add and remove capability to a key that allows multiple current values; the test guards the accident of every key getting the controls.
  fails_when: a key whose catalog entry has allowsMultiple false renders an add or remove control.
- file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  name: lists a field per current attribute and lets the owner add one and remove one
  proves: A key that allows multiple current values shows one field for each current attribute the node holds of it and lets the owner add and remove fields; one sequence decides the rule whole, from the open list through an add to a remove.
  fails_when: the open list differs from the current attributes, an add does not append an empty field, or a remove does not drop exactly the chosen one.
  demonstrates: rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
- file: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
  name: ties each field of a multi-valued key to its own current attribute, with the value it started with
  proves: 'UNDERDETERMINED entry 2: each entry carries its own itemId, startedWith and value, with the non-current attribute left out.'
  fails_when: the entries are plain strings, or lack itemId or startedWith, or carry another attribute's id, or include the non-current attribute.
- file: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
  name: builds a field added to a key from no current attribute and with no value
  proves: 'UNDERDETERMINED entry 1: this test covers the no-current-attribute half on the entry the add action is built from (emptyField).'
  fails_when: emptyField returns an entry with a non-null itemId, or a non-empty startedWith or value.
files:
- path: src/features/entities/components/__tests__/entity-form-multi-support.tsx
  effect: 'a new shared test helper beside entity-form-support.tsx, which is unchanged: it builds a multi-valued catalog key and finds a key''s group, inputs and add and remove controls, presses a control inside act, removes a field identified by its value, and retypes a field by dispatching an input event.'
not_applicable:
- edge_case: a multi-valued key holding a disputed attribute
  why: the advisory says the list steps aside, but the fact is held by a-disputed-key-shows-without-a-field-and-points-to-curation, which this task does not implement; the existing field-groups test covers the disputed key.
- edge_case: two operations on one key at once, or a slow or failing dependency
  why: the list is local form state with no dependency and no concurrent writer, and no obligation of this task states a behaviour there.
- edge_case: a removed field that was added in the same sitting
  why: the criteria and nodes say only that the owner can remove a field; the implementation's treatment of this is an inference (see untested).
- edge_case: the order of the fields of a multi-valued key
  why: no node fixes it; the tests compare sorted values and pair controls by position within the group, so they do not pin order.
untested:
- 'Multi-valued key with no current attribute: whether it shows zero fields or one empty field is decided by no node (task Notes, "no node resolves the two"); the implementation chose one empty field and no test pins it.'
- 'rules/entity-workspace/fields-start-from-the-current-values: not claimed on any test; its clause "empty where the node holds none" is exactly what the task Notes leave unresolved for a multi-valued key, so no finite test decides the node whole without pinning that choice; criterion 2 is proven on its own and the single-valued case is covered by the earlier task''s tests.'
- 'rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty: not claimed on any test; "starts empty" is observed through the rendered field, but "from no current attribute" (itemId null) is not observable through EntityForm, which holds its state and its submission, until the review and save tasks exist; it is only checked on emptyField, which does not prove the add action uses it, so the wrong pass of tying the added field to a current attribute is only caught if emptyField itself is wrong.'
- 'domain/entity-workspace/attribute-field: no finite test decides it; its fact includes valid_from and valid_to, which belong to the validity task.'
- 'domain/entity-workspace/entity-edit-session: an aggregate whose operations (review, save, undo, discard) are not reached by this task, and no finite test decides it.'
- 'contracts/entity-workspace/entity-screen: spans four operations of which this task reaches only part of show-entity-form, so no test decides it.'
- 'Implementation inferences about behaviour, none pinned: removing a field leaves no removed flag; a multi-valued key can end with no field and then shows its title and the add control; a single-valued key holding several current attributes shows only the first; focus moves to the add button after a removal; the accessible names ("Adicionar valor a {key}", "Remover valor N de {key}", "{key} (valor N)") are not asserted.'
- 'Field order within a multi-valued key (the order the node read lists them): an inference with no node, deliberately not asserted.'
---
## What it is
This record proves task/entity-form/multi-valued-fields.
It holds one rendered-form spec, one builder spec and one shared helper.

## Notes
The suite passed on its first run, run/entity-form-multi-valued-fields-suite; no existing test was affected by the change.
