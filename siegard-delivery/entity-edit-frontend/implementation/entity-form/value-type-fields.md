---
target: frontend
title: A field accepts only its key's value type
summary: Each field of the entity form is checked per entry against its key's value type (date, number, bool or text) by a Zod schema built from the catalog, shows the rule's wording on that field with aria-invalid and aria-describedby, and the form exposes a synchronous value-type validity flag for the later review task to gate on.
task: sha256:c66114d16e939b8affab68be5a5e3c8fa29e504f5b70fddff0b6db55c5bef1b0
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-value-type-fields-build-2
files:
- path: src/features/entities/components/entity-value-types.ts
  effect: 'new: holds the three exact messages the rule writes (date, number, bool) and valueTypeMessage(valueType, value), which returns null for an empty string, for text and for any value type it does not know, and otherwise the message for a value that does not read as its type; date is ^\d{4}-\d{2}-\d{2}$ plus an existing day, checked by month lengths and the leap-year rule with no Date object; number is ^-?\d+(\.\d+)?$ plus Number.isFinite; bool is exactly true or false, case-sensitive and untrimmed.'
- path: src/features/entities/components/entity-form-schema.ts
  effect: 'modified: adds buildEntityFormSchema(attributeKeys), a Zod object whose fields array carries a superRefine that maps each entry''s attributeKey to the catalog''s valueType and adds a custom issue at path [index, "value"] with the wording; entityFormSchema, attributeFieldSchema, the types and every builder keep their shape and the EntityFormValues type is unchanged.'
- path: src/features/entities/components/zod-issue-resolver.ts
  effect: 'new: zodIssueResolver(schema) returns an RHF Resolver that runs schema.safeParse(values); on success it returns { values: parsed.data, errors: {} }; on failure it returns { values: {}, errors } with one { type: issue.code, message: issue.message } per issue path (the first issue at a path wins), nested through @hookform/resolvers'' toNestErrors as zodResolver does, so fields.N.value reaches formState.errors and Controller''s fieldState.error; it reads Zod 4''s issues and does not depend on error.errors.'
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: 'new: hook useEntityEditForm(node, attributeKeys) that owns the useForm with the resolver zodIssueResolver over the catalog-built schema (memoised on attributeKeys, the resolver rebuilt with it), mode onChange, defaultValues from buildFormValues and the reset(values) effect that EntityForm previously held; it returns { form, valueTypesAccepted }, where valueTypesAccepted is the schema''s safeParse of the live fields via useWatch, so it is synchronous and true while every non-empty value reads as its key''s type.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'modified: takes its form from useEntityEditForm instead of building useForm inline and sets data-value-types-accepted on the form element from valueTypesAccepted; props, aria-label, data-testid, the field array with add and remove, the groups and the submission hold are unchanged.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'modified: each Controller reads fieldState.error; a field in error shows its message in a p with role alert, id entity-error-{rhf id} and data-testid entity-error-{key} under the input, and the input gets aria-invalid true and aria-describedby listing the help text id and the error id; a field not in error carries no aria-invalid and describes itself by the help text only, as before; the row aligns to the top so the remove button stays beside the input.'
criteria:
- criterion: A date field holding a non-empty value refuses it where it does not match ^\d{4}-\d{2}-\d{2}$.
  met: true
  how: readsAsDate in entity-value-types.ts tests DATE_PATTERN first and valueTypeMessage returns the date message on failure; the superRefine in buildEntityFormSchema turns that into an issue on fields.{index}.value, zodIssueResolver puts it on formState.errors and entity-field-group.tsx shows it on that field.
- criterion: A date field holding a non-empty value refuses it where it matches ^\d{4}-\d{2}-\d{2}$ but names no existing day.
  met: true
  how: namesExistingDay compares the day against MONTH_LENGTHS, with February 29 allowed only where isLeapYear (divisible by 4 and not by 100, or by 400) holds, and refuses month 00, month 13 and day 00; nothing depends on Date rolling over, so 2026-02-30 and 2025-02-29 are refused and 2024-02-29 is not.
