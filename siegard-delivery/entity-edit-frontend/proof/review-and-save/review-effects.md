---
target: frontend
title: Proof for the review stating the effect of each change
summary: Through the real EntityForm, tests show one exact-wording effect per changed field for each of the five effects, judged against the node as loaded. A direct table over changeOfField pins kind and itemId.
implementation: sha256:193daf3ca19c1cbdde882889c6330391b198511755a8b406e02b4267e1e8ee50
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-effects-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states exactly one effect for each changed field, a key with several changed fields included
  proves: The review states one effect for each changed field.
  fails_when: a listed entry shows no effect, shows two, or a key holding several changed fields shows an effect for only one of them
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a succession for a field of a temporal key that started from a current attribute and was changed to another non-empty value
  proves: A field of a temporal key that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a succession. The text is exactly Sucessão.
  fails_when: the field is stated as a correction or any other effect, the effect is missing, or the text is not exactly Sucessão
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a correction for a field of a key that is not temporal that started from a current attribute and was changed to another non-empty value
  proves: A field of a key that is not temporal that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a correction. The text is exactly Correção.
  fails_when: the field is stated as a succession or any other effect, the effect is missing, or the text is not exactly Correção
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a first value for a field given a value when $label
  proves: A field given a value for a key of which the node holds no attribute with a live status is stated as a first value. The three rows are a key with no attribute, a key with only a superseded attribute, and a temporal key with none. The text is exactly Primeiro valor.
  fails_when: a superseded-only attribute counts as live, a temporal key with no attribute is stated as a succession, or the text is not exactly Primeiro valor
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states an addition for a field added to a multi-valued key when $label
  proves: A field added to a multi-valued key of which the node holds an attribute with a live status, with a value no active or uncertain attribute of that key holds, is stated as an addition. The three rows are an active live attribute, an uncertain-only live attribute, and a value held only by a superseded attribute. The text is exactly Adição.
  fails_when: an uncertain attribute is not treated as live, so the field is stated as a first value; a value held only by a superseded attribute is treated as held; or the text is not exactly Adição
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a removal for a field of $label emptied after starting with a value
  proves: A field emptied after starting with a value is stated as a removal. The two rows are a key that is not temporal and a temporal key. The text is exactly Remoção.
  fails_when: an emptied field of a temporal key is stated as a succession, an emptied field is stated as a correction, the effect is missing, or the text is not exactly Remoção
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a removal for a field removed from a multi-valued key after starting with a value
  proves: A field removed after starting with a value is stated as a removal, through the entry the review lists for the removed field.
  fails_when: the removed entry shows no effect or any effect other than Remoção
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states a first value for both of two fields added to a multi-valued key of which the node holds no live attribute
  proves: 'UNDERDETERMINED (1), from the specification: each change is judged against the node as the form loaded it, never against the other fields of the same edit. Both added fields are Primeiro valor, and the second is not an Adição.'
  fails_when: the review judges a field against the node as the earlier fields would leave it, so the second of two added fields is stated as an addition
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states an addition for both of two fields added to a multi-valued key of which the node holds a live attribute
  proves: 'UNDERDETERMINED (1) as stated: two fields added to a multi-valued key with a live attribute are both an Adição. This is the addition criterion with several added fields.'
  fails_when: either added field is stated as anything other than an addition, or its effect is missing
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: states an addition for a field added while the same edit removes the only live attribute of the key
  proves: 'a-change-is-judged-against-the-node-as-loaded: another change of the edit, a removal of the key''s only live attribute, does not change the judgement of an added field. It stays Adição, against the node as loaded, and is not a first value.'
  fails_when: the review judges an added field against the node as the earlier removal would leave it, so the added field is stated as a first value
- file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending punctuation
  proves: 'rules/entity-workspace/review-names-each-effect-in-its-wording: one review holding all five effects shows Primeiro valor, Adição, Sucessão, Correção and Remoção, each exactly, with no ending punctuation. This also covers UNDERDETERMINED (2) and the criterion that each stated effect is one of the five.'
  fails_when: any of the five texts differs, for example First value, Substituição, or a text with an ending period; two effects swap their texts; or an effect is missing or sixth effect text appears
  demonstrates: rules/entity-workspace/review-names-each-effect-in-its-wording
