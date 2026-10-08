---
target: frontend
title: Closed-key choice in the entity form
summary: A field of a key whose catalog entry carries allowed values now offers a ui-kit Select over exactly those values, shown by label (or by value when it has none) in catalog order, and holds the allowed value's value in the form.
task: sha256:3d8bdfc8169c59053231bc7de7b8de99298c4409456160d659356535954cf9cb
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-closed-key-fields-build
files:
- path: src/features/entities/components/entity-allowed-values.ts
  effect: 'new: pure helpers; allowedValueLabel returns the label, or the value itself when the label is null or blank; allowedValueOptions maps the catalog''s allowed values to value+label options keeping their order, with no sorting and no use of sortOrder; isAllowedValue tests membership.'
- path: src/features/entities/components/entity-closed-choice.tsx
  effect: 'new: ClosedChoice renders the ui-kit Select over the allowed values as a role=group container with an aria-label and aria-describedby and the placeholder "Selecionar valor" when nothing is selected; a "Limpar <nome>" icon button, shown only while a value is held, resets the field to the empty string and returns focus to the combobox; a value held that is not among the allowed values is not offered as an option and a muted line "Valor atual fora dos valores permitidos: <valor>" shows it, linked through aria-describedby.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'modified: for a key whose allowedValues is non-null each field of the key renders ClosedChoice instead of the text Input, which covers every entry of a multi-valued key; the Controller binds the form value to field.value and field.onChange so the form holds the allowed value''s value; for a closed key the title is rendered as a plain p rather than a Label htmlFor because no input carries that id; help text, the error paragraph with role alert, add and remove, the numbering and the disputed-key behaviour are unchanged.'
criteria:
- criterion: A field of a key with allowed values offers only those values.
  met: true
  how: In entity-field-group.tsx, allowedValues !== null selects ClosedChoice; its Select options come only from allowedValueOptions(allowedValues) in entity-allowed-values.ts, one per catalog entry; the empty state is not an option but the placeholder plus a separate clear button; a held value outside the list is not added as an option.
- criterion: The allowed values are shown by their labels.
  met: true
  how: allowedValueLabel gives each option its label; for an allowed value with no label (null or blank) it gives the value itself, as the rule states, so there is never an empty option and no value is left out; the option's value is the allowed value's value, so the form value is what the wire carries.
- criterion: The allowed values are shown in the order the catalog gives them.
  met: true
  how: allowedValueOptions is a plain map over attributeKey.allowedValues, which the transform already keeps in wire order; there is no sort and sortOrder is not read; the Select renders options in array order.
nodes:
- node: rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
  encoded_at:
  - src/features/entities/components/entity-allowed-values.ts
  - src/features/entities/components/entity-closed-choice.tsx
  - src/features/entities/components/entity-field-group.tsx
  how: 'The invariant is the option list of the closed field: it holds exactly the key''s allowed values, in catalog order, each by its label and by its own value when it has no label.'
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-field-group.tsx
  how: The field's value member stays a string in attributeFieldSchema; for a closed key it holds the chosen allowed value's value, or the empty string for an empty choice; the key, itemId and startedWith members are untouched, so the changed-field comparison keeps working on wire values.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-closed-choice.tsx
  how: The show-entity-form clause "for a key the catalog closes, its allowed values" is the choice each closed field renders; the other clauses of the contract (loading, not found, disputed pointer, review, save) belong to sibling tasks and are untouched.
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/components/entity-allowed-values.ts
  how: 'It is the read side only: the form consumes AttributeKey.allowedValues as the existing toAttributeKey transform delivers it and does not re-sort it; the contract orders only the items of list-attribute-keys; no request code was written or changed.'
inferences:
- inferred: The control is the ui-kit Select, not a native select; it is given role=group and aria-label (the key, or "<key> (valor n)" for a numbered multi-valued entry) on its container div, which is where the vendored Select spreads its rest props; aria-describedby and data-testid go on the same div.
  from: The vendored Select takes { value, label } options and spreads rest props on the container div; TypeChoice in entity-list-parts.tsx uses it the same way and the task asked for the ui-kit Select as the other pages use it; nothing in vendor/ was edited.
- inferred: An allowed value whose label is null, empty or only whitespace is shown by its own value.
  from: The rule says "for a value that has no label, by its value" and the task's UNDERDETERMINED note says never an empty option and never left out; treating a blank label as no label is the reading that also avoids an empty option.
