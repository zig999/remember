---
target: frontend
title: Proof for the closed-key choice in the entity form
summary: Tests that a closed key's field offers exactly its catalog's allowed values, by label (by value when label-less), in delivered order, holds the picked allowed value's own value, starts empty or on the held value, clears, and behaves the same inside multi-valued keys, while an open key keeps its text input.
implementation: sha256:239a2002ea9fc56de196c13695921f763bafd93d0f2b99ba5a3ecc7ca9ef526f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-closed-key-fields-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: offers a closed key every allowed value and nothing else, each by its label, a label-less one by its own value, in the order the catalog gives them
  proves: 'The fact of rules/entity-workspace/a-closed-key-offers-only-its-allowed-values, whole: a field of a closed key offers only its allowed values, in their order, each by its label and, for a value with no label, by its value. One catalog with a labelled value, a null-label value and an empty-label value, delivered in an order that is neither alphabetical by shown text nor by value nor by sortOrder.'
  fails_when: the option list gains an option (blank, placeholder, held value), drops an allowed value, shows a value instead of its label, shows a label-less value as an empty option or leaves it out, or the list is re-sorted by label, value or sortOrder.
  demonstrates: rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: offers a closed key only its allowed values when the node holds a current value outside them
  proves: A field of a key with allowed values offers only those values.
  fails_when: a current value the node holds that is not among the allowed values is added to the field's options, or any option beyond the catalog's allowed values is offered.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: shows each allowed value by its label, not by its own value
  proves: The allowed values are shown by their labels.
  fails_when: an option shows the allowed value's value instead of its label when the label is present.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: keeps the order the catalog delivers the allowed values in, whatever their sort orders and whatever alphabetical order would give
  proves: The allowed values are shown in the order the catalog gives them; and the ADVISORY that the form must not re-sort what the catalog delivers.
  fails_when: the options are re-sorted by label ascending or descending, by value ascending or descending, or by sortOrder ascending or descending, or the delivered order is otherwise changed.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: shows an allowed value that has no label by its own value, neither as an empty option nor left out
  proves: 'UNDERDETERMINED entry: an allowed value that has no label (null) is shown by its own value, as the rule decided.'
  fails_when: a null-label allowed value is shown as an empty option or is left out of the options.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: shows an allowed value whose label is the empty string by its own value, not as an empty option
  proves: 'UNDERDETERMINED entry: a label-less allowed value is never an empty option; the empty-string label is the other class of label-less value.'
  fails_when: an allowed value whose label is the empty string is rendered as an option with empty text, or left out.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: holds the picked allowed value's own value in the form rather than its label
  proves: 'The closed field holds the allowed value''s value, observed through the form''s value-type check on a number-typed closed key whose labels are not numbers: after picking "Dois" the field shows "Dois" and the form still accepts its values.'
  fails_when: picking an option stores its label (or anything not the allowed value's value) in the form, so the number check refuses it and the accepted flag turns false; or the pick does not take effect, so the field does not show the picked label.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: starts with nothing selected for a closed key the node holds no value for
  proves: 'The empty starting state of a closed field: no allowed value is selected when the node holds no current value for the key.'
  fails_when: a closed field with no held value starts with an option selected (for example the first allowed value).
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: starts with the node's current value selected, shown by its label
  proves: A closed field holds the node's current value and shows the matching allowed value, by its label, as selected.
  fails_when: the held current value is not selected, a different option is selected, or the selection shows the value instead of the label.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: lets the owner return a held closed value to nothing selected
  proves: A closed field whose value was chosen can be emptied again (the form's empty member is representable for a closed key).
  fails_when: no control other than the choice itself is offered while a value is held, or using it leaves the value selected.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: makes every entry of the key a choice holding its own value, with no text field
  proves: In a multi-valued closed key every entry is a choice showing its own held value.
  fails_when: an entry of a multi-valued closed key renders as a text input, an entry shows another entry's value, or an entry is missing.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: adds an entry that is an empty choice offering the allowed values
  proves: Adding a value to a multi-valued closed key still works and the new entry is a choice over exactly the allowed values, with nothing selected.
  fails_when: add stops producing an entry, the new entry is a text input, it starts with a value selected, or it offers anything but the allowed values.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: removes the entry the owner removes and leaves the others holding their values
  proves: Removing a value from a multi-valued closed key still works and leaves the other entries holding their own values.
  fails_when: the remove control removes a different entry, removes none, or the remaining entries lose or swap their selected values.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  name: renders a text input for a key without allowed values and a choice for a key with them
  proves: An open key (allowedValues null) still renders a text input and no choice, while a closed key renders a choice and no text input.
  fails_when: an open key starts rendering a choice, or a closed key keeps rendering a free text input.
files:
- path: src/features/entities/components/__tests__/entity-form-closed-support.ts
  effect: 'a new shared helper for the closed-key spec: it builds closed catalog keys and allowed values, opens the ui-kit Select of a field by its combobox role and reads its options and the selected ones by role and aria-selected, picks an option by its label, clears a held choice through the field''s one non-combobox control, and removes a multi-valued entry by the label it shows; it reuses entity-form-support and entity-form-multi-support and no existing test file was edited.'
not_applicable:
- edge_case: an allowed list with duplicate values
  why: no criterion or node states that allowed values are unique or what a duplicate shows; the catalog's own uniqueness is not this task's claim.
- edge_case: a closed key whose attribute the node holds as disputed
  why: the disputed-key rule (no field, pointer to curation) belongs to the field-groups and disputed-keys tasks; this task changed only what a field renders and the existing disputed-key tests are over open keys, so no obligation here reaches it.
- edge_case: a non-current (superseded) attribute held for a closed key
  why: which attributes start a field is the starting-values and multi-valued tasks' fact; this task's obligations are about what a field offers, not which attributes start one.
- edge_case: a dependency failing or answering slowly, two operations on one subject at once
  why: the closed-key choice performs no request and holds no shared state beyond the form's own value; the read side is another task's.
- edge_case: absent description (help text) on a closed key
  why: help text is unchanged by this task and protected by the field-groups proof; no closed-key obligation reads it.
untested:
- 'domain/entity-workspace/attribute-field: the node''s fact spans item identity, started-with comparison, value and validity members; no finite test of this task decides it whole; this task touches only the value member for closed keys, observed in part by the number-typed pick test and not claimed as the node.'
- 'contracts/entity-workspace/entity-screen: the contract holds four operations with many refusals; the closed-key clause of show-entity-form is exercised by the tests above but no finite test of this task decides the contract whole, and the other clauses belong to sibling tasks.'
- 'contracts/entity-workspace/bff-entity-reads: the contract''s facts are the request shapes and the ordering of the items of list-attribute-keys, which this task does not issue or order; only the ADVISORY consequence (the form does not re-sort delivered allowed values) is exercised, by the order test.'
- 'That the picked allowed value''s value is what a save or a review will send: the review, the changed-field computation and the save do not exist yet; the value held is observed only through the form''s value-type check seam on a number-typed closed key.'
- 'How an emptied closed field becomes a removal or no change in the edit payload, and how a held out-of-set value is treated on review or save: deferred by the implementation to the review and save tasks; no node of this task states it.'
- 'Inference, the placeholder text "Selecionar valor" for the empty choice: no node states it; the tests read selection through aria-selected, never through placeholder text.'
- 'Inference, that clearing is a separate "Limpar <nome>" icon button with an Eraser icon: the wording, icon and the separate-button mechanism are the implementer''s; the clearing test locates the field''s one non-combobox button by structure and pins only that some such control returns a held value to nothing selected; focus returning to the combobox after clearing is not tested.'
- 'Inference, the muted line "Valor atual fora dos valores permitidos: <valor>" and its aria-describedby link for a held value outside the allowed set: no node states the line or its wording; the out-of-set test pins only that the value is not offered as an option.'
- 'Inference, role=group with aria-label on the choice container, aria-invalid not set on a closed field, onBlur and ref not wired, and the title rendered as a plain p rather than a Label: accessibility arrangement the implementer chose; no node states them.'
- 'Inference, an allowed value whose label is only whitespace is shown by its own value: the implementation extends "no label" from null and empty to whitespace; no node states it; the empty-string test is the only blank-label case tested besides null.'
- 'Inference, an allowed list that is non-null but empty renders a closed choice with no options (the kit''s "Nenhuma opção disponível."): no node says whether a key with an empty allowed set is closed; not pinned.'
- 'Inference, no Zod rule was added for closed keys: nothing in a node states one; not tested.'
- 'The open contradiction on the backend side about whether each allowed value carries a label and a sort order: the form tolerates absent labels by the rule''s by-value reading (tested) and ignores sortOrder (tested by the order test); how the wire delivers either is the retrieval contract''s to settle.'
---
## What it is
This record proves task/entity-form/closed-key-fields.
It holds one form spec over the real EntityForm and one shared helper.

## Notes
The suite passed on its first run, run/entity-form-closed-key-fields-suite.
