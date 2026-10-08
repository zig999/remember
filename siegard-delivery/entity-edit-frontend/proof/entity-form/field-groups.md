---
target: frontend
title: Proof for one field group per catalog key, starting from current values
summary: Rendered-form tests and one builder test hold up the catalog-order field groups, the current-value seeding, the catalog description as help text and the excluded fields the task's notes name, leaving the sibling-owned behaviors unproven.
implementation: sha256:7ae3fb0ae696ce9cb61b80c74b252bc40ad1fe9d1a0d82b1d014cb1de8aca381
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-field-groups-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
  name: holds one field for every catalog key of the node's type, in the order the catalog lists them
  proves: The form holds one group of fields for each attribute key the catalog holds for the node's type. The groups follow the order in which the catalog lists the keys. The catalog is [gamma, alpha, beta], which is neither alphabetical nor the node's attribute order [beta, gamma]; the key alpha, which the node holds no attribute for, still gets its field.
  fails_when: the form drops the field of a key the node holds no attribute for, adds fields per held attribute instead of per catalog key, re-sorts the catalog alphabetically, or follows the node's attribute order rather than the catalog's.
  demonstrates: rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
- file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
  name: shows each field the description the catalog holds for its own key as help text
  proves: Each field shows as its help text the description the catalog holds for its key. Three keys carry three different descriptions and each description is reached through the aria-describedby of that key's own field.
  fails_when: a field shows no help text, shows another key's description, shows a text other than the catalog's description, or the help text is not linked to its field through aria-describedby.
  demonstrates: rules/entity-workspace/a-field-shows-its-key-description-as-help-text
- file: src/features/entities/components/__tests__/EntityForm.starting-values.spec.tsx
  name: starts each field with its key's current attribute value, and empty where the key holds no current attribute
  proves: A field of a key for which the node holds a current attribute starts with that attribute's value. A field of a key for which the node holds no current attribute starts empty. One key holds a superseded attribute listed before its current one, one holds only a superseded attribute, one holds nothing, and one holds a current attribute listed before the other keys' attributes, so the pairing is by key and not by the node's order.
  fails_when: a field is seeded from a non-current attribute, or from the first attribute of its key whatever its currency; a key holding only a non-current attribute starts non-empty; a key holding nothing starts with a placeholder or another key's value; values are paired with fields by the node's attribute order rather than by key.
  demonstrates: rules/entity-workspace/fields-start-from-the-current-values
- file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
  name: adds no field for an attribute whose key the catalog does not hold
  proves: 'UNDERDETERMINED entry 2: an attribute whose key the catalog no longer holds is not given an editable field; the node holds such an attribute and the form still holds exactly one field per catalog key.'
  fails_when: the form adds an editable field for each attribute whose key is outside the catalog, as the note says a form could pass wrongly.
