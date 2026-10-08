---
target: frontend
title: Validity inputs of a changed field of a temporal key
summary: A changed field of a temporal key now offers a validity start and an optional validity end, a changed field of a stable key and an unchanged field offer neither, and an unstated start shows as today's local calendar date while the form state stays empty.
task: sha256:41eb06d437ad1f558a87e71c085b89d4d0303241ca7c5244901f9d887b40024f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-validity-fields-build
files:
- path: src/features/entities/components/entity-field-changed.ts
  effect: 'new: the pure function that decides whether a field is changed, which the review tasks must reuse; isFieldChanged(field, attributes, allowsMultiple) is false when value equals startedWith, whatever validity the field holds, and false for an added field (itemId null) of a multi-valued key whose value equals the value of an attribute of that key with status active or uncertain, and true otherwise; changedFlags(fields, attributeKeys, attributes) applies it to every field by index, looking up allowsMultiple in the catalog, and returns false for a key absent from the catalog.'
- path: src/features/entities/components/entity-local-date.ts
  effect: 'new: localCalendarDate(moment) builds YYYY-MM-DD from getFullYear, getMonth and getDate, the browser''s local time zone and never toISOString; todayLocalDate() reads new Date() at call time so a test can fix the clock with fake timers.'
- path: src/features/entities/components/entity-validity-fields.tsx
  effect: 'new: ValidityFields renders a role=group named "Validade de {nome}" holding two ui-kit date inputs bound to fields.N.validFrom and fields.N.validTo, each with a visible Label ("Início da validade", "Fim da validade") and an aria-label that adds the key and, for numbered multi-valued entries, the position; while validFrom is empty a note "Início não informado: aparece como hoje, AAAA-MM-DD." shows today''s local date, linked by aria-describedby, and the form value stays empty; the end carries the note "Opcional: pode ficar vazio." and no required state or error.'
- path: src/features/entities/components/entity-form-schema.ts
  effect: 'modified: attributeFieldSchema gains validFrom and validTo as strings where the empty string means unstated; emptyField and fieldStartingFrom write both as empty, so every field starts with its validity unstated and does not copy the held attribute''s validity; buildFormValues, buildFieldGroups and the value-type schema are otherwise unchanged.'
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: 'modified: the hook also returns changed, a readonly boolean per field index, which is changedFlags over the live useWatch values, the catalog and node.attributes, memoised; valueTypesAccepted and the resolver are unchanged.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'modified: takes changed from the hook and passes it to every EntityFieldGroup.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'modified: takes a changed prop; each field row wraps the value Controller and, below it, ValidityFields, rendered only when attributeKey.isTemporal is true and changed[index] is true; the inner value column dropped its flex-1 because the new wrapper carries it; Input, ClosedChoice, error paragraph, help text, add and remove controls and numbering are unchanged.'
criteria:
- criterion: A changed field of a temporal key offers a validity start.
  met: true
  how: entity-field-group.tsx renders ValidityFields when attributeKey.isTemporal and changed[index] is true; entity-validity-fields.tsx then renders a date Input named "Início da validade de {nome}" on fields.N.validFrom; changed[index] comes from isFieldChanged in entity-field-changed.ts over the live form values.
- criterion: A changed field of a temporal key offers a validity end.
  met: true
  how: The same ValidityFields renders a date Input named "Fim da validade de {nome}" on fields.N.validTo, under the same condition.
- criterion: The validity end of a changed field of a temporal key may be left empty.
  met: true
  how: 'validTo is a string with empty meaning unstated, and emptyField and fieldStartingFrom start it empty; the end input has no required attribute, no schema refusal and no error and its note says "Opcional: pode ficar vazio."; no start-before-end check was written.'
- criterion: A changed field of a key that is not temporal offers no validity start.
  met: true
  how: ValidityFields is rendered only when attributeKey.isTemporal is true, so a changed field of a non-temporal key renders no start input and its validFrom stays empty.
- criterion: A changed field of a key that is not temporal offers no validity end.
  met: true
  how: The same condition keeps the end input out for a non-temporal key; an unchanged field of any key also renders neither because changed[index] is false.
