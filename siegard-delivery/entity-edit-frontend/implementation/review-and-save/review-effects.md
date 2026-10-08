---
target: frontend
title: Review states the effect of each change
summary: A new pure mapping, changeOfField, classifies each changed field as a first value, addition, succession, correction or removal against the node as loaded. The review shows that effect as visible text for every listed entry.
task: sha256:37bbec4fd5b9595cddaa5befd78d3a1c1e099717aa0f9b278a231055e1d54a91
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-effects-build
files:
- path: src/features/entities/components/entity-change-effect.ts
  effect: 'New. It exports EditEffect, the five-value union first-value, addition, succession, correction, removal. It exports EDIT_EFFECT_WORDING (Primeiro valor, Adição, Sucessão, Correção, Remoção, no ending punctuation). It exports FieldChange { kind: ''set''|''remove'', effect, itemId } and ChangeSubject (attributeKey, itemId, startedWith, value). It exports the pure function changeOfField(field, attributeKey, attributes), which returns the FieldChange for one field or null. A field started from an attribute (itemId set) whose value is unchanged gives null. If emptied it gives remove/removal naming that itemId. Otherwise it gives set naming that itemId, succession for a temporal key and correction for any other key. A field with no started attribute and an empty value gives null. If the node holds no attribute of the key with a live status (heldAttributesOf: active, uncertain, disputed), it gives set/first-value. If the key allows multiple current values and no active or uncertain attribute holds the value, it gives set/addition. Anything else gives null. It reads only the field''s own started state and the node''s attributes as loaded, never the other fields of the edit. The edit-payload task can call it for the kind and itemId of each change.'
- path: src/features/entities/components/entity-review-entries.ts
  effect: 'Modified. ReviewEntry gains `effect: EditEffect | null`. reviewEntriesOf gains a fifth parameter `attributes` (node.attributes as loaded). Each live entry takes its effect from changeOfField. Each removed entry is judged as a field with an empty value, so it states a removal. Which fields are listed, their order, their validity and their removed entries are unchanged.'
- path: src/features/entities/components/use-entity-review.ts
  effect: Modified. useEntityReview takes `attributes` after attributeKeys and passes it to reviewEntriesOf, adding it to the memo dependencies. offered, open, openReview and closeReview behave as before.
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: Modified. It passes node.attributes, the node as loaded, to useEntityReview. The returned shape is unchanged.
- path: src/features/entities/components/entity-review.tsx
  effect: Modified. Each review item shows a 'Efeito' term with the effect wording as visible text (data-testid entity-review-effect-{key}) beside 'Valor anterior' and 'Novo valor'. Nothing is rendered when an entry's effect is null. Gating, focus handling, validity display and the 'Sem valor' display are unchanged.
- path: src/features/entities/components/entity-field-changed.ts
  effect: Modified. holdsValue is now exported so the effect mapping reuses the 'active or uncertain attribute of the key holds this value' test instead of duplicating it. Its behavior and isFieldChanged are unchanged.
criteria:
- criterion: The review states one effect for each changed field.
  met: true
  how: reviewEntriesOf sets `effect` on every entry from changeOfField, and ReviewItem renders it in the Efeito row (entity-review-effect-{key}). Every entry the changed flags admit gets one of the five effects. The one exception is a combination the form cannot produce, which gets null (see inferences).
- criterion: Each stated effect is a first value, an addition, a succession, a correction or a removal.
  met: true
  how: EditEffect is the five-value union, and EDIT_EFFECT_WORDING is a total Record over it. The entry's effect is typed EditEffect | null, with no sixth value.
- criterion: A field of a temporal key that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a succession.
  met: true
  how: In changeOfField, itemId !== null, the value differs from startedWith and is non-empty, and attributeKey.isTemporal, so the result is set/succession. The review shows 'Sucessão'.
- criterion: A field of a key that is not temporal that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a correction.
  met: true
  how: The same branch with isTemporal false returns set/correction, and the review shows 'Correção'.
