---
target: frontend
title: Attributes outside the catalog shown read-only in the entity form
summary: The entity form now lists, after its field groups, the held attributes whose key the catalog does not hold for the node's type, grouped by key, with each value and no field, and nothing of them enters form state.
task: sha256:30bed67312a5560b6a9e7afceb77616dc8e8141756c8d4fd8e98b84465d1f6ce
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-attributes-outside-the-catalog-build
files:
- path: src/features/entities/components/entity-form-schema.ts
  effect: adds isHeldAttribute (status active, uncertain or disputed), now used by heldAttributesOf, whose behavior is unchanged; adds OutsideCatalogGroup and outsideCatalogGroupsOf(attributes, attributeKeys), which returns the held attributes whose key is not among the catalog's keys, grouped by key in the order the keys first appear in the node read; buildFormValues, buildFieldGroups and isDisputedKey are untouched, so these attributes get no field entry.
- path: src/features/entities/components/entity-outside-catalog-values.tsx
  effect: 'new: OutsideCatalogValues renders nothing for no groups, otherwise a section labelled by the visible title "Valores fora do catálogo" holding a dl with one div per key: a dt with the key and a dd per held value, shown exactly as the node read delivers it; it renders no input, select, textarea, add or remove control, and no link.'
- path: src/features/entities/components/EntityForm.tsx
  effect: computes the outside-catalog groups with useMemo from node.attributes and attributeKeys and renders OutsideCatalogValues inside the form after the field groups; the props, aria-label, data-testid, form hook, review gate (valueTypesAccepted, changed) and the groups loop are unchanged.
criteria:
- criterion: An attribute whose key the catalog does not hold for the node's type shows its value.
  met: true
  how: outsideCatalogGroupsOf in entity-form-schema.ts collects every held attribute whose key is absent from the catalog; EntityForm passes the result to OutsideCatalogValues (entity-outside-catalog-values.tsx), which renders each value as a dd under its key's dt.
- criterion: An attribute whose key the catalog does not hold for the node's type shows no field.
  met: true
  how: buildFormValues iterates only the catalog's keys, so these attributes have no entry in the form state; OutsideCatalogValues renders only a section, a dl, dt and dd, with no Controller, Input, ClosedChoice, add button or remove button.
nodes:
- node: rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-outside-catalog-values.tsx
  - src/features/entities/components/EntityForm.tsx
  how: 'An attribute whose key is not in the catalog read for the node''s type shows its value: outsideCatalogGroupsOf selects it, OutsideCatalogValues shows it, and no field entry is created for it.'
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/EntityForm.tsx
  how: The session's fields still hold one attribute-field per catalog key; the outside-catalog values are read from the node read for display only and enter no form state, so they cannot be changed, reviewed or sent, and they do not affect the changed flags or the value-type gate.
inferences:
- inferred: 'Which attributes count: the held ones (status active, uncertain or disputed), whether or not current; a superseded or deleted attribute is not shown; this is the same reading heldAttributesOf already applies for disputed keys, and the new helper shares its predicate.'
  from: The rule says "an attribute of the node" and states no status, and no decision log entry exists for it; domain/knowledge-base/live-assertion-status names the held statuses, and the disputed-key log entry reads "its values" the same way.
- inferred: Grouping is by attribute key; groups follow the order in which each key first appears in the node read and values within a group follow the node read's order, one dd per attribute; value strings are shown as delivered, with no status, validity or flag beside them.
  from: The disputed-keys delivery and the non-active attribute list in entity-page-parts.tsx show values as given, and the rule names only the value.
- inferred: 'Where it sits and what it is called: inside the form element after the last group, as a section named by the visible title "Valores fora do catálogo", with a dl as the list; nothing decides the wording.'
  from: The rule requires only that the value shows without a field; the entity-screen contract fixes neither the place nor the wording, and the pt-BR-only convention in the inventory applies.
- inferred: A disputed attribute whose key is in the catalog stays in its catalog group, as the disputed-keys task delivered it; a disputed attribute whose key is outside the catalog shows in the outside-catalog section, because that key has no group, without the pointer to the curation queue, since that pointer belongs to a group's DisputedValues; both rules require the value without a field and this reading satisfies that.
  from: The delivery brief's instruction on the overlap, the disputed-key rule's statement about "a key" of the form, and the delivered disputed-keys record, whose pointer is rendered only inside catalog groups.
- inferred: When the catalog list is empty or not yet loaded, every held attribute counts as outside the catalog; EntityForm is rendered only after the catalog read has resolved, so this does not arise on the screen.
  from: EntityPage mounts EntityForm with the already-fetched attributeKeys, and the rule is stated against the catalog read.
preserved:
- 'Field groups: one group per catalog key in catalog order, the group''s title, help text and starting values, and buildFormValues and buildFieldGroups unchanged.'
- Multi-valued add and remove controls, the useFieldArray identity, and the add gating by listed && !disputed.
- Closed choices through ClosedChoice with allowedValues, and the value-type check with the valueTypesAccepted gate in use-entity-edit-form.ts.
- Validity fields shown only on changed temporal fields.
- 'Disputed keys: a disputed attribute whose key is in the catalog keeps its DisputedValues list and curation link inside its group.'
- 'Single-valued behavior: one field seeded from the first current attribute, or empty when none.'
- heldAttributesOf returns the same attributes as before, now through the extracted isHeldAttribute predicate.
- EntityForm's props (node, attributeKeys), its aria-label "Formulário de edição", its data-testid entity-form, and the local zodIssueResolver wiring.
- backend/, src/lib/http.ts, query-client.ts, error-routing.ts, package.json and vendor/ are unchanged; no dependency was added, nothing is imported from a sibling feature, no header entry or graph-panel button was added, and the entities api needed no new request.
deferred:
- what: Existing specs that mount EntityForm with a node holding attributes outside the catalog may now find them in the DOM; the proof must add specs for this section.
  why: Writing or adjusting tests is outside the implementer's role.
- what: The entity-screen contract's accepted answer of show-entity-form does not mention the read-only values this rule requires.
  why: A specification gap, already recorded as an ADVISORY in the task's Notes, that only the specification can close.
- what: Whether a disputed attribute outside the catalog should also carry the pointer to the curation queue.
  why: The disputed-key rules speak of a key's group and nothing states the overlap; the source adds no pointer there and the specification would have to decide it.
---
## What it is
This record answers task/entity-form/attributes-outside-the-catalog.
It holds the read-only rendering of attributes that fall outside the node type's catalog.

## Notes
The build passed on its first run, run/entity-form-attributes-outside-the-catalog-build; no decision log exists for the rule (specification/rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field.log.md is absent), so the reading of which attributes count is an inference taken from the disputed-keys log entry and live-assertion-status; if the business intends superseded or deleted attributes to show too, only the isHeldAttribute call in outsideCatalogGroupsOf changes.