- criterion: A validity start the owner has not stated shows as today.
  met: true
  how: 'While fields.N.validFrom is the empty string, ValidityFields shows the note "Início não informado: aparece como hoje, {todayLocalDate()}.", linked by aria-describedby and carrying data-testid entity-valid-from-today-{key}; todayLocalDate() formats the browser clock''s local calendar date through getFullYear, getMonth and getDate, not UTC; the form value is not written and the note disappears once the owner states a start.'
nodes:
- node: rules/entity-workspace/a-changed-temporal-field-offers-its-validity
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/entity-field-changed.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: A field whose key has isTemporal and whose changed flag is true gets a start input and an optional end input; the flag is decided by isFieldChanged and exposed through the hook as changed.
- node: rules/entity-workspace/a-changed-stable-field-offers-no-validity
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  how: The isTemporal condition on the render of ValidityFields keeps both inputs out for a field of a key that is not temporal, and validFrom and validTo stay empty for it.
- node: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
  encoded_at:
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/entity-form-schema.ts
  how: 'Shows as today: the note under the start input reads today''s date while validFrom is empty; sent empty: the form state keeps validFrom as the empty string and never writes the displayed date into it; sending it empty in the payload belongs to the edit payload task.'
- node: rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
  encoded_at:
  - src/features/entities/components/entity-local-date.ts
  - src/features/entities/components/entity-validity-fields.tsx
  how: localCalendarDate builds YYYY-MM-DD from the local getters of the browser clock and never from toISOString or UTC; ValidityFields calls todayLocalDate() when it renders.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-field-changed.ts
  how: valid_from and valid_to are now members of the field as the strings validFrom and validTo, where empty means unstated and the owner's date is YYYY-MM-DD; the field's changed state is the pure function isFieldChanged over value and startedWith, following a-field-is-changed-only-by-its-value (a field whose value equals its started-with value is not changed, whatever validity it holds) and a-field-added-with-a-held-value-is-not-changed (an added field of a multi-valued key that repeats a held active or uncertain value is not changed).
inferences:
- inferred: validFrom and validTo are plain strings with the empty string as unstated, and every field starts with both empty, including a field started from an attribute that holds its own valid_from and valid_to; the held attribute's validity is not copied into the field.
  from: The previous records expected nullable or empty strings; fields-start-from-the-current-values states only the value; a copied start would show as a stated start on a new change, which contradicts an unstated start showing as today; the empty-string convention is the one already used for value.
- inferred: A field is changed exactly when its value differs from startedWith, so a field emptied from a held value is changed (the removal case); the only exception is an added field (itemId null) of a key that allows multiple values whose value equals the value of an attribute of that key with status active or uncertain; a single-valued field with itemId null counts as changed once it holds a value.
  from: a-field-is-changed-only-by-its-value, a-field-added-with-a-held-value-is-not-changed (which names only added fields of multi-valued keys), its decision log, a-value-of-the-wrong-type-reads-its-wording (an emptied field counts as a removal) and review-states-the-effect-of-each-change; the statuses active and uncertain are the live assertion-status members of the domain.
- inferred: isFieldChanged takes the field, the node's attributes and whether the key allows multiple values, and changedFlags adds the catalog lookup; a field whose key is absent from the catalog counts as not changed.
  from: The held-value clause needs the node's attributes and the key's allowsMultiple, and the groups come from the catalog, so a field with no catalog key has no group.
- inferred: An emptied field of a temporal key is a changed field, so it offers validity even though a removal sends null validity.
  from: The two validity rules say "changed field" with no exception and the removal rules treat the emptied field as a changed field with the effect removal; hiding validity there would add an exception no node states.
- inferred: When a field stops being changed (its value returns to startedWith, or an added field repeats a held value) its two inputs disappear; any validity already typed stays in the field state, untouched and not cleared, and reappears if the field becomes changed again; a non-temporal key never has typed validity because its inputs are never offered.
  from: The rules say when the inputs are offered and say nothing about clearing, and a-field-is-changed-only-by-its-value says the field's validity does not decide changed-ness; keeping it avoids discarding typed input silently, and an unchanged field sends no change, so the stale validity reaches no payload unless the payload task sends it for an unchanged field, which the rules forbid.
- inferred: 'The unstated start is shown as helper text under the start input ("Início não informado: aparece como hoje, AAAA-MM-DD."), not as a placeholder or a shown value.'
  from: A native date input ignores placeholder, and a shown value would write the date into the form state, which the task forbids; the wording and the YYYY-MM-DD form are the implementer's, as the task fixed the date form and left the presentation open.
