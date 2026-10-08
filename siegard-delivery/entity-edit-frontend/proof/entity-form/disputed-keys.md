---
target: frontend
title: Proof for the disputed-key rendering in the entity form
summary: Table-driven and single-case tests decide, over the rendered form, which keys count as disputed, that a disputed key shows its values with no field and one link to /curation reading "Abrir na fila de curadoria", and that a sibling key is untouched; the shared mount helper now gives every EntityForm mount router context.
implementation: sha256:3167277e64ed794e9ba7f2da6c83f1a671c2cd01ad717c2694444f60e7f5bb0c
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-disputed-keys-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: 'decides a key''s disputed state from the status of its attributes alone: $label (nine rows: disputed current; disputed not current; current disputed with validity ended; disputed not current beside a current active one; current disputed beside a superseded one; active current; uncertain current; superseded; deleted)'
  proves: 'A key holding an attribute whose status is disputed shows its values without a field and points the owner to the curation workspace, whether or not that attribute is current or in effect; superseded or deleted attributes never make a key disputed. Also UNDERDETERMINED entry 1: a disputed non-current attribute makes its key disputed, an active or uncertain current attribute does not, and the statuses of the key''s other attributes do not matter.'
  fails_when: a disputed attribute that is non-current, or whose validity ended, leaves its key editable (a field, no pointer); a key is disputed because of another attribute's status, or a superseded, deleted, active or uncertain attribute makes its key disputed (no field, a pointer); or a disputed key's own value is not shown as text in its group.
  demonstrates: rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: shows every value a disputed key holds
  proves: A key with a disputed attribute shows its values (several values of one multi-valued key, all disputed).
  fails_when: the group shows only one of the key's disputed values, or none.
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: shows no field and no add or remove control for a disputed key that is $label (text key; closed-choice key; multi-valued key)
  proves: 'A key with a disputed attribute shows no field, for each kind of field the form could otherwise offer: no text input, no choice control, and no add or remove control.'
  fails_when: a disputed key's group still holds an input, select, textarea, combobox or button, such as a text field, a closed-choice control, or a multi-valued add or remove control.
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: shows the pointer in the disputed key's group alone and keeps the field of a key beside it
  proves: A key with a disputed attribute shows a pointer, and a key without a disputed attribute shows no pointer and still renders its field.
  fails_when: a key beside a disputed one gets a pointer, the disputed key shows none, or the sibling key loses its field.
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: leads to the curation address when the pointer is followed
  proves: 'A key with a disputed attribute shows a pointer to the curation workspace: activating it navigates to /curation.'
  fails_when: the pointer is plain text, is not a working link, or navigates to an address other than /curation.
- file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  name: makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila de curadoria'
  proves: 'The pointer is a link to /curation carrying no search key, reading "Abrir na fila de curadoria" with no closing period. Also UNDERDETERMINED entry 2: it excludes plain text with no link, a link carrying an item search key, and a link reading "Ver na curadoria.".'
  fails_when: the group holds no link, more than one link, a link whose text differs in any character (including a closing period), or whose href is anything but exactly /curation, such as one with a ?item=... search.
  demonstrates: rules/entity-workspace/a-disputed-key-links-to-the-curation-queue
files:
- path: src/features/entities/components/__tests__/entity-form-router-support.tsx
  effect: 'new shared test helper: mountFormInRouter mounts EntityForm as the component of an index route inside a memory-history router that also holds a /curation route with a marker page, and returns the root, container and router; it is the only place a form is mounted, so every mount has router context.'
- path: src/features/entities/components/__tests__/entity-form-support.tsx
  effect: 'existing mount helper changed so every EntityForm mount has router context: renderForm now delegates to the new renderRoutedForm, which uses mountFormInRouter and registers the placement for unmountForms; renderForm keeps its signature and return value and renderRoutedForm additionally returns the router; no existing spec or assertion was edited and no other existing test file was touched.'
not_applicable:
- edge_case: an attribute's effective status or flags deciding whether its key is disputed
  why: the node read the form receives (NodeAttribute) carries no effective status or flag, so no input can vary them; the status-only rule is decided over status, currency and validity, which the read does carry.
- edge_case: a catalog key with no attribute held, and a node with no attributes
  why: no obligation of this task treats them differently from a key with no disputed attribute; the existing field-group specs own the empty field and the table's non-disputed rows show the field and no pointer.
- edge_case: an empty or absent value string on a disputed attribute
  why: no criterion or node states what a disputed key shows for an empty value.
- edge_case: a duplicate of the same value among a key's disputed attributes
  why: no node claims uniqueness of what the group lists.
- edge_case: two operations against the form at once, or a slow or failing dependency
  why: the disputed-key rendering is a pure function of the node read and the catalog the form is handed; this task has no dependency that can fail.
- edge_case: the form of a node that is not active
  why: the ADVISORY note says the pointer applies only on the form of an active node; that gate belongs to rules/entity-workspace/the-form-is-offered-only-for-an-active-node, another task, and the form is never mounted for such a node here.
untested:
- 'contracts/entity-workspace/entity-screen: it declares four operations and many answers, and only the show-entity-form answer for the disputed-key rule belongs to this task; no finite test over the contract decides its whole fact, and the answer it names is exercised only through the rule''s test and the criterion tests.'
- 'domain/entity-workspace/entity-edit-session: an aggregate root whose operations belong to other tasks; the only part this task touches, that the session holds no attribute-field for a disputed key, is not stated by any node beyond "shows no field", so it is proven only through the rendered absence of a field and not through the form state (buildFormValues).'
- 'Which of a disputed key''s attributes count as "its values" beyond the disputed attributes themselves: the implementation chose held attributes (active, uncertain or disputed, current or not), and no node decides whether a current active or uncertain sibling value, or a non-current held one, is listed; an inference about behavior, not pinned.'
- 'Presentation inferences the implementation recorded: the ul labelled "Valores de <key>", one li per value, the data-testid hooks, the underline and focus-ring styling; no node states them, so no test pins them; the tests locate the disputed key''s group through the data-testid hook the earlier field-groups task already established, and the link as an anchor with an href inside it.'
- 'The link followed through the real application route tree: the criterion test follows the pointer in a minimal memory router that has only the /curation address, so it proves the pointer targets that address and not that the application''s own /curation route renders it; routes.tsx is another task''s ground.'
- The exclusion of "a link carrying an item search key" is made through the href equality in the link-rule test, not by following the link and reading the search; the search key's behavior on the curation page belongs to rules/application-shell/chat-and-curation-keep-one-search-key.
- Toasts and any message beyond the pointer text, which no node of this task states.
---
## What it is
This record proves task/entity-form/disputed-keys.
It holds one spec over the rendered form, one router-context helper and one adjustment of the shared mount helper.

## Notes
The suite passed on its first run, run/entity-form-disputed-keys-suite; the earlier form specs ran green through the router-context mount.
