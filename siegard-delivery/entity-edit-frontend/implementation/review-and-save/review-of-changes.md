---
target: frontend
title: Review of changed fields
summary: The entity form offers "Revisar alterações" only while a field is changed and every value reads as its key's type, and the review lists each changed field once with its previous and new value and the validity it holds.
task: sha256:122238ed5bd777284f2393d42910aa98ef4279c276ddc6d9482b422eb6eff292
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-of-changes-build
files:
- path: src/features/entities/components/entity-review-entries.ts
  effect: New pure function reviewEntriesOf(held, changed, baseline, attributeKeys). It lists a live field once when its `changed` flag (from changedFlags/isFieldChanged) is true. It also lists each baseline field that has an itemId and a non-empty startedWith but whose itemId is no longer in the live fields, as a removed entry with an empty new value. Entries follow the catalog key order. An entry of a temporal key that is still in the form carries the validFrom/validTo it holds ('' means unstated). Removed entries and entries of non-temporal keys carry validity null.
- path: src/features/entities/components/use-entity-review.ts
  effect: New hook useEntityReview holding the `reviewing` flag. It returns { entries, offered, open, openReview, closeReview }. `offered` is true only when valueTypesAccepted is true and there is at least one entry. `open` is `reviewing && offered`, and `reviewing` is reset during render when the review stops being offered. A review therefore never reopens by itself once the gate holds again.
- path: src/features/entities/components/entity-review.tsx
  effect: 'New EntityReview component. It renders nothing while the review is not offered. While offered and closed it renders a ''Revisar alterações'' button. While open it renders a ui-kit Panel ''Revisão das alterações'' holding one list item per entry and a ''Voltar à edição'' button. Each item shows the key, ''Valor anterior'' beside ''Novo valor'', ''Sem valor'' for an empty value, and, for a temporal key still in the form, ''Início da validade'' and ''Fim da validade'' (only when an end is held). An unstated start shows todayLocalDate() with the note ''Início não informado: hoje.''. Focus moves to the panel on open and back to the button on close.'
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: 'Modified: EntityEditForm gains `review: EntityReviewState`, produced by useEntityReview over the live held fields, the `changed` flags, the baseline `values` and the catalog. form, valueTypesAccepted and changed are unchanged.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'Modified: takes `review` from the hook and renders <EntityReview review={review} /> inside the form after OutsideCatalogValues. Props, aria-label, data-testid, groups, the data-value-types-accepted attribute and the submission hold are unchanged.'
criteria:
- criterion: The form does not offer the review while every field holds the value it started with.
  met: true
  how: '`offered` in use-entity-review.ts is false when `entries` is empty. Entries come only from `changed[index] === true` (changedFlags/isFieldChanged) plus fields removed from the form. EntityReview returns null when it is not offered, so no ''Revisar alterações'' button exists. It is also not offered while valueTypesAccepted is false, per the entity-screen show-review refusal.'
- criterion: While a field's value differs from the value it started with, the review is not withheld for want of a changed field.
  met: true
  how: A field whose value differs from startedWith gets `changed[index] === true` from isFieldChanged. That makes `entries.length > 0`, so with valueTypesAccepted true the button 'Revisar alterações' (data-testid entity-review-button) renders, and activating it opens the Panel (data-testid entity-review). The review is withheld only on a value-type refusal, which the entity-screen contract states.
- criterion: The review lists each changed field once.
  met: true
  how: reviewEntriesOf emits one entry per live field whose changed flag is true, keyed `field-{index}`. It emits a removed entry only for a baseline itemId absent from the live fields, so a field emptied but still present is listed once, as a live entry. EntityReview renders one li (data-testid entity-review-item-{key}) per entry.
- criterion: The review does not list a field whose value equals the value it started with.
  met: true
  how: Only fields with changed[index] === true are listed, and isFieldChanged returns false when value equals startedWith. An added field of a multi-valued key that repeats a held active or uncertain value is also false there, so it is not listed either.
- criterion: The review does not list a field whose value equals the value it started with even when its validity differs from the validity it started with.
  met: true
  how: Validity is not part of isFieldChanged, and the review never reads validFrom or validTo to decide whether to list a field. A field with an unchanged value and a typed validity gets a false flag and no entry.
- criterion: Each listed field shows the value it started with beside the value it now holds.
  met: true
  how: ReviewItem in entity-review.tsx shows 'Valor anterior' (entry.startedWith, data-testid entity-review-previous-{key}) and 'Novo valor' (entry.value, data-testid entity-review-new-{key}) side by side in a two-column grid from the sm breakpoint. An empty value shows 'Sem valor'.
- criterion: Each listed field of a temporal key shows the validity start it holds.
  met: true
  how: For a temporal key, reviewEntriesOf carries validity { from, to } from the live field. ReviewItem shows 'Início da validade' with a stated start as typed (data-testid entity-review-valid-from-{key}). A key that is not temporal carries validity null and shows no start. A field removed from the form carries no validity because no field state remains.