- file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
  name: offers no field, prefilled or empty, for a key holding a disputed attribute
  proves: 'UNDERDETERMINED entry 1, over the fact that a key holding a disputed attribute shows without a field: the disputed key''s current attribute is not offered as an editable prefilled field, and the other key''s field still renders.'
  fails_when: the form shows an editable field prefilled with a disputed attribute's value inside its key's group, shows an empty editable field for the disputed key, or renders nothing at all (the other key's field is asserted too).
- file: src/features/entities/components/__tests__/entity-form-schema.spec.ts
  name: records the current attribute a field started from, the value it started with and its value, for a key holding $held
  proves: 'The attribute-field node''s item_id (the current attribute the field started from), started_with (the value it started with) and value: a key holding a current attribute records its id and value, and a key holding only a non-current attribute records no item id and empty values.'
  fails_when: item_id points at a non-current attribute or at none for a key holding a current one, started_with is not the starting value, started_with and value diverge at load, or a key with no current attribute records a non-empty value.
files:
- path: src/features/entities/components/__tests__/entity-form-support.tsx
  effect: 'shared helper for the new specs: it builds catalog keys, held and stale attributes and a node, mounts the real EntityForm with props { node, attributeKeys }, unmounts it, and reads the rendered fields'' values and their aria-describedby help texts in DOM order.'
not_applicable:
- edge_case: a catalog holding no key
  why: the criterion maps each key to a group, so zero keys gives zero groups by the same mapping; what the page shows for an empty catalog belongs to the entity-page task.
- edge_case: two keys sharing one identity, or a duplicate attribute for one key
  why: catalog keys are unique by identity; two current attributes of one key are the multi-valued-fields task's case, which no node of this task states.
- edge_case: the catalog or node read failing, loading, or arriving late
  why: these states belong to the entity-page and node-and-catalog-reads tasks, which are already proven; this task's form is mounted only with data in hand.
- edge_case: a non-active node
  why: the active-node condition is owned by the entity-page task, and its tests already exist.
- edge_case: two operations against the form at once
  why: this task adds no operation; typing, review and save belong to sibling tasks.
untested:
- 'The third UNDERDETERMINED note: a multi-valued key shows one field per current attribute, while the criteria speak of one attribute per key, and the note passes a form that shows one field prefilled with only one of two current attributes; the excluding fact is held by a-multi-valued-key-is-a-list-of-fields, a node of the multi-valued-fields task, which this task does not implement; a test would require two fields and would fail against this implementation by design, because the implementation records the case as deferred; the proof does not claim sibling ground, so the multi-valued task owes this test.'
- 'domain/entity-workspace/entity-edit-session: its fact spans fields, reason, reviewing, undo_deadline and the operations change-field, review-changes, confirm-save, undo-save and discard-changes; this task reaches only the loaded fields, so no finite test decides the node whole.'
- 'domain/entity-workspace/attribute-field: its fact includes valid_from and valid_to, which the validity task adds, so the attribute-field test over item_id, started_with and value is not claimed as the node whole; item_id and started_with are observable only through the pure builder buildFormValues until the review and save tasks consume them.'
- 'contracts/entity-workspace/entity-screen: it states show-entity-form with closed-key allowed values, the disputed-key pointer and the loading and error answers, plus show-review, save-edit and show-entity-list; no finite test decides the whole contract here, and the field-group, starting-value and help-text parts are exercised by the tests above.'
- 'contracts/entity-workspace/bff-entity-reads: the wire facts belong to the delivered knowledge-base-client tasks and their tests; this task adds no request, and only that the form does not re-sort the catalog it is given is observed, in the order test.'
- 'Inference: a key with a null or empty description shows no help text and no aria-describedby; no node states it, so it is recorded as unproven rather than pinned.'
- 'Inference: the visible label of a group is the key''s name, with a role=group container, so the tests do not pin it; fields are paired with catalog keys by DOM order, which the order criterion licenses, so a failure of the order test also fails the starting-values and help-text tests and the diff in the order test names the cause.'
- 'Inference: every field is a plain text input whatever the key''s value type; value-type inputs and closed-key choices belong to sibling tasks.'
- 'Inference: typed values reset to the node''s current values when the node or catalog reference changes, and pressing Enter does not submit; no node states either, and the implementation says the save task will replace the reset effect.'
- 'Inference: a key counts as disputed when any attribute of it is disputed, current or not, and the group then shows only title and help text; only the no-field half is tested, over a current disputed attribute; the rest is owned by the disputed-keys task: the values display, the curation pointer, and a not-current disputed attribute.'
- 'Shape inferences: the flat fields array and its camelCase names; the builder test reads one entry by attributeKey but still reads attributeKey, itemId, startedWith and value, so a rename or restructure of the state breaks it without the behavior changing.'
- 'The ADVISORY that the catalog order is the order bff-entity-reads states: the form-level test shows the form keeps the order it is given, and the mapping from the wire to that order is exercised by the earlier knowledge-base-client proofs, not here.'
---
## What it is
This record proves task/entity-form/field-groups.
It holds two form specs, one builder spec and one shared helper.

## Notes
The suite passed on its first run, run/entity-form-field-groups-suite.