- criterion: A date field does not refuse a value that matches ^\d{4}-\d{2}-\d{2}$ and names an existing day.
  met: true
  how: readsAsDate returns true when the pattern matches and namesExistingDay holds, so valueTypeMessage returns null and no issue is added.
- criterion: A number field holding a non-empty value refuses it where it does not match ^-?\d+(\.\d+)?$.
  met: true
  how: readsAsNumber tests NUMBER_PATTERN first and valueTypeMessage returns the number message on failure; the pattern is not trimmed, so a value with surrounding spaces, a comma decimal or an exponent is refused.
- criterion: A number field holding a non-empty value refuses it where it matches ^-?\d+(\.\d+)?$ but does not read as a finite number.
  met: true
  how: readsAsNumber also requires Number.isFinite(Number(value)), so a 400-digit integer, which Number reads as Infinity, is refused with the number message.
- criterion: A number field does not refuse a value that matches ^-?\d+(\.\d+)?$ and reads as a finite number.
  met: true
  how: Both conditions in readsAsNumber hold for such a value, so valueTypeMessage returns null.
- criterion: A bool field holding a non-empty value refuses it where it is other than exactly true or exactly false.
  met: true
  how: readsAsBool is a strict equality against "true" and "false", so True, TRUE, " true" and 1 are refused with the bool message.
- criterion: A bool field does not refuse exactly true.
  met: true
  how: readsAsBool("true") is true, so valueTypeMessage returns null.
- criterion: A bool field does not refuse exactly false.
  met: true
  how: readsAsBool("false") is true, so valueTypeMessage returns null.
- criterion: A text field refuses no text.
  met: true
  how: valueTypeMessage has no case for text and its default branch returns null, so any text, including whitespace-only text and text that looks like a date, passes.
- criterion: An empty field of any value type is not refused for its value type.
  met: true
  how: valueTypeMessage returns null first when value is the empty string, before the switch on the value type; only the empty string counts as empty (see inferences).
- criterion: An empty field of any value type does not withhold the review.
  met: true
  how: Emptiness is never an issue in the schema, so valueTypesAccepted from useEntityEditForm stays true with empty fields of any type; read as the advisory note reads it, emptiness is never a cause of withholding; no review control exists yet, so this is met only in the sense that the gate has no emptiness cause, and the review task still has to add the rule that withholds the review while no field differs from its start.
- criterion: A field holding a value its key's value type refuses shows a message on that field naming the value type it expects.
  met: true
  how: The issue lands at fields.{index}.value; zodIssueResolver nests it into formState.errors, so Controller's fieldState.error carries the rule's wording, which names the value type; entity-field-group.tsx renders it under that field's input with role alert and links it through aria-describedby together with the help text, and the input carries aria-invalid true; with mode onChange the message shows as the owner types.
- criterion: The form does not offer the review while a field holds a value its key's value type refuses.
  met: true
  how: 'The form offers no review control at all yet, so the criterion holds only in that sense; the gate it depends on exists: useEntityEditForm returns valueTypesAccepted and EntityForm mirrors it as data-value-types-accepted on the form element; it is false exactly while some entry holds a refused value and the review task must read it; nothing reads it today.'
nodes:
- node: rules/entity-workspace/a-field-accepts-only-its-value-type
  encoded_at:
  - src/features/entities/components/entity-value-types.ts
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/zod-issue-resolver.ts
  how: The invariant is the superRefine in buildEntityFormSchema, which adds an issue for each entry whose value does not read as its key's value type; zodIssueResolver turns the issues into form errors, and valueTypesAccepted is the same schema's verdict on the live fields.
- node: rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording
  encoded_at:
  - src/features/entities/components/entity-value-types.ts
  - src/features/entities/components/entity-field-group.tsx
  how: The three messages are written verbatim as constants in entity-value-types.ts and text has none; an empty value is never refused; the message shows on the field in error, under it, and is linked by aria-describedby.
