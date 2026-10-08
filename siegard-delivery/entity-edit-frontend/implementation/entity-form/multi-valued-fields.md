---
target: frontend
title: Multi-valued keys as lists of fields
summary: A key whose catalog entry allows multiple values now shows one field per current attribute with a remove control on each field and an add control for the group, over a flat useFieldArray state in which each field stays tied to its own attribute through itemId and startedWith.
task: sha256:f60b8bf1efac7d66a16809cbce9a6f6798c8561cdf8198425a0f11c4fcff28c2
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-multi-valued-fields-build
files:
- path: src/features/entities/components/entity-form-schema.ts
  effect: 'modified: buildFormValues now emits, for a key whose catalog entry has allowsMultiple true, one entry per current attribute of the key in the order the node read lists them, each carrying itemId equal to that attribute''s id and startedWith and value equal to its value; a multi-valued key holding no current attribute gets one empty entry (itemId null, startedWith and value empty); a single-valued key still gets exactly one entry from the first current attribute, or an empty one; a key holding a disputed attribute still gets no entry; adds currentAttributesOf and emptyField (an entry with itemId null and empty startedWith and value); buildFieldGroups now takes the live field-array items, which carry the RHF id, and returns for each key a fields list of { index, id } in place of fieldIndexes; adds the IdentifiedFieldValues and GroupField types.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'modified: renders each field of the group as a row keyed by its RHF field id with the input id derived from it; for a multi-valued key each row also has an icon button named "Remover valor N de {key}" and below the rows an "Adicionar valor" button named "Adicionar valor a {key}"; where a multi-valued key shows more than one field each input is named "{key} (valor N)"; removing a field moves focus to the add button; a single-valued key and a disputed key render no add or remove control; a key left with no field shows its title as plain text and still offers the add control, except a disputed key; the help text and aria-describedby link are unchanged.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'modified: calls useFieldArray on the form''s fields array and builds the groups from the live items; wires each group''s onAdd to append(emptyField(key)) and its onRemove to remove(index) so adding and removing are reflected in the form state; passes the group''s disputed flag so a disputed key offers no add control; props, aria-label, data-testid, submission hold and the reset on node or catalog change are unchanged.'
criteria:
- criterion: A key that allows multiple current values shows one field for each current attribute the node holds of it.
  met: true
  how: startingFieldsOf in entity-form-schema.ts maps every attribute of the key with isCurrent true to its own entry when allowsMultiple is true; EntityForm builds its groups from the useFieldArray items and EntityFieldGroup renders one input per entry of group.fields; the disputed-key skip is unchanged and runs first.
- criterion: Each of those fields starts with the value of its own attribute.
  met: true
  how: fieldStartingFrom sets value and startedWith to that attribute's value and itemId to that attribute's id, and the same values are the useForm defaultValues and the reset(values) argument; each Controller binds fields.{index}.value and fields are keyed by the RHF id, so a removal does not shift one field's state onto another.
- criterion: The owner can add a field to a key that allows multiple current values.
  met: true
  how: The "Adicionar valor" button in entity-field-group.tsx calls onAdd, which EntityForm wires to append(emptyField(key)); the appended entry has itemId null and empty startedWith and value, and it takes focus as RHF's append does by default.
- criterion: The owner can remove a field from a key that allows multiple current values.
  met: true
  how: Each field of a multi-valued key has a button named "Remover valor N de {key}" that calls remove(index) on the field array; the entry leaves the form state and focus moves to the add button so it is not lost.
nodes:
- node: rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/EntityForm.tsx
  how: One entry per current attribute is built in startingFieldsOf; the add and remove controls are in EntityFieldGroup and wired to the field array in EntityForm; a key the catalog marks allowsMultiple false gets neither control.
- node: rules/entity-workspace/fields-start-from-the-current-values
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: Each entry starts with the value of its attribute, and a key with no current attribute starts with an empty field; a multi-valued key with no current attribute reads this rule as one empty field; single-valued keys keep their previous behaviour.
- node: rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/EntityForm.tsx
  how: emptyField builds the added entry with itemId null and empty startedWith and value, whatever values the key already holds; the add action appends nothing else and fills in no held value.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/EntityForm.tsx
  how: The session's fields are now a field array that grows and shrinks with the owner's add and remove, held in RHF state so nothing leaves the form; reason, reviewing, undo_deadline and the review, save and undo operations are not reached.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: The attributeFieldSchema shape is unchanged; several entries can now share an attributeKey, each tied to its own current attribute through itemId and startedWith, and an added entry has itemId null and empty startedWith; valid_from and valid_to remain with the validity task.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/EntityForm.tsx
  how: 'The show-entity-form answer now holds one field per current attribute for a multi-valued key, each with its current value and the key''s help text; the disputed-key answer is unchanged: no field and no add control; closed-key values, show-review and save-edit are not reached.'