- criterion: Each listed field of a temporal key that holds a validity end shows that validity end.
  met: true
  how: ReviewItem renders 'Fim da validade' (data-testid entity-review-valid-to-{key}) with validity.to only when it is not empty. An empty end renders nothing.
- criterion: A validity start the owner has not stated shows as today in the review.
  met: true
  how: 'When validity.from is '''' the start text is the `today` prop, computed once per render by todayLocalDate() from entity-local-date.ts (getFullYear/getMonth/getDate, the browser''s local time zone, never UTC). Beside it the note ''Início não informado: hoje.'' (data-testid entity-review-valid-from-unstated-{key}) shows. The form state is not written.'
nodes:
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/use-entity-review.ts
  how: 'Encodes the show-review answer for each changed field once, with its previous value beside its new value and the validity it states. It also encodes the refusals that no review is offered when no field is changed (review-needs-a-changed-field) and none while a value of the wrong type stands (the valueTypesAccepted gate). Not reached: the effect, the reason field, the trimmed-reason and start-before-end refusals, show-entity-list and save-edit.'
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: The session's `reviewing` member is the useState flag in useEntityReview. review-changes is openReview and the return to editing is closeReview. The flag is exposed by useEntityEditForm as `review.open`, with `review.offered` as its gate. `reason`, `undo_deadline`, confirm-save, undo-save and discard-changes are not reached.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-review-entries.ts
  how: The review reads attribute_key, started_with, value, valid_from and valid_to of each field, and item_id to detect a field that has left the form. It adds no member to the field's shape.
- node: rules/entity-workspace/review-needs-a-changed-field
  encoded_at:
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/entity-review.tsx
  how: '`offered` is `valueTypesAccepted && entries.length > 0`, and EntityReview renders neither button nor panel when it is false. An open review closes by itself when the last changed field returns to its start.'
- node: rules/entity-workspace/review-lists-each-changed-field-once
  encoded_at:
  - src/features/entities/components/entity-review-entries.ts
  - src/features/entities/components/entity-review.tsx
  how: Each changed field produces exactly one entry, and each entry is one list item showing its started-with value beside its current value. A removed field has no live counterpart, so it appears once, as a removed entry.
- node: rules/entity-workspace/a-field-is-changed-only-by-its-value
  encoded_at:
  - src/features/entities/components/entity-review-entries.ts
  how: Which live fields are listed is read from the `changed` array that changedFlags/isFieldChanged (entity-field-changed.ts, unchanged) produced. Validity is never consulted for listing, so a field whose value equals its start is not listed whatever validity it holds.
- node: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
  encoded_at:
  - src/features/entities/components/entity-review-entries.ts
  how: The held-value exception lives only in isFieldChanged. reviewEntriesOf consumes its result, so an added field of a multi-valued key that repeats an active or uncertain value is not listed and does not make the review offered.
- node: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  how: 'The ''shows as today'' half: an unstated start shows today''s date in the review, and the form state keeps validFrom empty. The ''sent empty'' half belongs to the edit-payload task and was not reached.'
- node: rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  how: The review's today is todayLocalDate() from the shared entity-local-date.ts, the browser clock's local calendar date. No UTC formatting and no second date helper were written.
inferences:
- inferred: A field the owner removed from a multi-valued key (the entry left the field array) is a changed field and is listed in the review, with its started value, an empty new value shown as 'Sem valor', and no validity. The review is offered when such a removal is the only change. Removals are computed against the baseline buildFormValues(node, attributeKeys) of the node as loaded. A baseline entry counts when it has an itemId, a non-empty startedWith, and its itemId is absent from the live fields.
  from: save-sends-one-change-per-changed-field says the save sends a remove change where the owner 'emptied or removed a field that started with a value'. rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields lets the owner remove fields. review-states-the-effect-of-each-change and review-names-each-effect-in-its-wording include a removal effect. The multi-valued-fields record deferred the baseline difference to the review tasks. Without it a removal would be saved unreviewed, or could not be saved at all. No task criterion tests it.
- inferred: '''Revisar alterações'' (button), ''Revisão das alterações'' (panel title), ''Voltar à edição'' (close button), ''Valor anterior'', ''Novo valor'', ''Início da validade'', ''Fim da validade'', ''Sem valor'' and ''Início não informado: hoje.'' are my wording.'
  from: 'The entity-screen contract and the nodes fix no wording for these controls or labels. They follow the pt-BR-only convention and the labels the validity fields already use (''Início da validade'', ''Fim da validade'', ''Início não informado: …'').'
- inferred: An empty previous or new value shows as the muted italic text 'Sem valor'.
  from: No node says how an empty value is displayed. An empty cell would hide that a value was added or removed, and the project's principle is that nothing is hidden silently.