- criterion: A field given a value for a key of which the node holds no attribute with a live status, active, uncertain or disputed, is stated as a first value.
  met: true
  how: With itemId null and a non-empty value, heldAttributesOf(attributes, key) is empty for node.attributes as loaded, so the result is set/first-value ('Primeiro valor'). Every added field of such a key is a first value, because the check never reads the other fields.
- criterion: A field added to a multi-valued key of which the node holds an attribute with a live status, with a value no active or uncertain attribute of that key holds, is stated as an addition.
  met: true
  how: With itemId null, a live attribute held (not the first-value case), allowsMultiple true and holdsValue false, the result is set/addition ('Adição'). The judgement uses the node's attributes as loaded, so two fields added to such a key are both additions.
- criterion: A field emptied after starting with a value is stated as a removal.
  met: true
  how: A live field with itemId set, a value that differs from startedWith, and an empty value returns remove/removal naming itemId, and the review shows 'Remoção'.
- criterion: A field removed after starting with a value is stated as a removal.
  met: true
  how: 'removedEntry in entity-review-entries.ts judges the baseline field as `{ ...field, value: "" }`, which is the same removal branch, so the removed entry shows ''Remoção''.'
nodes:
- node: rules/entity-workspace/review-states-the-effect-of-each-change
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/entity-review-entries.ts
  - src/features/entities/components/entity-review.tsx
  how: Every listed entry carries one effect from the five-value mapping, and EntityReview renders it as visible text with the stable data-testid entity-review-effect-{key}.
- node: rules/entity-workspace/review-names-each-effect-in-its-wording
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: EDIT_EFFECT_WORDING holds Primeiro valor, Adição, Sucessão, Correção and Remoção verbatim with no ending punctuation, and the review renders those strings and no other text for the effect. No text is given to unchanged, which the review never lists.
- node: rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: changeOfField takes the field's own started state and node.attributes as the node was loaded, and receives no other field of the edit. useEntityEditForm passes node.attributes, and removed entries use the baseline built from the node props.
- node: rules/knowledge-base/entity-edit-first-value
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: A set with no attribute named, for a key where heldAttributesOf (active, uncertain, disputed) finds none, takes the effect first-value.
- node: rules/knowledge-base/entity-edit-addition
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: A set with no attribute named, on a key that allows multiple current values with a live attribute held and no active or uncertain attribute holding the value, takes the effect addition. The recording clause is the backend's.
- node: rules/knowledge-base/entity-edit-succession
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: A field that names a current attribute (itemId) of a temporal key and holds another non-empty value takes the effect succession.
- node: rules/knowledge-base/entity-edit-correction
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: The same field on a key that is not temporal takes the effect correction.
- node: rules/knowledge-base/entity-edit-removal
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/entity-review-entries.ts
  how: A field that names an attribute and was emptied or removed gives kind 'remove' with the effect removal. The removal's recording (deleted and stamped) is the backend's.
- node: domain/knowledge-base/edit-effect
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  how: 'The EditEffect union carries the enumeration''s first five values. The sixth, unchanged, is not carried: the mapping gives null for a field that states no change, and the review lists none.'
- node: domain/entity-workspace/entity-edit-session
  how: 'The session is honored, not extended. The review remains a live view of the form''s fields, with no new session member: the effect is derived from the fields and the node as loaded on each render.'
- node: domain/entity-workspace/attribute-field
  how: The mapping reads attribute_key, item_id, started_with and value of a field and adds no member to its shape. Validity is not consulted for the effect.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  how: The show-review answer now includes the effect each change will have, beside the previous and new value. The reason field and its refusals, and the save-edit answer, are not reached.
inferences:
- inferred: The succession and correction rules apply to a field started from a current attribute of a multi-valued key whose value changed, as they do for a single-valued key. The two rules say 'a current attribute of a temporal key' and 'of a key that is not temporal', and neither restricts by multiplicity.
  from: The statements of entity-edit-succession and entity-edit-correction. Only entity-edit-addition names multiplicity, and it requires that the change name no attribute.
