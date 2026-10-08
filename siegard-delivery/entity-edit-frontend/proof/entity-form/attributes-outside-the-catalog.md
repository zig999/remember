---
target: frontend
title: Proof for attributes outside the catalog shown read-only in the entity form
summary: Tests show that the form shows the value of every attribute whose key is outside the catalog, adds no control for it and leaves the catalog fields and the value-type flag as they were.
implementation: sha256:bcc880184e310d9b16813b6ba59d06edcc0a04267d101d1a868b87292544fa35
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-attributes-outside-the-catalog-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: shows the value of an attribute whose key the catalog does not hold, and adds no field for it
  proves: 'The rule''s fact whole: an attribute of the node whose key the catalog does not hold for its type shows its value without a field. The same form is rendered with and without the outside attribute and the test asserts together that the value text is on the form and that the control count grew by zero.'
  fails_when: the value is not shown, or any input, select, textarea, combobox or button appears because of the outside attribute.
  demonstrates: rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: shows the value of every attribute outside the catalog, across keys and across several values of one key
  proves: 'Criterion: an attribute whose key the catalog does not hold for the node''s type shows its value; the test covers two outside keys, one holding two values, beside a catalog of a text, a multi-valued and a closed key.'
  fails_when: any outside-catalog value is missing from the form, for example only the first value of a key is shown, only one key is shown, or an outside value is dropped whenever the catalog has several keys.
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: leaves the form with exactly the controls its catalog keys give, whatever lies outside the catalog
  proves: 'Criterion: an attribute whose key the catalog does not hold for the node''s type shows no field; the control signatures (tag, type, role, aria-label, input value) with and without three outside attributes are equal, including the add and remove controls of the multi-valued key and the closed choice.'
  fails_when: an outside attribute adds, removes or alters any input, select, textarea, combobox or button, such as an extra field, an add or remove control, or an input that stands for it.
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: gives no input, select, textarea, combobox or button that carries or represents an outside-catalog value
  proves: 'Criterion: no field; no control in the form carries any outside value in its value, text, aria-label, placeholder or title.'
  fails_when: an outside value is placed in a form control, for example rendered as a read-only or disabled input, or an existing catalog input receives it as its value.
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: keeps an attribute whose key the catalog holds in its own field group, with its own values
  proves: The attribute whose key the catalog holds still renders in its own field group as before, while outside attributes are present; the text key shows its value and the multi-valued key shows both of its values.
  fails_when: showing outside-catalog attributes disturbs a catalog group, for example a group loses its value, takes another key's value, or an outside value is merged into a group's fields.
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: renders nothing beyond the catalog's field groups when no attribute lies outside the catalog
  proves: A node with no attribute outside the catalog shows nothing extra; the form's whole text equals the concatenated text of the catalog's field groups, so the test pins no wording or place of the outside section.
  fails_when: the form renders any text outside the catalog's field groups for a node whose attributes all have catalog keys, for example a section or heading for outside attributes is rendered even though there are none.
- file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  name: keeps the value-type flag true when an outside-catalog value would be refused by a date or a number type
  proves: 'The outside-catalog attribute enters no form state: outside values that no date or number reading accepts leave data-value-types-accepted true while the catalog''s date field holds a valid value.'
  fails_when: an outside attribute enters the form's fields and the value-type check reads it as a typed field, so a value invalid for a type turns the flag false.
files:
- path: src/features/entities/components/__tests__/entity-form-outside-support.ts
  effect: 'a new shared test helper: it gives the form element, a signature of every control in the form, the controls carrying a given text, and the form''s text beside the concatenated text of the catalog''s groups; it asserts nothing and reads only rendered output.'
not_applicable:
- edge_case: a key of a different node type's catalog, as against a retired key of the node's own type
  why: EntityForm receives only the catalog read for the node's type, so both cases reach it as a key absent from that list; one representative covers the class; the tests use keys named birth_date, retired_key, legacy_date and legacy_number.
- edge_case: an outside attribute whose value is empty or whose key is blank
  why: no criterion or node states a rule for either.
- edge_case: outside-catalog attributes arriving after the form mounted, or the catalog read failing
  why: EntityPage mounts EntityForm only after the catalog read resolves, and that read's failure belongs to the page task; this task's two criteria do not reach it.
- edge_case: two operations on one node at once
  why: the outside section is read-only and holds no operation.
untested:
- 'domain/entity-workspace/entity-edit-session: the task implements it only for the part that the session''s fields are one attribute-field per catalog key; the node describes a whole sitting (open, change, review, confirm, undo, discard) and no finite test decides that; the tests here touch only the fields part, through the unchanged control signature and the value-type flag, so no test claims the node.'
- 'Behavior inference: which statuses count; the implementation shows active, uncertain and disputed outside attributes and hides superseded and deleted ones; no node or decision log states this, so no test pins it, including whether a disputed outside attribute is shown and the rule''s reach over non-current held attributes.'
- 'Behavior inference: grouping by key, order of first appearance, one value per entry and no status or validity beside a value; nothing states it.'
- 'Behavior inference: placement after the field groups, the title "Valores fora do catálogo", the section, dl, dt and dd markup, and the data-testids; these are arrangement and wording, so the tests locate nothing by them.'
- 'Behavior inference: a disputed attribute outside the catalog carries no pointer to the curation queue; the deferred question stays with the specification.'
- 'Behavior inference: with an empty or unloaded catalog every held attribute counts as outside the catalog; no criterion states it, and EntityPage never renders the form in that state.'
- 'The ADVISORY that the accepted answer of show-entity-form in contracts/entity-workspace/entity-screen omits these read-only values: it names no implementation and sits outside this task''s nodes, so no test is owed.'
- 'The ADVISORY that the criteria say "does not hold" where the rule says "no longer holds": the tests treat both as the same set of attributes, as the advisory says they are.'
- 'The ADVISORY that telling which keys the catalog holds needs the list-attribute-keys and read-node reads of contracts/entity-workspace/bff-entity-reads: that is another task''s work, and these tests feed the form the already-read catalog.'
- The value-type flag test also passes on the code before this change, since the flag was already true; it guards only against an outside attribute later entering the value-type check, so it carries no claim to the node.
---
## What it is
This record proves task/entity-form/attributes-outside-the-catalog.
It holds one spec over the rendered form and one shared helper.

## Notes
The suite passed on its first run, run/entity-form-attributes-outside-the-catalog-suite; no existing spec was edited and none failed.