- inferred: 'The review is a live view of the form: it stays open while the owner edits and always lists the current changed fields. The form fields stay visible and mounted while it is open. Opening the review does not snapshot or freeze values.'
  from: entity-edit-session holds one `fields` state and a boolean `reviewing`, with no snapshot member. Keeping the Controllers mounted preserves the RHF state the later save and conflict tasks need.
- inferred: An open review closes by itself when it stops being offered (the last change reverted, or a value of the wrong type typed), and does not reopen when the gate holds again.
  from: review-needs-a-changed-field and the show-review refusal say no review is offered in those cases. Resetting `reviewing` during render keeps a stale open flag from reopening the review on a later change.
- inferred: The review control is a type=button inside the form, shown only while the review is closed. Activating it opens the review panel, and the panel's 'Voltar à edição' closes it. Focus moves to the panel on open (tabIndex -1) and back to the button on close.
  from: The form holds submission with preventDefault, so a button cannot submit. WCAG 2.2 AA in the project configuration asks for managed focus where content appears and disappears.
- inferred: A field of a temporal key that was emptied but is still in the form is listed with its validity start (today if unstated) and any end. A field removed from the form shows no validity.
  from: The criterion reads 'each listed field of a temporal key shows the validity start it holds'. The validity-fields record already inferred that an emptied field of a temporal key is a changed field offering validity. A removed field has no field state to read.
- inferred: Entries are ordered by the catalog's key order. Within a key, live changed fields come in form order, followed by removed ones. The list item key is `field-{index}` or `removed-{itemId}`.
  from: The form's own groups follow catalog order (the-form-has-a-field-group-per-catalog-key). No node orders the review.
preserved:
- EntityForm keeps its props (node, attributeKeys), aria-label 'Formulário de edição', data-testid entity-form, data-value-types-accepted, noValidate, the submission hold and the reset(values) effect.
- useEntityEditForm still returns { form, valueTypesAccepted, changed }; `review` is added beside them and nothing destructuring the earlier three breaks.
- isFieldChanged and changedFlags (entity-field-changed.ts) and todayLocalDate and localCalendarDate (entity-local-date.ts) are reused and unchanged. Changed-ness is not recomputed.
- Field groups, multi-valued add and remove with their accessible names and focus handling, closed choices, value-type inputs and messages, validity inputs shown only on changed temporal fields, disputed-key values with the curation link, and outside-catalog values are untouched.
- zodIssueResolver stays the form's resolver.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts, src/lib/error-routing.ts, the router, the header and the graph panel are untouched. No dependency was added. No header entry or graph button was added. No GlassSurface. No forwardRef. No sibling-feature import.
deferred:
- what: The effect each change will have ('Primeiro valor', 'Adição', 'Sucessão', 'Correção', 'Remoção'), the reason field and the refusals review-requires-a-trimmed-reason and validity-start-precedes-the-end.
  why: The task's ADVISORY note assigns them to the review-effects, review-reason and validity-order tasks. They can read `review.entries`, `review.open` and the baseline-based removal entries added here.
- what: 'The review''s reading of an emptied field of a temporal key: whether the review should hide the validity of an emptied field, whose removal sends null validity.'
  why: The criterion is literal about a listed field of a temporal key, and no node excepts a removal. Narrowing it is a question for the specification and the effects task.
- what: Confirm-save, the edit payload (an unstated start sent empty, one change per changed field, remove changes naming the baseline itemId), undo, conflict and keeping typed values across a refetch.
  why: 'REMAINDER and sibling tasks. The record that the review is judged against the node as loaded is kept: removals use the baseline of `values`, which follows the node props, and the reset(values) effect still replaces the field array on a node refetch.'
- what: Existing specs that mount EntityForm may now find a 'Revisar alterações' button once a field changes, and the new behaviour has no test yet.
  why: Writing tests is another judge's role.
- what: The displayed today is not refreshed across midnight without a re-render.
  why: Outside this task, and no node asks for a live clock (the same deferral as the validity-fields record).
---
## What it is
Adds the review step to the entity form. Files created: entity-review-entries.ts, use-entity-review.ts and entity-review.tsx. Files modified: use-entity-edit-form.ts, which now also returns `review`, and EntityForm.tsx, which renders EntityReview after the outside-catalog values. Nothing was run, built or tested. The reasoning is in inferences and deferred.

## Notes
Reviewing state is local React state (useState) inside useEntityReview, called by useEntityEditForm. No zustand store, because no node or inventory entry calls for one. It stays in the hook so the reason, save, undo and conflict tasks can read it and extend `EntityReviewState`. Changed-ness is decided only by `changedFlags`, which the hook already computes with `isFieldChanged`. The baseline is the `buildFormValues(node, attributeKeys)` result the hook already holds as `values` (memoised on the node and catalog props, the node as loaded). No path under backend/, vendor/ or package.json was touched, nor src/lib/http.ts, query-client.ts or error-routing.ts. zodIssueResolver is still the resolver. No header entry or graph button was added. No sibling feature is imported. The record carries no task pin and no standard `at`/`pin`; the caller stamps them.