- node: rules/knowledge-base/attribute-value-parses
  encoded_at:
  - src/features/entities/components/entity-value-types.ts
  how: 'The form side encodes the grammar of the node''s expression: date regex plus an existing calendar day, number regex plus finite, bool exactly true or false, text anything; the clauses for proposals, corrections and set changes belong to the backend and are not touched.'
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: attributeFieldSchema is unchanged; the value member is now validated against the value type of the key named by attribute_key, through a map built from the catalog, and the check applies to every entry of a multi-valued key.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/use-entity-edit-form.ts
  how: The show-review refusal for a wrong-type value is encoded as the message on the field and the gate (valueTypesAccepted, data-value-types-accepted) that the later review control must obey; the review itself, the save and the other refusals are not reached.
inferences:
- inferred: Only the empty string counts as empty; a whitespace-only value is non-empty, so it is refused for date, number and bool and accepted for text.
  from: No node says whether whitespace counts as empty and the task notes carry an ADVISORY to that effect; the bool grammar is stated as exact with no trimming and the date and number patterns are anchored, so trimming would contradict the grammar.
- inferred: A key whose valueType is not date, number or bool, and an entry whose attributeKey is absent from the catalog, are not refused.
  from: The rule writes a message only for the three types and says text reads as any text, and an unknown type has no grammar to refuse by.
- inferred: Year 0000 is accepted as an existing day (it is a leap year under the 400 rule).
  from: The grammar says four digits and an existing calendar day, and the proleptic Gregorian calendar the leap-year rule describes has year 0; no node excludes it.
- inferred: The form validates with mode onChange, so the message appears as the owner types and clears when the value is fixed.
  from: The task asks for the message to show as the owner types; the previous mode, onBlur, would show it only on leaving the field.
- inferred: The schema is built from the catalog by a factory, buildEntityFormSchema, and the resolver is rebuilt when attributeKeys changes; entityFormSchema stays exported unchanged.
  from: The task leaves the mechanism to the implementer; a factory keeps the form schema-first and the unchanged export keeps the existing consumers and tests working.
- inferred: 'zodIssueResolver keeps the first issue at each path as { type: issue.code, message } and ignores criteriaMode all and native validation.'
  from: zodResolver's own output shape in the installed @hookform/resolvers 3.10.0 (zod.ts), under the default criteriaMode, which is the only mode this form uses.
- inferred: valueTypesAccepted is derived synchronously with safeParse over useWatch instead of reading formState.isValid, and EntityForm exposes it as data-value-types-accepted on the form element.
  from: isValid is false until the resolver's first asynchronous run, which would briefly withhold the review on mount; the attribute gives the gate an observable seam before the review control exists.
- inferred: A node that starts with a value its key's type refuses shows no message until the owner edits that field, though valueTypesAccepted is false from the start.
  from: RHF onChange mode reports an error only for the touched field; the knowledge base validates the value type on write, so a stored value that fails is not expected, and forcing trigger() after reset would add asynchronous state updates on every load for a case the backend excludes.
- inferred: The error p uses role alert, id entity-error-{rhf field id} and data-testid entity-error-{key}, and the input carries aria-invalid true only while in error.
  from: The CorrectionFields precedent in features/curation (role alert, text-xs text-destructive, aria-invalid, aria-describedby) and rules/application-shell/an-invalid-field-is-described, which asks for a field in error to be described by its help text and its error message, and one not in error by its help text only.
divergences:
- from: The standard's rule FRM-01 (a form is schema-first with React Hook Form and Zod through zodResolver), whose scope reaches .tsx files and so not the hook src/features/entities/components/use-entity-edit-form.ts nor src/features/entities/components/zod-issue-resolver.ts where the departure sits
  departure: 'The form is schema-first with React Hook Form and Zod, but it does not go through zodResolver: use-entity-edit-form.ts passes a local Resolver, zodIssueResolver, built on the same Zod schema.'
  why: Installed @hookform/resolvers 3.10.0 (package.json ^3.9.1) recognises a Zod error only by Array.isArray(error?.errors) and the installed zod 4.4.3 errors expose issues and no errors, so zodResolver rethrows the schema's custom issues from RHF's onChange and no field error reaches formState.errors; the suite run run/entity-form-value-type-fields-suite was red for that reason; no dependency change is authorized to this delivery; the proper repair, bumping @hookform/resolvers to a release that supports Zod 4, is a dependency decision for the person.