- inferred: The clock is read when ValidityFields renders, through todayLocalDate() calling new Date(); the injectable seam is that Date-based read, which a test fixes with vi.useFakeTimers and setSystemTime; no prop was added and production passes nothing; the date is not refreshed across midnight without a re-render.
  from: The task allows Date-based reading at render time under fake timers and forbids a prop that production passes.
- inferred: No date check was added for validFrom and validTo, and entity-value-types.ts is not reused for them; the inputs are native date inputs, which yield only a valid YYYY-MM-DD or an empty value.
  from: a-field-accepts-only-its-value-type and a-value-of-the-wrong-type-reads-its-wording refer to a field's value and its key's value type and neither names the validity members; attribute-field types them as date but states no refusal; the wording rule's date message belongs to a value of a date key, so reusing it would add a rule no node states.
- inferred: The changed flags are computed in useEntityEditForm over useWatch values and passed down as a boolean array by field index, aligned with the field array; ValidityFields is keyed inside the row, which is keyed by the RHF field id, so field identity is unchanged.
  from: The review tasks need the same decision over the whole form, so one computation in the hook feeds both the inputs now and the review later.
- inferred: 'The accessible wording is the implementer''s: the group "Validade de {nome}", the labels "Início da validade" and "Fim da validade", an aria-label adding the key and position, and the notes; the aria-label contains the visible label text.'
  from: No node fixes these texts; WCAG 2.2 AA asks for labelled controls and for the accessible name to contain the visible label, and the existing group follows the same pattern for numbered multi-valued entries.
preserved:
- EntityForm keeps its props (node, attributeKeys), aria-label Formulário de edição, data-testid entity-form, noValidate, the submission hold and the reset(values) effect.
- Multi-valued add and remove, with the accessible names "Adicionar valor a {key}", "Remover valor N de {key}" and "{key} (valor N)", and focus returning to the add button after a removal; field identity stays the RHF field id.
- Closed keys still render ClosedChoice with the same options, placeholder, "Limpar" button and the held-outside line.
- The value-type check, its wording, the errors on the value field and valueTypesAccepted with data-value-types-accepted are unchanged, and validity is not part of the schema refinement.
- A disputed key still has no entry, no field, no add control and no validity inputs.
- A single-valued key still renders exactly one field, seeded from its first current attribute or empty, with no add or remove control.
- zodIssueResolver stays the resolver; nothing under backend/, src/lib/http.ts, query-client.ts, error-routing.ts, vendor/ or package.json was touched, no dependency was added, and no header entry or graph button was added.
deferred:
- what: The review tasks must reuse isFieldChanged and changedFlags from entity-field-changed.ts, or the hook's changed array, and not recompute changed-ness.
  why: The task introduces the function now because the validity inputs need it; the review is built by later tasks that depend on this one.
- what: The edit payload must send validFrom and validTo as JSON null when empty and must not write today's date into valid_from; it must send validity only for changed fields, and a remove change carries null validity, so any validity typed on an emptied field or on a field that stopped being changed is not sent.
  why: Sending belongs to the edit payload task (a-change-writes-an-empty-member-as-null, save-sends-one-change-per-changed-field), as the task's Notes state.
- what: The start-before-end check and its message on the validity end field (validity-start-precedes-the-end).
  why: The task assigns it to the validity-order task in the review epic.
- what: Existing specs that assert the exact entries of buildFormValues or emptyField need validFrom and validTo, and the new behavior has no test yet.
  why: Tests are another judge's; the implementer wrote none.
- what: Whether an emptied field of a temporal key, which becomes a removal with null validity, should offer validity at all.
  why: The rules say "changed field" and treat an emptied field as a removal, so this follows them literally; narrowing the offer is a question for the specification, not for source.
- what: 'A stale displayed date across midnight: the displayed today is not refreshed without a re-render.'
  why: Outside this task, and no node asks for a live clock.
---
## What it is
This record answers task/entity-form/validity-fields.
It holds the validity inputs of a changed field and the pure function that decides whether a field is changed.

## Notes
The build passed on its first run, run/entity-form-validity-fields-build; the implementer reported that existing specs asserting the exact entries of buildFormValues or emptyField may need the two new members, which the suite run decides.
