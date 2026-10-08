---
target: frontend
title: A disputed key shows its held values without a field and points to the curation queue
summary: The entity form's group for a key holding a disputed attribute now lists the key's held values as a labelled list, still has no field, and carries a router link to /curation, with no search key, reading "Abrir na fila de curadoria".
task: sha256:638a76405725b6fe2b8123a4592cd6489c531823e2489d6b9facacba194983ca
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-disputed-keys-build
files:
- path: src/features/entities/components/entity-form-schema.ts
  effect: FieldGroup gains heldValues; the new heldAttributesOf(attributes, key) returns the key's attributes whose status is active, uncertain or disputed, in the node read's order, current or not; buildFieldGroups fills heldValues only for a disputed key (decided by the existing isDisputedKey, status alone) and leaves it empty otherwise; buildFormValues is unchanged, so a disputed key still gets no form entry.
- path: src/features/entities/components/entity-disputed-values.tsx
  effect: 'new: DisputedValues renders a ul labelled "Valores de <key>" with one li per held value, showing the value string exactly as the node read delivers it, and below it a typed TanStack Router Link to=''/curation'' with no search or params, reading "Abrir na fila de curadoria"; it renders no input, select, textarea or add/remove control.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: takes the new heldValues prop and, when disputed is true, renders DisputedValues between the group title and the (empty) fields loop; the add button stays gated by listed && !disputed and the remove buttons only exist inside the fields loop, which is empty for a disputed key; the help text still renders last.
- path: src/features/entities/components/EntityForm.tsx
  effect: passes group.heldValues to each EntityFieldGroup; nothing else changed.
criteria:
- criterion: A key with a disputed attribute shows its values.
  met: true
  how: buildFieldGroups sets heldValues for a key where isDisputedKey is true and EntityFieldGroup passes it to DisputedValues in entity-disputed-values.tsx, which lists every held attribute value of the key as an li, including the disputed ones.
- criterion: A key with a disputed attribute shows no field.
  met: true
  how: buildFormValues still returns no entry for such a key (startingFieldsOf returns an empty list when isDisputedKey is true), so the group's fields array is empty and no Controller, Input or ClosedChoice renders; DisputedValues adds only a ul and a link; the add button is gated by !disputed and the remove buttons live inside the empty fields loop.
- criterion: A key with a disputed attribute shows a pointer to the curation workspace.
  met: true
  how: DisputedValues renders a Link to='/curation' with no search key, reading exactly "Abrir na fila de curadoria" with no closing period, as the rule a-disputed-key-links-to-the-curation-queue requires; it is not plain text, not a link carrying an item key, and not "Ver na curadoria.".
nodes:
- node: rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-disputed-values.tsx
  - src/features/entities/components/entity-field-group.tsx
  how: A key is disputed exactly when one of its attributes has status disputed (isDisputedKey, unchanged), which ignores isCurrent, effective status and flags, and a superseded or deleted attribute never makes its key disputed; the group shows the key's values through heldValues and DisputedValues, creates no field entry, and shows the pointer.
- node: rules/entity-workspace/a-disputed-key-links-to-the-curation-queue
  encoded_at:
  - src/features/entities/components/entity-disputed-values.tsx
  how: The pointer is the router's typed Link to the curation address /curation; no search is passed, so no item key is carried, and the text is "Abrir na fila de curadoria" exactly, with no period; the address and its single search key come from routes.tsx, which is untouched.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-disputed-values.tsx
  how: 'Encodes the show-entity-form refusal for the disputed-key rule: the key''s values with no field and a pointer to the curation workspace; the other operations and the other show-entity-form answers belong to other tasks and were not touched.'
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: The session's fields still hold no attribute-field for a disputed key (buildFormValues); the disputed key's values are read from the node read for display only and enter no form state, so nothing disputed can be changed, reviewed or sent.
inferences:
- inferred: '"Its values" are the key''s held attributes: those with status active, uncertain or disputed, whether or not current, and not superseded or deleted; they are listed in the node read''s order, one li per attribute; a held attribute shows even when it is not current, and no validity, status or flag is shown beside it.'
  from: The rule says the key shows "its values" and defines disputed by status only, ignoring current and in-effect; domain/knowledge-base/live-assertion-status enumerates active, uncertain and disputed as the statuses of an attribute still held, and the rule's own description says superseded or deleted attributes are not disputed; the entity-page attribute list shows value strings as given, so the value text is shown unmodified.
- inferred: The values are a ul with aria-label "Valores de <key>" inside the existing role=group labelled by the key title; the link is a plain Link with an underline and the focus ring token ring-border-focus, styled like the entity list's link; it has data-testid hooks entity-disputed-values-<key>, entity-disputed-value-<key> and entity-curation-link-<key>.
  from: The inventory convention of tokens plus cn(), the entity list link in entity-list-parts.tsx, and the WCAG 2.2 AA requirement for an accessible name on a list.
- inferred: 'Linking to /curation with no search compiles under the typed router with no workaround: the route''s validateSearch takes Record<string, unknown> and returns { item?: string }, so every search key is optional; the Link therefore passes no search, params or hash.'
  from: src/router/routes.tsx (curationRoute.validateSearch) and src/shell/Footer.tsx, which already links to='/curation' with no search.
preserved:
- Multi-valued add and remove controls on editable keys, the useFieldArray identity by RHF id, and the add button's gating by listed && !disputed.
- Closed-choice rendering (ClosedChoice with allowedValues), the value-type check and the valueTypesAccepted gate in use-entity-edit-form.ts, and the validity inputs shown only on changed temporal fields.
- 'Single-valued behavior: one field seeded from the first current attribute, or empty when none.'
- buildFormValues, isDisputedKey, currentAttributeOf and currentAttributesOf are unchanged; a disputed key still produces no form entry, and the zodIssueResolver form wiring is untouched.
- The form's props (node, attributeKeys), its aria-label "Formulário de edição" and data-testid entity-form.
- backend/, src/lib/http.ts, query-client.ts, error-routing.ts, routes.tsx, package.json and vendor/ are unchanged; no header entry or graph-panel button was added, nothing is imported from features/curation, and no dependency was added.
deferred:
- what: The existing entity-form test support (__tests__/entity-form-support.tsx) mounts EntityForm with createRoot and no router; a disputed key now renders a router Link, which needs router context, so the earlier field-groups and multi-valued specs that render a disputed key will fail until the proof wraps the form in a router.
  why: Writing or adjusting tests is outside the implementer's role; the proof for this task owns it.
- what: Attributes outside the catalog (a held attribute whose key the catalog does not list) still have no group.
  why: Owned by the attributes-outside-the-catalog task.
---
## What it is
This record answers task/entity-form/disputed-keys.
It holds the disputed-key rendering inside the form's groups: the held values, no field and the pointer to the curation queue.

## Notes
The build passed on its first run, run/entity-form-disputed-keys-build; the implementer warned that existing specs rendering a disputed key without a router may fail, which the proof and suite decide.