- from: src/features/entities/components/EntityForm.tsx as delivered by task/entity-form/multi-valued-fields
  departure: The useForm, the resolver and the reset effect moved from EntityForm into the new hook useEntityEditForm.
  why: The review task needs the validity next to the form that owns the schema, and a hook keeps EntityForm small and gives the gate a named export; the props, DOM, accessible names and behaviour of the form are unchanged.
preserved:
- EntityForm keeps its props (node, attributeKeys), aria-label Formulário de edição and data-testid entity-form, noValidate, the submission hold and the reset(values) effect on node or catalog change (now inside useEntityEditForm).
- A single-valued key renders one field with no add or remove control, seeded from its first current attribute or empty, with the Label tied to the field and the help text linked by aria-describedby.
- Multi-valued keys keep one field per current attribute, the add and remove controls, the accessible names Remover valor N de {key}, Adicionar valor a {key} and {key} (valor N), and focus returning to the add button after a removal; the validation applies to each entry by its own attributeKey.
- A key holding a disputed attribute still has no entry, no field and no add control, so it has nothing to validate.
- entityFormSchema, attributeFieldSchema, buildFormValues, buildFieldGroups, emptyField, currentAttributeOf, currentAttributesOf, isDisputedKey, DISPUTED_ATTRIBUTE_STATUS and the types EntityFormValues and AttributeFieldValues keep their exports and shapes.
- Nothing under backend/, src/lib/http.ts, query-client.ts or error-routing.ts, EntityPage, the api hooks, types.ts, the router, the header and the graph panel is touched; no dependency was added or bumped and package.json is unchanged.
deferred:
- what: Replacing zodIssueResolver with zodResolver once @hookform/resolvers is bumped to a release that supports Zod 4; CorrectionForm in features/curation uses zodResolver on the same installed versions and has the same exposure.
  why: A dependency bump is a decision for the person and no dependency change was authorized to this delivery; the local resolver is the source-side repair meanwhile.
- what: 'The review control and its gate: the review task (review-and-save/review-of-changes) must read valueTypesAccepted from useEntityEditForm in use-entity-edit-form.ts, which is false exactly while some entry holds a value its key''s value type refuses; EntityForm already mirrors it as data-value-types-accepted on the form element; the control is offered only when valueTypesAccepted is true and at least one field differs from its start, per review-needs-a-changed-field.'
  why: The task says the review belongs to a later task; this task only exposes the validity the review will gate on.
- what: An emptied field is validated as no value, so it never blocks the review for its type; how it becomes a removal or no change in the edit payload belongs to save-sends-one-change-per-changed-field and a-change-writes-an-empty-member-as-null.
  why: Owned by the review and save tasks.
- what: Showing the message for a field that starts already holding a refused value, before the owner touches it (for example a trigger() after the reset effect), if the review task wants that.
  why: No node requires it and the backend excludes the case, as recorded in inferences.
- what: Closed-key allowed values, validity fields, the disputed-key values and curation pointer, and attributes outside the catalog remain with their own tasks.
  why: Each is a sibling task of this one.
---
## What it is
This record answers task/entity-form/value-type-fields.
It holds the value-type check of every field, its wording on the field and the validity flag the review will gate on.

## Notes
The first build passed, run/entity-form-value-type-fields-build; the first suite run was red because zodResolver of the installed @hookform/resolvers 3.10.0 rethrows Zod 4 issues, the implementation was revised to a local resolver, and run/entity-form-value-type-fields-build-2 passed; the last two criteria are met only in the sense that no review control exists yet and the gate they depend on is exposed, which the review task completes.