inferences:
- inferred: A multi-valued key for which the node holds no current attribute shows one empty field, not zero fields.
  from: fields-start-from-the-current-values says every field starts "empty where the node holds none", which presupposes a field where the node holds none; the previous skeleton did the same, and the task's note leaves zero or one open; one empty field saves the owner an add click for a first value and matches the added-field start, and the owner can still remove it.
- inferred: Removing a field deletes its entry from the field array; no removed flag is added to the field state.
  from: The attribute-field and entity-edit-session nodes list no removed member; save-sends-one-change-per-changed-field says "emptied or removed a field that started with a value" and a-change-is-judged-against-the-node-as-loaded fixes the node as loaded as the baseline, so a removal is derivable from the baseline and needs no extra state.
- inferred: A field the owner removes is gone even when it had been added in the same sitting and nothing records it; a multi-valued key can end up with no field, and then it shows its title and the add control.
  from: An added field has itemId null and started from no attribute, so it has nothing to be removed from; the criterion says only that the owner can remove a field and nothing asks for a minimum of one.
- inferred: 'Names for assistive technology: "Adicionar valor" (visible text) with aria-label "Adicionar valor a {key}", "Remover valor N de {key}" for the icon-only remove button (N from 1, within the group), and "{key} (valor N)" on each input only when the key shows more than one field; a single field keeps the group''s Label as its name.'
  from: No node fixes these texts; they are structural labels chosen for WCAG 2.2 AA so that a button and a field identify their key and position; the accessible names contain the visible text.
- inferred: Focus moves to the group's add button after a field is removed; an added field takes focus from RHF's default append behaviour.
  from: The removed input would otherwise drop focus to the page; this is focus handling, which no node states.
- inferred: FieldGroup.fieldIndexes is replaced by FieldGroup.fields (a list of { index, id }), the group component receives fields, disputed, onAdd and onRemove, and the input id and React key come from the RHF field id instead of the position.
  from: The field-groups record already deferred this change to this task; keys by position would let state leak between fields after a removal; no test or other source file used fieldIndexes.
- inferred: Only isCurrent decides which attributes get a field, as in the skeleton; the several-current case is now handled by listing them in the order the node read gives, and nothing filters by status beyond the disputed check.
  from: The field-groups record's own inference (the multi-valued task owns the several-current case) and the wire fact is_current per attribute.
preserved:
- EntityForm keeps its props contract (node, attributeKeys), its aria-label "Formulário de edição", its data-testid entity-form, the submission hold and the reset(values) effect on node or catalog change.
- A single-valued key still renders exactly one field, with no add or remove control, seeded from the first current attribute or empty; its data-testid entity-field-{key}, the Label tied to the field and the help text with aria-describedby are unchanged.
- A key holding a disputed attribute still creates no entry and renders no field, and now no add control either; its title and help text still show.
- The catalog order of the groups, the entity-form-schema exports buildFormValues, currentAttributeOf, isDisputedKey and DISPUTED_ATTRIBUTE_STATUS, and the schema shape entityFormSchema and attributeFieldSchema are unchanged.
- EntityPage and its helpers, the entities api hooks, types.ts, the router, the header and the graph panel, src/lib/http.ts, query-client.ts and error-routing.ts, and everything under backend/ are untouched; no dependency was added and lucide-react, already installed, supplies the Plus and X icons.
deferred:
- what: 'How a removal reaches the edit payload: a removed field leaves no entry in the form state, so the review and edit-payload tasks must compute removals as the difference between the baseline and the live fields; the baseline is the starting values buildFormValues(node, attributeKeys) produced for the node as loaded, which EntityForm already holds as values; every baseline entry with a non-null itemId whose itemId is absent from the live fields is a removal, becoming a remove change naming that itemId with null value, valid_from and valid_to, and its previous value is the baseline entry''s startedWith; a field that started from an attribute and whose value is emptied (still present) must also be treated as a removal; the baseline must be the one for the node as loaded, not recomputed from a refetched node after the owner has edited.'
  why: The review, the changed-field computation and the save belong to the sibling review and save tasks; this task only keeps the form state able to represent a removal.
- what: 'Added fields are changed or not by rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed: an entry with itemId null counts as changed only when its value does not equal the value of an active or uncertain attribute of the key, and empty added fields must also be told apart from changes.'
  why: Owned by the review tasks; this task only guarantees that an added field starts empty with itemId null.
- what: 'Keeping the typed fields, including added and removed ones, through a refetch or a conflict: the reset(values) effect in EntityForm still replaces the whole field array when the node or catalog data changes.'
  why: Owned by the save and conflict tasks, as the field-groups record already deferred.
- what: Value-type inputs, allowed values for closed keys, validity fields, error text and aria-invalid on fields, the disputed-key values and curation pointer, and attributes outside the catalog remain with their own tasks.
  why: Each is a sibling task of the field-groups task.
---
## What it is
This record answers task/entity-form/multi-valued-fields.
It holds the list behaviour of the field group for a multi-valued key.

## Notes
The build passed on its first run, run/entity-form-multi-valued-fields-build.