- inferred: The empty choice is the Select's placeholder "Selecionar valor", shown when the form value is the empty string; a field of a key the node holds no value for starts that way, and an added entry starts that way.
  from: emptyField and fieldStartingFrom in entity-form-schema.ts already represent an empty field as the empty string and the Select shows its placeholder when value matches no option.
- inferred: Clearing back to the empty state is a separate "Limpar <nome>" icon button, shown only while the field holds a value, not a blank option in the list, so the choice still offers only the allowed values; the "Limpar" wording and the Eraser icon are the implementer's.
  from: The task asks that clearing be possible and the rule says "offer only those values"; a separate control satisfies both; the existing add/remove focus handling in entity-field-group.tsx is the model for returning focus to the combobox after the button unmounts.
- inferred: 'A current value that is not among the allowed values does not crash or alter the form: it stays in the form value, so the changed-field comparison sees no change unless the owner picks something; it is not offered as an option; a muted line "Valor atual fora dos valores permitidos: <valor>" shows it, linked through aria-describedby.'
  from: No node says what a held value outside the allowed set shows; the Select would otherwise display the placeholder and hide a held value, and the project's principle is that nothing is hidden silently; the line is presentation only and adds no rule.
- inferred: No Zod rule was added for closed keys; the existing value-type check is unchanged.
  from: The task forbids a new rule unless a node states one; the Select can only produce allowed values and a held out-of-set value is untouched.
- inferred: aria-invalid is not set on the closed field; its error is still shown in the same role=alert paragraph and linked through aria-describedby.
  from: The ui-kit Select's combobox button cannot receive props and aria-invalid on a role=group container is not valid ARIA; the text and the described-by link carry the error.
- inferred: onBlur and ref from the Controller are not wired to the Select.
  from: The Select exposes neither on its combobox button; the form uses mode onChange, so validation does not depend on blur.
- inferred: The key title of a closed field is rendered as a plain p with an id, like the no-field case, rather than a Label htmlFor.
  from: The Label's htmlFor targets an input id and a closed field has no input with that id; the enclosing role=group is still named by aria-labelledby pointing at the title.
- inferred: A closed key whose allowed list is non-null but empty renders the Select with the kit's own "Nenhuma opção disponível." message and no options.
  from: allowedValues is null only for an open key (toAttributeKey), so an empty list is still a closed key and offers only what it has, which is nothing.
preserved:
- Open keys (allowedValues null) still render the same text Input with the same id, aria-label, aria-invalid, aria-describedby and data-testid.
- The help text and its aria-describedby link, and the error paragraph with role alert, are unchanged for both kinds of field.
- 'Multi-valued behaviour is unchanged: the add button is hidden for a disputed key, there is one field per current attribute, the remove button and "Remover valor n de <chave>" label are kept, and focus returns to the add button after a removal.'
- A disputed key still has no fields and no entries.
- 'The empty starting state is unchanged: buildFormValues, emptyField, fieldStartingFrom and the field array are untouched, so itemId and startedWith still start the changed-field comparison.'
- The value-type check and the review gate valueTypesAccepted are untouched; the zodIssueResolver, entity-form-schema.ts, use-entity-edit-form.ts, entity-value-types.ts and EntityForm.tsx were not edited.
- Nothing under backend/, src/lib/http.ts, query-client.ts or error-routing.ts, package.json or vendor/ was touched; no header entry or graph button was added.
deferred:
- what: The label and sort order of an allowed value are still not stated by the retrieval contract; the wire facts record the question as open on the backend side; the form shows label when present and never reads sortOrder.
  why: It is a fact for the specification and the backend; the form already tolerates labels being absent through the by-value reading.
- what: The vendored Select cannot take an accessible name, id, onBlur or aria-invalid on its combobox button, because it spreads rest props on the container div; the closed field is named through the container group instead.
  why: Changing the kit is outside this task and vendor/ must not be edited; a change there would give the combobox its own name.
- what: How an emptied closed field becomes a removal or no change in the edit payload, and how a held out-of-set value is treated on save or review, remain with the review and save tasks (the changed-field computation, a-change-writes-an-empty-member-as-null, save-sends-one-change-per-changed-field).
  why: This task only offers the choice and keeps the empty state representable.
- what: Validity fields, the values of a disputed key with its curation pointer, attributes outside the catalog, and keeping typed values across refetch and conflict remain with their own tasks.
  why: They are sibling tasks and were already deferred by the earlier form records.
---
## What it is
This record answers task/entity-form/closed-key-fields.
It holds the choice of value for keys whose values the catalog closes.

## Notes
The build passed on its first run, run/entity-form-closed-key-fields-build.