- inferred: changeOfField returns null, and the entry carries no effect, for a combination no effect rule covers. That is a field with no started attribute, a live attribute held on a key that allows only one current value, and a non-empty value. The same null covers a value already held by an active or uncertain attribute, and a started field whose value equals its start. The form cannot produce these as listed fields. A single-valued key with a live attribute always starts its field from that current attribute, and isFieldChanged excludes the held-value additions. No sixth effect was invented.
  from: The five effect rules, entity-edit-adds-no-second-current-value (the backend refuses the single-valued case as a conflict) and a-field-added-with-a-held-value-is-not-changed. The wording rule gives no text to unchanged.
- inferred: The result's `kind` is 'set' for every effect except removal, and its `itemId` is the attribute the field started from (null for a first value and an addition). Value and validity are left to the payload task, which reads them from the field.
  from: save-sends-one-change-per-changed-field, the attribute-change shape, and the ADVISORY that the review and the save share one field-to-change mapping.
- inferred: '''Efeito'' is the term label for the effect row, and a removed field''s effect is judged as a field whose value is empty. The effect is placed after ''Novo valor''.'
  from: The label vocabulary of the delivered review ('Valor anterior', 'Novo valor'). No node fixes the label or the position, and the wording rule fixes only the effect texts.
- inferred: A first value is decided by the node holding no live attribute of the key, so a disputed attribute counts as live. A disputed key shows no field, so this cannot be reached through the form.
  from: The first-value criterion and rule, which list disputed among the live statuses, and heldAttributesOf, which covers active, uncertain and disputed.
preserved:
- The review is offered only while a field is changed and every value reads as its key's type. Gating, the reviewing flag, the auto-close and focus management are unchanged.
- Which fields are listed (the changed flags), the one-entry-per-field rule, removed entries from the baseline, catalog ordering and the item keys are unchanged.
- The validity display, 'Sem valor', 'Valor anterior', 'Novo valor', the unstated-start-as-today note and the 'Voltar à edição' control are untouched.
- isFieldChanged and changedFlags behave exactly as before. holdsValue is only exported.
- zodIssueResolver stays the form's resolver. useEntityEditForm still returns form, valueTypesAccepted, changed and review.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts, src/lib/error-routing.ts, the router, the header and the graph panel are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, and no comments written.
deferred:
- what: The edit payload (one change per changed field, empty validity sent as null, an unstated start sent empty) and the reason field.
  why: Those belong to the edit-payload and review-reason tasks. changeOfField, which returns the kind and itemId, is the shared mapping they should call.
- what: Existing and new tests for the effect. A direct call to reviewEntriesOf or useEntityReview must now pass `attributes`; none of the existing specs does, because they go through EntityForm.
  why: Writing tests is another judge's role.
- what: The repeated entity-review-*-{key} testids of a multi-valued key with several listed fields, which now includes entity-review-effect-{key}.
  why: The delivered review's convention is one testid per key. A change belongs to a later task.
---
## What it is
Adds the effect of each change to the entity review. The new entity-change-effect.ts holds the pure mapping changeOfField, the EditEffect union and the fixed pt-BR wording. reviewEntriesOf, useEntityReview and useEntityEditForm now carry the node's attributes as loaded so each entry gets its effect, and EntityReview shows it in an 'Efeito' row. Nothing was run, built or tested.

## Notes
Both UNDERDETERMINED notes are honored: each field is judged only against the node as loaded, and the wording is the rule's verbatim. The ADVISORY about one shared field-to-change mapping is met by changeOfField, whose kind and itemId output the edit-payload task is meant to reuse. No file under backend/ or vendor/ was touched. The record carries no task pin and no standard `at`/`pin`; the caller stamps them.