- file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
  name: gives $label
  proves: The shared mapping changeOfField names, for each case the nodes state, the change kind (set or remove) and the itemId. Succession and correction name the attribute the field started from. Removal is a remove change naming that attribute, including for a temporal key. First value and addition are set changes naming no attribute. A key holding only a disputed attribute counts as live, so an added field is an Adição. A started field of a multi-valued key changed to a value another attribute holds is a correction. These are the cases the edit-payload task reuses.
  fails_when: any case gives a different effect, kind or itemId, including a removal reported as a set change, a first value or addition naming an attribute, or a disputed-only key treated as having no live attribute
files:
- path: src/features/entities/components/__tests__/entity-form-effect-support.ts
  effect: A new helper. It opens the review in a mounted form and returns each listed item with its key, its previous and new texts and all effect texts found by entity-review-effect-{key} inside the item. It sorts them deterministically and filters them by key, previous or new text. The tests use it to assert the effect each entry shows without pinning the Efeito label.
not_applicable:
- edge_case: a field emptied that started empty, or a field returned to the value it started with
  why: neither is a changed field, so no effect is owed. Which fields are listed belongs to the review-of-changes task and its existing specs.
- edge_case: an added field repeating a value an active or uncertain attribute holds
  why: it is not a changed field (rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed), so it is never listed. The existing review-offered spec covers it, and this task states no effect for it.
- edge_case: a value its key's type refuses, so that no review is offered
  why: the review is not offered while the value stands, so no effect is stated. Another task owns this behavior.
- edge_case: a disputed key through the form
  why: a disputed key shows no field, so the form cannot make a change to it. The first-value and addition boundary for disputed is covered in the changeOfField table.
- edge_case: failure or latency of a dependency, and two operations at once
  why: the effect is a synchronous pure derivation from the fields and the node as loaded. No node states behavior under failure or concurrency for it.
untested:
- The recording clauses of the five rules/knowledge-base/entity-edit-first-value, -addition, -succession, -correction and -removal (the new active attribute, the closing, the deleted status and the supersession stamp). The task's REMAINDER note assigns them to the backend act of applying an edit. The tests prove only the classification the review predicts, so none of these nodes is claimed as demonstrated.
- 'rules/entity-workspace/review-states-the-effect-of-each-change and rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded: each is a universal statement over every changed field and every combination of other changes of the same edit, so no finite test decides it whole. Representatives of each effect class, and three cases of independence from the other fields, are tested but not claimed as the node.'
- 'domain/knowledge-base/edit-effect: an enumeration of how a change was recorded, with a sixth value, unchanged, that the review never shows. No finite test decides it. Its five values appear in the review only through the wording test.'
- 'domain/entity-workspace/entity-edit-session, domain/entity-workspace/attribute-field and contracts/entity-workspace/entity-screen: shape and contract nodes the task honors without extending. No test decides them whole, and the show-review answer''s other parts (reason, validity) belong to other tasks.'
- 'Inference about behavior: changeOfField returns null, and the entry shows no effect, for a combination no rule covers. That is a field with no started attribute on a single-valued key that already holds a live attribute, a value already held by an active or uncertain attribute, and a started field whose value equals its start. No node decides what the review shows there, so no test pins it. The form cannot produce these as listed fields.'
- 'Inference about behavior: a first value is decided by the node holding no live attribute, with a disputed attribute counting as live. Through the form this is unreachable, since a disputed key shows no field. It is exercised only by the changeOfField table row for a disputed-only multi-valued key, which the first-value and addition rules state.'
- 'Inferences about arrangement: the label Efeito, its position after Novo valor, and the repeated entity-review-effect-{key} test id of a multi-valued key. No node states them and no test pins them; the tests find the effect only by the entity-review-effect-{key} test id inside an item.'
- The ADVISORY that the review's prediction and the save's change come from one field-to-change mapping. The edit-payload task owns it. Here the table test pins the mapping's output, and nothing yet proves the payload calls it.
---
## What it is
This record proves task/review-and-save/review-effects.
It holds one form spec over the real EntityForm, one table spec of the shared mapping changeOfField and one helper.

## Notes
Nothing was run. No existing test file was edited. I read the existing specs and found none that calls reviewEntriesOf or useEntityReview directly, the only calls the new fifth and sixth parameters would break, so I expect the delivered change to break none. A run is needed to confirm the whole suite. The wording test needs a form with five catalog keys in one node, which is why it builds its own node rather than reusing the shared NODE of the listing spec.
The suite passed on its first run, run/review-and-save-review-effects-suite.
